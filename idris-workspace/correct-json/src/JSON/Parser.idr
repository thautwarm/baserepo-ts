-- Imported from idris2-ilex commit 35300916952f92912f8b4894f73da7be9b4b805a.
-- See LICENSE.ilex and README for the source and local changes.
module JSON.Parser

import Data.Bits
import Data.Buffer
import Data.Linear.Ref1
import Derive.Prelude
import Syntax.T1
import Text.ILex.Derive
import public Text.ILex
import public JSON.Object

%default total
%hide Data.Linear.(.)
%language ElabReflection

||| We cannot use `cast` to convert all valid JSON numbers
||| to `Double`. Fortunately, both the JavaScript and Scheme
||| backends are more tolerant, so we can use a simple FFI call.
export %foreign "scheme:(lambda (s) (string->number s))"
                "javascript:lambda:(s) => Number(s)"
jdouble : String -> Double

--------------------------------------------------------------------------------
--          String Encoding
--------------------------------------------------------------------------------

public export
escape : SnocList Char -> Char -> SnocList Char
escape sc '"'  = sc :< '\\' :< '"'
escape sc '\n' = sc :< '\\' :< 'n'
escape sc '\f' = sc :< '\\' :< 'f'
escape sc '\b' = sc :< '\\' :< 'b'
escape sc '\r' = sc :< '\\' :< 'r'
escape sc '\t' = sc :< '\\' :< 't'
escape sc '\\' = sc :< '\\' :< '\\'
escape sc '/'  = sc :< '\\' :< '/'
escape sc c =
  if isControl c || (cast {to=Integer} c >= 0xd800 && cast {to=Integer} c <= 0xdfff)
    then
      let x  := the Integer $ cast c
          d1 := hexChar $ cast $ (shiftR x 12 .&. 0xf)
          d2 := hexChar $ cast $ (shiftR x 8 .&. 0xf)
          d3 := hexChar $ cast $ (shiftR x 4 .&. 0xf)
          d4 := hexChar $ cast (x .&. 0xf)
       in sc :< '\\' :< 'u' :< d1 :< d2 :< d3 :< d4
    else sc :< c

public export
encode : String -> String
encode s = pack (foldl escape [<'"'] (unpack s) <>> ['"'])

--------------------------------------------------------------------------------
--          JSON
--------------------------------------------------------------------------------

public export
data JSON : Type where
  JNull   : JSON
  JInteger : Integer -> JSON
  JDouble : Double -> JSON
  -- Raw number token. The default parser uses this for decimal/exponent forms;
  -- parseJSONPreservingNumbers uses it for every number, including integers.
  -- Parsed tokens satisfy the JSON grammar; manually constructed ones may not.
  JDecimal : String -> JSON
  JBool   : Bool   -> JSON
  JString : String -> JSON
  JArray  : List JSON -> JSON
  JsonObject : StringKeySortedAssoc JSON -> JSON

%runElab derive "JSON" [Eq]

showValue : SnocList String -> JSON -> SnocList String

showPair : SnocList String -> Binding JSON -> SnocList String

showArray : SnocList String -> List JSON -> SnocList String

showObject : SnocList String -> List (Binding JSON) -> SnocList String

showObjectStart : SnocList String -> List (Binding JSON) -> SnocList String

showValue ss JNull              = ss :< "null"
showValue ss (JInteger ntgr)      = ss :< show ntgr
showValue ss (JDouble dbl)      = ss :< show dbl
showValue ss (JDecimal token)   = ss :< token
showValue ss (JBool True)       = ss :< "true"
showValue ss (JBool False)      = ss :< "false"
showValue ss (JString str)      = ss :< encode str
showValue ss (JArray [])        = ss :< "[]"
showValue ss (JArray $ h :: t)  =
  let ss' = showValue (ss :< "[") h
   in showArray ss' t
showValue ss (JsonObject (CanonicalAssoc contents _)) = showObjectStart ss contents

