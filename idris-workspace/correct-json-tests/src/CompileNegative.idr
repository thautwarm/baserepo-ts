module CompileNegative

import JSON.Derive

%language ElabReflection
%default total

options : Options
options = { sum := InternallyTagged "tag" } defaultOptions

encodeInternal : List Name -> ParamTypeInfo -> Res (List TopLevel)
encodeInternal = customToJSON options

decodeInternal : List Name -> ParamTypeInfo -> Res (List TopLevel)
decodeInternal = customFromJSON options

data Positional = Pos Nat | Nil

failing "InternallyTagged requires named fields or a nullary constructor"
  %runElab derive "Positional" [encodeInternal]

failing "InternallyTagged requires named fields or a nullary constructor"
  %runElab derive "Positional" [decodeInternal]

data Conflict : Type where
  Tagged : (tag : Nat) -> Conflict
  Empty : Conflict

failing "InternallyTagged tag field conflicts with constructor field"
  %runElab derive "Conflict" [encodeInternal]

failing "InternallyTagged tag field conflicts with constructor field"
  %runElab derive "Conflict" [decodeInternal]

data DuplicateTags = First | Second

encodeDuplicateTags : List Name -> ParamTypeInfo -> Res (List TopLevel)
encodeDuplicateTags = customToJSON ({ constructorTagModifier := const "same" } options)

decodeDuplicateTags : List Name -> ParamTypeInfo -> Res (List TopLevel)
decodeDuplicateTags = customFromJSON ({ constructorTagModifier := const "same" } options)

failing "InternallyTagged has duplicate modified constructor tags"
  %runElab derive "DuplicateTags" [encodeDuplicateTags]

failing "InternallyTagged has duplicate modified constructor tags"
  %runElab derive "DuplicateTags" [decodeDuplicateTags]

data DuplicateFields : Type where
  Pair : (left : Nat) -> (right : Nat) -> DuplicateFields
  Missing : DuplicateFields

encodeDuplicateFields : List Name -> ParamTypeInfo -> Res (List TopLevel)
encodeDuplicateFields = customToJSON ({ fieldNameModifier := const "same" } options)

decodeDuplicateFields : List Name -> ParamTypeInfo -> Res (List TopLevel)
decodeDuplicateFields = customFromJSON ({ fieldNameModifier := const "same" } options)

failing "InternallyTagged has duplicate modified field names"
  %runElab derive "DuplicateFields" [encodeDuplicateFields]

failing "InternallyTagged has duplicate modified field names"
  %runElab derive "DuplicateFields" [decodeDuplicateFields]

encodeRenamedConflict : List Name -> ParamTypeInfo -> Res (List TopLevel)
encodeRenamedConflict = customToJSON ({ fieldNameModifier := const "tag" } options)

decodeRenamedConflict : List Name -> ParamTypeInfo -> Res (List TopLevel)
decodeRenamedConflict = customFromJSON ({ fieldNameModifier := const "tag" } options)

failing "InternallyTagged tag field conflicts with constructor field"
  %runElab derive "DuplicateFields" [encodeRenamedConflict]

failing "InternallyTagged tag field conflicts with constructor field"
  %runElab derive "DuplicateFields" [decodeRenamedConflict]

data Mixed : Type where
  MixedArm : (named : Nat) -> Nat -> Mixed
  NoFields : Mixed

failing "InternallyTagged requires named fields or a nullary constructor"
  %runElab derive "Mixed" [encodeInternal]

failing "InternallyTagged requires named fields or a nullary constructor"
  %runElab derive "Mixed" [decodeInternal]

data SinglePositional = Single Nat

encodeSingle : List Name -> ParamTypeInfo -> Res (List TopLevel)
encodeSingle = customToJSON ({ unwrapRecords := False } options)

decodeSingle : List Name -> ParamTypeInfo -> Res (List TopLevel)
decodeSingle = customFromJSON ({ unwrapRecords := False } options)

failing "InternallyTagged requires named fields or a nullary constructor"
  %runElab derive "SinglePositional" [encodeSingle]

failing "InternallyTagged requires named fields or a nullary constructor"
  %runElab derive "SinglePositional" [decodeSingle]
