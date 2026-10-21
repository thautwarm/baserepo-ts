module JSON.Wire.Authoring

import public JSON
import public JSON.Wire.Codec
import public JSON.Wire.Reflection
import public JSON.Wire.Codegen
import Data.List
import Data.String

%language ElabReflection
%default total

lastSegment : List Char -> List Char -> List Char
lastSegment accumulated [] = reverse accumulated
lastSegment _ ('.' :: rest) = lastSegment [] rest
lastSegment accumulated (char :: rest) = lastSegment (char :: accumulated) rest

-- Avoid repeatedly converting Nat indices while reducing names in the
-- elaborator. Keep the same character order as Prelude.unpack.
nameChars : String -> List Char
nameChars text = go (length text) text
  where
    go : Nat -> String -> List Char
    go Z _ = []
    go (S k) rest = case strUncons rest of
      Nothing => []
      Just (char, tail) => char :: go k tail

shortName : Name -> String
shortName = pack . lastSegment [] . nameChars . show

validName : String -> Bool
validName text = case unpack text of
  [] => False
  char :: rest => (isAlpha char || char == '_') && all (\value => isAlphaNum value || value == '_') rest

snakeChars : Maybe Char -> List Char -> List Char
snakeChars _ [] = []
snakeChars previous (char :: rest) =
  let boundary = isUpper char && case previous of
        Nothing => False
        Just before => isLower before || isDigit before ||
          (isUpper before && case rest of next :: _ => isLower next; [] => False)
  in (if boundary then ['_', char] else [char]) ++ snakeChars (Just char) rest

export
snakeCaseName : String -> String
snakeCaseName = toLower . pack . snakeChars Nothing . unpack

duplicateKeys : List String -> Bool
duplicateKeys [] = False
duplicateKeys (key :: rest) = elem key rest || duplicateKeys rest

resolveName : Elaboration m => Name -> m Name
resolveName name = do
  candidates <- getType name
  case candidates of
    [(resolved, _)] => pure resolved
    [] => fail ("Wire authoring: unknown name: " ++ show name)
    _ => fail ("Wire authoring: ambiguous name: " ++ show name)

ensureFresh : Elaboration m => List Name -> m ()
ensureFresh names = do
  if duplicateKeys (map show names) then fail "Wire authoring: generated name collision" else pure ()
  traverse_ (\name => do
    prior <- getType name
    if null prior then pure () else fail ("Wire authoring: generated name collision: " ++ show name)) names

optionKeys : WireOption -> List String
optionKeys (FieldNames _) = ["field-names"]
optionKeys (FieldName field _) = ["field-name:" ++ field]
optionKeys (NumericField field _) = ["numeric-field:" ++ field]
optionKeys (TagField _) = ["tag-field"]
optionKeys (VariantTag variant _) = ["variant-tag:" ++ variant]
optionKeys (WireName _) = ["wire-name"]
optionKeys (ExportName _) = ["export-name"]
optionKeys (UseWire _) = []
optionKeys (FieldWire field _) = ["field-wire:" ++ field]
optionKeys (WireBinding _) = ["binding"]

initialBinding : List WireOption -> Either String Binding
initialBinding options = do
  if duplicateKeys (concatMap optionKeys options) then Left "Wire authoring: duplicate option" else Right ()
  let bindings = mapMaybe (\option => case option of WireBinding binding => Just binding; _ => Nothing) options
      keys = mapMaybe (\option => case option of TagField key => Just key; _ => Nothing) options
      tags = mapMaybe (\option => case option of VariantTag arm tag => Just (arm, tag); _ => Nothing) options
  case (bindings, keys, tags) of
    ([binding], [], []) => Right binding
    ([], [key], tags) => Right (InternalTagBinding key tags)
    ([], [], []) => Right (RecordBinding (StrictRecord []))
    _ => Left "Wire authoring: conflicting binding options"

