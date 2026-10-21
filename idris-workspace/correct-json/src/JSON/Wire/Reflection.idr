module JSON.Wire.Reflection

import JSON.Option
import public JSON.Wire.Registry
import public JSON.Wire.Check
import public JSON.Wire.Description
import Language.Reflection.Util

%language ElabReflection
%default total

primitive : TTImp -> Either String FieldKind
primitive (IVar _ name) =
  if name == "Prelude.Types.Nat" then Right Natural
  else Left ("Wire: unsupported field type in W1: " ++ show name)
primitive (IPrimVal _ (PrT StringType)) = Right Text
primitive type = Left ("Wire: unsupported field type in W1: " ++ show type)

reflectField : RecordRules -> BoundArg 2 RegularNamed -> Either String WireField
reflectField rules (BA arg _ _) = do
  kind <- primitive arg.type
  let source = (argName arg).nameStr
  pure (MkWireField source (renameFor rules source) kind)

||| No filtering of evidence/implicit fields is allowed in this initial slice.
||| Shapes requiring such filtering need a later explicit wire contract.
export
reflectRecord : RecordRules -> ParamTypeInfo -> Either String CheckedRecord
reflectRecord rules p =
  if p.info.arty /= 0 then Left "Wire: type parameters are not supported in W1"
  else case p.info.cons of
    [con] => case (dcon defaultOptions con).args of
      Fields fields =>
        if length fields /= con.arty then Left "Wire: implicit or erased fields are not supported in W1"
        else do
          reflected <- traverse (reflectField rules) (fields <>> [])
          checkRules rules (map sourceName reflected)
          checkRecord (MkRecordDescription (show p.info.name) p.nameStr reflected)
      _ => Left "Wire: W1 requires named non-empty record fields"
    _ => Left "Wire: W1 requires a single constructor"

export
descriptionTerm : CheckedRecord -> TTImp
descriptionTerm checked =
  let d = description checked
      fieldTerm = \field =>
        `(MkWireField ~(primVal (Str field.sourceName))
          ~(primVal (Str field.wireName)) ~(kindTerm field.kind))
  in `(MkRecordDescription ~(primVal (Str d.typeId))
        ~(primVal (Str d.exportName)) ~(listOf (map fieldTerm d.fields)))
  where
    kindTerm : FieldKind -> TTImp
    kindTerm Natural = `(Natural)
    kindTerm Text = `(Text)

export
codecOptions : CheckedRecord -> Options
codecOptions checked =
  { unwrapUnary := False, unwrapRecords := True,
    fieldNameModifier := \name => maybe name wireName
      (find (\field => field.sourceName == name) (description checked).fields)
  } defaultOptions


export
reflectTypeExpr : TTImp -> Either String TypeExpr
reflectTypeExpr (IPrimVal _ (PrT StringType)) = Right StringType
reflectTypeExpr (IPrimVal _ (PrT Int64Type)) = Right (Integer64Type Signed64)
reflectTypeExpr (IPrimVal _ (PrT Bits64Type)) = Right (Integer64Type Unsigned64)
reflectTypeExpr (IVar _ name) =
  if name == "Prelude.Types.Nat" then Right NaturalType
  else Right (Reference (show name) [])
reflectTypeExpr (IApp _ head argument) = do
  Reference name args <- reflectTypeExpr head
    | _ => Left "Wire graph: unsupported type application"
  value <- reflectTypeExpr argument
  pure (Reference name (args ++ [value]))
reflectTypeExpr value = Left ("Wire graph: unsupported field type: " ++ show value)

reflectMember : RecordRules -> BoundArg 2 RegularNamed -> Either String GraphField
reflectMember rules (BA arg _ _) = do
  type <- reflectTypeExpr arg.type
  let source = (argName arg).nameStr
  pure (GraphMember source (renameFor rules source) type)

||| This is reflection metadata for an existing declaration, not a new record
||| declaration or a second field schema. A closed alias retains its public
||| identity while its constructor and fields come from the original record.
export
record ReflectedRegistration where
  constructor Reflected
  registration : Registration
  applicationKey : String
  info : TypeInfo

mutual
  fullApplicationKey : TypeExpr -> String
  fullApplicationKey NullaryPayload = "Z;"
  fullApplicationKey NaturalType = "N"
  fullApplicationKey (BoundNaturalType _) = "N"
  fullApplicationKey StringType = "S"
  fullApplicationKey (Integer64Type Signed64) = "I64"
  fullApplicationKey (Integer64Type Unsigned64) = "U64"
  fullApplicationKey (Parameter index) = "P" ++ show index ++ ";"
  fullApplicationKey (Reference name args) =
    "R" ++ show (length name) ++ ":" ++ name ++ "[" ++ applicationKeys args ++ "]"

  applicationKeys : List TypeExpr -> String
  applicationKeys [] = ""
  applicationKeys (arg :: rest) = fullApplicationKey arg ++ applicationKeys rest

normalType : Elaboration m => TTImp -> m TTImp
normalType term = do
  value <- check {expected = Type} term
  quote value

||| Shared canonical encoding for legacy closed registrations and authoring.
export
canonicalApplicationKey : TypeExpr -> String
canonicalApplicationKey = fullApplicationKey

export
reflectedRegistrationInfo : ReflectedRegistration -> TypeInfo
reflectedRegistrationInfo = info

typeHead : TTImp -> Either String Name
typeHead (IVar _ name) = Right name
typeHead (IApp _ head _) = typeHead head
typeHead (INamedApp _ head _ _) = typeHead head
typeHead term = Left ("Wire graph: closed alias must resolve to a record: " ++ show term)

typeDepth : TTImp -> Nat
typeDepth (IApp _ head value) = 1 + max (typeDepth head) (typeDepth value)
typeDepth (INamedApp _ head _ value) = 1 + max (typeDepth head) (typeDepth value)
typeDepth _ = 1

-- AppArgs is dependent; collect actual arguments in the original binder order,
-- including named implicit applications. Missing type arguments cannot become
-- an unbound parameter in a concrete generated codec.
appliedTypes : {0 args : Vect n Arg} -> AppArgs args -> List TTImp
appliedTypes [] = []
appliedTypes (arg :: rest) = arg.ttimp :: appliedTypes rest

canonicalType : Elaboration m => Nat -> TTImp -> m TypeExpr
canonicalType _ (IPrimVal _ (PrT StringType)) = pure StringType
canonicalType _ (IPrimVal _ (PrT Int64Type)) = pure (Integer64Type Signed64)
canonicalType _ (IPrimVal _ (PrT Bits64Type)) = pure (Integer64Type Unsigned64)
canonicalType _ (IVar _ name) = if name == "Prelude.Types.Nat"
  then pure NaturalType else reference 1 (var name)
  where
    reference : Nat -> TTImp -> m TypeExpr
    reference fuel term = do
      info <- getInfo' name
      if info.arty /= 0 then fail ("Wire graph: unsaturated record specialization: " ++ show name) else pure ()
      pure (Reference (show name) [])
