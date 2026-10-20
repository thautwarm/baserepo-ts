module JSON.Wire.Check

import public JSON.Wire.Description
import JSON.Wire.Registry
import Data.List
import Data.String

%default total

mutual
  export
  expressionDepth : TypeExpr -> Nat
  expressionDepth (Reference _ args) = 1 + expressionListDepth args
  expressionDepth _ = 1

  expressionListDepth : List TypeExpr -> Nat
  expressionListDepth [] = 0
  expressionListDepth (x :: xs) = max (expressionDepth x) (expressionListDepth xs)

mutual
  expressionNodes : TypeExpr -> Nat
  expressionNodes (Reference _ args) = 1 + expressionListNodes args
  expressionNodes _ = 1

  expressionListNodes : List TypeExpr -> Nat
  expressionListNodes [] = 0
  expressionListNodes (x :: xs) = expressionNodes x + expressionListNodes xs

||| Concrete records cannot repeat on a checked path, and generic records are
||| rejected. Every wrapper application comes from a finite reflected field
||| expression. Counting every registry entry and expression node therefore
||| bounds every supported expansion path, including repeated unary templates.
||| List expands only its closed element expression, not the recursive tail.
export
expansionBudget : GraphDescription -> Nat
expansionBudget graph = 1 + length graph.definitions + sum (map weight graph.definitions)
  where
    weight : TypeDefinition -> Nat
    weight d = case d.body of
      RecordBody _ fields => sum (map (expressionNodes . valueType) fields)
      InternalTagBody _ arms => sum (map (\(_, _, payload) => expressionNodes payload) arms)
      ClosedNullableBody _ _ payload => expressionNodes payload
      UntaggedBody _ arms => sum (map (expressionNodes . snd) arms)
      _ => 0

mutual
  export
  shapeDepth : ValueShape -> Nat
  shapeDepth (NullableValue value) = 1 + shapeDepth value
  shapeDepth (ArrayValue value) = 1 + shapeDepth value
  shapeDepth (DynamicObjectValue value) = 1 + shapeDepth value
  shapeDepth (TaggedValue _ arms) = 1 + armDepth arms
  shapeDepth (UntaggedValue _ arms) = 1 + armDepth arms
  shapeDepth (ObjectValue fields) = 1 + fieldDepth fields
  shapeDepth _ = 1

  armDepth : List (String, ValueShape) -> Nat
  armDepth [] = 0
  armDepth ((_, shape) :: rest) = max (shapeDepth shape) (armDepth rest)

  fieldDepth : List (String, Bool, ValueShape) -> Nat
  fieldDepth [] = 0
  fieldDepth ((_, _, shape) :: rest) = max (shapeDepth shape) (fieldDepth rest)

export
record CheckedGraph where
  constructor Checked
  graph : GraphDescription
  expanded : ValueShape
  origins : List DefinitionOrigin

export
graphDescription : CheckedGraph -> GraphDescription
graphDescription = graph

export
graphShape : CheckedGraph -> ValueShape
graphShape = expanded

export
graphOrigins : CheckedGraph -> List DefinitionOrigin
graphOrigins = origins

mutual
  flattenMetadata : List Name -> WireMetadata -> Either String (List WireMetadata)
  flattenMetadata path metadata@(WireDescriptor name _ _ _ dependencies) = do
    if elem name path then Left ("Wire authoring: recursive dependency: " ++ show (reverse (name :: path))) else Right ()
    children <- flattenMetadataList (name :: path) dependencies
    pure (children ++ [metadata])

  flattenMetadataList : List Name -> List WireMetadata -> Either String (List WireMetadata)
  flattenMetadataList _ [] = Right []
  flattenMetadataList path (metadata :: rest) = (++) <$> flattenMetadata path metadata <*> flattenMetadataList path rest

insertMetadata : List WireMetadata -> WireMetadata -> Either String (List WireMetadata)
insertMetadata collected metadata = case find (\node => node.metadataWireName == metadata.metadataWireName) collected of
  Nothing => Right (collected ++ [metadata])
  Just prior => if sameMetadataNode prior metadata then Right collected
    else Left ("Wire authoring: conflicting wire definition identity: " ++ show metadata.metadataWireName)

