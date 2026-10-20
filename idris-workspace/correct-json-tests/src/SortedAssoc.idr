module SortedAssoc

import JSON.Parser
import Value.StringKeySortedAssoc
import Proof.Value.StringKeySortedAssoc
import Data.String
import Decidable.Equality

%default total

-- These are independent runtime/backend fixtures, not witnesses of universal
-- Unicode correspondence. In particular, JSON string VALUES keep the legacy
-- surrogate domain; only dictionary keys go through ScalarString validation.
%foreign "javascript:lambda: n => String.fromCharCode(n)"
codeUnit : Int -> String

bindings : List (String, a) -> Either String (List (Binding a))
bindings [] = Right []
bindings ((raw, value) :: rest) = case scalarString raw of
  Left _ => Left "non-scalar key"
  Right key => map ((key, value) ::) (bindings rest)

build : List (String, a) -> Maybe (StringKeySortedAssoc a)
build input = case bindings input of
  Left _ => Nothing
  Right typed => case fromList typed of
    Left _ => Nothing
    Right result => Just result

matches : List (String, Nat) -> List (String, Nat) -> Bool
matches input expected = case build input of
  Nothing => False
  Just result => map bindingContent (entries result) == expected

duplicate : List (String, Nat) -> Bool
duplicate input = case bindings input of
  Left _ => False
  Right typed => case fromList typed of
    Left (DuplicateKey _) => True
    Right _ => False

codesMatch : String -> List Nat -> Bool
codesMatch raw expected = case scalarString raw of
  Left _ => False
  Right typed => keyCodes typed == expected

lookupMatch : List (String, Nat) -> String -> Maybe Nat -> Bool
lookupMatch input raw expected = case (build input, scalarString raw) of
  (Just result, Right key) => lookupValue key result == expected
  _ => False

sameNormalized : Bool
sameNormalized = case (build [ ("b", the Nat 2), ("a", 1) ], build [ ("a", the Nat 1), ("b", 2) ]) of
  (Just left, Just right) => left == right
  _ => False

decSameNormalized : Bool
decSameNormalized = case (build [ ("b", the Nat 2), ("a", 1) ], build [ ("a", the Nat 1), ("b", 2) ]) of
  (Just left, Just right) => case decEq left right of Yes _ => True; No _ => False
  _ => False

decDifferentValues : Bool
decDifferentValues = case (build [ ("a", the Nat 1) ], build [ ("a", the Nat 2) ]) of
  (Just left, Just right) => case decEq left right of Yes _ => False; No _ => True
  _ => False

showEntries : Bool
showEntries = case build [ ("b", the Nat 2), ("a", 1) ] of
  Just result => show result == "[(\"a\", 1), (\"b\", 2)]"
  _ => False

mappedValues : Bool
mappedValues = case build [ ("b", the Nat 2), ("a", 1) ] of
  Just result => map bindingContent (entries (mapValues S result)) == [("a", 2), ("b", 3)]
  _ => False

normalizeAgain : Bool
normalizeAgain = case build [ ("b", the Nat 2), ("a", 1) ] of
  Just result => case fromList (entries result) of Right rebuilt => result == rebuilt; Left _ => False
  _ => False

functionValues : Bool
functionValues = case build [ ("b", the (Nat -> Nat) (\value => value + 2)), ("a", \value => value + 1) ] of
  Nothing => False
  Just result => case scalarString "a" of
    Left _ => False
    Right key => case lookupValue key result of Nothing => False; Just action => action 3 == 4

invalidKey : Int -> Bool
invalidKey point = case scalarString (codeUnit point) of Left IsolatedSurrogate => True; Right _ => False

surrogateValue : Int -> Bool
surrogateValue point = case build [("scalar-key", codeUnit point)] of
  Nothing => False
  Just result => map bindingContent (entries (mapValues id result)) == [("scalar-key", codeUnit point)]

-- The parser checks original occurrences before canonical construction.
-- Escape-equivalent keys cannot be overwritten by an object projection.
parsedDuplicate : String -> Bool
parsedDuplicate input = case parseJSON Virtual input of
  Left (PE _ _ _ _ (Custom (DuplicateObjectKey _ positions))) => positions == [0, 1]
  _ => False

parsedInvalidKey : Bool
parsedInvalidKey = case parseJSON Virtual "{\"\\ud800\":0}" of
  Left (PE _ _ _ _ (Custom (InvalidScalarKey 0 raw IsolatedSurrogate))) => raw == codeUnit 0xd800
  _ => False

parsedSurrogateValue : Bool
parsedSurrogateValue = case parseJSON Virtual "{\"scalar-key\":\"\\ud800\"}" of
  Right (JsonObject values) => case map bindingContent (entries values) of
    [("scalar-key", JString value)] => value == codeUnit 0xD800
    _ => False
  _ => False

longKeyOrder : Bool
longKeyOrder =
  let sharedKeyPrefix = Data.String.replicate 2048 'x'
  in matches [(sharedKeyPrefix ++ "😀", 2), (sharedKeyPrefix ++ "", 1)] [(sharedKeyPrefix ++ "", 1), (sharedKeyPrefix ++ "😀", 2)]