showObjectStart ss [] = ss :< "{}"
showObjectStart ss (h :: t) = showObject (showPair (ss :< "{") h) t

showPair ss (s,v) = showValue (ss :< encode (scalarValue s) :< ":") v

showArray ss [] = ss :< "]"
showArray ss (h :: t) =
  let ss' = showValue (ss :< ",") h in showArray ss' t

showObject ss [] = ss :< "}"
showObject ss (h :: t) =
  let ss' = showPair (ss :< ",") h in showObject ss' t

showImpl : JSON -> String
showImpl v = fastConcat $ showValue Lin v <>> Nil

||| Raw rendering for diagnostics. Use encodeJSONValue for checked JSON output.
export %inline
Show JSON where
  show = showImpl

||| Recursively drops `Null` entries from JSON objects.
export
dropNull : JSON -> JSON

-- These witnesses transport key order only; recursive calls use the original
-- children exposed by matching the actual container's checked constructor.
record DroppedBindings (0 source : List (Binding JSON)) where
  constructor Dropped
  droppedEntries : List (Binding JSON)
  0 droppedOrder : CanonicalEntries droppedEntries
  0 droppedAfter : {0 codes : List Nat} -> AllAfter codes source -> AllAfter codes droppedEntries

dropBindings : (source : List (Binding JSON)) ->
  (0 ordered : CanonicalEntries source) -> DroppedBindings source

dropNulls : SnocList JSON -> List JSON -> JSON
dropNulls sx []        = JArray $ sx <>> []
dropNulls sx (x :: xs) = dropNulls (sx :< dropNull x) xs

dropNull (JArray xs) = dropNulls [<] xs
dropNull (JsonObject (CanonicalAssoc contents valid)) =
  let rebuilt = dropBindings contents (canonicalSound contents valid) in
    JsonObject (normalizedValue (Normalization rebuilt.droppedEntries rebuilt.droppedOrder mappingReflexive))
dropNull x            = x

dropBindings [] CanonicalEmpty = Dropped [] CanonicalEmpty (\_ => NoLaterBindings)
dropBindings ((key, JNull) :: rest) (CanonicalCons later ordered) =
  let remaining = dropBindings rest ordered in
    Dropped remaining.droppedEntries remaining.droppedOrder
      (\(LaterBinding _ after) => remaining.droppedAfter after)
dropBindings ((key, value) :: rest) (CanonicalCons later ordered) =
  let remaining = dropBindings rest ordered in
    Dropped ((key, dropNull value) :: remaining.droppedEntries)
      (CanonicalCons (remaining.droppedAfter later) remaining.droppedOrder)
      (\(LaterBinding earlier after) => LaterBinding earlier (remaining.droppedAfter after))

--------------------------------------------------------------------------------
--          Parser State
--------------------------------------------------------------------------------

%runElab deriveParserState "JSz" "JST"
  ["JIni","ANew","AVal","ACom","ONew","OVal","OCom","OLbl","OCol","JStr","JDone"]

data Part : Type where
  PA : Part -> SnocList JSON -> Part -- partial array
  PO : Part -> SnocList (String,JSON) -> Part -- partial object
  PL : Part -> SnocList (String,JSON) -> String -> Part -- partial object
  PI : Part -- initial value
  PV : SnocList JSON -> Part -- initial value for value streaming
  PF : JSON -> Part -- final value

public export
0 SK : Type -> Type
SK = Stack ObjectError Part JSz

--------------------------------------------------------------------------------
-- Transformations
--------------------------------------------------------------------------------