||| Visit all occurrences before dedup; a repeated parent must not hide a
||| changed child policy under the same child ID. No global registry or fuel.
export
collectWireMetadata : List WireMetadata -> Either String (List WireMetadata)
collectWireMetadata roots = flattenMetadataList [] roots >>= gather []
  where
    gather : List WireMetadata -> List WireMetadata -> Either String (List WireMetadata)
    gather collected [] = Right collected
    gather collected (node :: rest) = insertMetadata collected node >>= \next => gather next rest

export
lookupDefinition : List TypeDefinition -> String -> Either String TypeDefinition
lookupDefinition definitions name = case find (\d => d.identity == name) definitions of
  Just value => Right value
  Nothing => Left ("Wire graph: missing registry definition: " ++ name)

duplicate : List String -> Bool
duplicate [] = False
duplicate (x :: xs) = elem x xs || duplicate xs

identifier : String -> Bool
identifier s = case unpack s of
  [] => False
  c :: cs => (isAlpha c || c == '_') && all (\x => isAlphaNum x || x == '_') cs

argumentAt : Nat -> List a -> Maybe a
argumentAt _ [] = Nothing
argumentAt 0 (x :: _) = Just x
argumentAt (S n) (_ :: xs) = argumentAt n xs

substitute : Nat -> List TypeExpr -> TypeExpr -> Either String TypeExpr
substitute _ arguments (Parameter index) = case argumentAt index arguments of
  Just value => Right value
  Nothing => Left "Wire graph: missing parameter argument"
substitute 0 _ (Reference _ _) = Left "Wire graph: parameter substitution depth exhausted"
substitute (S fuel) arguments (Reference name args) = Reference name <$> traverse (substitute fuel arguments) args
substitute _ _ value = Right value

disjointArmKinds : RepresentationProfile -> List (String, ValueShape) -> Bool
disjointArmKinds _ [] = True
disjointArmKinds profile ((_, shape) :: rest) =
  all (\(_, other) => not (any (\kind => elem kind (representationKinds profile other))
    (representationKinds profile shape))) rest && disjointArmKinds profile rest

checkUntaggedKinds : List (String, ValueShape) -> Either String ()
checkUntaggedKinds arms = do
  if disjointArmKinds NativeRepresentation arms then Right ()
    else Left "Wire graph: untagged native representation overlap"
  if disjointArmKinds CanonicalRepresentation arms then Right ()
    else Left "Wire graph: untagged canonical representation overlap"

