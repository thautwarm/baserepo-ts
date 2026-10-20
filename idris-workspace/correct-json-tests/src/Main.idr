module Main

import JSON.Derive
import JSON.Number
import Data.String
import InternallyTagged
import CompileNegative
import SortedAssoc
import JSON.Wire.Codec
import Text.ILex.Runner
import Data.ByteString

%language ElabReflection
%default total

-- Host-created fixtures avoid the compiler's scalar-only Int -> Char cast.
%foreign "javascript:lambda: n => String.fromCharCode(n)"
codeUnit : Int -> String

%foreign "javascript:lambda: () => { throw new Error('Idris JSON codec check failed'); }"
failChecks : PrimIO ()

-- Test fixtures, not a universal business numeric policy.
record NaturalRecord where
  constructor MkNaturalRecord
  count : Nat

record SignedRecord where
  constructor MkSignedRecord
  delta : Int64

-- Keep record objects even when they have one field.
recordOptions : Options
recordOptions = { unwrapUnary := False } defaultOptions

recordToJSON : List Name -> ParamTypeInfo -> Res (List TopLevel)
recordToJSON = customToJSON recordOptions

recordFromJSON : List Name -> ParamTypeInfo -> Res (List TopLevel)
recordFromJSON = customFromJSON recordOptions

renameField : String -> String
renameField "item_count" = "itemCount"
renameField s = s

renamedToJSON : List Name -> ParamTypeInfo -> Res (List TopLevel)
renamedToJSON = customToJSON ({ fieldNameModifier := renameField } recordOptions)

renamedFromJSON : List Name -> ParamTypeInfo -> Res (List TopLevel)
renamedFromJSON = customFromJSON ({ fieldNameModifier := renameField } recordOptions)

record NestedRecord where
  constructor MkNestedRecord
  item_count : NaturalRecord
  change : SignedRecord

-- Explicit example field constraint, distinct from Nat's own semantics.
record SmallCount where
  constructor MkSmallCount
  value : Nat

ToJSON SmallCount where
  toJSON (MkSmallCount n) = toJSON n

FromJSON SmallCount where
  fromJSON v = do
    n <- fromJSON {a = Nat} v
    if n <= 1000 then Right (MkSmallCount n) else fail "sample count exceeds 1000"

-- Example additional constraint on an otherwise signed 64-bit type.
record NonnegativeSigned where
  constructor MkNonnegativeSigned
  value : Int64

ToJSON NonnegativeSigned where
  toJSON (MkNonnegativeSigned n) = toJSON n

FromJSON NonnegativeSigned where
  fromJSON v = do
    n <- fromJSON {a = Int64} v
    if n >= 0 then Right (MkNonnegativeSigned n) else fail "sample signed field must be nonnegative"

record ConstrainedRecord where
  constructor MkConstrainedRecord
  count : SmallCount
  amount : NonnegativeSigned

%runElab derive "NaturalRecord" [Eq, recordToJSON, recordFromJSON]
%runElab derive "SignedRecord" [Eq, recordToJSON, recordFromJSON]
%runElab derive "NestedRecord" [Eq, renamedToJSON, renamedFromJSON]
%runElab derive "SmallCount" [Eq]
%runElab derive "NonnegativeSigned" [Eq]
%runElab derive "ConstrainedRecord" [Eq, ToJSON, FromJSON]

-- Regression fixtures for single-constructor option handling.
record DefaultNatural where
  constructor MkDefaultNatural
  count : Nat

data DefaultUnary = MkDefaultUnary Int64
data ArrayUnary = MkArrayUnary Int64

record RenamedNatural where
  constructor MkRenamedNatural
  item_count : Nat

%runElab derive "DefaultNatural" [Eq, ToJSON, FromJSON]
%runElab derive "DefaultUnary" [Eq, ToJSON, FromJSON]
%runElab derive "ArrayUnary" [Eq, recordToJSON, recordFromJSON]
%runElab derive "RenamedNatural" [Eq, renamedToJSON, renamedFromJSON]

-- Decode against a independently constructed exact value, never an encode result.
exact : Eq a => FromJSON a => String -> a -> Bool
exact input expected = case decode input of
  Right actual => actual == expected
  Left _ => False

rejected : (0 a : Type) -> FromJSON a => String -> Bool
rejected a input = case decode {a} input of
  Left _ => True
  Right _ => False

errorAt : (0 a : Type) -> FromJSON a => String -> JSONPath -> Bool
errorAt a input expected = case decode {a} input of
  Left (JErr (actual, _)) => actual == expected
  _ => False

counter : String -> Maybe Nat
counter input = case parseJSON Virtual input of
  Right value => boundedNatural 9007199254740991 value
  _ => Nothing

