module Value.StringKeySortedAssoc

import public Value.Unicode.Order
import public Data.List.Elem
import Decidable.Equality

%default total

public export
Binding : Type -> Type
Binding value = (ScalarString, value)

public export
bindingCodes : Binding a -> List Nat
bindingCodes binding = keyCodes (fst binding)

-- Equality of actual bindings, not an Eq instance, JSON encoding, or success
-- of a codec. No equality/decidable-equality interface is required for a.
public export
record SameMapping (left, right : List (Binding a)) where
  constructor SameBindings
  0 forward : {0 binding : Binding a} -> Elem binding left -> Elem binding right
  0 backward : {0 binding : Binding a} -> Elem binding right -> Elem binding left

public export
0 mappingReflexive : {0 contents : List (Binding a)} -> SameMapping contents contents
mappingReflexive = SameBindings id id

public export
0 mappingTarget : {0 source, left, right : List (Binding a)} ->
  SameMapping source left -> left = right -> SameMapping source right
mappingTarget same Refl = same

public export
0 mappingTransitive : SameMapping first second -> SameMapping second third -> SameMapping first third
mappingTransitive first second = SameBindings
  (\member => second.forward (first.forward member))
  (\member => first.backward (second.backward member))

public export
0 mappingCons : (0 leading : Binding a) -> SameMapping left right -> SameMapping (leading :: left) (leading :: right)
mappingCons leading same = SameBindings toRight toLeft
  where
    toRight : {0 binding : Binding a} -> Elem binding (leading :: left) -> Elem binding (leading :: right)
    toRight Here = Here
    toRight (There member) = There (same.forward member)

    toLeft : {0 binding : Binding a} -> Elem binding (leading :: right) -> Elem binding (leading :: left)
    toLeft Here = Here
    toLeft (There member) = There (same.backward member)

public export
0 mappingSwap : (0 first, second : Binding a) -> SameMapping (first :: second :: rest) (second :: first :: rest)
mappingSwap first second = SameBindings swap swap
  where
    swap : {0 binding : Binding a} -> Elem binding (x :: y :: rest) -> Elem binding (y :: x :: rest)
    swap Here = There Here
    swap (There Here) = Here
    swap (There (There member)) = There (There member)

-- Independent order and distinctness predicates. They do not inspect fromList.
public export
data AllAfter : List Nat -> List (Binding a) -> Type where
  NoLaterBindings : AllAfter codes []
  LaterBinding : {0 head : Binding a} -> {0 tail : List (Binding a)} ->
    CodesBefore codes (bindingCodes head) -> AllAfter codes tail -> AllAfter codes (head :: tail)

public export
data CanonicalEntries : List (Binding a) -> Type where
  CanonicalEmpty : CanonicalEntries []
  CanonicalCons : {0 head : Binding a} -> {0 tail : List (Binding a)} ->
    AllAfter (bindingCodes head) tail -> CanonicalEntries tail -> CanonicalEntries (head :: tail)

public export
data AllDifferent : List Nat -> List (Binding a) -> Type where
  NoOtherBindings : AllDifferent codes []
  DifferentBinding : {0 head : Binding a} -> {0 tail : List (Binding a)} ->
    (codes = bindingCodes head -> Void) -> AllDifferent codes tail -> AllDifferent codes (head :: tail)

public export
data DistinctKeys : List (Binding a) -> Type where
  DistinctEmpty : DistinctKeys []
  DistinctCons : {0 head : Binding a} -> {0 tail : List (Binding a)} ->
    AllDifferent (bindingCodes head) tail -> DistinctKeys tail -> DistinctKeys (head :: tail)

public export
allLater : List Nat -> List (Binding a) -> Bool
allLater codes [] = True
allLater codes (head :: tail) = codesEarlier codes (bindingCodes head) && allLater codes tail

public export
canonicalEntries : List (Binding a) -> Bool
canonicalEntries [] = True
canonicalEntries (head :: tail) = allLater (bindingCodes head) tail && canonicalEntries tail

public export
0 bothTrue : {left, right : Bool} -> left = True -> right = True -> left && right = True
bothTrue Refl Refl = Refl

public export
0 andLeft : (left, right : Bool) -> left && right = True -> left = True
andLeft False right Refl impossible
andLeft True right valid = Refl

public export
0 andRight : (left, right : Bool) -> left && right = True -> right = True
andRight False right Refl impossible
andRight True right valid = valid

