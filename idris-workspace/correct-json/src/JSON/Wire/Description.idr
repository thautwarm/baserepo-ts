module JSON.Wire.Description

import Data.List
import Data.String
import Value.Unicode

%default total

||| W1 only: both kinds are required, non-null fields. Natural accepts only
||| integer literals and uses arbitrary-precision values, not host Number.
public export
data FieldKind = Natural | Text

public export
record WireField where
  constructor MkWireField
  sourceName : String
  wireName : String
  kind : FieldKind

public export
record RecordDescription where
  constructor MkRecordDescription
  typeId : String
  exportName : String
  fields : List WireField

||| Rules add names only; field membership and types come from reflection.
public export
record RecordRules where
  constructor StrictRecord
  renames : List (String, String)

export
data CheckedRecord = Checked RecordDescription

export
description : CheckedRecord -> RecordDescription
description (Checked d) = d

duplicates : List String -> Bool
duplicates [] = False
duplicates (x :: xs) = elem x xs || duplicates xs

tsIdentifier : String -> Bool
tsIdentifier s = case unpack s of
  [] => False
  c :: cs => (isAlpha c || c == '_') && all (\x => isAlphaNum x || x == '_') cs

||| Object keys inhabit ScalarString; ordinary JSON string VALUES do not.
export
checkWireObjectKey : String -> Either String ()
checkWireObjectKey key = case scalarString key of
  Left IsolatedSurrogate => Left "Wire: isolated surrogate object key"
  Right _ => Right ()

||| This is an abstract checked structural description, not a semantic proof.
export
checkRecord : RecordDescription -> Either String CheckedRecord
checkRecord d =
  if d.typeId == "" then Left "Wire: empty type identity"
  else if not (tsIdentifier d.exportName) then Left "Wire: unsupported TS export name"
  else if null d.fields then Left "Wire: empty records are not supported in W1"
  else if duplicates (map sourceName d.fields) then Left "Wire: duplicate source field"
  else if duplicates (map wireName d.fields) then Left "Wire: duplicate wire field name"
  else do
    traverse_ (checkWireObjectKey . wireName) d.fields
    Right (Checked d)

export
renameFor : RecordRules -> String -> String
renameFor rules name = maybe name id (lookup name rules.renames)

export
checkRules : RecordRules -> List String -> Either String ()
checkRules rules names =
  if duplicates (map fst rules.renames) then Left "Wire: duplicate rename rule"
  else case find (\name => not (elem name names)) (map fst rules.renames) of
    Just name => Left ("Wire: rename rule references unknown field: " ++ name)
    Nothing => traverse_ (checkWireObjectKey . snd) rules.renames


||| Graph references use qualified Idris identities. Parameters are positional;
||| W2 only instantiates explicitly checked field/value templates.
public export
data NaturalInterpretation = ExactIntegralDecimal

public export
data NegativeZeroPolicy = NormalizeNegativeZero | RejectNegativeZero

public export
data NativeNumericView = CanonicalOnly | SafeIntegerNumber

||| Exact decimal interpretation is independent of host Number rounding.
||| Upper is an explicit semantic bound, never a token/resource budget.
public export
record NumericBinding where
  constructor BoundedNatural
  upper : Integer
  interpretation : NaturalInterpretation
  negativeZero : NegativeZeroPolicy
  nativeView : NativeNumericView

public export
-- Interpretation follows the first ECMAScript Number value, including its
-- rounding and signed underflow. Executable support is JavaScript-only.
data Binary64Policy = ECMAScriptBinary64

public export
data Integer64Kind = Signed64 | Unsigned64

public export
Eq Integer64Kind where
  Signed64 == Signed64 = True
  Unsigned64 == Unsigned64 = True
  _ == _ = False

public export
-- NullaryPayload is an internal-tag arm marker, never an Idris source type
-- or a standalone field/template argument. It carries no value or reference.
data TypeExpr = NaturalType | BoundNaturalType NumericBinding | Integer64Type Integer64Kind | StringType | Parameter Nat
              | Reference String (List TypeExpr) | NullaryPayload

public export
record GraphField where
  constructor GraphMember
  source : String
  key : String
  valueType : TypeExpr

||| Explicit wire policy: kind-disjoint arms have exactly one decoder.
public export
data UntaggedMode = ExactlyOne

public export
data DefinitionShape = RecordBody String (List GraphField)
                     | StringEnum (List (String, String))
                     | BooleanBody String String
                     | EmptyBody
                     | ListBody String String
                     | SortedAssocBody
                     | PresenceBody String String
                     | NullableBody String String
                     | ClosedNullableBody String String TypeExpr
                     | UntaggedBody UntaggedMode (List (String, TypeExpr))
                     | UpdateBody String String String
                     | AbsentNullBody String String
                     | InternalTagBody String (List (String, String, TypeExpr))
                     | ScalarBody
                     | FiniteBinary64Body Binary64Policy

public export
record TypeDefinition where
  constructor Definition
  identity : String
  tsName : String
  parameterCount : Nat
  body : DefinitionShape

public export
data RootRule = Component | FixedTag String String