parsedAs : (Origin -> String -> Either (ParseError ObjectError) JSON) -> String -> JSON -> Bool
parsedAs parser input expected = case parser Virtual input of
  Right actual => actual == expected
  Left _ => False

preservingRejected : String -> Bool
preservingRejected input = case parseJSONPreservingNumbers Virtual input of
  Left _ => True
  Right _ => False

nestedPreserving : Bool
nestedPreserving = case objectFromLegacyPairs [("large", JDecimal "9007199254740993")] of
  Left _ => False
  Right nested => case objectFromLegacyPairs
      [("values", JArray [JDecimal "-0", nested, JDecimal "1e999"]),
       ("truth", JBool True), ("nothing", JNull)] of
    Left _ => False
    Right expected => parsedAs parseJSONPreservingNumbers
      "{\"values\":[-0,{\"large\":9007199254740993},1e999],\"truth\":true,\"nothing\":null}" expected

-- Independent token/AST expectations: these checks never interpret a token as
-- a host Number. Legal overflow and underflow spellings are still syntax here.
preservingChecks : List (String, Bool)
preservingChecks =
  map (\token => ("Preserving token " ++ token,
    parsedAs parseJSONPreservingNumbers token (JDecimal token)))
    [ "0", "-0", "42", "-42", "9007199254740993"
    , "123456789012345678901234567890", "-0.0", "-0e99", "1E+00"
    , "1e999", "-1e999", "5e-324", "-2e-324", "1.7976931348623159e308"
    , "1e999999999", "-0E-999999999"
    ] ++
  map (\input => ("Preserving rejects " ++ show input, preservingRejected input))
    [ "NaN", "Infinity", "-Infinity", "01", "-01", "+1", "1.", ".1"
    , "1e", "1e+", "--0", "0x1", "1 2", "1e999suffix", ""
    ] ++
  [ ("Preserving nested independent AST", nestedPreserving)
  , ("Preserving duplicate occurrences rejected", case parseJSONPreservingNumbers Virtual
      "{\"same\":-0,\"same\":0,\"same\":1E+00}" of
      Left (PE _ _ _ _ (Custom (DuplicateObjectKey key positions))) => scalarValue key == "same" && positions == [0, 1, 2]
      _ => False)
  , ("Preserving Unicode strings and numeric text", parsedAs parseJSONPreservingNumbers
      "[\"北京🧪\",\"\\ud83e\\uddea\",\"-0\",\"1e999\",\"\\ud800\"]"
      (JArray [JString "北京🧪", JString "🧪", JString "-0", JString "1e999", JString (codeUnit 0xd800)]))
  , ("Preserving literal surrogate", parsedAs parseJSONPreservingNumbers
      ("\"" ++ codeUnit 0xdc00 ++ "\"") (JString (codeUnit 0xdc00)))
  , ("Preserving rejects invalid escaped surrogate", preservingRejected ("\"\\" ++ codeUnit 0xd800 ++ "\""))
  , ("Preserving rejects raw control", preservingRejected ("\"" ++ codeUnit 0 ++ "\""))
  , ("Legacy parser negative zero AST unchanged", parsedAs parseJSON "-0" (JInteger 0))
  , ("Legacy parser large integer AST unchanged", parsedAs parseJSON "9007199254740993" (JInteger 9007199254740993))
  , ("Legacy parser exponent AST unchanged", parsedAs parseJSON "1E+00" (JDecimal "1E+00"))
  , ("Preserving integer has no generic integer accessor", case parseJSONPreservingNumbers Virtual "42" of
      Right value => getInteger value == Nothing
      Left _ => False)
  , ("Preserving integer needs explicit Nat decoder", case parseJSONPreservingNumbers Virtual "42" of
      Right value => case fromJSON {a = Nat} value of
        Left _ => True
        Right _ => False
      Left _ => False)
  , ("Preserving integer needs explicit Int64 decoder", case parseJSONPreservingNumbers Virtual "-42" of
      Right value => case fromJSON {a = Int64} value of
        Left _ => True
        Right _ => False
      Left _ => False)
  ]

