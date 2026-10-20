module InternallyTagged

import JSON.Derive
import Data.String

%language ElabReflection
%default total

internalOptions : Options
internalOptions = { sum := InternallyTagged "tag" } defaultOptions

internalTo : List Name -> ParamTypeInfo -> Res (List TopLevel)
internalTo = customToJSON internalOptions

internalFrom : List Name -> ParamTypeInfo -> Res (List TopLevel)
internalFrom = customFromJSON internalOptions

data Shape : Type where
  Circle : (radius : Nat) -> Shape
  Rect : (width : Int64) -> (height : Nat) -> Shape
  Dot : Shape
  Label : (text : String) -> Shape
  Branch : (left : Shape) -> (right : Shape) -> Shape

%runElab derive "Shape" [Eq, internalTo, internalFrom]

data Flags = On | Off
%runElab derive "Flags" [Eq, internalTo, internalFrom]

renameField : String -> String
renameField "item_count" = "itemCount"
renameField s = s

renamedOptions : Options
renamedOptions = { sum := InternallyTagged "kind", constructorTagModifier := toLower,
                   fieldNameModifier := renameField, unwrapUnary := False } defaultOptions

renamedTo : List Name -> ParamTypeInfo -> Res (List TopLevel)
renamedTo = customToJSON renamedOptions

renamedFrom : List Name -> ParamTypeInfo -> Res (List TopLevel)
renamedFrom = customFromJSON renamedOptions

data Renamed : Type where
  Item : (item_count : Nat) -> Renamed
  Empty : Renamed
%runElab derive "Renamed" [Eq, renamedTo, renamedFrom]

record UntaggedRecord where
  constructor Unwrapped
  count : Nat

record TaggedRecord where
  constructor Tagged
  count : Nat

recordTo : List Name -> ParamTypeInfo -> Res (List TopLevel)
recordTo = customToJSON ({ unwrapUnary := False } internalOptions)

recordFrom : List Name -> ParamTypeInfo -> Res (List TopLevel)
recordFrom = customFromJSON ({ unwrapUnary := False } internalOptions)

taggedRecordTo : List Name -> ParamTypeInfo -> Res (List TopLevel)
taggedRecordTo = customToJSON ({ unwrapRecords := False } internalOptions)

taggedRecordFrom : List Name -> ParamTypeInfo -> Res (List TopLevel)
taggedRecordFrom = customFromJSON ({ unwrapRecords := False } internalOptions)

%runElab derive "UntaggedRecord" [Eq, recordTo, recordFrom]
%runElab derive "TaggedRecord" [Eq, taggedRecordTo, taggedRecordFrom]

data SingleNullary = Only
%runElab derive "SingleNullary" [Eq, taggedRecordTo, taggedRecordFrom]

data SingleUnwrapped = Bare Nat
%runElab derive "SingleUnwrapped" [Eq, internalTo, internalFrom]

-- Default behavior still uses the original nested TaggedObject/string forms.
data Legacy : Type where
  Value : (amount : Nat) -> (label : String) -> Legacy
  None : Legacy
%runElab derive "Legacy" [Eq, ToJSON, FromJSON]

%foreign "javascript:lambda: n => String.fromCharCode(n)"
codeUnit : Int -> String

exact : Eq a => FromJSON a => String -> a -> Bool
exact input expected = case decode input of
  Right actual => actual == expected
  Left _ => False

rejected : (0 a : Type) -> FromJSON a => String -> Bool
rejected a input = case decode {a} input of
  Left _ => True
  Right _ => False

roundtrip : Eq a => ToJSON a => FromJSON a => a -> Bool
roundtrip value = case encode value of
  Right text => exact text value
  Left _ => False

