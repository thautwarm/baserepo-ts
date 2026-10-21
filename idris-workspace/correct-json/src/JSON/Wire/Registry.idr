module JSON.Wire.Registry

import public JSON.Wire.Description
import public Language.Reflection.Util

%default total

||| These are wire rules/bindings, never an independent list of fields/types.
||| Update and absent/null are field-context contracts, not generic value sums.
||| Internal tags flatten one reflected record payload per registered arm.
public export
data Binding = RecordBinding RecordRules
             | NumericRecordBinding RecordRules (List (String, NumericBinding))
             | EnumBinding (List (String, String))
             | BooleanBinding
             | EmptyBinding
             | ListBinding
             | SortedAssocBinding
             | PresenceBinding String String
             | NullableBinding String String
             | UpdateBinding String String String
             | AbsentNullBinding String String
             | InternalTagBinding String (List (String, String))
             | UntaggedBinding UntaggedMode
             | ScalarBinding Name Name
             | FiniteBinary64Binding Binary64Policy Name Name

public export
record Registration where
  constructor Register
  typeName : Name
  exportName : String
  binding : Binding

public export
record RootRegistration where
  constructor Root
  typeName : Name
  rule : RootRule

public export
data NamingStrategy = PreserveNames | SnakeCase

||| Author options lower to existing checked bindings. They never list fields.
public export
data WireOption = FieldNames NamingStrategy
                | FieldName String String
                | NumericField String NumericBinding
                | TagField String
                | VariantTag String String
                | WireName Name
                | ExportName String
                | UseWire Name
                | FieldWire String Name
                | WireBinding Binding

public export
data RootOption = RootName String

||| Persisted pure data, published beside a typed wire value. Dependencies are
||| a finite declared DAG; collection checks repeated wire identities/config.
||| Own fields and constructors are the one existing reflected description.
public export
record WireMetadata where
  constructor WireDescriptor
  metadataWireName : Name
  metadataOrigin : DefinitionOrigin
  metadataRegistration : Registration
  metadataDefinition : TypeDefinition
  metadataDependencies : List WireMetadata

sameNumeric : NumericBinding -> NumericBinding -> Bool
sameNumeric left right = left.upper == right.upper &&
  (case (left.negativeZero, right.negativeZero) of
    (NormalizeNegativeZero, NormalizeNegativeZero) => True
    (RejectNegativeZero, RejectNegativeZero) => True
    _ => False) &&
  (case (left.nativeView, right.nativeView) of
    (CanonicalOnly, CanonicalOnly) => True
    (SafeIntegerNumber, SafeIntegerNumber) => True
    _ => False)

mutual
  export
  sameTypeExpression : TypeExpr -> TypeExpr -> Bool
  sameTypeExpression NullaryPayload NullaryPayload = True
  sameTypeExpression NaturalType NaturalType = True
  sameTypeExpression (Integer64Type left) (Integer64Type right) = left == right
  sameTypeExpression (BoundNaturalType left) (BoundNaturalType right) = sameNumeric left right
  sameTypeExpression StringType StringType = True
  sameTypeExpression (Parameter left) (Parameter right) = left == right
  sameTypeExpression (Reference left args) (Reference right values) = left == right && sameExpressions args values
  sameTypeExpression _ _ = False

  sameExpressions : List TypeExpr -> List TypeExpr -> Bool
  sameExpressions [] [] = True
  sameExpressions (left :: rest) (right :: values) = sameTypeExpression left right && sameExpressions rest values
  sameExpressions _ _ = False

sameList : (a -> a -> Bool) -> List a -> List a -> Bool
sameList _ [] [] = True
sameList compare (left :: rest) (right :: values) = compare left right && sameList compare rest values
sameList _ _ _ = False

sameBinding : Binding -> Binding -> Bool
sameBinding (RecordBinding left) (RecordBinding right) = left.renames == right.renames
sameBinding (NumericRecordBinding left numbers) (NumericRecordBinding right values) =
  left.renames == right.renames && sameList (\(field, rules), (other, numeric) => field == other && sameNumeric rules numeric) numbers values
