module JSON.Wire.Derive

import public JSON.Derive
import public JSON.Wire.Codec
import public JSON.Wire.Reflection
import public JSON.Wire.Codegen
import public JSON.Wire.Authoring

%language ElabReflection
%default total

||| One reflection/check result drives both legacy codec generators and the
||| new checked codec descriptor. No second field schema is accepted.
export
deriveWire : RecordRules -> List Name -> ParamTypeInfo -> Res (List TopLevel)
deriveWire rules names p = do
  checked <- reflectRecord rules p
  encoded <- customToJSON (codecOptions checked) names p
  decoded <- customFromJSON (codecOptions checked) names p
  let codecName = funName p "wireCodec"
      codecType = `(Either String (WireCodec ~(p.applied)))
      codecValue = `(trustedDerivedCodec ~(descriptionTerm checked)
        ~(var (funName p "toJson")) ~(var (funName p "fromJson")))
  pure (encoded ++ decoded ++
    [TL (public' codecName codecType) (def codecName [patClause (var codecName) codecValue])])


||| Reflection is performed once for the entire registry. The checked graph
||| drives codec generation and is embedded unchanged in every root factory.
duplicateIdentities : List Name -> Bool
duplicateIdentities [] = False
duplicateIdentities (name :: rest) = elem name rest || duplicateIdentities rest

export
deriveWireGraph : Elaboration m => List Registration -> List RootRegistration -> m ()
deriveWireGraph registrations roots = do
  if null roots then fail "Wire graph: at least one root is required" else pure ()
  reflected <- traverse reflectRegistration registrations
  -- Repeated public registrations are a registry error, not two distinct
  -- aliases of one closed application. Each binding is checked first, then
  -- duplicates are rejected before resolving references between fields.
  if duplicateIdentities (map typeName registrations)
    then fail "Wire graph: duplicate registry identity" else pure ()
  infos <- traverse (closeRegistration reflected) reflected
  Right reflectedDefinitions <- pure (sequence (zipWith reflectDefinition registrations infos))
    | Left error => fail error
  -- All actual wrapper identities are now known. Attach each record's rules
  -- locally, using the same lowering as authoring after dependency selection.
  Right definitions <- pure (sequence (zipWith (lowerNumericFields reflectedDefinitions) registrations reflectedDefinitions))
    | Left error => fail error
  checkedRoots <- traverse (\root => do
    let graph = Graph (show root.typeName) root.rule definitions
    Right checked <- pure (checkGraph graph) | Left error => fail error
    Just info <- pure (find (\info => info.name == root.typeName) infos)
      | Nothing => fail ("Wire graph: missing registry definition: " ++ show root.typeName)
    pure (checked, info)) roots
  Right generated <- pure (sequence (zipWith (generateDefinition definitions) registrations infos))
    | Left error => fail error
  Right rootCode <- pure (traverse (\(checked, info) => generateRoot checked info) checkedRoots)
    | Left error => fail error
  let allCode = concat generated ++ rootCode
  declare (map claim allCode ++ map defn allCode)