checks : List (String, Bool)
checks =
  [ ("Nat decode 0", exact "{\"count\":0}" (MkNaturalRecord 0))
  , ("Nat encode 0", encode (MkNaturalRecord 0) == Right "{\"count\":0}")
  , ("Nat decode 42", exact "{\"count\":42}" (MkNaturalRecord 42))
  , ("Nat encode 42", encode (MkNaturalRecord 42) == Right "{\"count\":42}")
  , ("Nat decode 9007199254740991", exact "{\"count\":9007199254740991}" (MkNaturalRecord 9007199254740991))
  , ("Nat encode 9007199254740991", encode (MkNaturalRecord 9007199254740991) == Right "{\"count\":9007199254740991}")
  , ("Nat decode 9007199254740992", exact "{\"count\":9007199254740992}" (MkNaturalRecord 9007199254740992))
  , ("Nat encode 9007199254740992", encode (MkNaturalRecord 9007199254740992) == Right "{\"count\":9007199254740992}")
  , ("Nat decode 9007199254740993", exact "{\"count\":9007199254740993}" (MkNaturalRecord 9007199254740993))
  , ("Nat encode 9007199254740993", encode (MkNaturalRecord 9007199254740993) == Right "{\"count\":9007199254740993}")
  , ("Nat decode 9223372036854775807", exact "{\"count\":9223372036854775807}" (MkNaturalRecord 9223372036854775807))
  , ("Nat encode 9223372036854775807", encode (MkNaturalRecord 9223372036854775807) == Right "{\"count\":9223372036854775807}")
  , ("Nat decode 9223372036854775808", exact "{\"count\":9223372036854775808}" (MkNaturalRecord 9223372036854775808))
  , ("Nat encode 9223372036854775808", encode (MkNaturalRecord 9223372036854775808) == Right "{\"count\":9223372036854775808}")
  , ("Nat decode 18446744073709551615", exact "{\"count\":18446744073709551615}" (MkNaturalRecord 18446744073709551615))
  , ("Nat encode 18446744073709551615", encode (MkNaturalRecord 18446744073709551615) == Right "{\"count\":18446744073709551615}")
  , ("Nat decode 123456789012345678901234567890", exact "{\"count\":123456789012345678901234567890}" (MkNaturalRecord 123456789012345678901234567890))
  , ("Nat encode 123456789012345678901234567890", encode (MkNaturalRecord 123456789012345678901234567890) == Right "{\"count\":123456789012345678901234567890}")
  , ("Nat rejects -1", rejected NaturalRecord "{\"count\":-1}")
  , ("Nat rejects -42", rejected NaturalRecord "{\"count\":-42}")
  , ("Nat rejects -9007199254740991", rejected NaturalRecord "{\"count\":-9007199254740991}")
  , ("Nat rejects -9007199254740992", rejected NaturalRecord "{\"count\":-9007199254740992}")
  , ("Nat rejects -9007199254740993", rejected NaturalRecord "{\"count\":-9007199254740993}")
  , ("Nat rejects -9223372036854775808", rejected NaturalRecord "{\"count\":-9223372036854775808}")
  , ("Nat rejects -123456789012345678901234567890", rejected NaturalRecord "{\"count\":-123456789012345678901234567890}")
  , ("Int64 decode 0", exact "{\"delta\":0}" (MkSignedRecord 0))
  , ("Int64 encode 0", encode (MkSignedRecord 0) == Right "{\"delta\":0}")
  , ("Int64 decode 42", exact "{\"delta\":42}" (MkSignedRecord 42))
  , ("Int64 encode 42", encode (MkSignedRecord 42) == Right "{\"delta\":42}")
  , ("Int64 decode -42", exact "{\"delta\":-42}" (MkSignedRecord (-42)))
  , ("Int64 encode -42", encode (MkSignedRecord (-42)) == Right "{\"delta\":-42}")
  , ("Int64 decode 9007199254740991", exact "{\"delta\":9007199254740991}" (MkSignedRecord 9007199254740991))
  , ("Int64 encode 9007199254740991", encode (MkSignedRecord 9007199254740991) == Right "{\"delta\":9007199254740991}")
  , ("Int64 decode 9007199254740992", exact "{\"delta\":9007199254740992}" (MkSignedRecord 9007199254740992))
  , ("Int64 encode 9007199254740992", encode (MkSignedRecord 9007199254740992) == Right "{\"delta\":9007199254740992}")
  , ("Int64 decode 9007199254740993", exact "{\"delta\":9007199254740993}" (MkSignedRecord 9007199254740993))
  , ("Int64 encode 9007199254740993", encode (MkSignedRecord 9007199254740993) == Right "{\"delta\":9007199254740993}")
  , ("Int64 decode -9007199254740991", exact "{\"delta\":-9007199254740991}" (MkSignedRecord (-9007199254740991)))
  , ("Int64 encode -9007199254740991", encode (MkSignedRecord (-9007199254740991)) == Right "{\"delta\":-9007199254740991}")
  , ("Int64 decode -9007199254740992", exact "{\"delta\":-9007199254740992}" (MkSignedRecord (-9007199254740992)))
  , ("Int64 encode -9007199254740992", encode (MkSignedRecord (-9007199254740992)) == Right "{\"delta\":-9007199254740992}")
  , ("Int64 decode -9007199254740993", exact "{\"delta\":-9007199254740993}" (MkSignedRecord (-9007199254740993)))
  , ("Int64 encode -9007199254740993", encode (MkSignedRecord (-9007199254740993)) == Right "{\"delta\":-9007199254740993}")
  , ("Int64 decode -9223372036854775808", exact "{\"delta\":-9223372036854775808}" (MkSignedRecord (-9223372036854775808)))
  , ("Int64 encode -9223372036854775808", encode (MkSignedRecord (-9223372036854775808)) == Right "{\"delta\":-9223372036854775808}")
  , ("Int64 decode 9223372036854775807", exact "{\"delta\":9223372036854775807}" (MkSignedRecord 9223372036854775807))
  , ("Int64 encode 9223372036854775807", encode (MkSignedRecord 9223372036854775807) == Right "{\"delta\":9223372036854775807}")
  , ("Int64 rejects -9223372036854775809", rejected SignedRecord "{\"delta\":-9223372036854775809}")
  , ("Int64 rejects 9223372036854775808", rejected SignedRecord "{\"delta\":9223372036854775808}")
  , ("Int64 rejects 18446744073709551615", rejected SignedRecord "{\"delta\":18446744073709551615}")
  , ("Int64 rejects 123456789012345678901234567890", rejected SignedRecord "{\"delta\":123456789012345678901234567890}")
  , ("Int64 rejects -123456789012345678901234567890", rejected SignedRecord "{\"delta\":-123456789012345678901234567890}")
  , ("NaturalRecord rejects 0.0", rejected NaturalRecord "{\"count\":0.0}")
  , ("NaturalRecord rejects 1.0", rejected NaturalRecord "{\"count\":1.0}")
  , ("NaturalRecord rejects -1.0", rejected NaturalRecord "{\"count\":-1.0}")
  , ("NaturalRecord rejects 1.5", rejected NaturalRecord "{\"count\":1.5}")
  , ("NaturalRecord rejects 1e0", rejected NaturalRecord "{\"count\":1e0}")
  , ("NaturalRecord rejects 1E+0", rejected NaturalRecord "{\"count\":1E+0}")
  , ("NaturalRecord rejects 1e-1", rejected NaturalRecord "{\"count\":1e-1}")
  , ("NaturalRecord rejects 9007199254740993.0", rejected NaturalRecord "{\"count\":9007199254740993.0}")
  , ("NaturalRecord rejects 9007199254740993e0", rejected NaturalRecord "{\"count\":9007199254740993e0}")
  , ("NaturalRecord rejects 1e999", rejected NaturalRecord "{\"count\":1e999}")
  , ("NaturalRecord rejects -1e999", rejected NaturalRecord "{\"count\":-1e999}")
  , ("NaturalRecord rejects null", rejected NaturalRecord "{\"count\":null}")
  , ("NaturalRecord rejects true", rejected NaturalRecord "{\"count\":true}")
  , ("NaturalRecord rejects \"42\"", rejected NaturalRecord "{\"count\":\"42\"}")
  , ("NaturalRecord rejects []", rejected NaturalRecord "{\"count\":[]}")
  , ("NaturalRecord rejects {}", rejected NaturalRecord "{\"count\":{}}")
  , ("NaturalRecord missing field", rejected NaturalRecord "{}")
  , ("SignedRecord rejects 0.0", rejected SignedRecord "{\"delta\":0.0}")
  , ("SignedRecord rejects 1.0", rejected SignedRecord "{\"delta\":1.0}")
  , ("SignedRecord rejects -1.0", rejected SignedRecord "{\"delta\":-1.0}")
  , ("SignedRecord rejects 1.5", rejected SignedRecord "{\"delta\":1.5}")
  , ("SignedRecord rejects 1e0", rejected SignedRecord "{\"delta\":1e0}")
  , ("SignedRecord rejects 1E+0", rejected SignedRecord "{\"delta\":1E+0}")
  , ("SignedRecord rejects 1e-1", rejected SignedRecord "{\"delta\":1e-1}")
  , ("SignedRecord rejects 9007199254740993.0", rejected SignedRecord "{\"delta\":9007199254740993.0}")
  , ("SignedRecord rejects 9007199254740993e0", rejected SignedRecord "{\"delta\":9007199254740993e0}")
  , ("SignedRecord rejects 1e999", rejected SignedRecord "{\"delta\":1e999}")
  , ("SignedRecord rejects -1e999", rejected SignedRecord "{\"delta\":-1e999}")
  , ("SignedRecord rejects null", rejected SignedRecord "{\"delta\":null}")
  , ("SignedRecord rejects true", rejected SignedRecord "{\"delta\":true}")
  , ("SignedRecord rejects \"42\"", rejected SignedRecord "{\"delta\":\"42\"}")
  , ("SignedRecord rejects []", rejected SignedRecord "{\"delta\":[]}")
  , ("SignedRecord rejects {}", rejected SignedRecord "{\"delta\":{}}")
  , ("SignedRecord missing field", rejected SignedRecord "{}")
  , ("Nat negative zero is zero", exact "{\"count\":-0}" (MkNaturalRecord 0))
  , ("Int64 negative zero is zero", exact "{\"delta\":-0}" (MkSignedRecord 0))
  , ("nested renamed exact decode", exact "{\"itemCount\":{\"count\":9007199254740993},\"change\":{\"delta\":-9223372036854775808}}" (MkNestedRecord (MkNaturalRecord 9007199254740993) (MkSignedRecord (-9223372036854775808))))
  , ("nested renamed independent encode", encode (MkNestedRecord (MkNaturalRecord 9007199254740993) (MkSignedRecord (-9223372036854775808))) == Right "{\"change\":{\"delta\":-9223372036854775808},\"itemCount\":{\"count\":9007199254740993}}")
  , ("nested wrong field name", rejected NestedRecord "{\"item_count\":{\"count\":9007199254740993},\"change\":{\"delta\":-9223372036854775808}}")
  , ("nested missing required field", rejected NestedRecord "{\"itemCount\":{\"count\":1}}")
  , ("nested inner missing field", rejected NestedRecord "{\"itemCount\":{},\"change\":{\"delta\":1}}")
  , ("nested natural rejection path", errorAt NestedRecord "{\"itemCount\":{\"count\":-1},\"change\":{\"delta\":0}}" [Key "itemCount", Key "count"])
  , ("nested signed overflow path", errorAt NestedRecord "{\"itemCount\":{\"count\":0},\"change\":{\"delta\":9223372036854775808}}" [Key "change", Key "delta"])
  , ("constraint decode 0", exact "{\"count\":0,\"amount\":9223372036854775807}" (MkConstrainedRecord (MkSmallCount 0) (MkNonnegativeSigned 9223372036854775807)))
  , ("constraint encode 0", encode (MkConstrainedRecord (MkSmallCount 0) (MkNonnegativeSigned 9223372036854775807)) == Right "{\"amount\":9223372036854775807,\"count\":0}")
  , ("constraint decode 1000", exact "{\"count\":1000,\"amount\":9223372036854775807}" (MkConstrainedRecord (MkSmallCount 1000) (MkNonnegativeSigned 9223372036854775807)))
  , ("constraint encode 1000", encode (MkConstrainedRecord (MkSmallCount 1000) (MkNonnegativeSigned 9223372036854775807)) == Right "{\"amount\":9223372036854775807,\"count\":1000}")
  , ("constraint rejects upper bound", rejected ConstrainedRecord "{\"count\":1001,\"amount\":0}")
  , ("constraint rejects negative Nat", rejected ConstrainedRecord "{\"count\":-1,\"amount\":0}")
  , ("constraint rejects additional signed constraint", rejected ConstrainedRecord "{\"count\":0,\"amount\":-1}")
  , ("constraint rejects signed range", rejected ConstrainedRecord "{\"count\":0,\"amount\":9223372036854775808}")
  , ("constraint rejects large Nat bound", rejected ConstrainedRecord "{\"count\":123456789012345678901234567890,\"amount\":0}")
  , ("default named unary decode", exact "9007199254740993" (MkDefaultNatural 9007199254740993))
  , ("default named unary encode", encode (MkDefaultNatural 9007199254740993) == Right "9007199254740993")
  , ("default named unary rejects object", rejected DefaultNatural "{\"count\":1}")
  , ("default positional unary decode", exact "-9007199254740993" (MkDefaultUnary (-9007199254740993)))
  , ("default positional unary encode", encode (MkDefaultUnary (-9007199254740993)) == Right "-9007199254740993")
  , ("default positional unary rejects array", rejected DefaultUnary "[1]")
  , ("explicit positional array decode", exact "[-9007199254740993]" (MkArrayUnary (-9007199254740993)))
  , ("explicit positional array encode", encode (MkArrayUnary (-9007199254740993)) == Right "[-9007199254740993]")
  , ("explicit positional rejects bare number", rejected ArrayUnary "1")
  , ("renamed unary object decode", exact "{\"itemCount\":9007199254740993}" (MkRenamedNatural 9007199254740993))
  , ("renamed unary object encode", encode (MkRenamedNatural 9007199254740993) == Right "{\"itemCount\":9007199254740993}")
  , ("renamed unary rejects original name", rejected RenamedNatural "{\"item_count\":1}")
  , ("explicit natural object rejects bare number", rejected NaturalRecord "1")
  , ("explicit signed object rejects bare number", rejected SignedRecord "1")
  , ("constraint signed zero decode", exact "{\"count\":0,\"amount\":0}" (MkConstrainedRecord (MkSmallCount 0) (MkNonnegativeSigned 0)))
  , ("constraint signed zero encode", encode (MkConstrainedRecord (MkSmallCount 0) (MkNonnegativeSigned 0)) == Right "{\"amount\":0,\"count\":0}")
  , ("constraint ordinary decode", exact "{\"count\":42,\"amount\":42}" (MkConstrainedRecord (MkSmallCount 42) (MkNonnegativeSigned 42)))
  , ("constraint ordinary encode", encode (MkConstrainedRecord (MkSmallCount 42) (MkNonnegativeSigned 42)) == Right "{\"amount\":42,\"count\":42}")
  , ("JS Int max exact", exact "2147483647" (the Int 2147483647))
  , ("JS Int min exact", exact "-2147483648" (the Int (-2147483648)))
  , ("JS Int rejects positive wrap", rejected Int "2147483648")
  , ("JS Int rejects negative wrap", rejected Int "-2147483649")
  , ("JS Int rejects unsafe integer", rejected Int "9007199254740993")
  , ("Unicode scalar decode", exact "\"北京🧪\"" "北京🧪")
  , ("surrogate escape decode", exact "\"\\ud800\"" (codeUnit 0xd800))
  , ("surrogate encode remains transport safe", map toLower (JSON.ToJSON.encode (codeUnit 0xd800)) == Right "\"\\ud800\"")
  , ("low surrogate encode remains transport safe", map toLower (JSON.ToJSON.encode (codeUnit 0xdc00)) == Right "\"\\udc00\"")
  , ("NUL encode remains escaped", JSON.ToJSON.encode (Data.String.singleton (cast {from=Int} 0)) == Right "\"\\u0000\"")
  , ("surrogate pair escape decode", exact "\"\\ud83e\\uddea\"" "🧪")
  , ("low surrogate escape decode", exact "\"\\udc00\"" (codeUnit 0xdc00))
  , ("escaped surrogate distinct from NUL", not (exact "\"\\ud800\"" (codeUnit 0)))
  , ("bounded decimal max exact", counter "9007199254740991.0" == Just 9007199254740991)
  , ("bounded exponent max exact", counter "90071992547409910e-1" == Just 9007199254740991)
  , ("bounded positive exponent", counter "1e+2" == Just 100)
  , ("bounded trailing zeros", counter "1.000" == Just 1)
  , ("bounded fraction scaled", counter "0.000000000000001e15" == Just 1)
  , ("bounded fractional near max rejects", counter "9007199254740991.1" == Nothing)
  , ("bounded hidden fraction rejects", counter "1.00000000000000000000000001" == Nothing)
  , ("bounded underflow rejects", counter "1e-999999999" == Nothing)
  , ("bounded overflow rejects", counter "1e999999999" == Nothing)
  , ("bounded zero huge exponent", counter "0e999999999" == Just 0)
  , ("bounded negative zero exponent", counter "-0e-999999999" == Just 0)
  , ("bounded negative underflow rejects", counter "-1e-999999999" == Nothing)
  , ("bounded invalid manual token rejects", boundedNatural 10 (JDecimal "oops") == Nothing)
  , ("raw surrogate input preserved", exact ("\"" ++ codeUnit 0xd800 ++ "\"") (codeUnit 0xd800))
  , ("raw low surrogate input preserved", exact ("\"" ++ codeUnit 0xdc00 ++ "\"") (codeUnit 0xdc00))
  , ("invalid escaped surrogate is not repaired", rejected String ("\"\\" ++ codeUnit 0xd800 ++ "\""))
  , ("raw control remains invalid", rejected String ("\"" ++ codeUnit 0 ++ "\""))
  ]

