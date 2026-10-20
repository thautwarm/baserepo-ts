module JSON.Wire.Codec

import JSON
import public JSON.Wire.Description
import public JSON.Wire.Check
import public JSON.Wire.Registry
import JSON.Wire.Numeric
import JSON.Wire.Binary64
import Data.List

%default total

||| Constructor is hidden. The elaborator's trusted bridge binds the generated
||| codec closures to the reflected description; this linkage is tested, not
||| proved. Every public text/view path checks keys and field kinds first.
export
record WireCodec a where
  constructor Codec
  checked : CheckedRecord
  graphChecked : CheckedGraph
  encodeValue : a -> Result JSON
  decodeValue : JSON -> Result a

export
codecDescription : WireCodec a -> CheckedRecord
codecDescription = checked

exactKeys : List String -> List (String, JSON) -> Result ()
exactKeys expected pairs =
  if length pairs /= length expected ||
     not (all (\key => length (filter (\entry => fst entry == key) pairs) == 1) expected)
    then fail "Wire: unknown, missing or duplicate object field"
    else Right ()

checkField : WireField -> JSON -> Result ()
checkField field value = prependPath (checkKind field.kind value) (Key field.wireName)
  where
    checkKind : FieldKind -> JSON -> Result ()
    checkKind Natural (JInteger n) = if n >= 0 then Right () else fail "Wire: expected natural integer literal"
    checkKind Text (JString _) = Right ()
    checkKind Natural _ = fail "Wire: expected natural integer literal"
    checkKind Text _ = fail "Wire: expected string"

export
validateRecord : CheckedRecord -> JSON -> Result ()
validateRecord checked (JsonObject object) = do
  let pairs = map bindingContent (entries object)
  let fields = (description checked).fields
  exactKeys (map wireName fields) pairs
  traverse_ (\field => case Data.List.lookup field.wireName pairs of
    Nothing => fail "Wire: missing field"
    Just value => checkField field value) fields
validateRecord _ _ = fail "Wire: expected record object"

||| Internal construction bridge for generated declarations. The factory
||| validates the description, but cannot prove arbitrary supplied closures
||| coherent. Callers should use deriveWire; this function is a trusted boundary.
export
trustedDerivedCodec : RecordDescription -> (a -> Either String JSON) -> (JSON -> Result a)
                   -> Either String (WireCodec a)
trustedDerivedCodec d encode decode = do
  checked <- checkRecord d
  graph <- singletonGraph checked
  pure (Codec checked graph (\value => mapFst (\message => ([], message)) (encode value)) decode)

parseText : String -> Either String JSON
parseText text = case parseJSON Virtual text of
  Left err => Left (interpolate err)
  Right value => Right value

fieldError : Result a -> Either String a
fieldError = mapFst (\(path, message) => formatError path message)

||| The typed closures are emitted from the same reflected graph. Like W1,
||| this hidden-constructor factory is an explicit trusted elaborator bridge,
||| not a proof that arbitrary caller-provided closures respect the graph.
export
record GraphCodec a where
  constructor GraphCodecValue
  checkedGraph : CheckedGraph
  encodeGraphValue : a -> Result JSON
  decodeGraphValue : JSON -> Result a

export
graphCodecDescription : GraphCodec a -> CheckedGraph
graphCodecDescription = checkedGraph

export
trustedGraphCodec : GraphDescription -> (a -> Result JSON) -> (JSON -> Result a)
                 -> Either String (GraphCodec a)
trustedGraphCodec graph encode decode = do
  checked <- checkGraph graph
  pure (GraphCodecValue checked encode decode)

||| Same trusted typed closure bridge with source provenance attached. Legacy
||| trustedGraphCodec and its three-field hidden GraphCodec constructor stay.
export
trustedAuthoredGraphCodec : GraphDescription -> List DefinitionOrigin
                         -> (a -> Result JSON) -> (JSON -> Result a)
                         -> Either String (GraphCodec a)