canonicalType 0 term = fail "Wire graph: closed application normalization exhausted"
canonicalType (S fuel) term = do
  Right name <- pure (typeHead term) | Left error => fail error
  source <- getInfo' name
  Right (arguments, _) <- pure (getArgs source.args term) | Left error => fail ("Wire graph: unsaturated record specialization: " ++ error)
  args <- traverse (canonicalType fuel) (appliedTypes arguments)
  pure (Reference (show name) args)

sourceExpression : Elaboration m => Nat -> TTImp -> m TypeExpr
sourceExpression _ (IPrimVal _ (PrT StringType)) = pure StringType
sourceExpression _ (IPrimVal _ (PrT Int64Type)) = pure (Integer64Type Signed64)
sourceExpression _ (IPrimVal _ (PrT Bits64Type)) = pure (Integer64Type Unsigned64)
sourceExpression _ (IVar _ name) = pure (if name == "Prelude.Types.Nat"
  then NaturalType else Reference (show name) [])
sourceExpression 0 _ = fail "Wire authoring: source type expression exhausted"
sourceExpression (S fuel) term = do
  Right name <- pure (typeHead term) | Left error => fail error
  (_, declared) <- lookupName name
  let (binders, _) = unPi declared
  Right (arguments, _) <- pure (getArgs (Vect.fromList binders) term)
    | Left error => fail ("Wire authoring: unsupported source application: " ++ error)
  args <- traverse (sourceExpression fuel) (appliedTypes arguments)
  pure (Reference (show name) args)

||| Preserve explicit source aliases, while ordering named implicit binders
||| according to the actual declaration rather than application syntax order.
export
sourceTypeExpression : Elaboration m => TTImp -> m TypeExpr
sourceTypeExpression term = sourceExpression (S (typeDepth term)) term

atArgument : Nat -> List a -> Either String a
atArgument _ [] = Left "Wire graph: missing closed type argument"
atArgument 0 (value :: _) = Right value
atArgument (S index) (_ :: rest) = atArgument index rest

mutual
  closeParameter : List TTImp -> PArg n -> Either String TTImp
  closeParameter args (PPar index) = atArgument (finToNat index) args
  closeParameter _ (PVar (UN _)) = Left "Wire graph: unsupported dependent record field type"
  closeParameter _ (PVar name) = Right (var name)
  closeParameter args (PApp head value) = app <$> closeParameter args head <*> closeParameter args value
  closeParameter args (PNamedApp head name value) =
    namedApp <$> closeParameter args head <*> pure name <*> closeParameter args value
  closeParameter _ (PPrim value) = Right (primVal value)
  closeParameter _ value = Left "Wire graph: unsupported dependent record field type"

  closeMembers : List TTImp -> List (ConArg n) -> Either String (List Arg)
  closeMembers _ [] = Right []
  closeMembers args (ParamArg _ (IType _) :: rest) = closeMembers args rest
  closeMembers args (CArg (Just name) MW ExplicitArg type :: rest) = do
    closed <- closeParameter args type
    remaining <- closeMembers args rest
    pure (MkArg MW ExplicitArg (Just name) closed :: remaining)
  closeMembers _ (ParamArg _ _ :: _) = Left "Wire graph: record parameter must be an erased Type"
  closeMembers _ _ = Left "Wire graph: implicit/erased record fields are unsupported"

typeParameter : Arg -> Either String ()
typeParameter (MkArg M0 ExplicitArg _ (IType _)) = Right ()
typeParameter (MkArg M0 ImplicitArg _ (IType _)) = Right ()
typeParameter (MkArg MW ExplicitArg _ (IType _)) = Right ()
typeParameter (MkArg MW ImplicitArg _ (IType _)) = Right ()
typeParameter _ = Left "Wire graph: record specialization requires Type parameters, not runtime indices"

closedRecordInfo : Name -> TypeInfo -> List TTImp -> Either String TypeInfo
closedRecordInfo publicName source arguments = do
  if length arguments /= source.arty then Left "Wire graph: unsaturated record specialization" else Right ()
  traverse_ typeParameter (toList source.args)
  parameterized <- paramType source (paramsOnly source.arty)
  [con] <- pure parameterized.cons | _ => Left "Wire graph: record binding requires one constructor"
  fields <- closeMembers arguments (toList con.args)
  if null fields then Left "Wire graph: record binding requires named fields" else Right ()
  let fieldArgs = Vect.fromList fields
  pure (MkTypeInfo publicName 0 [] [] [MkCon con.name (length fields) fieldArgs []])

-- Alias templates describe Type expressions, never record fields or codecs.
-- Their formal parameters are leaves. Saturate Type functions under fresh
-- binders before quoting: quoting an under-applied function is not its body.
record AliasTemplate where
  constructor TypeAliasTemplate
  aliasName : Name
  aliasArity : Nat
  aliasBody : TypeExpr

formalIndex : Name -> List Name -> Maybe Nat
formalIndex _ [] = Nothing
formalIndex name (first :: rest) = if name == first then Just 0 else S <$> formalIndex name rest

mutual
  templateExpression : Nat -> List Name -> TTImp -> Elab TypeExpr
  templateExpression _ _ (IPrimVal _ (PrT StringType)) = pure StringType
  templateExpression _ _ (IPrimVal _ (PrT Int64Type)) = pure (Integer64Type Signed64)
  templateExpression _ _ (IPrimVal _ (PrT Bits64Type)) = pure (Integer64Type Unsigned64)
  templateExpression _ formals (IVar _ name) = case formalIndex name formals of
    Just index => pure (Parameter index)
    Nothing => if name == "Prelude.Types.Nat" then pure NaturalType else do
      (_, declared) <- lookupName name
      case unPi declared of
        ([], IType _) => pure (Reference (show name) [])
        _ => fail "Wire graph: unsaturated alias template application"
  templateExpression 0 _ _ = fail "Wire graph: inconsistent alias template depth"
  templateExpression (S depth) formals term = named depth formals term

  named : Nat -> List Name -> TTImp -> Elab TypeExpr
  named depth formals term = do
    Right name <- pure (typeHead term) | Left _ => fail "Wire graph: unsupported alias template form"
    if isJust (formalIndex name formals)
      then fail "Wire graph: higher-order alias parameter is unsupported" else pure ()
    (_, declared) <- lookupName name
    let (binders, result) = unPi declared
    case result of
      IType _ => pure ()
      _ => fail "Wire graph: alias template must reference a Type"
    traverse_ (\binder => case typeParameter binder of
      Right () => pure ()
      Left _ => fail "Wire graph: alias template requires first-order Type parameters") binders
    Right (arguments, _) <- pure (getArgs (Vect.fromList binders) term)
      | Left _ => fail "Wire graph: unsaturated alias template application"
    values <- traverse (templateExpression depth formals) (appliedTypes arguments)
    pure (Reference (show name) values)