%foreign "javascript:lambda: n => [NaN, Infinity, -Infinity][Number(n)]"
specialDouble : Nat -> Double

data FailingValue = FailValue

ToJSON FailingValue where
  toJSON FailValue = Left "child encoder sentinel"

record FailingRecord where
  constructor FailingRecordData
  child : FailingValue

%runElab derive "FailingRecord" [recordToJSON]

encodedAssocFailure : Bool
encodedAssocFailure = case checkedAssoc [("child", FailValue)] of
  Left _ => False
  Right values => encode values == Left "child encoder sentinel"

assocDecodePath : Bool
assocDecodePath = case decode {a = StringKeySortedAssoc (List Nat)} "{\"child\":[1,-1]}" of
  Left (JErr (path, message)) => path == [Key "child", Index 1] && message == "not a natural number: -1"
  _ => False

schemaRejects : Either String a -> Bool
schemaRejects (Left message) = message == "Wire: isolated surrogate object key"
schemaRejects (Right _) = False

schemaAccepts : Either String a -> Bool
schemaAccepts (Right _) = True
schemaAccepts (Left _) = False

recordGraph : String -> GraphDescription
recordGraph key = Graph "Record" Component
  [Definition "Record" "Record" 0 (RecordBody "RecordData" [GraphMember "field" key StringType])]