trustedAuthoredGraphCodec graph origins encode decode = do
  checked <- checkGraphWithOrigins graph origins
  pure (GraphCodecValue checked encode decode)

||| The hidden carrier is a typed linkage, not a proof of closure coherence.
||| Published metadata is separate pure data; elaboration never quotes this.
export
record WireDefinition (0 a : Type) where
  constructor TypedWireDefinition
  wireDescription : WireMetadata
  wireEncoder : a -> Result JSON
  wireDecoder : JSON -> Result a

||| Internal trusted construction bridge used by generated author declarations.
export
trustedWireDefinition : WireMetadata -> (a -> Result JSON) -> (JSON -> Result a) -> WireDefinition a
trustedWireDefinition = TypedWireDefinition

||| Internal raw projections for generated imported links. Public text paths
||| still validate the complete checked graph before/after these closures.
export
wireEncodeValue : WireDefinition a -> a -> Result JSON
wireEncodeValue = wireEncoder

export
wireDecodeValue : WireDefinition a -> JSON -> Result a
wireDecodeValue = wireDecoder

||| The actual encoder projection is the supplied closure. This equation does
||| not prove that the closure implements its metadata or a semantic relation.
export
0 wireEncodeFactory :
  {0 a : Type} ->
  (metadata : WireMetadata) ->
  (encode : a -> Result JSON) ->
  (decode : JSON -> Result a) ->
  (value : a) ->
  wireEncodeValue (trustedWireDefinition metadata encode decode) value = encode value
wireEncodeFactory metadata encode decode value = Refl

||| The actual decoder projection is the supplied closure. Checked graph and
||| protocol semantics remain separate obligations.
export
0 wireDecodeFactory :
  {0 a : Type} ->
  (metadata : WireMetadata) ->
  (encode : a -> Result JSON) ->
  (decode : JSON -> Result a) ->
  (json : JSON) ->
  wireDecodeValue (trustedWireDefinition metadata encode decode) json = decode json
wireDecodeFactory metadata encode decode json = Refl

export
record WireTemplate where
  constructor TypedWireTemplate
  templateDescription : WireMetadata

export
trustedWireTemplate : WireMetadata -> WireTemplate
trustedWireTemplate = TypedWireTemplate

||| A component factory for a published typed definition uses the same graph
||| collector/checker as independent roots. Presentation profiles are separate.
export
wireGraphCodec : WireDefinition a -> Either String (GraphCodec a)
wireGraphCodec definition = do
  nodes <- collectWireMetadata [definition.wireDescription]
  trustedAuthoredGraphCodec
    (Graph (show definition.wireDescription.metadataWireName) Component (map metadataDefinition nodes))
    (map metadataOrigin nodes) definition.wireEncoder definition.wireDecoder

export
readNatural : JSON -> Result Nat
readNatural (JInteger n) = if n >= 0 then Right (cast n) else fail "Wire graph: expected natural integer literal"
readNatural _ = fail "Wire graph: expected natural integer literal"

export
readBoundNatural : NumericBinding -> JSON -> Result Nat
readBoundNatural rules json = mapFst (\message => ([], message)) (boundNatural rules json)

export
readString : JSON -> Result String
readString (JString text) = Right text
readString _ = fail "Wire graph: expected string"

export
readBoolean : JSON -> Result Bool
readBoolean (JBool value) = Right value
readBoolean _ = fail "Wire graph: expected boolean"

||| Void has no JSON representation, including null. Wrappers decide whether
||| absence, an empty array or null is legal without manufacturing a Void.
export
readNever : JSON -> Result Void
readNever _ = fail "Wire graph: empty type has no JSON value"

readListValues : (JSON -> Result a) -> Nat -> List JSON -> Result (List a)
readListValues decode index [] = Right []
readListValues decode index (value :: rest) = do
  checked <- prependPath (decode value) (Index index)
  remaining <- readListValues decode (S index) rest
  pure (checked :: remaining)