sameBinding (EnumBinding left) (EnumBinding right) = left == right
sameBinding (UntaggedBinding ExactlyOne) (UntaggedBinding ExactlyOne) = True
sameBinding BooleanBinding BooleanBinding = True
sameBinding EmptyBinding EmptyBinding = True
sameBinding ListBinding ListBinding = True
sameBinding SortedAssocBinding SortedAssocBinding = True
sameBinding (PresenceBinding a b) (PresenceBinding c d) = a == c && b == d
sameBinding (NullableBinding a b) (NullableBinding c d) = a == c && b == d
sameBinding (UpdateBinding a b c) (UpdateBinding d e f) = a == d && b == e && c == f
sameBinding (AbsentNullBinding a b) (AbsentNullBinding c d) = a == c && b == d
sameBinding (InternalTagBinding a tags) (InternalTagBinding b values) = a == b && tags == values
sameBinding (ScalarBinding a b) (ScalarBinding c d) = a == c && b == d
sameBinding (FiniteBinary64Binding ECMAScriptBinary64 a b) (FiniteBinary64Binding ECMAScriptBinary64 c d) = a == c && b == d
sameBinding _ _ = False

sameBody : DefinitionShape -> DefinitionShape -> Bool
sameBody (RecordBody a fields) (RecordBody b values) = a == b && sameList
  (\left, right => left.source == right.source && left.key == right.key && sameTypeExpression left.valueType right.valueType) fields values
sameBody (StringEnum a) (StringEnum b) = a == b
sameBody (BooleanBody a b) (BooleanBody c d) = a == c && b == d
sameBody EmptyBody EmptyBody = True
sameBody (ListBody a b) (ListBody c d) = a == c && b == d
sameBody SortedAssocBody SortedAssocBody = True
sameBody (PresenceBody a b) (PresenceBody c d) = a == c && b == d
sameBody (NullableBody a b) (NullableBody c d) = a == c && b == d
sameBody (ClosedNullableBody a b payload) (ClosedNullableBody c d value) =
  a == c && b == d && sameTypeExpression payload value
sameBody (UpdateBody a b c) (UpdateBody d e f) = a == d && b == e && c == f
sameBody (AbsentNullBody a b) (AbsentNullBody c d) = a == c && b == d
sameBody (InternalTagBody a arms) (InternalTagBody b values) = a == b && sameList
  (\(ctor, tag, type), (other, value, payload) => ctor == other && tag == value && sameTypeExpression type payload) arms values
sameBody (UntaggedBody ExactlyOne arms) (UntaggedBody ExactlyOne values) = sameList
  (\(ctor, payload), (other, value) => ctor == other && sameTypeExpression payload value) arms values
sameBody ScalarBody ScalarBody = True
sameBody (FiniteBinary64Body ECMAScriptBinary64) (FiniteBinary64Body ECMAScriptBinary64) = True
sameBody _ _ = False

sameReferenceOrigin : ReferenceOrigin -> ReferenceOrigin -> Bool
sameReferenceOrigin left right = left.referencePath == right.referencePath &&
  sameTypeExpression left.originalReference right.originalReference &&
  sameTypeExpression left.normalizedReference right.normalizedReference &&
  left.referenceApplicationKey == right.referenceApplicationKey && left.selectedWireIdentity == right.selectedWireIdentity

sameOrigin : DefinitionOrigin -> DefinitionOrigin -> Bool
sameOrigin left right = left.originWireIdentity == right.originWireIdentity &&
  left.originSource.sourceAlias == right.originSource.sourceAlias &&
  sameTypeExpression left.originSource.sourceApplication right.originSource.sourceApplication &&
  left.originSource.sourceApplicationKey == right.originSource.sourceApplicationKey &&
  sameList (\a, b => a.fieldSource == b.fieldSource && sameTypeExpression a.fieldOriginalType b.fieldOriginalType &&
    sameList sameReferenceOrigin a.fieldReferences b.fieldReferences) left.originFields right.originFields &&
  sameList (\a, b => a.armSource == b.armSource && sameTypeExpression a.armOriginalType b.armOriginalType &&
    sameList sameReferenceOrigin a.armReferences b.armReferences) left.originArms right.originArms

||| Compare the complete normalized node, including selected dependency IDs.
||| Closure collection also visits every occurrence's children before dedup.
export
sameMetadataNode : WireMetadata -> WireMetadata -> Bool
sameMetadataNode left right = left.metadataWireName == right.metadataWireName &&
  sameOrigin left.metadataOrigin right.metadataOrigin &&
  left.metadataRegistration.typeName == right.metadataRegistration.typeName &&
  left.metadataRegistration.exportName == right.metadataRegistration.exportName &&
  sameBinding left.metadataRegistration.binding right.metadataRegistration.binding &&
  left.metadataDefinition.identity == right.metadataDefinition.identity &&
  left.metadataDefinition.tsName == right.metadataDefinition.tsName &&
  left.metadataDefinition.parameterCount == right.metadataDefinition.parameterCount &&
  sameBody left.metadataDefinition.body right.metadataDefinition.body &&
  map metadataWireName left.metadataDependencies == map metadataWireName right.metadataDependencies
