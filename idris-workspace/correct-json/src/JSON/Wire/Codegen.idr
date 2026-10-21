module JSON.Wire.Codegen

import public JSON.Wire.Reflection
import JSON.Wire.Codec
import public JSON.Wire.Binary64
import JSON.Option

%language ElabReflection
%default total

functionName : TypeDefinition -> String -> Name
functionName d namePrefix = fromString (namePrefix ++ d.tsName)

||| Node identity resolves to actual local functions or an imported typed value.
public export
data CodecLink = LocalCodec Name Name | ImportedCodec Name

public export
record CodecLinks where
  constructor Links
  codecLinks : List (String, CodecLink)

export
localCodecLinks : List TypeDefinition -> CodecLinks
localCodecLinks definitions = Links (map (\d => (d.identity,
  LocalCodec (functionName d "wireEncode") (functionName d "wireDecode"))) definitions)

codecTerms : CodecLinks -> String -> Either String (TTImp, TTImp)
codecTerms links identity = case Data.List.lookup identity links.codecLinks of
  Just (LocalCodec encode decode) => Right (var encode, var decode)
  Just (ImportedCodec value) => Right (`(wireEncodeValue ~(var value)), `(wireDecodeValue ~(var value)))
  Nothing => Left ("Wire graph: missing typed codec link: " ++ identity)

mutual
  encoder : Nat -> CodecLinks -> List TypeDefinition -> TypeExpr -> TTImp -> Either String TTImp
  encoder _ _ _ NullaryPayload _ = Left "Wire graph: nullary payload marker requires internal tag arm context"
  encoder _ _ _ (BoundNaturalType _) value = Right `(Right (JInteger (cast ~(value))))
  encoder _ _ _ NaturalType value = Right `(Right (JInteger (cast ~(value))))
  encoder _ _ _ (Integer64Type _) value = Right `(Right (JInteger (cast ~(value))))
  encoder _ _ _ StringType value = Right `(Right (JString ~(value)))
  encoder _ _ _ (Parameter _) _ = Left "Wire graph: cannot encode unbound parameter"
  encoder 0 _ _ (Reference _ _) _ = Left "Wire graph: encoder expansion exhausted"
  encoder (S fuel) links definitions type@(Reference name args) value = do
    d <- lookupDefinition definitions name
    case (d.body, args) of
      (BooleanBody _ _, []) => pure `(Right (JBool ~(value)))
      (EmptyBody, []) => pure `(absurd ~(value))
      (SortedAssocBody, [inner]) => do
        encoded <- encoder fuel links definitions inner `(wireAssocValue)
        pure `(encodeSortedAssoc (\wireAssocValue => ~(encoded)) ~(value))
      (ListBody _ _, [inner]) => do
        encoded <- encoder fuel links definitions inner `(wireListValue)
        pure `(map JArray (encodeListValues (\wireListValue => ~(encoded)) ~(value)))
      (NullableBody empty full, [inner]) => do
        encoded <- encoder fuel links definitions inner `(wireNullableValue)
        pure `(case ~(value) of
          ~(varStr empty) => Right JNull
          ~(varStr full) wireNullableValue => ~(encoded))
      (PresenceBody _ _, _) => Left "Wire graph: Presence encoder requires field context"
      (UpdateBody _ _ _, _) => Left "Wire graph: update encoder requires field context"
      (AbsentNullBody _ _, _) => Left "Wire graph: absent/null encoder requires field context"
      (_, []) => do
        (encode, _) <- codecTerms links name
        pure (encode `app` value)
      _ => Left "Wire graph: unsupported generic encoder"

  decoder : Nat -> CodecLinks -> List TypeDefinition -> TypeExpr -> Either String TTImp
  decoder _ _ _ NullaryPayload = Left "Wire graph: nullary payload marker requires internal tag arm context"
  decoder _ _ _ (BoundNaturalType rules) = Right `(readBoundNatural ~(numericTerm rules))
  decoder _ _ _ NaturalType = Right `(readNatural)
  decoder _ _ _ (Integer64Type Signed64) = Right `(fromJSON {a = Int64})
  decoder _ _ _ (Integer64Type Unsigned64) = Right `(fromJSON {a = Bits64})
  decoder _ _ _ StringType = Right `(readString)
  decoder _ _ _ (Parameter _) = Left "Wire graph: cannot decode unbound parameter"
  decoder 0 _ _ (Reference _ _) = Left "Wire graph: decoder expansion exhausted"
  decoder (S fuel) links definitions (Reference name args) = do
    d <- lookupDefinition definitions name
    case (d.body, args) of
      (BooleanBody _ _, []) => pure `(readBoolean)
      (EmptyBody, []) => pure `(readNever)
      (SortedAssocBody, [inner]) => do
        decoded <- decoder fuel links definitions inner
        pure `(readSortedAssoc ~(decoded))
      (ListBody _ _, [inner]) => do
        decoded <- decoder fuel links definitions inner
        pure `(readList ~(decoded))
      (NullableBody empty full, [inner]) => do
        decoded <- decoder fuel links definitions inner
        pure `(readNullable ~(varStr empty) ~(varStr full) ~(decoded))
      (PresenceBody _ _, _) => Left "Wire graph: Presence decoder requires field context"
      (UpdateBody _ _ _, _) => Left "Wire graph: update decoder requires field context"
      (AbsentNullBody _ _, _) => Left "Wire graph: absent/null decoder requires field context"
      (_, []) => snd <$> codecTerms links name
      _ => Left "Wire graph: unsupported generic decoder"