||| Traverses the actual finite List in order. Depth fuel bounds nesting only;
||| this slice does not impose a length limit or bound parser/allocation cost.
encodeListAt : (a -> Result JSON) -> Nat -> List a -> Result (List JSON)
encodeListAt action index [] = Right []
encodeListAt action index (value :: rest) = do
  encoded <- prependPath (action value) (Index index)
  remaining <- encodeListAt action (S index) rest
  pure (encoded :: remaining)

export
encodeListValues : (a -> Result JSON) -> List a -> Result (List JSON)
encodeListValues action = encodeListAt action 0

-- Conditional success for the existing ordered traversal, erased from runtime.
0 encodeListAtRight : (encode : a -> Result JSON) -> (project : a -> JSON) ->
  ((value : a) -> encode value = Right (project value)) ->
  (index : Nat) -> (values : List a) ->
  encodeListAt encode index values = Right (map project values)
encodeListAtRight encode project success index [] = Refl
encodeListAtRight encode project success index (value :: rest) =
  rewrite success value in
  rewrite prependPathRight (project value) (Index index) in
  rewrite encodeListAtRight encode project success (S index) rest in Refl

export
0 encodeListValuesRight : (encode : a -> Result JSON) -> (project : a -> JSON) ->
  ((value : a) -> encode value = Right (project value)) ->
  (values : List a) ->
  encodeListValues encode values = Right (map project values)
encodeListValuesRight encode project success values =
  encodeListAtRight encode project success 0 values

export
readList : (JSON -> Result a) -> JSON -> Result (List a)
readList decode (JArray values) = readListValues decode 0 values
readList _ _ = fail "Wire graph: expected array"

||| Preserve the foundation's canonical scalar keys and use the selected value
||| codec at every occurrence. No ToJSON instance or constructor escape hatch.
export
encodeSortedAssoc : (a -> Result JSON) -> StringKeySortedAssoc a -> Result JSON
encodeSortedAssoc encode values = JsonObject <$> traverseAssocWithKey
  (\key, value => prependPath (encode value) (Key (scalarValue key))) values

export
readSortedAssoc : (JSON -> Result a) -> JSON -> Result (StringKeySortedAssoc a)
readSortedAssoc decode (JsonObject values) = traverseAssocWithKey
  (\key, value => prependPath (decode value) (Key (scalarValue key))) values
readSortedAssoc _ _ = fail "Wire graph: expected dynamic object"

export
readRequired : String -> (JSON -> Result a) -> List (String, JSON) -> Result a
readRequired key decode pairs = prependPath (case Data.List.lookup key pairs of
  Just value => decode value
  Nothing => fail "Wire graph: missing required field") (Key key)

export
readOptional : String -> a -> (JSON -> Result a) -> List (String, JSON) -> Result a
readOptional key absent decode pairs = prependPath (case Data.List.lookup key pairs of
  Just value => decode value
  Nothing => Right absent) (Key key)

export
readObject : (List (String, JSON) -> Result a) -> JSON -> Result a
readObject decode (JsonObject object) = decode (map bindingContent (entries object))
readObject _ _ = fail "Wire graph: expected object"

export
readNullable : a -> (b -> a) -> (JSON -> Result b) -> JSON -> Result a
readNullable empty full decode JNull = Right empty
readNullable empty full decode value = full <$> decode value

export
readNull : a -> JSON -> Result a
readNull value JNull = Right value
readNull _ _ = fail "Wire graph: expected null"

export
buildObjectValue : List (String, JSON) -> Result JSON
buildObjectValue values = mapFst (\message => ([], message)) (objectFromLegacyPairs values)

||| Generated object assembly preserves the supplied fromList success proof.
export
0 buildObjectValueBindings :
  (bindings : List (Binding JSON)) -> (result : StringKeySortedAssoc JSON) ->
  (0 accepted : Value.StringKeySortedAssoc.fromList bindings = Right result) ->
  buildObjectValue (map Value.StringKeySortedAssoc.bindingContent bindings) = Right (JsonObject result)
buildObjectValueBindings bindings result accepted =
  rewrite objectFromLegacyPairsBindings bindings result accepted in Refl