-- Fuel counts the reflected source graph. Exhaustion is an explicit unsupported
-- result, never a partial graph or a proof bypass.
mutual
  resolve : Nat -> List TypeDefinition -> List String -> TypeExpr -> Either String ValueShape
  resolve _ _ _ NullaryPayload = Left "Wire graph: nullary payload marker requires internal tag arm context"
  resolve _ _ _ NaturalType = Right NaturalValue
  resolve _ _ _ (BoundNaturalType rules) =
    if rules.upper < 0 then Left "Wire graph: numeric upper must be nonnegative"
    else Right (BoundNaturalValue rules)
  resolve _ _ _ StringType = Right StringValue
  resolve _ _ _ (Parameter _) = Left "Wire graph: unbound parameter"
  resolve 0 _ path (Reference name _) = Left ("Wire graph: expansion exhausted: " ++ show (name :: path))
  resolve (S fuel) definitions path (Reference name args) = do
    if elem name path then Left ("Wire graph: recursive reference: " ++ show (reverse (name :: path))) else Right ()
    d <- lookupDefinition definitions name
    if length args /= d.parameterCount then Left ("Wire graph: parameter arity mismatch: " ++ name) else Right ()
    case d.body of
      ScalarBody => Right ScalarValue
      FiniteBinary64Body policy => Right (FiniteBinary64Value policy)
      BooleanBody _ _ => Right BooleanValue
      EmptyBody => Right NeverValue
      StringEnum tags => Right (EnumValue (map snd tags))
      ListBody _ _ => case args of
        [arg] => ArrayValue <$> resolve fuel definitions path arg
        _ => Left "Wire graph: invalid List application"
      SortedAssocBody => case args of
        [arg] => DynamicObjectValue <$> resolve fuel definitions path arg
        _ => Left "Wire graph: invalid sorted association application"
      PresenceBody _ _ => Left "Wire graph: Presence is only supported at a record field boundary"
      NullableBody _ _ => case args of
        [arg] => do
          shape <- resolve fuel definitions path arg
          if elem NullKind (representationKinds NativeRepresentation shape)
            then Left "Wire graph: nested Nullable has ambiguous null representation"
            else Right (NullableValue shape)
        _ => Left "Wire graph: invalid Nullable application"
      ClosedNullableBody _ _ payload => do
        shape <- resolve fuel definitions (name :: path) payload
        if elem NullKind (representationKinds NativeRepresentation shape)
          then Left "Wire graph: nested Nullable has ambiguous null representation"
          else Right (NullableValue shape)
      UntaggedBody ExactlyOne arms => do
        expanded <- traverse (\(constructor, payload) => do
          shape <- resolve fuel definitions (name :: path) payload
          pure (constructor, shape)) arms
        checkUntaggedKinds expanded
        pure (UntaggedValue ExactlyOne expanded)
      UpdateBody _ _ _ => Left "Wire graph: update is only supported at a record field boundary"
      AbsentNullBody _ _ => Left "Wire graph: absent/null is only supported at a record field boundary"
      InternalTagBody key arms => do
        expanded <- traverse (\(_, tag, payload) => case payload of
          NullaryPayload => Right (tag, ObjectValue [(key, False, EnumValue [tag])])
          _ => do
            definition <- case payload of
              Reference child [] => lookupDefinition definitions child
              _ => Left "Wire graph: internal tag payload must reference a record"
            case definition.body of
              RecordBody _ _ => Right ()
              _ => Left "Wire graph: internal tag payload must reference a record"
            shape <- resolve fuel definitions (name :: path) payload
            case shape of
              ObjectValue fields =>
                if elem key (map (\(key, _, _) => key) fields)
                  then Left "Wire graph: internal tag collides with payload field"
                  else Right (tag, ObjectValue ((key, False, EnumValue [tag]) :: fields))
              _ => Left "Wire graph: internal tag payload must be an object") arms
        pure (TaggedValue key expanded)
      RecordBody _ fields => ObjectValue <$> traverse (resolveField fuel definitions (name :: path) args) fields

  resolveField : Nat -> List TypeDefinition -> List String -> List TypeExpr -> GraphField
              -> Either String (String, Bool, ValueShape)
  resolveField fuel definitions path args field = do
    value <- substitute (expressionDepth field.valueType) args field.valueType
    case value of
      Reference name [inner] => do
        d <- lookupDefinition definitions name
        case d.body of
          PresenceBody _ _ => do
            shape <- resolve fuel definitions path inner
            pure (field.key, True, shape)
          UpdateBody _ _ _ => do
            shape <- resolve fuel definitions path inner
            case shape of
              ObjectValue _ => pure (field.key, True, NullableValue shape)
              DynamicObjectValue _ => pure (field.key, True, NullableValue shape)
              TaggedValue _ _ => pure (field.key, True, NullableValue shape)
              _ => Left "Wire graph: update replacement must be an object"
          _ => do
            shape <- resolve fuel definitions path value
            pure (field.key, False, shape)
      Reference name [] => do
        d <- lookupDefinition definitions name
        case d.body of
          AbsentNullBody _ _ => pure (field.key, True, NullValue)
          _ => do
            shape <- resolve fuel definitions path value
            pure (field.key, False, shape)
      _ => do
        shape <- resolve fuel definitions path value
        pure (field.key, False, shape)