public export
record GraphDescription where
  constructor Graph
  root : String
  rootRule : RootRule
  definitions : List TypeDefinition

||| Source identity is provenance; graph nodes may name distinct wire policies
||| for the same actual Idris type. Public aliases and full applications survive.
public export
record SourceOrigin where
  constructor SourceProvenance
  sourceAlias : String
  sourceApplication : TypeExpr
  sourceApplicationKey : String

||| Argument paths retain an explicitly named alias inside standard containers.
||| The selected wire node is separate from the original and normalized types.
public export
record ReferenceOrigin where
  constructor ReferenceProvenance
  referencePath : List Nat
  originalReference : TypeExpr
  normalizedReference : TypeExpr
  referenceApplicationKey : String
  selectedWireIdentity : String

public export
record FieldOrigin where
  constructor FieldProvenance
  fieldSource : String
  fieldOriginalType : TypeExpr
  fieldReferences : List ReferenceOrigin

public export
record ArmOrigin where
  constructor ArmProvenance
  armSource : String
  armOriginalType : TypeExpr
  armReferences : List ReferenceOrigin

public export
record DefinitionOrigin where
  constructor DefinitionProvenance
  originWireIdentity : String
  originSource : SourceOrigin
  originFields : List FieldOrigin
  originArms : List ArmOrigin

||| A finite checked expansion drives runtime traversal and host guards. The
||| source graph remains available for names, references and manifest export.
public export
data ValueShape = NaturalValue | BoundNaturalValue NumericBinding | Integer64Value Integer64Kind | StringValue | ScalarValue
                | FiniteBinary64Value Binary64Policy
                | BooleanValue | NeverValue
                | NullValue
                | ArrayValue ValueShape
                | DynamicObjectValue ValueShape
                | TaggedValue String (List (String, ValueShape))
                | UntaggedValue UntaggedMode (List (String, ValueShape))
                | EnumValue (List String)
                | NullableValue ValueShape
                | ObjectValue (List (String, Bool, ValueShape))

||| Representation kinds describe input shapes, not payload validity.
||| Numeric syntax is an object; raw JSON numbers remain numbers.
public export
data RepresentationKind = NullKind | BooleanKind | NumberKind | StringKind | ArrayKind | ObjectKind

public export
Eq RepresentationKind where
  NullKind == NullKind = True
  BooleanKind == BooleanKind = True
  NumberKind == NumberKind = True
  StringKind == StringKind = True
  ArrayKind == ArrayKind = True
  ObjectKind == ObjectKind = True
  _ == _ = False

public export
data RepresentationProfile = NativeRepresentation | CanonicalRepresentation

mutual
  export
  representationKinds : RepresentationProfile -> ValueShape -> List RepresentationKind
  representationKinds _ NullValue = [NullKind]
  representationKinds _ BooleanValue = [BooleanKind]
  representationKinds _ NeverValue = []
  representationKinds profile NaturalValue = numericKinds profile
  representationKinds profile (BoundNaturalValue _) = numericKinds profile
  representationKinds _ (Integer64Value _) = [NumberKind]
  representationKinds profile (FiniteBinary64Value _) = numericKinds profile
  representationKinds _ StringValue = [StringKind]
  representationKinds _ ScalarValue = [StringKind]
  representationKinds _ (EnumValue _) = [StringKind]
  representationKinds _ (ArrayValue _) = [ArrayKind]
  representationKinds _ (DynamicObjectValue _) = [ObjectKind]
  representationKinds _ (ObjectValue _) = [ObjectKind]
  representationKinds _ (TaggedValue _ _) = [ObjectKind]
  representationKinds profile (NullableValue child) = NullKind :: representationKinds profile child
  representationKinds profile (UntaggedValue ExactlyOne arms) = armKinds profile arms

  armKinds : RepresentationProfile -> List (String, ValueShape) -> List RepresentationKind
  armKinds _ [] = []
  armKinds profile ((_, child) :: rest) = representationKinds profile child ++ armKinds profile rest

  numericKinds : RepresentationProfile -> List RepresentationKind
  numericKinds NativeRepresentation = [NumberKind]
  numericKinds CanonicalRepresentation = [ObjectKind]

||| Checked graphs reject overlaps; dispatch also fails closed for malformed
||| manually supplied selectors. Arm order never chooses a successful decoder.
export
selectRepresentationArm : RepresentationKind -> List (String, List RepresentationKind) -> Either String String
selectRepresentationArm kind arms = case filter (\(_, kinds) => elem kind kinds) arms of
  [(name, _)] => Right name
  [] => Left "Wire graph: no matching untagged representation"
  _ => Left "Wire graph: ambiguous untagged representation"

export
selectUntaggedShape : RepresentationProfile -> RepresentationKind -> List (String, ValueShape) -> Either String ValueShape
selectUntaggedShape profile kind arms = case filter (\(_, shape) => elem kind (representationKinds profile shape)) arms of
  [(_, shape)] => Right shape
  [] => Left "Wire graph: no matching untagged representation"
  _ => Left "Wire graph: ambiguous untagged representation"