encodeField : CodecLinks -> List TypeDefinition -> GraphField -> TTImp -> Either String TTImp
encodeField links definitions field value = case field.valueType of
  Reference name [inner] => do
    d <- lookupDefinition definitions name
    case d.body of
      PresenceBody absent present => do
        encoded <- presentField inner `(wirePresentValue)
        pure `(case ~(value) of
          ~(varStr absent) => Right []
          ~(varStr present) wirePresentValue => ~(encoded))
      UpdateBody keep replace clear => do
        encoded <- presentField inner `(wireReplacement)
        let cleared = listOf (the (List TTImp) [`(MkPair ~(primVal (Str field.key)) JNull)])
        pure `(case ~(value) of
          ~(varStr keep) => Right []
          ~(varStr replace) wireReplacement => ~(encoded)
          ~(varStr clear) => Right ~(cleared))
      _ => required
  Reference name [] => do
    d <- lookupDefinition definitions name
    case d.body of
      AbsentNullBody absent null => do
        let fields = listOf (the (List TTImp) [`(MkPair ~(primVal (Str field.key)) JNull)])
        pure `(case ~(value) of
          ~(varStr absent) => Right []
          ~(varStr null) => Right ~(fields))
      _ => required
  _ => required
  where
    presentField : TypeExpr -> TTImp -> Either String TTImp
    presentField type fieldValue = do
      encoded <- encoder (expressionDepth type) links definitions type fieldValue
      let valueName : Name = fromString "wireEncodedField"
          keyTerm = primVal (Str field.key)
          pair = (`(MkPair) `app` keyTerm) `app` var valueName
          mapper = lam (lambdaArg valueName) (listOf (the (List TTImp) [pair]))
          checked = `(prependPath ~(encoded) (Key ~(keyTerm)))
      let mapped = (`(map) `app` mapper) `app` `(the (Result JSON) ~(checked))
      pure `(the (Result (List (String, JSON))) ~(mapped))

    required : Either String TTImp
    required = presentField field.valueType value