public export
0 allLaterComplete : (entries : List (Binding a)) -> AllAfter codes entries -> allLater codes entries = True
allLaterComplete [] NoLaterBindings = Refl
allLaterComplete (head :: tail) (LaterBinding earlier later) = bothTrue
  (earlierComplete _ _ earlier) (allLaterComplete tail later)

public export
0 allLaterSound : (codes : List Nat) -> (entries : List (Binding a)) -> allLater codes entries = True -> AllAfter codes entries
allLaterSound codes [] valid = NoLaterBindings
allLaterSound codes (head :: tail) valid = LaterBinding
  (earlierSound _ _ (andLeft _ _ valid))
  (allLaterSound codes tail (andRight _ _ valid))

public export
0 canonicalComplete : (entries : List (Binding a)) -> CanonicalEntries entries -> canonicalEntries entries = True
canonicalComplete [] CanonicalEmpty = Refl
canonicalComplete (head :: tail) (CanonicalCons later rest) = bothTrue
  (allLaterComplete tail later) (canonicalComplete tail rest)

public export
0 canonicalSound : (entries : List (Binding a)) -> canonicalEntries entries = True -> CanonicalEntries entries
canonicalSound [] valid = CanonicalEmpty
canonicalSound (head :: tail) valid = CanonicalCons
  (allLaterSound _ tail (andLeft _ _ valid))
  (canonicalSound tail (andRight _ _ valid))

public export
0 afterMember : {0 contents : List (Binding a)} -> AllAfter codes contents -> Elem binding contents -> CodesBefore codes (bindingCodes binding)
afterMember (LaterBinding earlier _) Here = earlier
afterMember (LaterBinding _ rest) (There member) = afterMember rest member

public export
0 differentMember : {0 contents : List (Binding a)} -> AllDifferent codes contents -> Elem binding contents -> codes = bindingCodes binding -> Void
differentMember (DifferentBinding different _) Here = different
differentMember (DifferentBinding _ rest) (There member) = differentMember rest member

public export
0 afterTransitive : {0 contents : List (Binding a)} -> CodesBefore first second -> AllAfter second contents -> AllAfter first contents
afterTransitive earlier NoLaterBindings = NoLaterBindings
afterTransitive earlier (LaterBinding later rest) = LaterBinding
  (codesTransitive earlier later) (afterTransitive earlier rest)

public export
0 afterMapping : (target : List (Binding a)) -> AllAfter codes source ->
  ({0 binding : Binding a} -> Elem binding target -> Elem binding source) -> AllAfter codes target
afterMapping [] later back = NoLaterBindings
afterMapping (head :: tail) later back = LaterBinding
  (afterMember later (back Here))
  (afterMapping tail later (\member => back (There member)))

-- Transport of a predicate needs only the backward membership direction.
-- In particular, it never needs Eq a or decoding/encoding an a.
public export
0 differentMapping : (target : List (Binding a)) -> AllDifferent codes source ->
  ({0 binding : Binding a} -> Elem binding target -> Elem binding source) -> AllDifferent codes target
differentMapping [] different back = NoOtherBindings
differentMapping (head :: tail) different back = DifferentBinding
  (differentMember different (back Here))
  (differentMapping tail different (\member => back (There member)))

public export
data AssocError = DuplicateKey ScalarString

-- Only actual entries are stored. Erased validity is a Bool equality, so two
-- independently built validity witnesses cannot create different containers.
public export
data StringKeySortedAssoc : Type -> Type where
  CanonicalAssoc : (contents : List (Binding a)) ->
    (0 valid : canonicalEntries contents = True) -> StringKeySortedAssoc a

export
entries : StringKeySortedAssoc a -> List (Binding a)
entries (CanonicalAssoc contents _) = contents

||| Checked representation view of the actual container. The index exposes
||| its original contents to dependent elimination. Both this view and the
||| public CanonicalAssoc constructor require canonical evidence, exactly as
||| the existing normalizedValue bridge does.
public export
data AssocView : StringKeySortedAssoc a -> Type where
  ViewCanonical : (contents : List (Binding a)) ->
    (0 valid : canonicalEntries contents = True) ->
    AssocView (CanonicalAssoc contents valid)

export
viewAssoc : (actual : StringKeySortedAssoc a) -> AssocView actual
viewAssoc (CanonicalAssoc contents valid) = ViewCanonical contents valid

export
0 entriesCanonical : (value : StringKeySortedAssoc a) -> CanonicalEntries (entries value)
entriesCanonical (CanonicalAssoc contents valid) = canonicalSound contents valid