mutual
  probeTemplate : List Arg -> List Name -> TTImp -> Elab TypeExpr
  probeTemplate [] formals application = do
    normalized <- normalType application
    templateExpression (S (typeDepth normalized)) formals normalized
  probeTemplate (binder :: rest) formals application = do
    -- Lambda enters the callback's original binder name. Build that binder
    -- explicitly so each saved TTImp variable remains distinct at every step.
    -- Reify data only: quoting the implementation would expose private case
    -- blocks when this callback is checked in an importing module.
    fresh <- genSym "wireAliasType"
    binderTerm <- quote binder
    restTerm <- quote rest
    formalsTerm <- quote formals
    applicationTerm <- quote application
    let body = `(JSON.Wire.Reflection.probeTemplateStep
          ~(binderTerm) ~(restTerm) ~(formalsTerm) ~(applicationTerm) ~(var fresh))
    callback <- check {expected = Type -> Elab TypeExpr}
      (ILam EmptyFC MW ExplicitArg (Just fresh) `(Type) body)
    function <- lambda Type {ty = \_ => TypeExpr} callback
    -- The result stores Parameter indices, not the bound Type witness.
    pure (function Nat)

  -- This exported bridge is referenced by a typed, generated elaborator
  -- callback across modules. Its implementation and private case blocks are
  -- never copied into that callback's syntax.
  export
  probeTemplateStep : Arg -> List Arg -> List Name -> TTImp -> Type -> Elab TypeExpr
  probeTemplateStep binder rest formals application formal = do
    syntax <- quote formal
    IVar _ name <- pure syntax | _ => fail "Wire graph: alias formal did not quote as a variable"
    applied <- case binder.piInfo of
          ExplicitArg => pure (app application syntax)
          ImplicitArg => case binder.name of
            Just name => pure (namedApp application name syntax)
            Nothing => fail "Wire graph: unnamed implicit alias parameter is unsupported"
          _ => fail "Wire graph: unsupported alias parameter"
    probeTemplate rest (formals ++ [name]) applied

aliasCandidate : Name -> Elab Bool
aliasCandidate name = do
  information <- getInfo name
  case information of
    [(_, MkNameInfo Func)] => do
      (_, declared) <- lookupName name
      pure (case snd (unPi declared) of IType _ => True; _ => False)
    _ => pure False

readAliasTemplate : Name -> Elab AliasTemplate
readAliasTemplate name = do
  (_, declared) <- lookupName name
  let (binders, _) = unPi declared
  traverse_ (\binder => case typeParameter binder of
    Right () => pure ()
    Left _ => fail "Wire graph: alias template requires first-order Type parameters") binders
  body <- probeTemplate binders [] (var name)
  pure (TypeAliasTemplate name (length binders) body)

mutual
  expressionNames : TypeExpr -> List Name
  expressionNames (Reference name arguments) = fromString name :: expressionsNames arguments
  expressionNames _ = []

  expressionsNames : List TypeExpr -> List Name
  expressionsNames [] = []
  expressionsNames (first :: rest) = expressionNames first ++ expressionsNames rest

-- The compiler closure bounds discovery, but does not decide grammar or
-- cycles. Only names encountered in the actual source/template trees become
-- nodes; TyCon fields and unrelated Type helpers are never inspected.
discoverTemplates : Nat -> List Name -> List Name -> List AliasTemplate -> Elab (List AliasTemplate)
discoverTemplates fuel universe pending found = do
  let fresh = filter (\name => not (any (\template => template.aliasName == name) found)) (nub pending)
  flags <- traverse aliasCandidate fresh
  let candidates = map fst (filter snd (zip fresh flags))
  case candidates of
    [] => pure found
    _ => case fuel of
      0 => fail "Wire graph: alias discovery exceeded compiler dependency closure"
      S remaining => do
        if any (\name => not (elem name universe)) candidates
          then fail "Wire graph: alias dependency is absent from compiler closure" else pure ()
        templates <- traverse readAliasTemplate candidates
        discoverTemplates remaining universe (concatMap (expressionNames . aliasBody) templates) (found ++ templates)

parameterAt : Nat -> List TypeExpr -> Either String TypeExpr
parameterAt _ [] = Left "Wire graph: missing alias type argument"
parameterAt 0 (first :: _) = Right first
parameterAt (S index) (_ :: rest) = parameterAt index rest

mutual
  substituteTemplate : TypeExpr -> List TypeExpr -> Either String TypeExpr
  substituteTemplate (Parameter index) arguments = parameterAt index arguments
  substituteTemplate (Reference name values) arguments = Reference name <$> substituteTemplates values arguments
  substituteTemplate value _ = Right value

  substituteTemplates : List TypeExpr -> List TypeExpr -> Either String (List TypeExpr)
  substituteTemplates [] _ = Right []
  substituteTemplates (value :: rest) arguments =
    (::) <$> substituteTemplate value arguments <*> substituteTemplates rest arguments

mutual
  expandAliases : TypeExpr -> List AliasTemplate -> Either String TypeExpr
  expandAliases (Reference name arguments) templates = do
    expanded <- expandArguments arguments templates
    case find (\template => show template.aliasName == name) templates of
      Nothing => pure (Reference name expanded)
      Just template => do
        if length expanded /= template.aliasArity then Left "Wire graph: unsaturated alias template application" else Right ()
        -- The stored template has already had all aliases removed. Substitute
        -- structurally; never recurse into the newly enlarged result.
        substituteTemplate template.aliasBody expanded
  expandAliases value _ = Right value

  expandArguments : List TypeExpr -> List AliasTemplate -> Either String (List TypeExpr)
  expandArguments [] _ = Right []
  expandArguments (argument :: rest) templates =
    (::) <$> expandAliases argument templates <*> expandArguments rest templates

expandTemplates : Nat -> List AliasTemplate -> List AliasTemplate -> Either String (List AliasTemplate)
expandTemplates _ [] expanded = Right expanded
expandTemplates 0 _ _ = Left "Wire graph: inconsistent alias dependency order"
expandTemplates (S fuel) pending expanded = do
  let pendingNames = map aliasName pending
      ready = filter (\template => all (\name => not (elem name pendingNames)) (expressionNames template.aliasBody)) pending
  if null ready then Left "Wire graph: recursive type alias is unsupported" else Right ()
  prepared <- traverse (\template => do
    body <- expandAliases template.aliasBody expanded
    pure ({ aliasBody := body } template)) ready
  let rest = filter (\template => not (any (\done => done.aliasName == template.aliasName) ready)) pending
  expandTemplates fuel rest (expanded ++ prepared)

structuredApplication : TTImp -> Elab TypeExpr
structuredApplication term = do
  -- Normalization also resolves short names. Source provenance is computed
  -- separately from the original term, never from this semantic expression.
  normalized <- normalType term
  source <- sourceTypeExpression normalized
  let names = nub (expressionNames source)
  references <- traverse getReferredFns names
  let universe = nub (names ++ concat references)
  templates <- discoverTemplates (length universe) universe names []
  Right prepared <- pure (expandTemplates (length templates) templates []) | Left error => fail error
  Right application <- pure (expandAliases source prepared) | Left error => fail error
  pure application

||| Normalize every closed actual argument. Keep the old successful path;
||| residual aliases use checked first-order templates and finite DAG expansion.
||| Source expression/provenance and canonical key encoding remain separate.
export
normalizedApplication : Elaboration m => TTImp -> m TypeExpr
normalizedApplication term = try
  (do normalized <- normalType term
      canonicalType (S (typeDepth normalized)) normalized)
  (structuredApplication term)