scalarMaps : (StringKeySortedAssoc ScalarString -> StringKeySortedAssoc ScalarString -> Bool) -> Bool
scalarMaps action = case (scalarString "one", scalarString "two") of
  (Right one, Right two) => case (build [("b", two), ("a", one)], build [("a", one), ("b", two)]) of
    (Just left, Just right) => action left right
    _ => False
  _ => False

export
checks : List (String, Bool)
checks =
  [ ("assoc empty", matches [] [])
  , ("assoc singleton zero and empty key", matches [("", 0)] [("", 0)])
  , ("assoc integer-looking lex order", matches [("2", 2), ("10", 10)] [("10", 10), ("2", 2)])
  , ("assoc leading zero keys distinct", matches [("1", 1), ("01", 2)] [("01", 2), ("1", 1)])
  , ("assoc case-sensitive keys", matches [("a", 2), ("A", 1)] [("A", 1), ("a", 2)])
  , ("assoc no Unicode normalization", matches [("é", 2), ("é", 1)] [("é", 1), ("é", 2)])
  , ("assoc scalar order differs from UTF16", matches [("😀", 2), ("", 1)] [("", 1), ("😀", 2)])
  , ("assoc highest scalar order", matches [("􏿿", 3), ("😀", 2), ("", 1)] [("", 1), ("😀", 2), ("􏿿", 3)])
  , ("assoc empty before nonempty key", matches [("a", 2), ("", 1)] [("", 1), ("a", 2)])
  , ("assoc prefix before extension", matches [("ab", 2), ("a", 1)] [("a", 1), ("ab", 2)])
  , ("assoc escape keys retained", matches [("\\", 2), ("\"", 1)] [("\"", 1), ("\\", 2)])
  , ("assoc identical binding duplicate rejected", duplicate [("a", 1), ("a", 1)])
  , ("assoc different value duplicate rejected", duplicate [("a", 1), ("a", 2)])
  , ("assoc nonadjacent duplicate rejected", duplicate [("a", 1), ("b", 2), ("a", 3)])
  , ("assoc empty key duplicate rejected", duplicate [("", 1), ("", 2)])
  , ("assoc astral duplicate rejected", duplicate [("😀", 1), ("😀", 2)])
  , ("assoc parsed escape-equivalent duplicate", parsedDuplicate "{\"same\":0,\"\\u0073ame\":1}")
  , ("assoc parsed astral escape-equivalent duplicate", parsedDuplicate "{\"😀\":0,\"\\ud83d\\ude00\":1}")
  , ("assoc codepoint empty", codesMatch "" [])
  , ("assoc codepoint astral", codesMatch "😀" [128512])
  , ("assoc codepoint composed", codesMatch "é" [233])
  , ("assoc codepoint combining", codesMatch "é" [101, 769])
  , ("assoc codepoint highest scalar", codesMatch "􏿿" [1114111])
  , ("assoc high isolated surrogate key rejected", invalidKey 0xD800)
  , ("assoc low isolated surrogate key rejected", invalidKey 0xDC00)
  , ("assoc high surrogate value remains generic", surrogateValue 0xD800)
  , ("assoc low surrogate value remains generic", surrogateValue 0xDC00)
  , ("assoc parser isolated surrogate key rejected", parsedInvalidKey)
  , ("assoc parser surrogate value remains generic", parsedSurrogateValue)
  , ("assoc lookup found", lookupMatch [("b", 2), ("a", 1)] "a" (Just 1))
  , ("assoc lookup absent before", lookupMatch [("b", 2)] "a" Nothing)
  , ("assoc lookup absent after", lookupMatch [("a", 1)] "b" Nothing)
  , ("assoc lookup empty", lookupMatch [] "a" Nothing)
  , ("assoc generic function values need no Eq", functionValues)
  , ("assoc value map keeps keys", mappedValues)
  , ("assoc runtime normalization idempotent", normalizeAgain)
  , ("assoc Eq compares normalized mapping", sameNormalized)
  , ("assoc DecEq normalized equality", decSameNormalized)
  , ("assoc DecEq detects different value", decDifferentValues)
  , ("assoc Show diagnostic entries", showEntries)
  , ("assoc long shared prefix and high codepoints", longKeyOrder)
  , ("assoc ScalarString values Eq", scalarMaps (==))
  , ("assoc ScalarString values DecEq", scalarMaps (\left, right => case decEq left right of Yes _ => True; No _ => False))
  , ("assoc ScalarString values Show", scalarMaps (\left, right => show left == "[(\"a\", \"one\"), (\"b\", \"two\")]") )
  , ("assoc object special keys preserved", matches [("constructor", 2), ("__proto__", 1)] [("__proto__", 1), ("constructor", 2)])
  , ("assoc object special key lookup", lookupMatch [("constructor", 2), ("__proto__", 1)] "__proto__" (Just 1))
  ]