decodeField : CodecLinks -> List TypeDefinition -> GraphField -> Either String TTImp
decodeField links definitions field = case field.valueType of
  Reference name [inner] => do
    d <- lookupDefinition definitions name
    case d.body of
      PresenceBody absent present => do
        decoded <- decoder (expressionDepth inner) links definitions inner
        pure `(readOptional ~(primVal (Str field.key)) ~(varStr absent)
          (\json => map ~(varStr present) (~(decoded) json)) wireObject)
      UpdateBody keep replace clear => do
        decoded <- decoder (expressionDepth inner) links definitions inner
        pure `(readOptional ~(primVal (Str field.key)) ~(varStr keep)
          (readNullable ~(varStr clear) ~(varStr replace) ~(decoded)) wireObject)
      _ => required
  Reference name [] => do
    d <- lookupDefinition definitions name
    case d.body of
      AbsentNullBody absent null => pure `(readOptional ~(primVal (Str field.key)) ~(varStr absent)
        (readNull ~(varStr null)) wireObject)
      _ => required
  _ => required
  where
    required : Either String TTImp
    required = do
      decoded <- decoder (expressionDepth field.valueType) links definitions field.valueType
      pure `(readRequired ~(primVal (Str field.key)) ~(decoded) wireObject)

recordCode : Name -> Name -> CodecLinks -> List TypeDefinition -> TypeDefinition -> TypeInfo -> List GraphField
           -> Either String (List TopLevel)