||| Only closed Type-parameter records are specialized. General polymorphic,
||| dependent and recursive codecs remain outside this finite-DAG generator.
plainRecordBinding : Binding -> Binding
plainRecordBinding (NumericRecordBinding rules _) = RecordBinding rules
plainRecordBinding binding = binding

export
reflectRegistration : Elaboration m => Registration -> m ReflectedRegistration
reflectRegistration registration = do
  (publicName, declared) <- lookupName registration.typeName
  if publicName /= registration.typeName then fail "Wire graph: registration identity must be qualified" else pure ()
  case plainRecordBinding registration.binding of
    RecordBinding _ => do
      case unPi declared of
        ([], IType _) => pure ()
        _ => fail "Wire graph: generic records are not supported in W2a; register a saturated closed Type alias"
      normal <- normalType (var publicName)
      Right name <- pure (typeHead normal) | Left error => fail error
      source <- getInfo' name
      Right (arguments, _) <- pure (getArgs source.args normal) | Left error => fail ("Wire graph: unsaturated record specialization: " ++ error)
      Right closed <- pure (closedRecordInfo publicName source (appliedTypes arguments)) | Left error => fail error
      expression <- normalizedApplication (var publicName)
      pure (Reflected registration (fullApplicationKey expression) closed)
    _ => do
      info <- getInfo' publicName
      pure (Reflected registration (fullApplicationKey (Reference (show publicName) [])) info)

mutual
  closeReference : Elaboration m => Nat -> List ReflectedRegistration -> TypeExpr -> m TypeExpr
  closeReference _ _ NullaryPayload = fail "Wire graph: nullary payload marker requires internal tag arm context"
  closeReference _ _ NaturalType = pure NaturalType
  closeReference _ _ value@(BoundNaturalType _) = pure value
  closeReference _ _ StringType = pure StringType
  closeReference _ _ value@(Integer64Type _) = pure value
  closeReference _ _ (Parameter _) = fail "Wire graph: unbound specialization parameter"
  closeReference 0 _ _ = fail "Wire graph: closed reference expansion exhausted"
  closeReference (S fuel) registrations expression@(Reference name args) =
    case filter (\entry => entry.applicationKey == fullApplicationKey expression) registrations of
      [entry] => pure (Reference (show entry.registration.typeName) [])
      _ :: _ :: _ => fail ("Wire graph: ambiguous closed specialization: " ++ name)
      [] => case find (\entry => show entry.registration.typeName == name) registrations of
        Just entry => case entry.registration.binding of
          RecordBinding _ => fail ("Wire graph: missing registered closed specialization: " ++ name)
          NumericRecordBinding _ _ => fail ("Wire graph: missing registered closed specialization: " ++ name)
          _ => Reference name <$> closeReferences fuel registrations args
        Nothing => if null args then pure expression else do
          source <- getInfo' (fromString name)
          -- An unregistered ordinary dependency/template must reach the graph
          -- check with its identity intact. Only named single-constructor
          -- records require the new closed-specialization registration.
          case source.cons of
            [con] => case (dcon defaultOptions con).args of
              Fields _ => fail ("Wire graph: missing registered closed specialization: " ++ name)
              _ => pure expression
            _ => pure expression

  closeReferences : Elaboration m => Nat -> List ReflectedRegistration -> List TypeExpr -> m (List TypeExpr)
  closeReferences _ _ [] = pure []
  closeReferences fuel registrations (value :: rest) =
    (::) <$> closeReference fuel registrations value <*> closeReferences fuel registrations rest