0 trueEvidenceUnique : {decision : Bool} -> (left, right : decision = True) -> left = right
trueEvidenceUnique Refl Refl = Refl

export
0 entriesInjective : (left, right : StringKeySortedAssoc a) -> entries left = entries right -> left = right
entriesInjective (CanonicalAssoc leftContents leftValid) (CanonicalAssoc rightContents rightValid) same =
  case same of Refl => case trueEvidenceUnique leftValid rightValid of Refl => Refl

-- These worker results carry the entries actually used by fromList. The erased
-- fields certify that same computation, not a second normalization pipeline.
public export
record Inserted (incoming : Binding a) (previous : List (Binding a)) where
  constructor Insertion
  insertedEntries : List (Binding a)
  0 insertedOrder : CanonicalEntries insertedEntries
  0 insertedMapping : SameMapping (incoming :: previous) insertedEntries

public export
insertBinding : (incoming : Binding a) -> (previous : List (Binding a)) ->
  (0 ordered : CanonicalEntries previous) -> Either AssocError (Inserted incoming previous)
insertBinding incoming [] CanonicalEmpty = Right (Insertion [incoming]
  (CanonicalCons NoLaterBindings CanonicalEmpty) mappingReflexive)
insertBinding incoming (head :: tail) (CanonicalCons later rest) = case compareCodes (bindingCodes incoming) (bindingCodes head) of
  CodesEarlier earlier => Right (Insertion (incoming :: head :: tail)
    (CanonicalCons (LaterBinding earlier (afterTransitive earlier later)) (CanonicalCons later rest)) mappingReflexive)
  CodesSame _ => Left (DuplicateKey (fst incoming))
  CodesLater earlier => do
    inserted <- insertBinding incoming tail rest
    let 0 sourceLater = LaterBinding earlier later
        0 headLater = afterMapping inserted.insertedEntries sourceLater inserted.insertedMapping.backward
        0 same = mappingTransitive (mappingSwap incoming head) (mappingCons head inserted.insertedMapping)
    pure (Insertion (head :: inserted.insertedEntries) (CanonicalCons headLater inserted.insertedOrder) same)

public export
record Normalized (source : List (Binding a)) where
  constructor Normalization
  normalizedEntries : List (Binding a)
  0 normalizedOrder : CanonicalEntries normalizedEntries
  0 normalizedMapping : SameMapping source normalizedEntries

public export
normalizeEntries : (source : List (Binding a)) -> Either AssocError (Normalized source)
normalizeEntries [] = Right (Normalization [] CanonicalEmpty mappingReflexive)
normalizeEntries (head :: tail) = do
  normalized <- normalizeEntries tail
  inserted <- insertBinding head normalized.normalizedEntries normalized.normalizedOrder
  pure (Normalization inserted.insertedEntries inserted.insertedOrder
    (mappingTransitive (mappingCons head normalized.normalizedMapping) inserted.insertedMapping))

public export
normalizedValue : {0 a : Type} -> {0 source : List (Binding a)} -> Normalized source -> StringKeySortedAssoc a
normalizedValue normalized = CanonicalAssoc normalized.normalizedEntries
  (canonicalComplete normalized.normalizedEntries normalized.normalizedOrder)

export
0 normalizedValueEntries : {0 a : Type} -> {0 source : List (Binding a)} -> (normalized : Normalized source) ->
  entries (normalizedValue normalized) = normalized.normalizedEntries
normalizedValueEntries normalized = Refl

public export
fromList : List (Binding a) -> Either AssocError (StringKeySortedAssoc a)
fromList source = map normalizedValue (normalizeEntries source)

export
empty : StringKeySortedAssoc a
empty = CanonicalAssoc [] Refl

public export
mapBindings : (a -> b) -> List (Binding a) -> List (Binding b)
mapBindings action [] = []
mapBindings action (head :: tail) = (fst head, action (snd head)) :: mapBindings action tail

0 mapLater : (action : a -> b) -> AllAfter codes source -> AllAfter codes (mapBindings action source)
mapLater action NoLaterBindings = NoLaterBindings
mapLater action (LaterBinding earlier rest) = LaterBinding earlier (mapLater action rest)

0 mapOrdered : (action : a -> b) -> CanonicalEntries source -> CanonicalEntries (mapBindings action source)
mapOrdered action CanonicalEmpty = CanonicalEmpty
mapOrdered action (CanonicalCons later rest) = CanonicalCons (mapLater action later) (mapOrdered action rest)