checkDefinition : TypeDefinition -> Either String ()
checkDefinition d =
  if d.identity == "" then Left "Wire graph: empty identity"
  else if not (identifier d.tsName) then Left "Wire graph: invalid TS name"
  else case d.body of
    RecordBody constructor fields =>
      if d.parameterCount /= 0 then Left "Wire graph: generic records are not supported in W2a"
      else if duplicate (map source fields) then Left "Wire graph: duplicate source field"
      else if duplicate (map key fields) then Left "Wire graph: duplicate wire field"
      else traverse_ (checkWireObjectKey . key) fields
    StringEnum tags =>
      if d.parameterCount /= 0 || null tags then Left "Wire graph: invalid enum"
      else if duplicate (map fst tags) || duplicate (map snd tags) then Left "Wire graph: duplicate enum arm/tag"
      else Right ()
    BooleanBody false true =>
      if d.parameterCount == 0 && false /= "" && true /= "" && false /= true then Right ()
        else Left "Wire graph: invalid boolean binding"
    EmptyBody => if d.parameterCount == 0 then Right () else Left "Wire graph: empty binding cannot have parameters"
    ListBody empty full =>
      if d.identity /= "Prelude.Basics.List" || d.parameterCount /= 1 || empty == "" || full == "" || empty == full
        then Left "Wire graph: invalid standard List template" else Right ()
    SortedAssocBody => if d.parameterCount == 1 then Right ()
      else Left "Wire graph: sorted association requires one parameter"
    PresenceBody _ _ => if d.parameterCount == 1 then Right () else Left "Wire graph: Presence requires one parameter"
    NullableBody _ _ => if d.parameterCount == 1 then Right () else Left "Wire graph: Nullable requires one parameter"
    ClosedNullableBody empty full _ =>
      if d.parameterCount == 0 && empty /= "" && full /= "" && empty /= full then Right ()
        else Left "Wire graph: invalid closed nullable binding"
    UntaggedBody ExactlyOne arms =>
      if d.parameterCount /= 0 || length arms < 2 || any ((== "") . fst) arms
        then Left "Wire graph: invalid untagged binding"
      else if duplicate (map fst arms) then Left "Wire graph: duplicate untagged arm"
      else Right ()
    UpdateBody _ _ _ => if d.parameterCount == 1 then Right () else Left "Wire graph: update requires one parameter"
    AbsentNullBody _ _ => if d.parameterCount == 0 then Right () else Left "Wire graph: absent/null cannot have parameters"
    InternalTagBody key arms =>
      if d.parameterCount /= 0 || null arms || key == "" then Left "Wire graph: invalid internal tag"
      else if duplicate (map (\(ctor, _, _) => ctor) arms) || duplicate (map (\(_, tag, _) => tag) arms)
        then Left "Wire graph: duplicate internal arm/tag"
      else checkWireObjectKey key
    ScalarBody => if d.parameterCount == 0 then Right () else Left "Wire graph: scalar binding cannot have parameters"
    FiniteBinary64Body _ => if d.parameterCount == 0 then Right () else Left "Wire graph: finite binary64 binding cannot have parameters"

export
checkGraph : GraphDescription -> Either String CheckedGraph
checkGraph graph = do
  if duplicate (map identity graph.definitions) then Left "Wire graph: duplicate registry identity" else Right ()
  if duplicate (map tsName graph.definitions) then Left "Wire graph: duplicate TS name" else Right ()
  traverse_ checkDefinition graph.definitions
  -- Check every concrete registry definition too: an unused malformed entry
  -- cannot silently survive, and missing references fail the whole registry.
  traverse_ (\d => case d.body of
    AbsentNullBody _ _ => Right ()
    _ => if d.parameterCount == 0
      then map (const ()) (resolve (expansionBudget graph) graph.definitions [] (Reference d.identity []))
      else Right ()) graph.definitions
  shape <- resolve (expansionBudget graph) graph.definitions [] (Reference graph.root [])
  case (graph.rootRule, shape) of
    (Component, _) => pure (Checked graph shape [])
    (FixedTag key tag, ObjectValue fields) => do
      checkWireObjectKey key
      if elem key (map (\(name, _, _) => name) fields)
        then Left "Wire graph: root tag collides with field"
        else pure (Checked graph (ObjectValue ((key, False, EnumValue [tag]) :: fields)) [])
    _ => Left "Wire graph: fixed root tag requires a record"