mutual
  closedTypeTerm : TypeExpr -> TTImp
  closedTypeTerm NullaryPayload = implicitFalse
  closedTypeTerm (BoundNaturalType _) = `(Nat)
  closedTypeTerm NaturalType = var "Prelude.Types.Nat"
  closedTypeTerm StringType = primVal (PrT StringType)
  closedTypeTerm (Integer64Type Signed64) = primVal (PrT Int64Type)
  closedTypeTerm (Integer64Type Unsigned64) = primVal (PrT Bits64Type)
  closedTypeTerm (Parameter _) = implicitFalse
  closedTypeTerm (Reference name args) = foldl app (varStr name) (closedTypeTerms args)

  closedTypeTerms : List TypeExpr -> List TTImp
  closedTypeTerms [] = []
  closedTypeTerms (value :: rest) = closedTypeTerm value :: closedTypeTerms rest

export
typeExpressionSyntax : TypeExpr -> TTImp
typeExpressionSyntax = closedTypeTerm

authoringArgument : Elaboration m => Arg -> m (Arg, (TypeExpr, TypeExpr))
authoringArgument arg = do
  original <- sourceTypeExpression arg.type
  normalized <- normalizedApplication arg.type
  let lowered = case normalized of
        NaturalType => var "Prelude.Types.Nat"
        StringType => primVal (PrT StringType)
        Integer64Type Signed64 => primVal (PrT Int64Type)
        Integer64Type Unsigned64 => primVal (PrT Bits64Type)
        _ => typeExpressionSyntax original
  pure ({ type := lowered } arg, (original, normalized))

||| Preserve the actual source expression and its fully normalized application
||| together. Metadata lowering uses explicit positional applications only;
||| constructor/type claims still use the original source identity.
export
reflectAuthoringInfo : Elaboration m => TypeInfo
                    -> m (TypeInfo, List (String, List (TypeExpr, TypeExpr)))
reflectAuthoringInfo info = do
  constructors <- traverse (\con => do
    fields <- traverse authoringArgument (toList con.args)
    let arguments = map fst fields
    pure (the (Con 0 [], (String, List (TypeExpr, TypeExpr)))
      (MkCon con.name (length arguments) (Vect.fromList arguments) [],
       (show con.name, map snd fields)))) info.cons
  pure (MkTypeInfo info.name 0 [] [] (map fst constructors), map snd constructors)

normalizedFieldType : Elaboration m => List ReflectedRegistration -> TTImp -> m TTImp
normalizedFieldType registrations term = do
  expression <- normalizedApplication term
  closed <- closeReference (expressionDepth expression) registrations expression
  pure (closedTypeTerm closed)

mutual
  closeFieldType : Elaboration m => List ReflectedRegistration -> TTImp -> m TTImp
  closeFieldType registrations term@(IVar _ name) =
    if any (\entry => entry.registration.typeName == name) registrations
      then pure term else normalizedFieldType registrations term
  closeFieldType registrations term = case typeHead term of
    Right name => case find (\entry => entry.registration.typeName == name) registrations of
      -- Registered templates retain their syntax and recursively close each
      -- original argument. Normalizing the whole application would erase a
      -- named alias such as FirstPart in List FirstPart or Maybe FirstPart.
      Just entry => if entry.info.arty > 0
        then closeFieldApplications registrations term
        else normalizedFieldType registrations term
      Nothing => normalizedFieldType registrations term
    Left _ => normalizedFieldType registrations term

  closeFieldApplications : Elaboration m => List ReflectedRegistration -> TTImp -> m TTImp
  closeFieldApplications registrations (IApp fc head value) =
    IApp fc <$> closeFieldApplications registrations head <*> closeFieldType registrations value
  closeFieldApplications registrations (INamedApp fc head name value) =
    INamedApp fc <$> closeFieldApplications registrations head <*> pure name <*> closeFieldType registrations value
  closeFieldApplications _ term@(IVar _ _) = pure term
  closeFieldApplications _ term = fail ("Wire graph: unsupported template application: " ++ show term)

||| Rewrite concrete field references before the existing graph and codec
||| generators consume this metadata. Constructor names and field order remain
||| those obtained from the original record declaration.
export
closeRegistration : Elaboration m => List ReflectedRegistration -> ReflectedRegistration -> m TypeInfo
closeRegistration registrations entry = case plainRecordBinding entry.registration.binding of
  RecordBinding _ => do
    [con] <- pure entry.info.cons | _ => fail "Wire graph: record binding requires one constructor"
    fields <- traverse (\arg => do
      closed <- closeFieldType registrations arg.type
      pure ({ type := closed } arg)) (toList con.args)
    pure (MkTypeInfo entry.info.name 0 [] [] [MkCon con.name (length fields) (Vect.fromList fields) []])
  NullableBinding _ _ => if entry.info.arty == 0
    then do
      constructors <- traverse (\con => do
        arguments <- traverse (\arg => do
          closed <- closeFieldType registrations arg.type
          pure ({ type := closed } arg)) (toList con.args)
        pure (the (Con 0 []) (MkCon con.name (length arguments) (Vect.fromList arguments) []))) entry.info.cons
      pure (MkTypeInfo entry.info.name 0 [] [] constructors)
    else pure entry.info
  UntaggedBinding ExactlyOne => if entry.info.arty == 0
    then do
      constructors <- traverse (\con => do
        arguments <- traverse (\arg => do
          closed <- closeFieldType registrations arg.type
          pure ({ type := closed } arg)) (toList con.args)
        pure (the (Con 0 []) (MkCon con.name (length arguments) (Vect.fromList arguments) []))) entry.info.cons
      pure (MkTypeInfo entry.info.name 0 [] [] constructors)
    else pure entry.info
  _ => pure entry.info

-- Check the entire generic constructor contract: one erased type parameter,
-- one nullary arm, one arm whose sole runtime value is exactly Parameter 0.
-- This rejects impostor templates with extra fields/arms or different payloads.
checkTemplate : String -> String -> TypeInfo -> Either String (String, String)
checkTemplate empty full ti = do
  if ti.arty /= 1 then Left "Wire graph: template requires exactly one parameter" else Right ()
  p <- paramType ti (paramsOnly ti.arty)
  if length p.cons /= 2 then Left "Wire graph: template requires exactly two arms" else Right ()
  Just emptyCon <- pure (Data.List.find (\c => c.nameStr == empty) p.cons)
    | _ => Left "Wire graph: missing template empty arm"
  Just fullCon <- pure (Data.List.find (\c => c.nameStr == full) p.cons)
    | _ => Left "Wire graph: missing template value arm"
  let emptyArgs = toList emptyCon.args
      fullArgs = toList fullCon.args
  case (emptyArgs, fullArgs) of
    ([ParamArg emptyIndex (IType _)], [ParamArg fullIndex (IType _), CArg _ MW ExplicitArg (PPar index)]) =>
      if finToNat index == 0 && finToNat emptyIndex == 0 && finToNat fullIndex == 0 then Right (show emptyCon.name, show fullCon.name)
      else Left "Wire graph: template value must be its parameter"
    _ => Left "Wire graph: template constructor shape mismatch"

-- A concrete nullable has no type parameters: its sole value payload comes
-- from the real constructor, not a caller-maintained type or field schema.
checkClosedNullable : String -> String -> TypeInfo -> Either String DefinitionShape
checkClosedNullable null value ti = do
  if ti.arty /= 0 then Left "Wire graph: closed nullable cannot have parameters" else Right ()
  if null == value then Left "Wire graph: closed nullable arms must be distinct" else Right ()
  if length ti.cons /= 2 then Left "Wire graph: closed nullable requires exactly two arms" else Right ()
  Just emptyCon <- pure (Data.List.find (\c => c.nameStr == null) ti.cons)
    | _ => Left "Wire graph: missing closed nullable null arm"
  Just fullCon <- pure (Data.List.find (\c => c.nameStr == value) ti.cons)
    | _ => Left "Wire graph: missing closed nullable value arm"
  case toList emptyCon.args of
    [] => Right ()
    _ => Left "Wire graph: closed nullable null arm must be nullary"
  case toList fullCon.args of
    [MkArg MW ExplicitArg _ type] => do
      payload <- reflectTypeExpr type
      pure (ClosedNullableBody (show emptyCon.name) (show fullCon.name) payload)
    _ => Left "Wire graph: closed nullable value arm requires exactly one explicit runtime payload"

-- All source constructors are reflected; callers do not maintain an arm list.
checkUntagged : UntaggedMode -> TypeInfo -> Either String DefinitionShape
checkUntagged ExactlyOne ti = do
  if ti.arty /= 0 then Left "Wire graph: untagged binding requires a closed type" else Right ()
  if length ti.cons < 2 then Left "Wire graph: untagged binding requires at least two arms" else Right ()
  arms <- traverse (\con => case toList con.args of
    [MkArg MW ExplicitArg _ type] => do
      payload <- reflectTypeExpr type
      pure (show con.name, payload)
    _ => Left "Wire graph: untagged arm requires exactly one explicit runtime payload") ti.cons
  pure (UntaggedBody ExactlyOne arms)

-- Only the standard finite List template is supported. Its own constructor
-- recursion is checked here, never expanded as a user-type graph cycle.
checkListTemplate : TypeInfo -> Either String (String, String)
checkListTemplate ti = do
  if ti.name /= "Prelude.Basics.List"
    then Left "Wire graph: List binding requires Prelude.Basics.List" else Right ()
  if ti.arty /= 1 then Left "Wire graph: List requires exactly one parameter" else Right ()
  p <- paramType ti (paramsOnly ti.arty)
  case p.cons of
    [emptyCon, fullCon] => case (toList emptyCon.args, toList fullCon.args) of
      ([ParamArg emptyIndex (IType _)],
       [ParamArg fullIndex (IType _), CArg _ MW ExplicitArg (PPar headIndex),
        CArg _ MW ExplicitArg (PApp (PVar tailName) (PPar tailIndex))]) =>
          if tailName == ti.name && all (== 0)
            (the (List Nat) [finToNat emptyIndex, finToNat fullIndex, finToNat headIndex, finToNat tailIndex])
            then Right (show emptyCon.name, show fullCon.name)
            else Left "Wire graph: List head/tail must use its parameter"
      _ => Left "Wire graph: List constructor shape mismatch"
    _ => Left "Wire graph: List requires exactly two constructors"

checkCoverage : List (String, String) -> TypeInfo -> Either String ()
checkCoverage tags ti =
  if length tags == length ti.cons &&
     all (\c => length (filter (\tag => fst tag == c.nameStr) tags) == 1) ti.cons
    then Right () else Left "Wire graph: internal tag rules must cover every arm exactly once"

checkUpdate : String -> String -> String -> TypeInfo -> Either String (String, String, String)
checkUpdate keep replace clear ti = do
  if ti.arty /= 1 then Left "Wire graph: update template requires one parameter" else Right ()
  p <- paramType ti (paramsOnly ti.arty)
  if length p.cons /= 3 then Left "Wire graph: update template requires exactly three arms" else Right ()
  Just kc <- pure (Data.List.find (\c => c.nameStr == keep) p.cons)
    | _ => Left "Wire graph: missing update keep arm"
  Just rc <- pure (Data.List.find (\c => c.nameStr == replace) p.cons)
    | _ => Left "Wire graph: missing update replace arm"
  Just cc <- pure (Data.List.find (\c => c.nameStr == clear) p.cons)
    | _ => Left "Wire graph: missing update clear arm"
  if keep == replace || keep == clear || replace == clear
    then Left "Wire graph: update arms must be distinct" else Right ()
  case (toList kc.args, toList rc.args, toList cc.args) of
    ([ParamArg ki (IType _)], [ParamArg ri (IType _), CArg _ MW ExplicitArg (PPar vi)], [ParamArg ci (IType _)]) =>
      if all (== 0) (the (List Nat) [finToNat ki, finToNat ri, finToNat vi, finToNat ci])
        then Right (show kc.name, show rc.name, show cc.name)
        else Left "Wire graph: update payload must be its parameter"
    _ => Left "Wire graph: update constructor shape mismatch"

reflectInternal : String -> List (String, String) -> TypeInfo -> Either String DefinitionShape
reflectInternal key tags ti = do
  if ti.arty /= 0 then Left "Wire graph: generic internal tags are unsupported" else Right ()
  checkCoverage tags ti
  arms <- traverse (\con => case toList con.args of
    [] => pure (show con.name, maybe "" id (Data.List.lookup con.nameStr tags), NullaryPayload)
    [MkArg MW ExplicitArg _ type] => do
      payload <- reflectTypeExpr type
      pure (show con.name, maybe "" id (Data.List.lookup con.nameStr tags), payload)
    _ => Left "Wire graph: internal tag arm requires exactly one explicit record payload") ti.cons
  pure (InternalTagBody key arms)

numericDuplicates : List String -> Bool
numericDuplicates [] = False
numericDuplicates (name :: rest) = elem name rest || numericDuplicates rest

recordShape : RecordRules -> TypeInfo -> Either String DefinitionShape
recordShape rules ti =
  if ti.arty /= 0 then Left "Wire graph: generic records are not supported in W2a"
  else case ti.cons of
    [con] => case (dcon defaultOptions con).args of
      Fields fields =>
        if length fields /= con.arty then Left "Wire graph: implicit/erased record fields are unsupported"
        else do
          members <- traverse (reflectMember rules) (fields <>> [])
          checkRules rules (map source members)
          pure (RecordBody (show con.name) members)
      _ => Left "Wire graph: record binding requires named fields"
    _ => Left "Wire graph: record binding requires one constructor"

export
reflectDefinition : Registration -> TypeInfo -> Either String TypeDefinition
reflectDefinition registration ti = do
  -- Registration identities must be fully qualified and resolve exactly. The
  -- caller cannot attach an unrelated rule to an ambiguous short type name.
  if registration.typeName /= ti.name then Left "Wire graph: registration identity must be qualified"
    else Right ()
  shape <- case registration.binding of
    NumericRecordBinding rules bindings => do
      shape <- recordShape rules ti
      RecordBody constructor members <- pure shape
        | _ => Left "Wire graph: numeric binding requires a record"
      if numericDuplicates (map fst bindings) then Left "Wire graph: duplicate numeric field rule" else Right ()
      traverse_ (\(name, numeric) => do
        member <- maybe (Left ("Wire graph: unknown numeric field: " ++ name)) Right
          (find (\member => member.source == name) members)
        -- Reference targets are resolved later, after legacy registration
        -- closing or authoring FieldWire selection. Their spelling is not a
        -- presence/nullable contract; the selected definition body is checked
        -- by lowerNumericFields before any graph/codecs are published.
        case member.valueType of
          NaturalType => Right ()
          Reference _ _ => Right ()
          _ => Left ("Wire graph: numeric field must be Nat or checked Presence/Nullable Nat: " ++ name)
        if numeric.upper < 0 then Left "Wire graph: numeric upper must be nonnegative" else Right ()) bindings
      pure (RecordBody constructor (map (\member => case lookup member.source bindings of
        Just numeric => case member.valueType of
          NaturalType => { valueType := BoundNaturalType numeric } member
          _ => member
        Nothing => member) members))
    RecordBinding rules => recordShape rules ti
    BooleanBinding => do
      if show ti.name /= "Prelude.Basics.Bool" || ti.arty /= 0 || length ti.cons /= 2 ||
         not (all (\c => c.arty == 0) ti.cons)
        then Left "Wire graph: boolean binding requires actual Bool" else Right ()
      Just falseArm <- pure (find (\c => c.nameStr == "False") ti.cons)
        | _ => Left "Wire graph: missing False arm"
      Just trueArm <- pure (find (\c => c.nameStr == "True") ti.cons)
        | _ => Left "Wire graph: missing True arm"
      pure (BooleanBody (show falseArm.name) (show trueArm.name))
    EmptyBinding =>
      if show ti.name == "Builtin.Void" && ti.arty == 0 && null ti.cons then Right EmptyBody
        else Left "Wire graph: empty binding requires actual Void"
    EnumBinding tags => do
      if ti.arty /= 0 || not (all (\c => c.arty == 0) ti.cons)
        then Left "Wire graph: enum binding requires nullary arms" else Right ()
      if length tags /= length ti.cons ||
        not (all (\c => length (filter (\tag => fst tag == c.nameStr) tags) == 1) ti.cons)
        then Left "Wire graph: enum rules must cover every arm exactly once" else Right ()
      pure (StringEnum (map (\c => (show c.name, maybe "" id (Data.List.lookup c.nameStr tags))) ti.cons))
    SortedAssocBinding => do
      -- The named foundation type owns scalar keys, uniqueness and sorting.
      -- Its hidden representation is not treated as a wire payload record.
      if show ti.name /= "Value.StringKeySortedAssoc.StringKeySortedAssoc" || ti.arty /= 1
        then Left "Wire graph: sorted association binding requires actual StringKeySortedAssoc with one Type parameter" else Right ()
      pure SortedAssocBody
    ListBinding => do
      (empty, full) <- checkListTemplate ti
      pure (ListBody empty full)
    PresenceBinding absent present => do
      (empty, full) <- checkTemplate absent present ti
      pure (PresenceBody empty full)
    NullableBinding null value => do
      if ti.arty == 0 then checkClosedNullable null value ti else do
        (empty, full) <- checkTemplate null value ti
        pure (NullableBody empty full)
    UpdateBinding keep replace clear => do
      (k, r, c) <- checkUpdate keep replace clear ti
      pure (UpdateBody k r c)
    AbsentNullBinding absent null => do
      if ti.arty /= 0 || length ti.cons /= 2 || not (all (\c => c.arty == 0) ti.cons)
        then Left "Wire graph: absent/null binding requires exactly two nullary arms" else Right ()
      if absent == null then Left "Wire graph: absent/null arms must be distinct" else Right ()
      Just ac <- pure (Data.List.find (\c => c.nameStr == absent) ti.cons)
        | _ => Left "Wire graph: missing absent arm"
      Just nc <- pure (Data.List.find (\c => c.nameStr == null) ti.cons)
        | _ => Left "Wire graph: missing null arm"
      pure (AbsentNullBody (show ac.name) (show nc.name))
    UntaggedBinding mode => checkUntagged mode ti
    InternalTagBinding key tags => reflectInternal key tags ti
    ScalarBinding _ _ =>
      if ti.arty == 0 then Right ScalarBody else Left "Wire graph: scalar binding cannot have parameters"
    FiniteBinary64Binding policy _ _ =>
      if ti.arty == 0 then Right (FiniteBinary64Body policy)
        else Left "Wire graph: finite binary64 binding cannot have parameters"
  pure (Definition (show ti.name) registration.exportName ti.arty shape)

-- Lower only an occurrence's actual Type expression. Wrapper declarations
-- carry a checked unary body, so traversing their single actual argument is
-- structural: no alias/record/schema expansion, fuel, or visited-name cutoff.
-- Repeated finite applications of one template remain distinct occurrences.
-- Dependency DAG cycles are rejected by collectWireMetadata/checkGraph, not
-- mistaken for repetition of a wrapper name in a finite source expression.
lowerNumericType : List TypeDefinition -> String -> NumericBinding -> TypeExpr -> Either String TypeExpr
lowerNumericType _ _ rules NaturalType = Right (BoundNaturalType rules)
lowerNumericType _ _ rules (BoundNaturalType _) = Right (BoundNaturalType rules)
lowerNumericType definitions field rules (Reference name [inner]) = do
  definition <- lookupDefinition definitions name
  let wrapper = case definition.body of
        PresenceBody _ _ => True
        NullableBody _ _ => True
        _ => False
  if not wrapper then Left ("Wire graph: numeric field must be Nat or checked Presence/Nullable Nat: " ++ field) else Right ()
  if definition.parameterCount /= 1 then Left ("Wire graph: numeric wrapper requires one parameter: " ++ name) else Right ()
  lowered <- lowerNumericType definitions field rules inner
  pure (Reference name [lowered])
lowerNumericType definitions field _ (Reference name _) = do
  -- Preserve a missing dependency diagnostic even for a malformed application.
  definition <- lookupDefinition definitions name
  case definition.body of
    PresenceBody _ _ => Left ("Wire graph: numeric wrapper requires one argument: " ++ name ++ " in field " ++ field)
    NullableBody _ _ => Left ("Wire graph: numeric wrapper requires one argument: " ++ name ++ " in field " ++ field)
    _ => Left ("Wire graph: numeric field must be Nat or checked Presence/Nullable Nat: " ++ field)
lowerNumericType _ field _ _ = Left ("Wire graph: numeric field must be Nat or checked Presence/Nullable Nat: " ++ field)

||| Attach an explicit numeric rule to this record occurrence after its actual
||| dependency identities have been selected. Shared definitions and source
||| provenance are not rewritten; only the selected Nat leaf becomes bounded.
||| Both authoring and the legacy registry call this before graph/codegen checks.
export
lowerNumericFields : List TypeDefinition -> Registration -> TypeDefinition -> Either String TypeDefinition
lowerNumericFields definitions registration own = case registration.binding of
  NumericRecordBinding _ bindings => do
    RecordBody constructor fields <- pure own.body
      | _ => Left "Wire graph: numeric binding requires a record"
    if own.parameterCount /= 0 then Left "Wire graph: numeric binding requires a closed record" else Right ()
    if numericDuplicates (map fst bindings) then Left "Wire graph: duplicate numeric field rule" else Right ()
    traverse_ (\(name, rules) => do
      if any (\field => field.source == name) fields then Right ()
        else Left ("Wire graph: unknown numeric field: " ++ name)
      if rules.upper < 0 then Left "Wire graph: numeric upper must be nonnegative" else Right ()) bindings
    lowered <- traverse (\field => case lookup field.source bindings of
      Nothing => Right field
      Just rules => do
        value <- lowerNumericType definitions field.source rules field.valueType
        pure ({ valueType := value } field)) fields
    pure ({ body := RecordBody constructor lowered } own)
  _ => Right own

export
numericTerm : NumericBinding -> TTImp
numericTerm rules = `(BoundedNatural ~(primVal (BI rules.upper)) ExactIntegralDecimal
  ~(case rules.negativeZero of NormalizeNegativeZero => `(NormalizeNegativeZero); RejectNegativeZero => `(RejectNegativeZero))
  ~(case rules.nativeView of CanonicalOnly => `(CanonicalOnly); SafeIntegerNumber => `(SafeIntegerNumber)))