export
checks : List (String, Bool)
checks =
  [ ("internal unary encode keeps name", encode (Circle 9007199254740993) == Right "{\"radius\":9007199254740993,\"tag\":\"Circle\"}")
  , ("internal unary independent decode", exact "{\"tag\":\"Circle\",\"radius\":9007199254740993}" (Circle 9007199254740993))
  , ("internal named encode exact counters", encode (Rect (-9223372036854775808) 123456789012345678901234567890) == Right "{\"height\":123456789012345678901234567890,\"tag\":\"Rect\",\"width\":-9223372036854775808}")
  , ("internal named independent decode", exact "{\"tag\":\"Rect\",\"width\":-9223372036854775808,\"height\":123456789012345678901234567890}" (Rect (-9223372036854775808) 123456789012345678901234567890))
  , ("internal nullary encode", encode Dot == Right "{\"tag\":\"Dot\"}")
  , ("internal nullary independent decode", exact "{\"tag\":\"Dot\"}" Dot)
  , ("internal fields before tag decode", exact "{\"radius\":3,\"tag\":\"Circle\"}" (Circle 3))
  , ("internal string encode", encode (Label "北京🧪") == Right "{\"tag\":\"Label\",\"text\":\"北京🧪\"}")
  , ("internal string independent decode", exact "{\"tag\":\"Label\",\"text\":\"北京🧪\"}" (Label "北京🧪"))
  , ("internal recursive encode", encode (Branch Dot (Circle 3)) == Right "{\"left\":{\"tag\":\"Dot\"},\"right\":{\"radius\":3,\"tag\":\"Circle\"},\"tag\":\"Branch\"}")
  , ("internal recursive independent decode", exact "{\"tag\":\"Branch\",\"left\":{\"tag\":\"Dot\"},\"right\":{\"tag\":\"Circle\",\"radius\":3}}" (Branch Dot (Circle 3)))
  , ("internal circle roundtrip", roundtrip (Circle 42))
  , ("internal rect roundtrip", roundtrip (Rect (-42) 9007199254740993))
  , ("internal dot roundtrip", roundtrip Dot)
  , ("internal recursive roundtrip", roundtrip (Branch (Label "x") (Branch Dot (Circle 0))))
  , ("internal high surrogate roundtrip", roundtrip (Label (codeUnit 0xd800)))
  , ("internal low surrogate roundtrip", roundtrip (Label (codeUnit 0xdc00)))
  , ("internal high surrogate independent decode", exact "{\"tag\":\"Label\",\"text\":\"\\ud800\"}" (Label (codeUnit 0xd800)))
  , ("internal high surrogate encode", map toLower (encode (Label (codeUnit 0xd800))) == Right "{\"tag\":\"label\",\"text\":\"\\ud800\"}")
  , ("internal all nullary encode", encode On == Right "{\"tag\":\"On\"}")
  , ("internal all nullary decode", exact "{\"tag\":\"Off\"}" Off)
  , ("internal all nullary roundtrip", roundtrip On && roundtrip Off)
  , ("internal renamed encode", encode (Item 9007199254740993) == Right "{\"itemCount\":9007199254740993,\"kind\":\"item\"}")
  , ("internal renamed independent decode", exact "{\"kind\":\"item\",\"itemCount\":9007199254740993}" (Item 9007199254740993))
  , ("internal renamed nullary", encode Empty == Right "{\"kind\":\"empty\"}" && exact "{\"kind\":\"empty\"}" Empty)
  , ("internal renamed roundtrip", roundtrip (Item 42))
  , ("internal unwrapped record unchanged", encode (Unwrapped 3) == Right "{\"count\":3}" && exact "{\"count\":3}" (Unwrapped 3))
  , ("internal tagged single record encode", encode (Tagged 3) == Right "{\"count\":3,\"tag\":\"Tagged\"}")
  , ("internal tagged single record decode", exact "{\"tag\":\"Tagged\",\"count\":3}" (Tagged 3))
  , ("internal tagged single record roundtrip", roundtrip (Tagged 3))
  , ("internal tagged single nullary encode", encode Only == Right "{\"tag\":\"Only\"}")
  , ("internal tagged single nullary decode", exact "{\"tag\":\"Only\"}" Only)
  , ("internal tagged single nullary roundtrip", roundtrip Only)
  , ("internal unwrapped positional encode unchanged", encode (Bare 3) == Right "3")
  , ("internal unwrapped positional decode unchanged", exact "3" (Bare 3))
  , ("internal missing tag rejected", rejected Shape "{\"radius\":3}")
  , ("internal null tag rejected", rejected Shape "{\"tag\":null,\"radius\":3}")
  , ("internal number tag rejected", rejected Shape "{\"tag\":1,\"radius\":3}")
  , ("internal unknown tag rejected", rejected Shape "{\"tag\":\"Other\",\"radius\":3}")
  , ("internal missing field rejected", rejected Shape "{\"tag\":\"Circle\"}")
  , ("internal null field rejected", rejected Shape "{\"tag\":\"Circle\",\"radius\":null}")
  , ("internal negative Nat rejected", rejected Shape "{\"tag\":\"Circle\",\"radius\":-1}")
  , ("internal decimal Nat rejected", rejected Shape "{\"tag\":\"Circle\",\"radius\":1.0}")
  , ("internal signed overflow rejected", rejected Shape "{\"tag\":\"Rect\",\"width\":9223372036854775808,\"height\":0}")
  , ("internal bare nullary rejected", rejected Shape "\"Dot\"")
  , ("internal nested contents rejected", rejected Shape "{\"tag\":\"Circle\",\"contents\":3}")
  , ("internal unary bare value rejected", rejected Shape "3")
  , ("internal array rejected", rejected Shape "[\"Circle\",3]")
  , ("internal renamed original names rejected", rejected Renamed "{\"kind\":\"Item\",\"item_count\":3}")
  , ("internal existing unknown field policy", exact "{\"tag\":\"Circle\",\"radius\":3,\"extra\":true}" (Circle 3))
  , ("internal nullary unknown field policy", exact "{\"tag\":\"Dot\",\"extra\":true}" Dot)
  , ("legacy named encode canonical order", encode (Value 3 "x") == Right "{\"contents\":{\"amount\":3,\"label\":\"x\"},\"tag\":\"Value\"}")
  , ("legacy named decode unchanged", exact "{\"tag\":\"Value\",\"contents\":{\"amount\":3,\"label\":\"x\"}}" (Value 3 "x"))
  , ("legacy nullary string unchanged", encode None == Right "\"None\"" && exact "\"None\"" None)
  ]