keyChecks : List (String, Bool)
keyChecks = map (\point => ("W1 invalid scalar field key " ++ show point,
    schemaRejects (checkRecord (MkRecordDescription "Record" "Record" [MkWireField "field" (codeUnit point) Text])))) [0xd800, 0xdc00] ++
  map (\point => ("invalid scalar rename key " ++ show point,
    schemaRejects (checkRules (StrictRecord [("field", codeUnit point)]) ["field"]))) [0xd800, 0xdc00] ++
  map (\point => ("graph invalid scalar field key " ++ show point,
    schemaRejects (checkGraph (recordGraph (codeUnit point))))) [0xd800, 0xdc00] ++
  map (\point => ("graph invalid scalar internal tag key " ++ show point,
    schemaRejects (checkGraph (Graph "Tagged" Component
      [Definition "Tagged" "Tagged" 0 (InternalTagBody (codeUnit point) [("Only", "only", NullaryPayload)])])))) [0xd800, 0xdc00] ++
  map (\point => ("graph invalid scalar fixed root tag key " ++ show point,
    schemaRejects (checkGraph (Graph "Record" (FixedTag (codeUnit point) "tag") (recordGraph "field").definitions)))) [0xd800, 0xdc00] ++
  [ ("W1 nonASCII scalar field key accepted", schemaAccepts (checkRecord (MkRecordDescription "Record" "Record" [MkWireField "field" "标签🧪" Text])))
  , ("W1 empty scalar field key accepted", schemaAccepts (checkRecord (MkRecordDescription "Record" "Record" [MkWireField "field" "" Text])))
  , ("rename nonASCII scalar key accepted", schemaAccepts (checkRules (StrictRecord [("field", "标签🧪")]) ["field"]))
  , ("graph nonASCII scalar field key accepted", schemaAccepts (checkGraph (recordGraph "标签🧪")))
  , ("graph empty scalar field key accepted", schemaAccepts (checkGraph (recordGraph "")))
  , ("graph combining keys remain distinct", schemaAccepts (checkGraph (Graph "Record" Component
      [Definition "Record" "Record" 0 (RecordBody "RecordData" [GraphMember "one" "é" StringType, GraphMember "two" "é" StringType])])))
  , ("graph unused invalid scalar field key rejected", schemaRejects (checkGraph (Graph "Scalar" Component
      (Definition "Scalar" "Scalar" 0 ScalarBody :: (recordGraph (codeUnit 0xd800)).definitions))))
  , ("graph scalar internal tag key surrogate value accepted", schemaAccepts (checkGraph (Graph "Tagged" Component
      [Definition "Tagged" "Tagged" 0 (InternalTagBody "标签🧪" [("Only", codeUnit 0xd800, NullaryPayload)])])))
  , ("graph scalar fixed root tag key surrogate value accepted", schemaAccepts (checkGraph
      (Graph "Record" (FixedTag "标签🧪" (codeUnit 0xd800)) (recordGraph "field").definitions)))
  , ("graph empty fixed root tag key accepted", schemaAccepts (checkGraph
      (Graph "Record" (FixedTag "" "tag") (recordGraph "field").definitions)))
  , ("graph enum surrogate String value accepted", schemaAccepts (checkGraph (Graph "Enum" Component
      [Definition "Enum" "Enum" 0 (StringEnum [("Only", codeUnit 0xd800)])])))
  ]