lowerBinding : DefinitionShape -> Binding -> List WireOption -> Either String Binding
lowerBinding shape initial options = case shape of
  RecordBody _ fields => do
    let names = map source fields
        strategy = fromMaybe PreserveNames (head' (mapMaybe (\option => case option of FieldNames value => Just value; _ => Nothing) options))
        overrides = mapMaybe (\option => case option of FieldName field name => Just (field, name); _ => Nothing) options
        additional = mapMaybe (\option => case option of NumericField field binding => Just (field, binding); _ => Nothing) options
        rulesAndNumbers : (List (String, String), List (String, NumericBinding))
        rulesAndNumbers = case initial of
          RecordBinding rules => (rules.renames, [])
          NumericRecordBinding rules rulesNumeric => (rules.renames, rulesNumeric)
          _ => ([], [])
        renames = fst rulesAndNumbers
        numeric = snd rulesAndNumbers
    checkRules (StrictRecord (renames ++ overrides)) names
    if duplicateKeys (map fst (numeric ++ additional)) then Left "Wire authoring: duplicate numeric field" else Right ()
    if any (\(field, _) => not (elem field names)) (numeric ++ additional)
      then Left "Wire authoring: numeric rule references unknown field" else Right ()
    let normalizedRenames = map (\field => (field, fromMaybe
          (case strategy of PreserveNames => field; SnakeCase => snakeCaseName field)
          (Data.List.lookup field (renames ++ overrides)))) names
        normalizedNumeric = mapMaybe (\field => map (\value => (field, value)) (Data.List.lookup field (numeric ++ additional))) names
    pure (if null normalizedNumeric then RecordBinding (StrictRecord normalizedRenames)
      else NumericRecordBinding (StrictRecord normalizedRenames) normalizedNumeric)
  _ => if any recordOption options then Left "Wire authoring: record option on non-record" else Right initial
  where
    recordOption : WireOption -> Bool
    recordOption (FieldNames _) = True
    recordOption (FieldName _ _) = True
    recordOption (NumericField _ _) = True
    recordOption _ = False

metadataName : Name -> Name
metadataName name = fromString (show name ++ "Metadata")

templateBody : DefinitionShape -> Bool
templateBody (ListBody _ _) = True
templateBody SortedAssocBody = True
templateBody (PresenceBody _ _) = True
templateBody (NullableBody _ _) = True
templateBody _ = False

userTemplateBody : DefinitionShape -> Bool
userTemplateBody SortedAssocBody = True
userTemplateBody (PresenceBody _ _) = True
userTemplateBody (NullableBody _ _) = True
userTemplateBody _ = False

readWireMetadata : Elaboration m => Name -> m WireMetadata
readWireMetadata requested = do
  name <- resolveName requested
  metadata <- check {expected = WireMetadata} (var (metadataName name))
  if metadata.metadataWireName /= name then fail "Wire authoring: imported wire identity mismatch" else pure ()
  if metadata.metadataDefinition.identity /= show name || metadata.metadataOrigin.originWireIdentity /= show name
    then fail "Wire authoring: imported node identity mismatch" else pure ()
  source <- resolveName metadata.metadataRegistration.typeName
  if show source /= metadata.metadataOrigin.originSource.sourceAlias
    then fail "Wire authoring: imported source identity mismatch" else pure ()
  if metadata.metadataDefinition.parameterCount == 0
    then do
      application <- normalizedApplication (var source)
      if not (sameTypeExpression application metadata.metadataOrigin.originSource.sourceApplication) ||
         canonicalApplicationKey application /= metadata.metadataOrigin.originSource.sourceApplicationKey
        then fail "Wire authoring: imported full application mismatch" else pure ()
      expected <- check {expected = Type} `(WireDefinition ~(var source))
      _ <- check {expected = expected} (var name)
      pure metadata
    else do
      reflected <- reflectRegistration metadata.metadataRegistration
      Right expected <- pure (reflectDefinition metadata.metadataRegistration (reflectedRegistrationInfo reflected))
        | Left error => fail error
      let supported = expected.parameterCount == 1 && templateBody expected.body
          application = Reference (show source) [Parameter 0]
          expectedDefinition = Definition (show name) expected.tsName 1 expected.body
      if not supported || not (sameTypeExpression application metadata.metadataOrigin.originSource.sourceApplication) ||
         canonicalApplicationKey application /= metadata.metadataOrigin.originSource.sourceApplicationKey ||
         not (sameMetadataNode metadata ({ metadataDefinition := expectedDefinition } metadata))
        then fail "Wire authoring: imported template mismatch" else pure ()
      _ <- check {expected = WireTemplate} (var name)
      pure metadata

-- Explicit standard templates remain the already checked backend templates.
builtinMetadata : Elaboration m => String -> m (Maybe WireMetadata)
builtinMetadata name = case name of
  "Prelude.Basics.List" => Just <$> builtin ListBinding "List"
  "Value.StringKeySortedAssoc.StringKeySortedAssoc" => Just <$> builtin SortedAssocBinding "StringKeySortedAssoc"
  "Prelude.Types.Maybe" => Just <$> builtin (PresenceBinding "Nothing" "Just") "Maybe"
  "Prelude.Basics.Bool" => Just <$> builtin BooleanBinding "Bool"
  "Builtin.Void" => Just <$> builtin EmptyBinding "Void"
  _ => pure Nothing
  where
    builtin : Binding -> String -> m WireMetadata
    builtin binding exportName = do
      let registration = Register (fromString name) exportName binding
      reflected <- reflectRegistration registration
      let info = reflectedRegistrationInfo reflected
      Right definition <- pure (reflectDefinition registration info) | Left error => fail error
      let application = Reference name (if info.arty == 0 then [] else [Parameter 0])
          origin = DefinitionProvenance name (SourceProvenance name application (canonicalApplicationKey application)) [] []
      pure (WireDescriptor (fromString name) origin registration definition [])

compatible : TypeExpr -> WireMetadata -> Bool
compatible application metadata =
  if metadata.metadataDefinition.parameterCount == 0
    then canonicalApplicationKey application == metadata.metadataOrigin.originSource.sourceApplicationKey
    else case (application, metadata.metadataOrigin.originSource.sourceApplication) of
      (Reference source arguments, Reference template [Parameter 0]) =>
        metadata.metadataDefinition.parameterCount == 1 && templateBody metadata.metadataDefinition.body &&
        source == template && length arguments == 1
      _ => False

conventionalCandidates : Elaboration m => TypeExpr -> m (List WireMetadata)
conventionalCandidates (Reference source _) = do
  names <- getType (fromString ("wire" ++ shortName (fromString source)))
  traverse (readWireMetadata . fst) names
conventionalCandidates _ = pure []

selectDependency : Elaboration m => Name -> TypeExpr -> List WireMetadata -> Maybe Name -> TypeExpr
                 -> TypeExpr -> m WireMetadata
selectDependency ownName ownApplication visible selected original application = do
  if canonicalApplicationKey application == canonicalApplicationKey ownApplication
    then fail "Wire authoring: recursive dependency" else pure ()
  case selected of
    Just name => do
      metadata <- readWireMetadata name
      if compatible application metadata then pure metadata
        else fail "Wire authoring: selected wire source type mismatch"
    Nothing => do
      automatic <- conventionalCandidates original
      let candidates = filter (compatible application) (visible ++ automatic)
          exactCandidates : List WireMetadata
          exactCandidates = case original of
            Reference alias [] => filter (\metadata => metadata.metadataOrigin.originSource.sourceAlias == alias) candidates
            _ => []
          preferred = if null exactCandidates then candidates else exactCandidates
      Right unique <- pure (collectWireMetadata preferred) | Left error => fail error
      -- Only the actual candidate roots participate in selection, not their children.
      let roots = filter (\metadata => any (\candidate => candidate.metadataWireName == metadata.metadataWireName) preferred) unique
      case roots of
        [metadata] => pure metadata
        [] => case application of
          Reference source arguments => do
            builtin <- builtinMetadata source
            case builtin of
              Just metadata => if compatible application metadata then pure metadata
                else fail "Wire authoring: template argument mismatch"
              Nothing => fail "Wire authoring: missing wire dependency"
          _ => fail "Wire authoring: missing wire dependency"
        _ => fail "Wire authoring: ambiguous wire dependency"

mutual
  resolveExpression : Elaboration m => Nat -> Name -> TypeExpr -> List WireMetadata -> Maybe Name -> List Nat -> TypeExpr -> TypeExpr
                    -> m (TypeExpr, List ReferenceOrigin, List WireMetadata)
  resolveExpression _ _ _ _ Nothing _ NaturalType NaturalType = pure (NaturalType, [], [])
  resolveExpression _ _ _ _ Nothing _ (Integer64Type _) (Integer64Type kind) = pure (Integer64Type kind, [], [])
  resolveExpression _ _ _ _ Nothing _ StringType StringType = pure (StringType, [], [])
  resolveExpression _ _ _ _ _ _ (Parameter _) _ = fail "Wire authoring: unbound parameter"
  resolveExpression 0 _ _ _ _ _ _ _ = fail "Wire authoring: inconsistent reflected expression depth"
  resolveExpression (S depth) own ownApplication visible selected path original application = do
    case application of
      NaturalType => case selected of
        Nothing => pure (NaturalType, [], [])
        _ => fail "Wire authoring: FieldWire requires a referenced value"
      Integer64Type kind => case selected of
        Nothing => pure (Integer64Type kind, [], [])
        _ => fail "Wire authoring: FieldWire requires a referenced value"
      StringType => case selected of
        Nothing => pure (StringType, [], [])
        _ => fail "Wire authoring: FieldWire requires a referenced value"
      Reference source arguments => do
        -- A selected template belongs to this boundary. A selected closed
        -- value can instead belong inside a container, as in the existing
        -- List/Maybe FieldWire contract. Preserve that inner selection.
        selectedHere <- case selected of
          Nothing => pure Nothing
          Just name => do
            candidate <- readWireMetadata name
            if compatible application candidate then pure (Just name) else do
              builtin <- builtinMetadata source
              automatic <- conventionalCandidates original
              let isContainer = \metadata => metadata.metadataDefinition.parameterCount == 1 &&
                    templateBody metadata.metadataDefinition.body && compatible application metadata
              if any isContainer (visible ++ automatic ++ maybe [] (\value => [value]) builtin)
                then pure Nothing
                else fail "Wire authoring: selected wire source type mismatch"
        metadata <- selectDependency own ownApplication visible selectedHere original application
        case metadata.metadataDefinition.parameterCount of
          0 => do
            case (selected, selectedHere) of
              (Just _, Nothing) => fail "Wire authoring: selected wire source type mismatch"
              _ => pure ()
            let reference = ReferenceProvenance path original application (canonicalApplicationKey application) (show metadata.metadataWireName)
            pure (Reference (show metadata.metadataWireName) [], [reference], [metadata])
          _ => do
            if not (templateBody metadata.metadataDefinition.body) || length arguments /= 1
              then fail "Wire authoring: unsupported template dependency" else pure ()
            let sourceArguments = case original of
                  Reference originalSource values => if originalSource == source then values else arguments
                  _ => arguments
                innerSelection = case selectedHere of Just _ => Nothing; Nothing => selected
            if length sourceArguments /= length arguments then fail "Wire authoring: template argument mismatch" else pure ()
            resolved <- resolveArguments depth own ownApplication visible innerSelection path 0 (zip sourceArguments arguments)
            let reference = ReferenceProvenance path original application (canonicalApplicationKey application) (show metadata.metadataWireName)
            pure (Reference (show metadata.metadataWireName) (map (\(type, _, _) => type) resolved),
              reference :: concatMap (\(_, origins, _) => origins) resolved,
              metadata :: concatMap (\(_, _, dependencies) => dependencies) resolved)
      _ => fail "Wire authoring: unsupported value expression"

  resolveArguments : Elaboration m => Nat -> Name -> TypeExpr -> List WireMetadata -> Maybe Name -> List Nat -> Nat -> List (TypeExpr, TypeExpr)
                   -> m (List (TypeExpr, List ReferenceOrigin, List WireMetadata))
  resolveArguments _ _ _ _ _ _ _ [] = pure []
  resolveArguments depth own application visible selected path index ((original, normalized) :: rest) =
    (::) <$> resolveExpression depth own application visible selected (path ++ [index]) original normalized
         <*> resolveArguments depth own application visible selected path (S index) rest

fieldChoice : String -> List WireOption -> Maybe Name
fieldChoice source options = head' (mapMaybe (\option => case option of
  FieldWire field name => if field == source then Just name else Nothing
  _ => Nothing) options)

resolveOwnDefinition : Elaboration m => Name -> TypeExpr -> List WireMetadata -> List WireOption
                     -> List (String, List (TypeExpr, TypeExpr)) -> TypeDefinition -> m (TypeDefinition, List FieldOrigin, List ArmOrigin, List WireMetadata)
resolveOwnDefinition own application visible options members definition = case definition.body of
  RecordBody constructor fields => do
    let selections = mapMaybe (\option => case option of FieldWire field _ => Just field; _ => Nothing) options
    if any (\field => not (elem field (map source fields))) selections
      then fail "Wire authoring: FieldWire references unknown field" else pure ()
    let sourceTypes = fromMaybe [] (Data.List.lookup constructor members)
    if length sourceTypes /= length fields then fail "Wire authoring: reflected field origin mismatch" else pure ()
    resolved <- traverse (\(field, (original, normalized)) => do
      (value, origins, dependencies) <- resolveExpression (S (JSON.Wire.Check.expressionDepth normalized)) own application visible (fieldChoice field.source options) [] original normalized
      -- Resolve identities first, preserving the original source provenance.
      -- Numeric lowering then inspects these selected wrapper definitions.
      pure (GraphMember field.source field.key value, FieldProvenance field.source original origins, dependencies)) (zip fields sourceTypes)
    pure (Definition (show own) definition.tsName definition.parameterCount
      (RecordBody constructor (map (\(field, _, _) => field) resolved)),
      map (\(_, origin, _) => origin) resolved, [], concatMap (\(_, _, deps) => deps) resolved)
  InternalTagBody key arms => do
    if any (\option => case option of FieldWire _ _ => True; _ => False) options
      then fail "Wire authoring: FieldWire requires a record field" else pure ()
    resolved <- traverse (\(constructor, tag, payload) => case payload of
      NullaryPayload => do
        [] <- pure (fromMaybe [] (Data.List.lookup constructor members))
          | _ => fail "Wire authoring: reflected nullary arm origin mismatch"
        pure ((constructor, tag, NullaryPayload), ArmProvenance constructor NullaryPayload [], the (List WireMetadata) [])
      _ => do
        [(original, normalized)] <- pure (fromMaybe [] (Data.List.lookup constructor members))
          | _ => fail "Wire authoring: reflected arm origin mismatch"
        (value, origins, dependencies) <- resolveExpression (S (JSON.Wire.Check.expressionDepth normalized)) own application visible Nothing [] original normalized
        pure ((constructor, tag, value), ArmProvenance constructor original origins, dependencies)) arms
    pure (Definition (show own) definition.tsName 0 (InternalTagBody key (map (\(arm, _, _) => arm) resolved)),
      [], map (\(_, origin, _) => origin) resolved, concatMap (\(_, _, deps) => deps) resolved)
  UntaggedBody ExactlyOne arms => do
    if any (\option => case option of FieldWire _ _ => True; _ => False) options
      then fail "Wire authoring: FieldWire requires a record field" else pure ()
    resolved <- traverse (\(constructor, _) => do
      [(original, normalized)] <- pure (fromMaybe [] (Data.List.lookup constructor members))
        | _ => fail "Wire authoring: reflected untagged arm origin mismatch"
      (value, origins, dependencies) <- resolveExpression (S (JSON.Wire.Check.expressionDepth normalized))
        own application visible Nothing [] original normalized
      pure ((constructor, value), ArmProvenance constructor original origins, dependencies)) arms
    pure (Definition (show own) definition.tsName 0 (UntaggedBody ExactlyOne (map (\(arm, _, _) => arm) resolved)),
      [], map (\(_, origin, _) => origin) resolved, concatMap (\(_, _, deps) => deps) resolved)
  ClosedNullableBody empty full _ => do
    if any (\option => case option of FieldWire _ _ => True; _ => False) options
      then fail "Wire authoring: FieldWire requires a record field" else pure ()
    [] <- pure (fromMaybe [] (Data.List.lookup empty members))
      | _ => fail "Wire authoring: reflected closed nullable null arm origin mismatch"
    [(original, normalized)] <- pure (fromMaybe [] (Data.List.lookup full members))
      | _ => fail "Wire authoring: reflected closed nullable value arm origin mismatch"
    (value, origins, dependencies) <- resolveExpression (S (JSON.Wire.Check.expressionDepth normalized))
      own application visible Nothing [] original normalized
    pure (Definition (show own) definition.tsName 0 (ClosedNullableBody empty full value),
      [], [ArmProvenance full original origins], dependencies)
  _ => pure (Definition (show own) definition.tsName definition.parameterCount definition.body, [], [], [])

needsMemberReflection : Binding -> Bool
needsMemberReflection (RecordBinding _) = True
needsMemberReflection (NumericRecordBinding _ _) = True
needsMemberReflection (InternalTagBinding _ _) = True
needsMemberReflection (NullableBinding _ _) = True
needsMemberReflection (UntaggedBinding _) = True
needsMemberReflection _ = False

publishCheckedTemplate : Elaboration m => Name -> Name -> Registration -> TypeDefinition -> List WireOption -> m ()
publishCheckedTemplate source own registration reflected options = do
  -- reflectDefinition has checked the recognized unary contract: either the
  -- presence/nullable constructors or the actual opaque foundation container.
  -- No arbitrary generic record/function is published here.
  let supported = reflected.parameterCount == 1 && userTemplateBody reflected.body
  if not supported then fail "Wire authoring: generic declarations require a built-in template" else pure ()
  if any dependencyOption options then fail "Wire authoring: template cannot select value dependencies" else pure ()
  let application = Reference (show source) [Parameter 0]
      definition = Definition (show own) reflected.tsName 1 reflected.body
      origin = DefinitionProvenance (show own)
        (SourceProvenance (show source) application (canonicalApplicationKey application)) [] []
      metadata = WireDescriptor own origin registration definition []
  Right _ <- pure (collectWireMetadata [metadata]) | Left error => fail error
  declare
    [ public' (metadataName own) `(WireMetadata)
    , def (metadataName own) [patClause (var (metadataName own)) (wireMetadataTerm metadata)]
    , public' own `(WireTemplate)
    , def own [patClause (var own) `(trustedWireTemplate ~(var (metadataName own)))]
    ]
  where
    dependencyOption : WireOption -> Bool
    dependencyOption (UseWire _) = True
    dependencyOption (FieldWire _ _) = True
    dependencyOption _ = False

||| Build only this type's codec. Imported dependencies supply typed references
||| and pure descriptors; no imported codec declaration is generated again.
export
deriveJSON : Elaboration m => Name -> List WireOption -> m ()
deriveJSON requested options = do
  source <- resolveName requested
  Right configured <- pure (initialBinding options) | Left error => fail error
  let explicitBinding = any (\option => case option of WireBinding _ => True; TagField _ => True; VariantTag _ _ => True; _ => False) options
      initial = if explicitBinding then configured else case show source of
        "Prelude.Basics.Bool" => BooleanBinding
        "Builtin.Void" => EmptyBinding
        "Value.StringKeySortedAssoc.StringKeySortedAssoc" => SortedAssocBinding
        _ => configured
  let exportName = fromMaybe (shortName source) (head' (mapMaybe (\option => case option of ExportName name => Just name; _ => Nothing) options))
      requestedWire : Name
      requestedWire = fromMaybe (the Name (fromString ("wire" ++ shortName source))) (head' (mapMaybe (\option => case option of WireName name => Just name; _ => Nothing) options))
  if not (validName (show requestedWire)) then fail "Wire authoring: WireName must be a local value name" else pure ()
  own <- inCurrentNS requestedWire
  freshEncode <- genSym {m = m} "wireEncode"
  freshDecode <- genSym {m = m} "wireDecode"
  encodeName <- inCurrentNS freshEncode
  decodeName <- inCurrentNS freshDecode
  ensureFresh [own, metadataName own, encodeName, decodeName]
  let preliminary = Register source exportName initial
  reflected <- reflectRegistration preliminary
  let rawInfo = reflectedRegistrationInfo reflected
  -- Opaque bindings use their checked projection/constructor hooks, not the
  -- private representation's fields or erased dependent constructor proofs.
  (info, members) <- if rawInfo.arty == 0 && needsMemberReflection initial
    then reflectAuthoringInfo rawInfo else pure (rawInfo, [])
  Right rawDefinition <- pure (reflectDefinition preliminary info) | Left error => fail error
  Right binding <- pure (lowerBinding rawDefinition.body initial options) | Left error => fail error
  let registration = Register source exportName binding
  Right reflectedDefinition <- pure (reflectDefinition registration info) | Left error => fail error
  if info.arty /= 0
    then publishCheckedTemplate source own registration reflectedDefinition options
    else do
      application <- normalizedApplication (var source)
      visible <- traverse readWireMetadata (mapMaybe (\option => case option of UseWire name => Just name; _ => Nothing) options)
      (resolvedDefinition, fields, arms, selected) <- resolveOwnDefinition own application visible options members reflectedDefinition
      Right dependencies <- pure (collectWireMetadata selected) | Left error => fail error
      Right definition <- pure (lowerNumericFields (resolvedDefinition :: map metadataDefinition dependencies) registration resolvedDefinition)
        | Left error => fail error
      -- Direct dependencies only; each descriptor retains its own transitive DAG.
      let direct = filter (\node => any (\selectedNode => selectedNode.metadataWireName == node.metadataWireName) selected) dependencies
          origin = DefinitionProvenance (show own) (SourceProvenance (show source) application (canonicalApplicationKey application)) fields arms
          metadata = WireDescriptor own origin registration definition direct
      Right nodes <- pure (collectWireMetadata [metadata]) | Left error => fail error
      let graph = Graph (show own) Component (map metadataDefinition nodes)
      Right checked <- pure (checkGraphWithOrigins graph (map metadataOrigin nodes)) | Left error => fail error
      let links = Links ((show own, LocalCodec encodeName decodeName) ::
            map (\node => (show node.metadataWireName, ImportedCodec node.metadataWireName)) dependencies)
      Right generated <- pure (generateCheckedDefinitionWithLinks (show own) links checked registration info)
        | Left error => fail error
      declare (map claim generated ++ map defn generated ++
        [ public' (metadataName own) `(WireMetadata)
        , def (metadataName own) [patClause (var (metadataName own)) (wireMetadataTerm metadata)]
        , public' own `(WireDefinition ~(var source))
        , def own [patClause (var own) `(trustedWireDefinition ~(var (metadataName own)) ~(var encodeName) ~(var decodeName))]
        ])

||| Publish a root independently of its definition module. TS profile selection
||| remains renderGraph*For on this exact checked GraphCodec.
export
publishJSONRoot : Elaboration m => Name -> RootRule -> List RootOption -> m ()
publishJSONRoot requested rule options = do
  metadata <- readWireMetadata requested
  _ <- if metadata.metadataDefinition.parameterCount /= 0 then fail "Wire authoring: root requires a closed value type" else pure ()
  _ <- if length options > 1 then fail "Wire authoring: duplicate root option" else pure ()
  let name = case options of
        [RootName value] => value
        _ => "graphCodec" ++ metadata.metadataDefinition.tsName
  _ <- if not (validName name) then fail "Wire authoring: invalid root name" else pure ()
  codecName <- inCurrentNS (fromString name)
  _ <- ensureFresh [codecName]
  Right nodes <- pure (collectWireMetadata [metadata]) | Left error => fail error
  let graph = Graph (show metadata.metadataWireName) rule (map metadataDefinition nodes)
  Right checked <- pure (checkGraphWithOrigins graph (map metadataOrigin nodes)) | Left error => fail error
  reflected <- reflectRegistration metadata.metadataRegistration
  let info = reflectedRegistrationInfo reflected
      links = Links (map (\node => (show node.metadataWireName, ImportedCodec node.metadataWireName)) nodes)
  Right generated <- pure (generateRootWithLinks codecName links checked info) | Left error => fail error
  declare [claim generated, defn generated]