export
addInternalTag : String -> String -> JSON -> Result JSON
addInternalTag key tag (JsonObject values) =
  buildObjectValue ((key, JString tag) :: map bindingContent (entries values))
addInternalTag _ _ _ = fail "Wire graph: expected object for internal tag"

export
removeInternalTag : String -> JSON -> JSON
removeInternalTag key (JsonObject values) = JsonObject (filterAssoc (\stored, _ => scalarValue stored /= key) values)
removeInternalTag _ value = value

export
readInternalTag : String -> JSON -> Result String
readInternalTag key = readObject (readRequired key readString)

export
scalarTextValid : String -> Bool
scalarTextValid text = all (\character => let point = ord character in
  point >= 0 && point <= 0x10FFFF && (point < 0xD800 || point > 0xDFFF)) (unpack text)

checkObjectKeys : List (String, Bool, ValueShape) -> List (String, JSON) -> Result ()
checkObjectKeys fields pairs =
  if not (all (\(key, _) => elem key (map (\(name, _, _) => name) fields)
    && length (filter (\entry => fst entry == key) pairs) == 1) pairs)
    || not (all (\(key, optional, _) => optional || isJust (Data.List.lookup key pairs)) fields)
    then fail "Wire graph: unknown, missing or duplicate object field"
    else Right ()

||| Classify representation only. JDecimal is not rounded or validated here.
export
jsonRepresentationKind : JSON -> RepresentationKind
jsonRepresentationKind JNull = NullKind
jsonRepresentationKind (JBool _) = BooleanKind
jsonRepresentationKind (JInteger _) = NumberKind
jsonRepresentationKind (JDouble _) = NumberKind
jsonRepresentationKind (JDecimal _) = NumberKind
jsonRepresentationKind (JString _) = StringKind
jsonRepresentationKind (JArray _) = ArrayKind
jsonRepresentationKind (JsonObject _) = ObjectKind

export
readUntaggedArm : List (String, List RepresentationKind) -> JSON -> Result String
readUntaggedArm arms json = mapFst (\error => ([], error))
  (selectRepresentationArm (jsonRepresentationKind json) arms)

||| Both directions recursively traverse the same checked finite expansion.
||| All raw integers remain JInteger until replaced by decimal-token nodes.
transform : Nat -> Bool -> ValueShape -> JSON -> Result JSON
transform 0 _ _ _ = fail "Wire graph: checked traversal depth exhausted"
transform (S fuel) toWire (UntaggedValue ExactlyOne arms) value = do
  let profile = if toWire then CanonicalRepresentation else NativeRepresentation
  shape <- mapFst (\error => ([], error)) (selectUntaggedShape profile (jsonRepresentationKind value) arms)
  transform fuel toWire shape value
transform (S fuel) toWire NaturalValue value = if toWire then do
  JsonObject object <- pure value | _ => fail "Wire graph: expected integer syntax node"
  let pairs = map bindingContent (entries object)
  exactKeys ["kind", "token"] pairs
  Just (JString "integer") <- pure (Data.List.lookup "kind" pairs)
    | _ => fail "Wire graph: expected integer syntax kind"
  Just (JString token) <- pure (Data.List.lookup "token" pairs)
    | _ => fail "Wire graph: expected integer token"
  case parseJSON Virtual token of
    Right (JInteger n) => if n >= 0 && token == show n then Right (JInteger n)
      else fail "Wire graph: expected canonical natural token"
    _ => fail "Wire graph: expected canonical natural token"
  else do
    n <- readNatural value
    buildObjectValue [("kind", JString "integer"), ("token", JString (show n))]