export
mapValues : (a -> b) -> StringKeySortedAssoc a -> StringKeySortedAssoc b
mapValues action (CanonicalAssoc contents valid) = CanonicalAssoc (mapBindings action contents)
  (canonicalComplete _ (mapOrdered action (canonicalSound contents valid)))

export
0 mapValuesEntries : (action : a -> b) -> (value : StringKeySortedAssoc a) ->
  entries (mapValues action value) = mapBindings action (entries value)
mapValuesEntries action (CanonicalAssoc contents valid) = Refl

public export
lookupEntries : ScalarString -> List (Binding a) -> Maybe a
lookupEntries key [] = Nothing
lookupEntries key ((stored, value) :: tail) = case compareKeys key stored of
  CodesEarlier _ => Nothing
  CodesSame _ => Just value
  CodesLater _ => lookupEntries key tail

export
lookupValue : ScalarString -> StringKeySortedAssoc a -> Maybe a
lookupValue key value = lookupEntries key (entries value)

export
0 lookupValueEntries : (key : ScalarString) -> (value : StringKeySortedAssoc a) ->
  lookupValue key value = lookupEntries key (entries value)
lookupValueEntries key value = Refl

-- keyCodes identity is the model's key identity. Relating it to equality of
-- primitive String content is a separate Unicode/backend obligation. No key or
-- value is merged/rewritten by normalization; equal-code keys are rejected.
-- Fallible value codecs must traverse entries with an explicit Either result;
-- mapValues is deliberately only the total value-map operation.

public export
bindingContent : Binding a -> (String, a)
bindingContent binding = (scalarValue (fst binding), snd binding)

0 bindingEqual : {leftKey, rightKey : ScalarString} -> {leftValue, rightValue : a} ->
  leftKey = rightKey -> leftValue = rightValue -> (leftKey, leftValue) = (rightKey, rightValue)
bindingEqual Refl Refl = Refl

0 listHeadEqual : {0 first, second : a} -> {0 left, right : List a} -> first :: left = second :: right -> first = second
listHeadEqual Refl = Refl

0 listTailEqual : {0 first, second : a} -> {0 left, right : List a} -> first :: left = second :: right -> left = right
listTailEqual Refl = Refl

0 listConsEqual : {0 first, second : a} -> {0 left, right : List a} -> first = second -> left = right -> first :: left = second :: right
listConsEqual Refl Refl = Refl

-- Dec.Yes carries a runtime witness, while the equality theorems are erased.
-- Equality has only Refl: this reconstructs its witness from checked evidence,
-- without a cast, an unchecked Bool reflection, or reifying an arbitrary a.
equalityWitness : {0 left, right : a} -> (0 same : left = right) -> left = right
equalityWitness Refl = Refl

decideBinding : DecEq a => (left, right : Binding a) -> Dec (left = right)
decideBinding (leftKey, leftValue) (rightKey, rightValue) = case decEq (scalarValue leftKey) (scalarValue rightKey) of
  No different => No (\same => different (cong (\binding => scalarValue (fst binding)) same))
  Yes keySame => case decEq leftValue rightValue of
    No different => No (\same => different (cong snd same))
    Yes valueSame => Yes (equalityWitness (bindingEqual (scalarValueInjective leftKey rightKey keySame) valueSame))

decideBindings : DecEq a => (left, right : List (Binding a)) -> Dec (left = right)
decideBindings [] [] = Yes Refl
decideBindings [] (_ :: _) = No (\Refl impossible)
decideBindings (_ :: _) [] = No (\Refl impossible)
decideBindings (left :: leftTail) (right :: rightTail) = case decideBinding left right of
  No different => No (\same => different (equalityWitness (listHeadEqual same)))
  Yes headSame => case decideBindings leftTail rightTail of
    No different => No (\same => different (equalityWitness (listTailEqual same)))
    Yes tailSame => Yes (equalityWitness (listConsEqual headSame tailSame))

-- Compatibility interfaces for native records. String/Char primitive Eq and
-- the standard library's primitive DecEq are inherited trusted boundaries.
-- These instances are not the structural order/canonicality proofs above.
export
Eq a => Eq (StringKeySortedAssoc a) where
  left == right = map bindingContent (entries left) == map bindingContent (entries right)

export
Show a => Show (StringKeySortedAssoc a) where
  show value = show (map bindingContent (entries value))

export
DecEq a => DecEq (StringKeySortedAssoc a) where
  decEq left right = case decideBindings (entries left) (entries right) of
    Yes same => Yes (equalityWitness (entriesInjective left right same))
    No different => No (\same => different (cong entries same))
