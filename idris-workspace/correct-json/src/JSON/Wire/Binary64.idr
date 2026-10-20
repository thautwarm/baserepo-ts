module JSON.Wire.Binary64

import JSON
import JSON.Wire.Numeric
import Data.String

%default total

-- ECMAScript Number and DataView are the trusted runtime boundary. These
-- required foreign calls deliberately have no non-JS implementation. Stock
-- non-JS code generators reject an executable that reaches this codec with
-- NoForeignCC/FFI-not-found; importing metadata or dead code is not that gate.
-- Bits64 is a BigInt on the pinned JS backend. Endianness is explicit in both
-- directions, and no arithmetic is applied to the floating-point value.
%foreign "javascript:lambda: value => { const view = new DataView(new ArrayBuffer(8)); view.setFloat64(0,value,false); return view.getBigUint64(0,false); }"
doubleBits : Double -> Bits64

%foreign "javascript:lambda: bits => { const view = new DataView(new ArrayBuffer(8)); view.setBigUint64(0,bits,false); return view.getFloat64(0,false); }"
bitsDouble : Bits64 -> Double

%foreign "javascript:lambda: token => Number(token)"
numberValue : String -> Double

%foreign "javascript:lambda: value => Object.is(value,-0) ? '-0' : String(value)"
numberText : Double -> String

%foreign "javascript:lambda: bits => bits.toString(16).padStart(16,'0')"
bitsHex : Bits64 -> String

%foreign "javascript:lambda: text => BigInt('0x'+text)"
hexBits : String -> Bits64

export
finiteWireBits : Bits64 -> Bool
finiteWireBits bits = ((the Integer (cast bits) `div` 4503599627370496) `mod` 2048 /= 2047)

checkFinite : Bits64 -> Either String Bits64
checkFinite bits = if finiteWireBits bits then Right bits
  else Left "Wire binary64: non-finite value"

tokenBits : String -> Either String Bits64
tokenBits source = do
  token <- numberToken source
  checkFinite (doubleBits (numberValue token))

||| First parsed ECMAScript Number value semantics. Only this explicit float
||| binding rounds decimals/integers. Nat interpretation remains independent.
||| JInteger 0 has already lost any original negative-zero token spelling.
export
readFiniteBits : JSON -> Either String Bits64
readFiniteBits (JDecimal token) = tokenBits token
readFiniteBits (JInteger value) = tokenBits (show value)
readFiniteBits (JDouble value) = checkFinite (doubleBits value)
readFiniteBits _ = Left "Wire binary64: expected JSON number"

||| Shortest finite ECMAScript round-trip text, with explicit negative zero.
||| A checked JDecimal avoids the generic Double renderer and integer -0 loss.
export
encodeFiniteBits : Bits64 -> Either String JSON
encodeFiniteBits bits = do
  checked <- checkFinite bits
  token <- numberToken (numberText (bitsDouble checked))
  pure (JDecimal token)

export
finiteBitsHex : Bits64 -> Either String String
finiteBitsHex bits = bitsHex <$> checkFinite bits

||| Strict fixed-width lowercase carrier: range is checked before BigInt/FFI,
||| and exponent 2047 is excluded independently of the opaque typed validator.
export
readFiniteHex : String -> Either String Bits64
readFiniteHex text =
  if length (unpack text) == 16 && all (\char => elem char (unpack "0123456789abcdef")) (unpack text)
    then checkFinite (hexBits text)
    else Left "Wire binary64: expected 16 lowercase hexadecimal digits"