mutual
  exprTerm : TypeExpr -> TTImp
  exprTerm NullaryPayload = `(NullaryPayload)
  exprTerm NaturalType = `(NaturalType)
  exprTerm (BoundNaturalType rules) = `(BoundNaturalType ~(numericTerm rules))
  exprTerm StringType = `(JSON.Wire.Description.StringType)
  exprTerm (Integer64Type Signed64) = `(Integer64Type Signed64)
  exprTerm (Integer64Type Unsigned64) = `(Integer64Type Unsigned64)
  exprTerm (Parameter index) = `(Parameter (Prelude.fromInteger ~(primVal (BI (cast index)))))
  exprTerm (Reference name arguments) = `(Reference ~(primVal (Str name)) ~(listOf (expressionTerms arguments)))

  expressionTerms : List TypeExpr -> List TTImp
  expressionTerms [] = []
  expressionTerms (x :: xs) = exprTerm x :: expressionTerms xs

graphFieldTerm : GraphField -> TTImp
graphFieldTerm field = `(GraphMember ~(primVal (Str field.source)) ~(primVal (Str field.key)) ~(exprTerm field.valueType))

definitionShapeTerm : DefinitionShape -> TTImp
definitionShapeTerm (RecordBody constructor fields) = `(RecordBody ~(primVal (Str constructor)) ~(listOf (map graphFieldTerm fields)))
definitionShapeTerm (StringEnum tags) = `(StringEnum ~(listOf (map (\(ctor, tag) => `(MkPair ~(primVal (Str ctor)) ~(primVal (Str tag)))) tags)))
definitionShapeTerm (BooleanBody false true) = `(BooleanBody ~(primVal (Str false)) ~(primVal (Str true)))
definitionShapeTerm EmptyBody = `(EmptyBody)
definitionShapeTerm SortedAssocBody = `(SortedAssocBody)
definitionShapeTerm (ListBody empty full) = `(ListBody ~(primVal (Str empty)) ~(primVal (Str full)))
definitionShapeTerm (PresenceBody empty full) = `(PresenceBody ~(primVal (Str empty)) ~(primVal (Str full)))
definitionShapeTerm (NullableBody empty full) = `(NullableBody ~(primVal (Str empty)) ~(primVal (Str full)))
definitionShapeTerm (ClosedNullableBody empty full payload) =
  `(ClosedNullableBody ~(primVal (Str empty)) ~(primVal (Str full)) ~(exprTerm payload))
definitionShapeTerm (UpdateBody keep replace clear) = `(UpdateBody ~(primVal (Str keep)) ~(primVal (Str replace)) ~(primVal (Str clear)))
definitionShapeTerm (AbsentNullBody absent null) = `(AbsentNullBody ~(primVal (Str absent)) ~(primVal (Str null)))
definitionShapeTerm (InternalTagBody key arms) = `(InternalTagBody ~(primVal (Str key))
  ~(listOf (map (\(ctor, tag, payload) => `(MkPair ~(primVal (Str ctor)) (MkPair ~(primVal (Str tag)) ~(exprTerm payload)))) arms)))
definitionShapeTerm (UntaggedBody ExactlyOne arms) = `(UntaggedBody ExactlyOne
  ~(listOf (map (\(ctor, payload) => `(MkPair ~(primVal (Str ctor)) ~(exprTerm payload))) arms)))
definitionShapeTerm ScalarBody = `(ScalarBody)
definitionShapeTerm (FiniteBinary64Body ECMAScriptBinary64) = `(FiniteBinary64Body ECMAScriptBinary64)

export
typeDefinitionTerm : TypeDefinition -> TTImp
typeDefinitionTerm d = `(Definition ~(primVal (Str d.identity)) ~(primVal (Str d.tsName))
  (Prelude.fromInteger ~(primVal (BI (cast d.parameterCount)))) ~(definitionShapeTerm d.body))

export
rootRuleTerm : RootRule -> TTImp
rootRuleTerm Component = `(Component)
rootRuleTerm (FixedTag key value) = `(FixedTag ~(primVal (Str key)) ~(primVal (Str value)))

export
graphTerm : GraphDescription -> TTImp
graphTerm graph = `(Graph ~(primVal (Str graph.root)) ~(rootRuleTerm graph.rootRule)
  ~(listOf (map typeDefinitionTerm graph.definitions)))

sourceOriginTerm : SourceOrigin -> TTImp
sourceOriginTerm origin = `(SourceProvenance ~(primVal (Str origin.sourceAlias))
  ~(exprTerm origin.sourceApplication) ~(primVal (Str origin.sourceApplicationKey)))

referenceOriginTerm : ReferenceOrigin -> TTImp
referenceOriginTerm origin = `(ReferenceProvenance
  ~(listOf (map (\index => `(Prelude.fromInteger ~(primVal (BI (cast index))))) origin.referencePath))
  ~(exprTerm origin.originalReference) ~(exprTerm origin.normalizedReference)
  ~(primVal (Str origin.referenceApplicationKey)) ~(primVal (Str origin.selectedWireIdentity)))

fieldOriginTerm : FieldOrigin -> TTImp
fieldOriginTerm origin = `(FieldProvenance ~(primVal (Str origin.fieldSource))
  ~(exprTerm origin.fieldOriginalType) ~(listOf (map referenceOriginTerm origin.fieldReferences)))

armOriginTerm : ArmOrigin -> TTImp
armOriginTerm origin = `(ArmProvenance ~(primVal (Str origin.armSource))
  ~(exprTerm origin.armOriginalType) ~(listOf (map referenceOriginTerm origin.armReferences)))

export
definitionOriginTerm : DefinitionOrigin -> TTImp
definitionOriginTerm origin = `(DefinitionProvenance ~(primVal (Str origin.originWireIdentity))
  ~(sourceOriginTerm origin.originSource) ~(listOf (map fieldOriginTerm origin.originFields))
  ~(listOf (map armOriginTerm origin.originArms)))

export
originsTerm : List DefinitionOrigin -> TTImp
originsTerm = listOf . map definitionOriginTerm

nameTerm : Name -> TTImp
nameTerm name = `(fromString ~(primVal (Str (show name))))

pairTerm : (String, String) -> TTImp
pairTerm (left, right) = `(MkPair ~(primVal (Str left)) ~(primVal (Str right)))

bindingTerm : Binding -> TTImp
bindingTerm (RecordBinding rules) = `(RecordBinding (StrictRecord ~(listOf (map pairTerm rules.renames))))
bindingTerm (NumericRecordBinding rules numbers) = `(NumericRecordBinding
  (StrictRecord ~(listOf (map pairTerm rules.renames)))
  ~(listOf (map (\(source, numeric) => `(MkPair ~(primVal (Str source)) ~(numericTerm numeric))) numbers)))