mutual
  payloadReferences : List Nat -> TypeExpr -> List (List Nat, String)
  payloadReferences path (Reference name arguments) =
    (path, name) :: payloadArgumentReferences path 0 arguments
  payloadReferences _ _ = []

  payloadArgumentReferences : List Nat -> Nat -> List TypeExpr -> List (List Nat, String)
  payloadArgumentReferences _ _ [] = []
  payloadArgumentReferences path index (argument :: rest) =
    payloadReferences (path ++ [index]) argument ++ payloadArgumentReferences path (S index) rest

||| Origins add provenance to the same checked graph; they do not alter shape
||| expansion, accepted values, numeric policy, or legacy construction.
export
checkGraphWithOrigins : GraphDescription -> List DefinitionOrigin -> Either String CheckedGraph
checkGraphWithOrigins graph origins = do
  checked <- checkGraph graph
  let identities = map identity graph.definitions
  if duplicate (map originWireIdentity origins) then Left "Wire authoring: duplicate origin identity" else Right ()
  if length origins /= length identities || not (all (\origin => elem origin.originWireIdentity identities) origins)
    then Left "Wire authoring: origin coverage mismatch" else Right ()
  traverse_ (\origin => do
    if origin.originSource.sourceAlias == "" || origin.originSource.sourceApplicationKey == ""
      then Left "Wire authoring: missing source provenance" else Right ()
    definition <- lookupDefinition graph.definitions origin.originWireIdentity
    case definition.body of
      RecordBody _ fields =>
        if map fieldSource origin.originFields /= map source fields || not (null origin.originArms)
          then Left "Wire authoring: record origin linkage mismatch" else Right ()
      InternalTagBody _ arms =>
        if map armSource origin.originArms /= map (\(ctor, _, _) => ctor) arms || not (null origin.originFields)
          then Left "Wire authoring: arm origin linkage mismatch" else Right ()
      ClosedNullableBody _ full payload => do
        if map armSource origin.originArms /= [full] || not (null origin.originFields)
          then Left "Wire authoring: closed nullable origin linkage mismatch" else Right ()
        if map (\reference => (reference.referencePath, reference.selectedWireIdentity))
             (concatMap armReferences origin.originArms) /= payloadReferences [] payload
          then Left "Wire authoring: closed nullable payload reference linkage mismatch" else Right ()
      UntaggedBody ExactlyOne arms => do
        if map armSource origin.originArms /= map fst arms || not (null origin.originFields)
          then Left "Wire authoring: untagged origin linkage mismatch" else Right ()
        traverse_ (\((_, payload), arm) =>
          if map (\reference => (reference.referencePath, reference.selectedWireIdentity)) arm.armReferences
               /= payloadReferences [] payload
            then Left "Wire authoring: untagged payload reference linkage mismatch" else Right ())
          (zip arms origin.originArms)
      _ => if null origin.originFields && null origin.originArms then Right ()
        else Left "Wire authoring: unexpected member provenance"
    traverse_ (\reference =>
      if reference.referenceApplicationKey == "" || not (elem reference.selectedWireIdentity identities)
        then Left "Wire authoring: reference origin linkage mismatch" else Right ())
      (concatMap fieldReferences origin.originFields ++ concatMap armReferences origin.originArms)) origins
  pure (Checked graph (graphShape checked) origins)

||| W1 is the singleton graph adapter; its public names and accepted domain
||| remain unchanged while text/view validation uses the common graph walker.
export
singletonGraph : CheckedRecord -> Either String CheckedGraph
singletonGraph checked =
  let d = description checked
      fields = map (\f => GraphMember f.sourceName f.wireName
        (case f.kind of Natural => NaturalType; Text => StringType)) d.fields
  in checkGraph (Graph d.typeId Component [Definition d.typeId d.exportName 0 (RecordBody "" fields)])