parameters {auto sk : SK q}

  %inline
  part : JSON -> Part -> F1 q JST
  part v (PA p sy)   = putStackAs (PA p (sy :< v)) AVal
  part v (PL p sy l) = putStackAs (PO p (sy :< (l,v))) OVal
  part v (PV sy)     = putStackAs (PV (sy :< v)) JIni
  part v _           = putStackAs (PF v) JDone

  %inline
  onVal : JSON -> F1 q JST
  onVal v = getStack >>= part v

  %inline
  endStr : String -> F1 q JST
  endStr s = T1.do
   getStack >>= \case
     PO a b => putStackAs (PL a b s) OLbl
     p      => part (JString s) p

  %inline
  closeVal : F1 q JST
  closeVal =
    getStack >>= \case
      PO p sp => case checkedAssoc (sp <>> []) of
        Right object => part (JsonObject object) p
        Left problem => failHere (Custom problem) JDone
      PA p sp => part (JArray $ sp <>> []) p
      _       => pure JDone

--------------------------------------------------------------------------------
-- Lexers
--------------------------------------------------------------------------------

%inline
spaced : Steps q r SK -> DFA q r SK
spaced = dfa . jsonSpaced

export
jsonDouble : RExp True
jsonDouble =
  let frac  = '.' >> plus digit
      exp   = oneof ['e','E'] >> opt (oneof ['+','-']) >> plus digit
   in opt '-' >> decimal >> opt frac >> opt exp

%inline
valTok : Bool -> Steps q JSz SK -> DFA q JSz SK
valTok preserveNumbers ts =
  spaced $
    [ step "null"  (onVal JNull)
    , step "true"  (onVal $ JBool True)
    , step "false" (onVal $ JBool False)
    ] ++ (if preserveNumbers
      then [string jsonDouble (onVal . JDecimal)]
      else [ bytes (opt '-' >> decimal) (onVal . JInteger . Util.integer)
           , string jsonDouble (onVal . JDecimal)
           ]) ++
    [ opn '{' (modStackAs SK (`PO` [<]) ONew)
    , opn '[' (modStackAs SK (`PA` [<]) ANew)
    , opn' '"' JStr
    ] ++ ts

codepoint : RExp True
codepoint = #"\u"# >> hexdigit >> hexdigit >> hexdigit >> hexdigit

-- Preserve JSON UTF-16 escapes on the JS backend; an Idris Char cast
-- deliberately maps surrogate code points to NUL.
%foreign "javascript:lambda: n => String.fromCharCode(n)"
         "scheme:(lambda (n) (string (integer->char n)))"
codeUnit : Int -> String

decode : ByteString -> String
decode (BS 6 bv) =
 codeUnit $ cast $
   hexdigit (bv `at` 2) * 0x1000 +
   hexdigit (bv `at` 3) * 0x100  +
   hexdigit (bv `at` 4) * 0x10   +
   hexdigit (bv `at` 5)
decode _         = "" -- impossible

jchar : RExp True
jchar = range32 0x20 0x10ffff && not '"' && not '\\'

%inline
strTok : DFA q JSz SK
strTok =
  dfa
    [ closeStr '"' endStr
    , string (plus jchar) (pushStr JStr)
    , step #"\""# (pushStr JStr "\"")
    , step #"\n"# (pushStr JStr "\n")
    , step #"\f"# (pushStr JStr "\f")
    , step #"\b"# (pushStr JStr "\b")
    , step #"\r"# (pushStr JStr "\r")
    , step #"\t"# (pushStr JStr "\t")
    , step #"\\"# (pushStr JStr "\\")
    , step #"\/"# (pushStr JStr "\/")
    , bytes codepoint (pushStr JStr . decode)
    ]

--------------------------------------------------------------------------------
-- Parsers
--------------------------------------------------------------------------------

