module JSON.Wire.Numeric

import JSON.Parser
import public JSON.Wire.Description
import Data.String
import Data.List

%default total

export
integer64Bounds : Integer64Kind -> (Integer, Integer)
integer64Bounds Signed64 = (-9223372036854775808, 9223372036854775807)
integer64Bounds Unsigned64 = (0, 18446744073709551615)

export
integer64 : Integer64Kind -> JSON -> Either String Integer
integer64 kind (JInteger value) =
  let (lower, upper) = integer64Bounds kind in
    if value >= lower && value <= upper then Right value
    else Left "Wire: integer outside 64-bit range"
integer64 _ _ = Left "Wire: expected a 64-bit integer literal"

||| Reuse the actual DFA, requiring exactly the retained number token. This
||| rejects forged leading/trailing whitespace and other JSON values too.
export
numberToken : String -> Either String String
numberToken token = case parseJSONPreservingNumbers Virtual token of
  Right (JDecimal retained) => if retained == token then Right token
    else Left "Wire numeric: expected a complete number token without whitespace"
  _ => Left "Wire numeric: invalid JSON number token"

power10 : Nat -> Integer
power10 Z = 1
power10 (S n) = 10 * power10 n

rejectSignedZero : NumericBinding -> Bool -> Either String ()
rejectSignedZero rules negative = case rules.negativeZero of
  NormalizeNegativeZero => Right ()
  RejectNegativeZero => if negative then Left "Wire numeric: negative zero is excluded" else Right ()

||| Interpretation does not use Double, JS Number, or an exponent budget.
||| Strip cancelling zeros before exponentiation. A nonzero coefficient with
||| no trailing zeros is integral exactly when its resulting scale is >= 0.
export
naturalToken : NumericBinding -> String -> Either String Nat
naturalToken rules source = do
  token <- numberToken source
  if rules.upper < 0 then Left "Wire numeric: invalid negative upper" else Right ()
  let chars = the (List Char) (unpack token)
      negative = case chars of '-' :: _ => True; _ => False
      unsigned = if negative then Data.List.drop 1 chars else chars
      (mantissa, exponentPart) = Data.List.break (\c => c == 'e' || c == 'E') unsigned
      (_, fraction) = Data.List.break (== '.') mantissa
      places = the Nat $ case fraction of [] => Z; _ :: fractionDigits => length fractionDigits
      digits = Data.List.dropWhile (== '0') (Prelude.Types.List.filter (/= '.') mantissa)
  case (null digits, negative) of
    (True, _) => do
      rejectSignedZero rules negative
      Right 0
    (False, True) => Left "Wire numeric: expected nonnegative value"
    (False, False) => do
      let reversed = Prelude.Types.List.reverse digits
          significant = Prelude.Types.List.reverse (Data.List.dropWhile (== '0') reversed)
          trailing = cast {to=Integer} (length digits) - cast {to=Integer} (length significant)
          exponent = case exponentPart of [] => the Integer 0; _ :: rest => cast (pack rest)
          scale = exponent - cast places + trailing
          width = cast {to=Integer} (length significant) + scale
          maximumWidth = cast {to=Integer} (length (show rules.upper))
      case (scale < 0, width > maximumWidth) of
        (True, _) => Left "Wire numeric: expected exact integral decimal value"
        (False, True) => Left "Wire numeric: value exceeds upper"
        (False, False) =>
          let value = cast {to=Integer} (pack significant) * power10 (cast scale) in
            if value > rules.upper then Left "Wire numeric: value exceeds upper" else Right (cast value)

export
boundNatural : NumericBinding -> JSON -> Either String Nat
boundNatural rules (JInteger value) =
  if rules.upper < 0 then Left "Wire numeric: invalid negative upper"
  else if value < 0 then Left "Wire numeric: expected nonnegative value"
  else if value > rules.upper then Left "Wire numeric: value exceeds upper"
  else Right (cast value)
boundNatural rules (JDecimal token) = naturalToken rules token
boundNatural _ _ = Left "Wire numeric: expected exact JSON number"

||| Only the text path uses this helper. The ordinary AST decoder continues
||| to reject JDecimal integers; decimal/exponent forms remain excluded here.
export
legacyIntegerToken : String -> Either String JSON
legacyIntegerToken token = do
  _ <- numberToken token
  case parseJSON Virtual token of
    Right value@(JInteger _) => Right value
    _ => Left "Wire graph: expected natural integer literal"