bindingTerm (EnumBinding tags) = `(EnumBinding ~(listOf (map pairTerm tags)))
bindingTerm (UntaggedBinding ExactlyOne) = `(UntaggedBinding ExactlyOne)
bindingTerm BooleanBinding = `(BooleanBinding)
bindingTerm EmptyBinding = `(EmptyBinding)
bindingTerm ListBinding = `(ListBinding)
bindingTerm SortedAssocBinding = `(SortedAssocBinding)
bindingTerm (PresenceBinding absent present) = `(PresenceBinding ~(primVal (Str absent)) ~(primVal (Str present)))
bindingTerm (NullableBinding null value) = `(NullableBinding ~(primVal (Str null)) ~(primVal (Str value)))
bindingTerm (UpdateBinding keep replace clear) = `(UpdateBinding ~(primVal (Str keep)) ~(primVal (Str replace)) ~(primVal (Str clear)))
bindingTerm (AbsentNullBinding absent null) = `(AbsentNullBinding ~(primVal (Str absent)) ~(primVal (Str null)))
bindingTerm (InternalTagBinding key tags) = `(InternalTagBinding ~(primVal (Str key)) ~(listOf (map pairTerm tags)))
bindingTerm (ScalarBinding project validate) = `(ScalarBinding ~(nameTerm project) ~(nameTerm validate))
bindingTerm (FiniteBinary64Binding ECMAScriptBinary64 project validate) =
  `(FiniteBinary64Binding ECMAScriptBinary64 ~(nameTerm project) ~(nameTerm validate))

registrationTerm : Registration -> TTImp
registrationTerm registration = `(Register ~(nameTerm registration.typeName)
  ~(primVal (Str registration.exportName)) ~(bindingTerm registration.binding))

mutual
  ||| Reify pure published data explicitly; never quote a typed codec closure.
  export
  wireMetadataTerm : WireMetadata -> TTImp
  wireMetadataTerm (WireDescriptor name origin registration definition dependencies) =
    `(WireDescriptor ~(nameTerm name) ~(definitionOriginTerm origin)
      ~(registrationTerm registration) ~(typeDefinitionTerm definition)
      ~(listOf (wireMetadataTerms dependencies)))

  wireMetadataTerms : List WireMetadata -> List TTImp
  wireMetadataTerms [] = []
  wireMetadataTerms (metadata :: rest) = wireMetadataTerm metadata :: wireMetadataTerms rest