wireAssocFailure : Bool
wireAssocFailure = case checkedAssoc (the (List (String, List Nat)) [("child", [1, 2])]) of
  Left _ => False
  Right values => case traverseAssocWithKey (\key, items =>
    encodeListValues (\item => if item == 2 then Left ([], "child encoder sentinel") else Right (JInteger (cast item))) items
      `prependPath` Key (scalarValue key)) values of
      Left (path, message) => path == [Key "child", Index 1] && message == "child encoder sentinel"
      Right _ => False

canonicalChecks : List (String, Bool)
canonicalChecks =
  [ ("checked nonfinite NaN encode", encode (specialDouble 0) == Left "JSON: non-finite Double")
  , ("checked nonfinite positive infinity encode", encode (specialDouble 1) == Left "JSON: non-finite Double")
  , ("checked nonfinite negative infinity encode", encode (specialDouble 2) == Left "JSON: non-finite Double")
  , ("checked finite Double encode", encode (the Double 1.5) == Right "1.5")
  , ("canonical key order independent literal", case parseJSON Virtual "{\"2\":2,\"1\":1,\"__proto__\":3,\"constructor\":4,\"\":0}" of
      Right value => encodeJSONValue value == Right "{\"\":0,\"1\":1,\"2\":2,\"__proto__\":3,\"constructor\":4}"
      _ => False)
  , ("canonical scalar order differs from UTF16", case parseJSON Virtual "{\"😀\":2,\"\":1}" of
      Right value => encodeJSONValue value == Right "{\"\":1,\"😀\":2}"
      _ => False)
  , ("legacy pairs explicit duplicate rejection", case objectFromLegacyPairs [("x", JNull), ("x", JBool True)] of
      Left message => message == "Duplicate object key \"x\" at pair positions [0, 1]"
      _ => False)
  , ("legacy pairs explicit key rejection", case checkedAssoc [(codeUnit 0xd800, JNull)] of
      Left (InvalidScalarKey 0 key IsolatedSurrogate) => key == codeUnit 0xd800
      _ => False)
  , ("actual generic Assoc child encode failure", encodedAssocFailure)
  , ("actual derived record child encode failure", encode (FailingRecordData FailValue) == Left "child encoder sentinel")
  , ("actual generic Assoc child Key Index decode failure", assocDecodePath)
  , ("wire generic traversal child Key Index encode failure", wireAssocFailure)
  , ("path index beyond Bits32 preserves exact position", formatPath [Key "child", Index 4294967297] == "$.child[4294967297]")
  , ("checked nested forged token rejection", encodeJSONValue (JArray [JDecimal "1", JDecimal "oops"]) == Left "JSON: invalid number token")
  , ("checked manually built nonfinite AST rejection", encodeJSONValue (JDouble (specialDouble 0)) == Left "JSON: non-finite Double")
  , ("checked nested object forged token rejection", case objectFromLegacyPairs [("child", JDecimal "oops")] of
      Right value => encodeJSONValue value == Left "JSON: invalid number token"
      Left _ => False)
  , ("checked huge exponent retains grammar domain", encodeJSONValue (JDecimal "1e999999999") == Right "1e999999999")
  , ("checked negative zero retains original token", encodeJSONValue (JDecimal "-0E-999999999") == Right "-0E-999999999")
  , ("checked integer arbitrary precision", encodeJSONValue (JInteger 123456789012345678901234567890) == Right "123456789012345678901234567890")
  , ("checked nested object dropNull", case parseJSON Virtual "{\"z\":null,\"a\":{\"z\":null,\"b\":1},\"values\":[null]}" of
      Right value => encodeJSONValue (dropNull value) == Right "{\"a\":{\"b\":1},\"values\":[null]}"
      _ => False)
  ] ++ map (\token => ("checked forged token rejects " ++ show token,
    case encodeJSONValue (JDecimal token) of Left _ => True; Right _ => False))
    ["NaN", "Infinity", "-Infinity", "01", "1 2", " 1", "1 ", "true", "{}", "1e", "1e999suffix"]