recordCode encodeName decodeName links definitions d ti fields = case ti.cons of
  [con] => do
    let c = dcon defaultOptions con
    Fields bound <- pure c.args | _ => Left "Wire graph: missing checked record arguments"
    if length fields /= length bound then Left "Wire graph: reflection/codegen linkage mismatch" else Right ()
    encodedFields <- sequence (zipWith (\field, (BA _ [x, _] _) => encodeField links definitions field (var x)) fields (bound <>> []))
    let encoded = `(do
          wireFields <- the (Result (List (List (String, JSON))))
            (sequence (the (List (Result (List (String, JSON)))) ~(listOf encodedFields)))
          buildObjectValue (concat wireFields))
    decoded <- foldr (\(field, (BA _ [x, _] _)), result => do
      remaining <- result
      parse <- decodeField links definitions field
      pure `(case ~(parse) of
        Left error => Left error
        Right ~(bindVar x) => ~(remaining))) (Right c.applied) (zip fields (bound <>> []))
    pure [TL (private' encodeName `(~(var ti.name) -> Result JSON))
          (def encodeName [patClause (var encodeName `app` c.bound) encoded]),
          TL (private' decodeName `(JSON -> Result ~(var ti.name)))
          (def decodeName [patClause (var decodeName) `(readObject (\wireObject => ~(decoded)))])]
  _ => Left "Wire graph: record/codegen constructor mismatch"

enumCode : Name -> Name -> TypeDefinition -> TypeInfo -> List (String, String) -> List TopLevel
enumCode encodeName decodeName d ti tags =
  let encodeClauses = map (\(ctor, tag) => patClause (var encodeName `app` varStr ctor) `(Right (JString ~(primVal (Str tag))))) tags
      cases = map (\(ctor, tag) => patClause `(JString ~(primVal (Str tag))) `(Right ~(varStr ctor))) tags
      fallback = patClause `(_) `(fail "Wire graph: unknown enum tag")
  in [TL (private' encodeName `(~(var ti.name) -> Result JSON)) (def encodeName encodeClauses),
      TL (private' decodeName `(JSON -> Result ~(var ti.name)))
        (def decodeName [patClause `( ~(var decodeName) wireJson)
          (iCase `(wireJson) implicitFalse (cases ++ [fallback]))])]

internalCode : Name -> Name -> CodecLinks -> List TypeDefinition -> TypeDefinition -> TypeInfo -> String
             -> List (String, String, TypeExpr) -> Either String (List TopLevel)
internalCode encodeName decodeName links definitions d ti key arms = do
  clauses <- traverse (\(ctor, tag, payload) => case payload of
    NullaryPayload => pure (patClause (var encodeName `app` varStr ctor)
      `(addInternalTag ~(primVal (Str key)) ~(primVal (Str tag)) (JsonObject Value.StringKeySortedAssoc.empty)))
    _ => do
      encoded <- encoder (expressionDepth payload) links definitions payload `(wirePayload)
      pure (patClause (var encodeName `app` (varStr ctor `app` bindVar "wirePayload"))
        `(~(encoded) >>= addInternalTag ~(primVal (Str key)) ~(primVal (Str tag))))) arms
  cases <- traverse (\(ctor, tag, payload) => case payload of
    NullaryPayload => pure (patClause (primVal (Str tag)) `(Right ~(varStr ctor)))
    _ => do
      decoded <- decoder (expressionDepth payload) links definitions payload
      pure (patClause (primVal (Str tag))
        `(map ~(varStr ctor) (~(decoded) (removeInternalTag ~(primVal (Str key)) wireJson))))) arms
  let fallback = patClause `(_) `(fail "Wire graph: unknown internal tag")
      dispatch = iCase `(wireTag) implicitFalse (cases ++ [fallback])
  pure [TL (private' encodeName `(~(var ti.name) -> Result JSON)) (def encodeName clauses),
        TL (private' decodeName `(JSON -> Result ~(var ti.name)))
          (def decodeName [patClause `( ~(var decodeName) wireJson) `(do
            wireTag <- readInternalTag ~(primVal (Str key)) wireJson
            ~(dispatch))])]

scalarCode : Name -> Name -> TypeDefinition -> TypeInfo -> Name -> Name -> List TopLevel
scalarCode encodeName decodeName d ti project validate =
  [TL (private' encodeName `(~(var ti.name) -> Result JSON))
        (def encodeName [patClause `( ~(var encodeName) wireScalar) `(Right (JString (~(var project) wireScalar)))]),
      TL (private' decodeName `(JSON -> Result ~(var ti.name)))
        (def decodeName [patClause `( ~(var decodeName) wireJson) `(do
          text <- readString wireJson
          case ~(var validate) text of
            Left _ => fail "Wire graph: scalar binding rejected string"
            Right value => Right value)])]

-- The generated source -> Result JSON and JSON -> Result source claims check
-- the actual hook ABI: source -> Bits64, Bits64 -> Either error source. No
-- opaque constructor, proof field, or protocol dependency is inspected here.
finiteCode : Name -> Name -> TypeInfo -> Name -> Name -> List TopLevel
finiteCode encodeName decodeName ti project validate =
  [TL (private' encodeName `(~(var ti.name) -> Result JSON))
    (def encodeName [patClause `( ~(var encodeName) wireFinite) `(case encodeFiniteBits (the Bits64 (~(var project) wireFinite)) of
      Left message => fail message
      Right json => Right json)]),
   TL (private' decodeName `(JSON -> Result ~(var ti.name)))
    (def decodeName [patClause `( ~(var decodeName) wireJson) `(case readFiniteBits wireJson of
      Left message => fail message
      Right bits => case ~(var validate) bits of
        Left _ => fail "Wire binary64: typed validator rejected finite bits"
        Right value => Right value)])]

booleanCode : Name -> Name -> TypeInfo -> String -> String -> List TopLevel
booleanCode encodeName decodeName ti false true =
  [TL (private' encodeName `(~(var ti.name) -> Result JSON))
    (def encodeName [patClause (var encodeName `app` varStr false) `(Right (JBool False)),
                     patClause (var encodeName `app` varStr true) `(Right (JBool True))]),
   TL (private' decodeName `(JSON -> Result ~(var ti.name)))
    (def decodeName [patClause `( ~(var decodeName) wireJson) `(readBoolean wireJson)])]

emptyCode : Name -> Name -> TypeInfo -> List TopLevel
emptyCode encodeName decodeName ti =
  [TL (private' encodeName `(~(var ti.name) -> Result JSON))
    (def encodeName [patClause `( ~(var encodeName) wireImpossible) `(absurd wireImpossible)]),
   TL (private' decodeName `(JSON -> Result ~(var ti.name)))
    (def decodeName [patClause `( ~(var decodeName) wireJson) `(readNever wireJson)])]

closedNullableCode : Name -> Name -> CodecLinks -> List TypeDefinition -> TypeInfo ->
                     String -> String -> TypeExpr -> Either String (List TopLevel)
closedNullableCode encodeName decodeName links definitions ti empty full payload = do
  encoded <- encoder (expressionDepth payload) links definitions payload `(wireNullableValue)
  decoded <- decoder (expressionDepth payload) links definitions payload
  pure [TL (private' encodeName `(~(var ti.name) -> Result JSON))
    (def encodeName [patClause (var encodeName `app` varStr empty) `(Right JNull),
      patClause (var encodeName `app` (varStr full `app` bindVar "wireNullableValue")) encoded]),
    TL (private' decodeName `(JSON -> Result ~(var ti.name)))
      (def decodeName [patClause (var decodeName) `(readNullable ~(varStr empty) ~(varStr full) ~(decoded))])]

representationKindTerm : RepresentationKind -> TTImp
representationKindTerm NullKind = `(NullKind)
representationKindTerm BooleanKind = `(BooleanKind)
representationKindTerm NumberKind = `(NumberKind)
representationKindTerm StringKind = `(StringKind)
representationKindTerm ArrayKind = `(ArrayKind)
representationKindTerm ObjectKind = `(ObjectKind)

untaggedCode : Name -> Name -> CodecLinks -> List TypeDefinition -> TypeInfo ->
               List (String, TypeExpr) -> List (String, ValueShape) -> Either String (List TopLevel)
untaggedCode encodeName decodeName links definitions ti arms expanded = do
  if map fst arms /= map fst expanded then Left "Wire graph: untagged checked arm mismatch" else Right ()
  clauses <- traverse (\(constructor, payload) => do
    encoded <- encoder (expressionDepth payload) links definitions payload `(wirePayload)
    pure (patClause (var encodeName `app` (varStr constructor `app` bindVar "wirePayload")) encoded)) arms
  cases <- traverse (\(constructor, payload) => do
    decoded <- decoder (expressionDepth payload) links definitions payload
    pure (patClause (primVal (Str constructor))
      `(map ~(varStr constructor) (~(decoded) wireJson)))) arms
  let selectors = listOf (map (\(constructor, shape) =>
        `(MkPair ~(primVal (Str constructor))
          ~(listOf (map representationKindTerm (representationKinds NativeRepresentation shape))))) expanded)
      fallback = patClause `(_) `(fail "Wire graph: unknown untagged arm")
      dispatch = iCase `(wireArm) implicitFalse (cases ++ [fallback])
  pure [TL (private' encodeName `(~(var ti.name) -> Result JSON)) (def encodeName clauses),
        TL (private' decodeName `(JSON -> Result ~(var ti.name)))
          (def decodeName [patClause `( ~(var decodeName) wireJson) `(do
            wireArm <- readUntaggedArm ~(selectors) wireJson
            ~(dispatch))])]

generateDefinitionUsingShape : Maybe ValueShape -> String -> CodecLinks -> List TypeDefinition -> Registration -> TypeInfo -> Either String (List TopLevel)
generateDefinitionUsingShape checkedShape ownIdentity links definitions registration ti = do
  d <- lookupDefinition definitions ownIdentity
  let (encodeName, decodeName) = case Data.List.lookup ownIdentity links.codecLinks of
        Just (LocalCodec encode decode) => (encode, decode)
        _ => (functionName d "wireEncode", functionName d "wireDecode")
  case (d.body, registration.binding) of
    (RecordBody _ fields, _) => recordCode encodeName decodeName links definitions d ti fields
    (StringEnum tags, _) => Right (enumCode encodeName decodeName d ti tags)
    (BooleanBody false true, BooleanBinding) => Right (booleanCode encodeName decodeName ti false true)
    (EmptyBody, EmptyBinding) => Right (emptyCode encodeName decodeName ti)
    (ScalarBody, ScalarBinding project validate) => Right (scalarCode encodeName decodeName d ti project validate)
    (FiniteBinary64Body ECMAScriptBinary64, FiniteBinary64Binding ECMAScriptBinary64 project validate) =>
      Right (finiteCode encodeName decodeName ti project validate)
    (ListBody _ _, ListBinding) => Right []
    (SortedAssocBody, SortedAssocBinding) => Right []
    (PresenceBody _ _, _) => Right []
    (NullableBody _ _, _) => Right []
    (ClosedNullableBody empty full payload, NullableBinding _ _) =>
      closedNullableCode encodeName decodeName links definitions ti empty full payload
    (UpdateBody _ _ _, _) => Right []
    (AbsentNullBody _ _, _) => Right []
    (UntaggedBody ExactlyOne arms, UntaggedBinding ExactlyOne) => do
      shape <- case checkedShape of
        Just shape => Right shape
        Nothing => graphShape <$> checkGraph (Graph ownIdentity Component definitions)
      JSON.Wire.Description.UntaggedValue ExactlyOne expanded <- pure shape
        | _ => Left "Wire graph: untagged checked shape mismatch"
      untaggedCode encodeName decodeName links definitions ti arms expanded
    (InternalTagBody key arms, _) => internalCode encodeName decodeName links definitions d ti key arms
    _ => Left "Wire graph: checked binding/codegen mismatch"

||| Authoring reuses its already checked root, including origin validation.
export
generateCheckedDefinitionWithLinks : String -> CodecLinks -> CheckedGraph -> Registration -> TypeInfo -> Either String (List TopLevel)
generateCheckedDefinitionWithLinks ownIdentity links checked registration ti =
  let graph = graphDescription checked in
  if graph.root /= ownIdentity || (case graph.rootRule of Component => False; _ => True)
    then Left "Wire graph: checked codegen requires its own component root"
    else generateDefinitionUsingShape (Just (graphShape checked)) ownIdentity links graph.definitions registration ti

||| Retain the low-level registry entry; only an untagged branch needs a new
||| checked expansion here. Existing definition generation is unchanged.
export
generateDefinitionWithLinks : String -> CodecLinks -> List TypeDefinition -> Registration -> TypeInfo -> Either String (List TopLevel)
generateDefinitionWithLinks = generateDefinitionUsingShape Nothing

||| Legacy registries keep their original local names and source identities.
export
generateDefinition : List TypeDefinition -> Registration -> TypeInfo -> Either String (List TopLevel)
generateDefinition definitions registration ti =
  generateDefinitionWithLinks (show ti.name) (localCodecLinks definitions) definitions registration ti

export
generateRootWithLinks : Name -> CodecLinks -> CheckedGraph -> TypeInfo -> Either String TopLevel
generateRootWithLinks codecName links checked ti = do
  let graph = graphDescription checked
  d <- lookupDefinition graph.definitions graph.root
  (encode, decode) <- codecTerms links graph.root
  let encoded = case graph.rootRule of
        Component => encode
        FixedTag key tag => `(\value => ~(encode) value >>= addInternalTag ~(primVal (Str key)) ~(primVal (Str tag)))
      decoded = case graph.rootRule of
        Component => decode
        FixedTag key _ => `(\json => ~(decode) (removeInternalTag ~(primVal (Str key)) json))
      value = if null (graphOrigins checked)
        then `(trustedGraphCodec ~(graphTerm graph) ~(encoded) ~(decoded))
        else `(trustedAuthoredGraphCodec ~(graphTerm graph) ~(originsTerm (graphOrigins checked)) ~(encoded) ~(decoded))
  pure (TL (public' codecName `(Either String (GraphCodec ~(var ti.name))))
    (def codecName [patClause (var codecName) value]))

export
generateRoot : CheckedGraph -> TypeInfo -> Either String TopLevel
generateRoot checked ti = do
  let graph = graphDescription checked
  definition <- lookupDefinition graph.definitions graph.root
  generateRootWithLinks (functionName definition "graphCodec") (localCodecLinks graph.definitions) checked ti
