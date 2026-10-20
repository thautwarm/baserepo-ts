module Value.Unicode

import Decidable.Equality

%default total

public export
data UnicodeError = IsolatedSurrogate

public export
scalarCharacter : Char -> Bool
scalarCharacter character =
  let point = ord character in
  point >= 0 && point <= 0x10FFFF && (point < 0xD800 || point > 0xDFFF)

public export
scalarCharacters : List Char -> Bool
scalarCharacters [] = True
scalarCharacters (character :: rest) = scalarCharacter character && scalarCharacters rest

-- The pinned JS backend's unpack uses Array.from, so astral characters are
-- individual code points while isolated surrogate code units remain visible.
public export
isScalarString : String -> Bool
isScalarString value = scalarCharacters (unpack value)

-- Constructors and validation evidence are hidden from consumers. This is a
-- v1 boundary; compatibility strings deliberately have a different domain.
export
data ScalarString : Type where
  ValidScalarString : (value : String) ->
    (0 valid : isScalarString value = True) -> ScalarString

export
scalarString : String -> Either UnicodeError ScalarString
scalarString value with (isScalarString value) proof checked
  scalarString value | True = Right (ValidScalarString value checked)
  scalarString value | False = Left IsolatedSurrogate

-- A total bridge for callers that already proved this same checker true.
-- The runtime decision and both proofs agree; the evidence remains erased.
scalarFromDecision : (value : String) -> (decision : Bool) ->
  (0 checked : isScalarString value = decision) -> (0 valid : decision = True) -> ScalarString
scalarFromDecision value True checked valid = ValidScalarString value checked
scalarFromDecision value False checked Refl impossible

export
checkedScalar : (value : String) -> (0 valid : isScalarString value = True) -> ScalarString
checkedScalar value valid = scalarFromDecision value (isScalarString value) Refl valid

export
scalarValue : ScalarString -> String
scalarValue (ValidScalarString value _) = value

-- Bool equality evidence is unique by construction; this is not an axiom of
-- proof irrelevance for arbitrary propositions.
export
0 validationEvidenceUnique : {decision : Bool} ->
  (left, right : decision = True) -> left = right
validationEvidenceUnique Refl Refl = Refl

export
0 scalarValueInjective : (left, right : ScalarString) ->
  scalarValue left = scalarValue right -> left = right
scalarValueInjective (ValidScalarString value leftValid) (ValidScalarString value rightValid) Refl =
  case validationEvidenceUnique leftValid rightValid of Refl => Refl

scalarEqualityWitness : {0 left, right : ScalarString} -> (0 same : left = right) -> left = right
scalarEqualityWitness Refl = Refl

-- Primitive String Eq/DecEq and Show retain their standard-library/runtime
-- trust boundary. These interfaces do not prove Unicode conversion or order.
export
Eq ScalarString where
  left == right = scalarValue left == scalarValue right

export
Show ScalarString where
  show value = show (scalarValue value)

export
DecEq ScalarString where
  decEq left right = case decEq (scalarValue left) (scalarValue right) of
    Yes same => Yes (scalarEqualityWitness (scalarValueInjective left right same))
    No different => No (\same => different (cong scalarValue same))

0 decisionValue : (value : String) -> (decision : Bool) ->
  (0 checked : isScalarString value = decision) -> (0 valid : decision = True) ->
  scalarValue (scalarFromDecision value decision checked valid) = value
decisionValue value True checked valid = Refl
decisionValue value False checked valid = absurd valid

export
0 checkedScalarValue : (value : String) -> (0 valid : isScalarString value = True) ->
  scalarValue (checkedScalar value valid) = value
checkedScalarValue value valid = decisionValue value (isScalarString value) Refl valid

export
0 scalarStringComplete : (value : String) -> (0 valid : isScalarString value = True) ->
  scalarString value = Right (checkedScalar value valid)
scalarStringComplete value valid with (isScalarString value) proof checked
  scalarStringComplete value valid | True = Refl
  scalarStringComplete value valid | False = absurd valid

export
0 scalarValid : (value : ScalarString) -> isScalarString (scalarValue value) = True
scalarValid (ValidScalarString value valid) = valid

-- Reuse the same checker rather than an unchecked constructor at runtime.
export
appendScalar : ScalarString -> ScalarString -> Either UnicodeError ScalarString
appendScalar left right = scalarString (scalarValue left ++ scalarValue right)

-- A constructive scalar-content domain: validated leaves and concatenation.
-- This is not a theorem about unpack on primitive String concatenation.
public export
data ScalarProvenance : String -> Type where
  ScalarLeaf : (value : ScalarString) -> ScalarProvenance (scalarValue value)
  ScalarExtension : ScalarProvenance previous -> (delta : ScalarString) ->
    ScalarProvenance (previous ++ scalarValue delta)

export
data ScalarText : Type where
  ProvenScalarText : (value : String) -> (0 provenance : ScalarProvenance value) -> ScalarText

export
scalarText : ScalarString -> ScalarText
scalarText value = ProvenScalarText (scalarValue value) (ScalarLeaf value)

export
textValue : ScalarText -> String
textValue (ProvenScalarText value _) = value

export
0 textScalarValue : (value : ScalarString) ->
  textValue (scalarText value) = scalarValue value
textScalarValue value = Refl

export
appendText : ScalarText -> ScalarString -> ScalarText
appendText (ProvenScalarText previous provenance) delta =
  ProvenScalarText (previous ++ scalarValue delta) (ScalarExtension provenance delta)

export
textAppendValue : (previous : ScalarText) -> (delta : ScalarString) ->
  textValue (appendText previous delta) = textValue previous ++ scalarValue delta
textAppendValue (ProvenScalarText previous _) delta = Refl

export
0 textProvenance : (value : ScalarText) -> ScalarProvenance (textValue value)
textProvenance (ProvenScalarText value provenance) = provenance