transform (S _) toWire (BoundNaturalValue rules) value = if toWire then do
  JsonObject object <- pure value | _ => fail "Wire graph: expected integer syntax node"
  let pairs = map bindingContent (entries object)
  exactKeys ["kind", "token"] pairs
  Just (JString "integer") <- pure (Data.List.lookup "kind" pairs)
    | _ => fail "Wire graph: expected integer syntax kind"
  Just (JString token) <- pure (Data.List.lookup "token" pairs)
    | _ => fail "Wire graph: expected integer token"
  n <- readBoundNatural rules (JDecimal token)
  if token == show n then Right (JInteger (cast n))
    else fail "Wire graph: expected canonical natural token"
  else do
    n <- readBoundNatural rules value
    buildObjectValue [("kind", JString "integer"), ("token", JString (show n))]
transform (S _) toWire (FiniteBinary64Value ECMAScriptBinary64) value = if toWire then do
  JsonObject object <- pure value | _ => fail "Wire binary64: expected finite bits syntax node"
  let pairs = map bindingContent (entries object)
  exactKeys ["kind", "bits"] pairs
  Just (JString "finite-binary64") <- pure (Data.List.lookup "kind" pairs)
    | _ => fail "Wire binary64: expected finite bits syntax kind"
  Just (JString text) <- pure (Data.List.lookup "bits" pairs)
    | _ => fail "Wire binary64: expected finite bits string"
  bits <- mapFst (\message => ([], message)) (readFiniteHex text)
  mapFst (\message => ([], message)) (encodeFiniteBits bits)
  else do
    bits <- mapFst (\message => ([], message)) (readFiniteBits value)
    text <- mapFst (\message => ([], message)) (finiteBitsHex bits)
    buildObjectValue [("kind", JString "finite-binary64"), ("bits", JString text)]
transform (S _) _ NullValue JNull = Right JNull
transform (S _) _ NullValue _ = fail "Wire graph: expected null"
transform (S _) _ BooleanValue (JBool value) = Right (JBool value)
transform (S _) _ BooleanValue _ = fail "Wire graph: expected boolean"
transform (S _) _ NeverValue _ = fail "Wire graph: empty type has no JSON value"
transform (S fuel) direction (TaggedValue key arms) json = do
  tag <- readInternalTag key json
  Just shape <- pure (Data.List.lookup tag arms) | _ => fail "Wire graph: unknown internal tag"
  transform fuel direction shape json
transform (S _) _ StringValue value = do
  text <- readString value
  pure (JString text)
transform (S _) _ ScalarValue value = do
  text <- readString value
  if scalarTextValid text then Right (JString text) else fail "Wire graph: isolated surrogate"
transform (S _) _ (EnumValue tags) (JString tag) =
  if elem tag tags then Right (JString tag) else fail "Wire graph: unknown enum tag"
transform (S _) _ (EnumValue _) _ = fail "Wire graph: expected enum string"
transform (S fuel) direction (ArrayValue shape) (JArray values) =
  JArray <$> readListValues (transform fuel direction shape) 0 values
transform (S _) _ (ArrayValue _) _ = fail "Wire graph: expected array"
transform (S fuel) direction (DynamicObjectValue shape) (JsonObject values) =
  JsonObject <$> traverseAssocWithKey
    (\key, value => prependPath (transform fuel direction shape value) (Key (scalarValue key))) values
transform (S _) _ (DynamicObjectValue _) _ = fail "Wire graph: expected dynamic object"
transform (S fuel) direction (NullableValue _) JNull = Right JNull
transform (S fuel) direction (NullableValue value) json = transform fuel direction value json
transform (S fuel) direction (ObjectValue fields) (JsonObject object) = do
  let pairs = map bindingContent (entries object)
  checkObjectKeys fields pairs
  values <- traverse (\(key, optional, shape) => case Data.List.lookup key pairs of
    Nothing => Right []
    Just value => map (\checked => [(key, checked)])
      (prependPath (transform fuel direction shape value) (Key key))) fields
  buildObjectValue (concat values)
transform (S _) _ (ObjectValue _) _ = fail "Wire graph: expected object"

traversalFuel : CheckedGraph -> Nat
traversalFuel graph = shapeDepth (graphShape graph)

export
validateGraph : CheckedGraph -> JSON -> Result ()
validateGraph graph value = map (const ()) (transform (traversalFuel graph) False (graphShape graph) value)