jsonTransFor : Bool -> Lex1 q JSz SK
jsonTransFor preserveNumbers =
  lex1
    [ E JIni (valTok preserveNumbers [])
    , E JDone (spaced [])

    , E ANew (valTok preserveNumbers [close ']' closeVal])
    , E ACom (valTok preserveNumbers [])
    , E AVal $ spaced [step' ',' ACom, close ']' closeVal]

    , E ONew $ spaced [close '}' closeVal, opn' '"' JStr]
    , E OVal $ spaced [close '}' closeVal, step' ',' OCom]
    , E OCom $ spaced [opn' '"' JStr]
    , E OLbl $ spaced [step' ':' OCol]
    , E OCol (valTok preserveNumbers [])

    , E JStr strTok
    ]

jsonTrans : Lex1 q JSz SK
jsonTrans = jsonTransFor False

jsonErr : Arr32 JSz (SK q -> F1 q (BBErr ObjectError))
jsonErr =
  arr32 JSz (unexpected [])
    [ E ANew $ unclosedIfEOI "[" []
    , E AVal $ unclosedIfEOI "[" [",", "]"]
    , E ACom $ unclosedIfEOI "[" []
    , E ONew $ unclosedIfEOI "{" ["\"", "}"]
    , E OVal $ unclosedIfEOI "{" [",", "}"]
    , E OCom $ unclosedIfEOI "{" ["\""]
    , E OLbl $ unclosedIfEOI "{" [":"]
    , E OCol $ unclosedIfEOI "{" []
    , E JStr $ unclosedIfNLorEOI "\"" []
    ]

jsonEOI : JST -> SK q -> F1 q (Either (BBErr ObjectError) JSON)
jsonEOI sk s t =
  case read1 (error s) t of
    Just problem # t => Left problem # t
    Nothing # t => case sk == JDone of
      False => arrFail SK jsonErr sk s t
      True  => case getStack t of
        PF v # t => Right v # t
        _    # t => Right JNull # t

public export
json : P1 q (BBErr ObjectError) JSON
json = P JIni (init PI) jsonTrans (\x => (Nothing #)) jsonErr jsonEOI

-- parseString uses UTF-8 bytes. Preserve literal JS surrogate code units inside
-- strings by spelling them as escapes first. Do not repair an invalid escape
-- or an out-of-string token; full syntax validation remains the DFA's job.
prepareText : String -> String
prepareText s = pack (go False False [<] (unpack s) <>> [])
  where
    go : Bool -> Bool -> SnocList Char -> List Char -> SnocList Char
    go quoted escaped acc [] = acc
    go quoted True acc (c :: cs) = go quoted False (acc :< c) cs
    go True False acc ('\\' :: cs) = go True True (acc :< '\\') cs
    go quoted False acc ('"' :: cs) = go (not quoted) False (acc :< '"') cs
    go quoted False acc (c :: cs) =
      let n = cast {to=Integer} c in
      if quoted && n >= 0xd800 && n <= 0xdfff
        then go quoted False (escape acc c) cs
        else go quoted False (acc :< c) cs

export %inline
parseJSON : Origin -> String -> Either (ParseError ObjectError) JSON
parseJSON origin input = parseString json origin (prepareText input)

||| Parse with the same JSON grammar, retaining every original number token in
||| JDecimal, including integer -0 and arbitrarily large/exponent forms. No
||| numeric conversion or finite-value check occurs here. Objects reject duplicate
||| or non-scalar keys and use canonical scalar-key order; string VALUES retain
||| the same compatibility domain as parseJSON.
|||
||| Existing getInteger and Nat/Int64 decoders do not accept JDecimal integers.
||| Consumers must choose an explicit typed numeric interpretation. This entry
||| preserves number syntax, not whitespace or string escape spellings, and does
||| not validate manually constructed JDecimal values for later serialization.
export %inline
parseJSONPreservingNumbers : Origin -> String -> Either (ParseError ObjectError) JSON
parseJSONPreservingNumbers origin input =
  parseString (P JIni (init PI) (jsonTransFor True) (\x => (Nothing #)) jsonErr jsonEOI)
    origin (prepareText input)

--------------------------------------------------------------------------------
-- Streaming
--------------------------------------------------------------------------------

extract : Part -> (Part, Maybe $ List JSON)
extract (PF (JArray vs)) = (PF (JArray []), Just vs)
extract (PA PI sv)       = (PA PI [<], maybeList sv)
extract (PV sv)          = (PV [<], maybeList sv)
extract (PA p sv)        = let (p2,m) := extract p in (PA p2 sv, m)
extract (PO p sv)        = let (p2,m) := extract p in (PO p2 sv, m)
extract (PL p sv l)      = let (p2,m) := extract p in (PL p2 sv l, m)
extract p                = (p, Nothing)

arrChunk : SK q -> F1 q (Maybe $ List JSON)
arrChunk sk = T1.do
  p <- getStack
  let (p2,res) := extract p
  putStackAs p2 res

arrEOI : JST -> SK q -> F1 q (Either (BBErr ObjectError) (List JSON))
arrEOI st sk t =
  case read1 (error sk) t of
    Just problem # t => Left problem # t
    Nothing # t => case st == JIni of
      True  => case getStack t of
        PV sv # t => Right (sv <>> []) # t
        _     # t => Right [] # t
      False => case jsonEOI st sk t of
        Right (JArray vs) # t => Right vs # t
        Right _           # t => Right [] # t
        Left x            # t => Left x # t

||| A parser that is capable of streaming a single large
||| array of JSON values.
public export
jsonArray : P1 q (BBErr ObjectError) (List JSON)
jsonArray = P JIni (init PI) jsonTrans arrChunk jsonErr arrEOI

||| Parser that is capable of streaming large amounts of
||| JSON values.
|||
||| Values need not be separated by whitespace but the longest
||| possible value will always be consumed.
public export
jsonValues : P1 q (BBErr ObjectError) (List JSON)
jsonValues = P JIni (init $ PV [<]) jsonTrans arrChunk jsonErr arrEOI

||| Exactly one original number token, using the same DFA as actual JSON text.
||| Exponent magnitude is not a floating-point bound or an allocation budget.
export
checkedNumberToken : String -> Either String String
checkedNumberToken token = case parseJSONPreservingNumbers Virtual token of
  Right (JDecimal retained) => if retained == token then Right token
    else Left "JSON: expected a complete number token without whitespace"
  _ => Left "JSON: invalid number token"

export
finiteDouble : Double -> Bool
finiteDouble value = value == value && abs value <= 1.7976931348623157e308

validateJSONValue : JSON -> Either String ()
validateJSONBindings : List (Binding JSON) -> Either String ()
validateJSONValues : List JSON -> Either String ()
validateJSONValue (JDouble value) =
  if finiteDouble value then map (const ()) (checkedNumberToken (show value))
  else Left "JSON: non-finite Double"
validateJSONValue (JDecimal token) = map (const ()) (checkedNumberToken token)
validateJSONValue (JArray values) = validateJSONValues values
validateJSONValue (JsonObject (CanonicalAssoc contents _)) = validateJSONBindings contents
validateJSONValue _ = Right ()

validateJSONBindings [] = Right ()
validateJSONBindings ((_, value) :: rest) = do
  validateJSONValue value
  validateJSONBindings rest

validateJSONValues [] = Right ()
validateJSONValues (value :: rest) = do
  validateJSONValue value
  validateJSONValues rest

||| Checked serialization, including manually built numeric AST nodes.
export
encodeJSONValue : JSON -> Either String String
encodeJSONValue value = do
  validateJSONValue value
  pure (show value)

||| Explicit checked compatibility construction; no raw-pairs AST remains.
export
objectFromLegacyPairs : List (String, JSON) -> Either String JSON
objectFromLegacyPairs values = map JsonObject (mapFst show (checkedAssoc values))

||| The compatibility constructor preserves a proved checked normalization.
export
0 objectFromLegacyPairsBindings :
  (bindings : List (Binding JSON)) -> (result : StringKeySortedAssoc JSON) ->
  (0 accepted : Value.StringKeySortedAssoc.fromList bindings = Right result) ->
  objectFromLegacyPairs (map Value.StringKeySortedAssoc.bindingContent bindings) = Right (JsonObject result)
objectFromLegacyPairsBindings bindings result accepted =
  rewrite checkedAssocBindings bindings result accepted in Refl