parseStream : Bool -> List String -> Either (BBErr ObjectError) (List JSON)
parseStream array chunks =
  let bytes = map (\chunk => the ByteString (fromString chunk)) chunks in
    if array then runList jsonArray bytes else runList jsonValues bytes

streamDuplicate : Bool -> Bool
streamDuplicate array = case parseStream array
    (if array then ["[{\"same\":0,\"\\u00", "73ame\":1}]"]
      else ["{\"same\":0,\"\\u00", "73ame\":1}"]) of
  Left (B (Custom (DuplicateObjectKey key positions)) _) =>
    scalarValue key == "same" && positions == [0, 1]
  _ => False

streamInvalidKey : Bool -> Bool
streamInvalidKey array = case parseStream array
    (if array then ["[{\"\\ud8", "00\":0}]"] else ["{\"\\ud8", "00\":0}"]) of
  Left (B (Custom (InvalidScalarKey 0 key IsolatedSurrogate)) _) => key == codeUnit 0xd800
  _ => False

streamCanonical : Bool -> Bool
streamCanonical array = case parseStream array
    (if array then ["[{\"z\":1,\"\\u00", "61\":2}]"] else ["{\"z\":1,\"\\u00", "61\":2}"]) of
  Right [value] => encodeJSONValue value == Right "{\"a\":2,\"z\":1}"
  _ => False

streamChecks : List (String, Bool)
streamChecks =
  [ ("stream array duplicate split escape rejection", streamDuplicate True)
  , ("stream values duplicate split escape rejection", streamDuplicate False)
  , ("stream array invalid scalar split escape rejection", streamInvalidKey True)
  , ("stream values invalid scalar split escape rejection", streamInvalidKey False)
  , ("stream array split key canonical order", streamCanonical True)
  , ("stream values split key canonical order", streamCanonical False)
  ]

main : IO ()
main = do
  let allChecks = Main.checks ++ InternallyTagged.checks ++ preservingChecks ++ SortedAssoc.checks ++ canonicalChecks ++ streamChecks ++ keyChecks
  traverse_ (\(label, ok) => if ok then pure () else putStrLn ("FAIL " ++ label)) allChecks
  putStrLn ("CHECKS " ++ show (length allChecks))
  if all snd allChecks then pure () else primIO failChecks