||| Text-only normalization. Ordinary AST literal decoders are unchanged.
||| Each occurrence is rebuilt from its own shape; keys are checked first.
normalizeParsed : Nat -> ValueShape -> JSON -> Result JSON
normalizeParsed 0 _ _ = fail "Wire graph: normalization depth exhausted"
normalizeParsed (S fuel) (UntaggedValue ExactlyOne arms) json = do
  shape <- mapFst (\error => ([], error))
    (selectUntaggedShape NativeRepresentation (jsonRepresentationKind json) arms)
  normalizeParsed fuel shape json
normalizeParsed (S _) NaturalValue (JDecimal token) = do
  value <- mapFst (\message => ([], message)) (legacyIntegerToken token)
  _ <- readNatural value
  pure value
normalizeParsed (S _) (BoundNaturalValue rules) value =
  map (JInteger . cast) (readBoundNatural rules value)
normalizeParsed (S _) (FiniteBinary64Value ECMAScriptBinary64) value = do
  bits <- mapFst (\message => ([], message)) (readFiniteBits value)
  mapFst (\message => ([], message)) (encodeFiniteBits bits)
normalizeParsed (S fuel) (ArrayValue shape) (JArray values) =
  JArray <$> readListValues (normalizeParsed fuel shape) 0 values
normalizeParsed (S fuel) (DynamicObjectValue shape) (JsonObject values) =
  JsonObject <$> traverseAssocWithKey
    (\key, value => prependPath (normalizeParsed fuel shape value) (Key (scalarValue key))) values
normalizeParsed (S fuel) (NullableValue _) JNull = Right JNull
normalizeParsed (S fuel) (NullableValue shape) json = normalizeParsed fuel shape json
normalizeParsed (S fuel) (TaggedValue key arms) json = do
  tag <- readInternalTag key json
  Just shape <- pure (lookup tag arms) | _ => fail "Wire graph: unknown internal tag"
  normalizeParsed fuel shape json
normalizeParsed (S fuel) (ObjectValue fields) (JsonObject object) = do
  let pairs = map bindingContent (entries object)
  checkObjectKeys fields pairs
  JsonObject <$> traverseAssocWithKey (\key, value => do
    Just (_, _, shape) <- pure (find (\(name, _, _) => name == scalarValue key) fields)
      | _ => fail "Wire graph: unknown field"
    prependPath (normalizeParsed fuel shape value) (Key (scalarValue key))) object
normalizeParsed fuel shape json = do
  _ <- transform fuel False shape json
  pure json

needsNumberTokens : Nat -> ValueShape -> Bool
needsNumberTokens 0 _ = False
needsNumberTokens (S _) (BoundNaturalValue _) = True
-- A float needs every raw token too: ordinary integer parsing loses -0.
needsNumberTokens (S _) (FiniteBinary64Value _) = True
needsNumberTokens (S fuel) (ArrayValue shape) = needsNumberTokens fuel shape
needsNumberTokens (S fuel) (DynamicObjectValue shape) = needsNumberTokens fuel shape
needsNumberTokens (S fuel) (NullableValue shape) = needsNumberTokens fuel shape
needsNumberTokens (S fuel) (ObjectValue fields) = any (\(_, _, shape) => needsNumberTokens fuel shape) fields
needsNumberTokens (S fuel) (UntaggedValue _ arms) = any (\(_, shape) => needsNumberTokens fuel shape) arms
needsNumberTokens (S fuel) (TaggedValue _ arms) = any (\(_, shape) => needsNumberTokens fuel shape) arms
needsNumberTokens _ _ = False

parseGraphText : CheckedGraph -> String -> Either String JSON
parseGraphText graph text =
  if needsNumberTokens (traversalFuel graph) (graphShape graph) then do
    json <- mapFst interpolate (parseJSONPreservingNumbers Virtual text)
    fieldError (normalizeParsed (traversalFuel graph) (graphShape graph) json)
  else parseText text

