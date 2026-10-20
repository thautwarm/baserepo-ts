module JSON.Number

import JSON.Parser
import Data.String

%default total

power10 : Nat -> Integer
power10 Z = 1
power10 (S n) = 10 * power10 n

-- Interpret an already parsed JSON decimal token as a bounded natural. Bounds
-- on digit counts are checked before exponentiation, so 1e999999999 does not
-- allocate an enormous power. This is not a general decimal arithmetic API.
decimalNatural : Nat -> String -> Maybe Nat
decimalNatural upper token =
  let (mantissa, exponentPart) = break (\c => c == 'e' || c == 'E') (unpack token)
      exponent = case exponentPart of
        [] => the Integer 0
        _ :: rest => cast (pack rest)
      (_, fraction) = break (== '.') mantissa
      places = the Nat $ case fraction of
        [] => Z
        _ :: digits => length digits
      digits = filter (/= '.') mantissa
      coefficient = the Integer (cast (pack digits))
      power = exponent - cast places
      digitCount = cast {to=Integer} (length (show coefficient))
      maxDigits = cast {to=Integer} (length (show upper))
  in if coefficient == 0 then Just 0
     else if coefficient < 0 then Nothing
     else if power >= 0 then
       if digitCount + power > maxDigits then Nothing
       else bounded (coefficient * power10 (cast power))
     else if negate power >= digitCount then Nothing
     else let divisor = power10 (cast (negate power)) in
       if mod coefficient divisor /= 0 then Nothing
       else bounded (div coefficient divisor)
  where
    bounded : Integer -> Maybe Nat
    bounded n = if n <= cast upper then Just (cast n) else Nothing

||| For JSON produced by parseJSON. Decimal tokens use exact decimal arithmetic,
||| while manually supplied JDouble values are deliberately not accepted.
export
boundedNatural : Nat -> JSON -> Maybe Nat
boundedNatural upper (JInteger n) =
  if n >= 0 && n <= cast upper then Just (cast n) else Nothing
boundedNatural upper (JDecimal token) = case parseJSON Virtual token of
  Right (JDecimal _) => decimalNatural upper token
  Right (JInteger n) => if n >= 0 && n <= cast upper then Just (cast n) else Nothing
  _ => Nothing
boundedNatural _ _ = Nothing