||| Checked AST entry points; raw generated closures remain a trusted bridge.
export
decodeGraphCheckedValue : GraphCodec a -> JSON -> Result a
decodeGraphCheckedValue codec json = do
  validateGraph codec.checkedGraph json
  codec.decodeGraphValue json

export
encodeGraphCheckedValue : GraphCodec a -> a -> Result JSON
encodeGraphCheckedValue codec value = do
  json <- codec.encodeGraphValue value
  validateGraph codec.checkedGraph json
  pure json

export
decodeGraphText : GraphCodec a -> String -> Either String a
decodeGraphText codec text = do
  json <- parseGraphText codec.checkedGraph text
  fieldError (decodeGraphCheckedValue codec json)

export
encodeGraphText : GraphCodec a -> a -> Either String String
encodeGraphText codec value = do
  json <- fieldError (encodeGraphCheckedValue codec value)
  encodeJSONValue json

export
toGraphSyntaxText : GraphCodec a -> String -> Either String String
toGraphSyntaxText codec text = do
  value <- decodeGraphText codec text
  canonical <- encodeGraphText codec value
  -- Reuse occurrence-aware number parsing: reparsing -0 as JInteger would
  -- lose the bit pattern between the typed encoder and canonical transport.
  json <- parseGraphText codec.checkedGraph canonical
  view <- fieldError (transform (traversalFuel codec.checkedGraph) False (graphShape codec.checkedGraph) json)
  encodeJSONValue view

export
fromGraphSyntaxText : GraphCodec a -> String -> Either String String
fromGraphSyntaxText codec text = do
  view <- parseText text
  json <- fieldError (transform (traversalFuel codec.checkedGraph) True (graphShape codec.checkedGraph) view)
  fieldError (validateGraph codec.checkedGraph json)
  value <- fieldError (codec.decodeGraphValue json)
  encodeGraphText codec value

export
decodeWireText : WireCodec a -> String -> Either String a
decodeWireText codec text = do
  value <- parseText text
  fieldError (validateGraph codec.graphChecked value)
  fieldError (codec.decodeValue value)

export
encodeWireText : WireCodec a -> a -> Either String String
encodeWireText codec value = do
  json <- fieldError (codec.encodeValue value)
  fieldError (validateGraph codec.graphChecked json)
  encodeJSONValue json

||| This normalizes integer values (-0 becomes 0); it is not the future
||| ExactJSON representation retaining every original numeric lexeme.
export
toSyntaxText : WireCodec a -> String -> Either String String
toSyntaxText codec text = do
  value <- decodeWireText codec text
  canonical <- encodeWireText codec value
  json <- parseText canonical
  view <- fieldError (transform (traversalFuel codec.graphChecked) False (graphShape codec.graphChecked) json)
  encodeJSONValue view

export
fromSyntaxText : WireCodec a -> String -> Either String String
fromSyntaxText codec text = do
  view <- parseText text
  json <- fieldError (transform (traversalFuel codec.graphChecked) True (graphShape codec.graphChecked) view)
  fieldError (validateGraph codec.graphChecked json)
  value <- fieldError (codec.decodeValue json)
  encodeWireText codec value

||| Reply transport never contains raw numeric payloads: syntax fields carry
||| strings, and output text is itself a JSON string inside the reply.
export
syntaxReply : Either String String -> Either String String
syntaxReply (Left error) = objectFromLegacyPairs [("ok", JBool False), ("error", JString error)] >>= encodeJSONValue
syntaxReply (Right text) = case parseJSON Virtual text of
  Right value => objectFromLegacyPairs [("ok", JBool True), ("value", value)] >>= encodeJSONValue
  Left problem => objectFromLegacyPairs [("ok", JBool False), ("error", JString (interpolate problem))] >>= encodeJSONValue

export
textReply : Either String String -> Either String String
textReply (Left error) = objectFromLegacyPairs [("ok", JBool False), ("error", JString error)] >>= encodeJSONValue
textReply (Right text) = objectFromLegacyPairs [("ok", JBool True), ("value", JString text)] >>= encodeJSONValue
