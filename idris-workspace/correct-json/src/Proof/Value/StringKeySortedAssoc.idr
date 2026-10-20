module Proof.Value.StringKeySortedAssoc

import public Value.StringKeySortedAssoc

%default total

0 noEmptyMember : Elem binding [] -> Void
noEmptyMember Here impossible
noEmptyMember (There _) impossible

public export
0 earlierDifferent : CodesBefore left right -> left = right -> Void
earlierDifferent earlier Refl = codesIrreflexive earlier

public export
0 laterDifferent : {0 contents : List (Binding a)} -> AllAfter codes contents -> AllDifferent codes contents
laterDifferent NoLaterBindings = NoOtherBindings
laterDifferent (LaterBinding earlier rest) = DifferentBinding
  (earlierDifferent earlier) (laterDifferent rest)

public export
0 canonicalDistinct : {0 contents : List (Binding a)} -> CanonicalEntries contents -> DistinctKeys contents
canonicalDistinct CanonicalEmpty = DistinctEmpty
canonicalDistinct (CanonicalCons later rest) = DistinctCons (laterDifferent later) (canonicalDistinct rest)

-- Both heads are actual members of the other list. If either membership is
-- Here, whole-binding equality follows directly. If both are in the tails,
-- strict order gives an impossible cycle. No code->String injectivity is used.
0 canonicalHeadsSame : CanonicalEntries (left :: leftTail) -> CanonicalEntries (right :: rightTail) ->
  Elem left (right :: rightTail) -> Elem right (left :: leftTail) -> left = right
canonicalHeadsSame leftOrder rightOrder Here rightMember = Refl
canonicalHeadsSame (CanonicalCons leftLater _) (CanonicalCons rightLater _) (There leftMember) Here = Refl
canonicalHeadsSame (CanonicalCons leftLater _) (CanonicalCons rightLater _) (There leftMember) (There rightMember) =
  absurd (codesAsymmetric (afterMember leftLater rightMember) (afterMember rightLater leftMember))

0 mappingTails : {0 head : Binding a} -> CanonicalEntries (head :: left) -> CanonicalEntries (head :: right) ->
  SameMapping (head :: left) (head :: right) -> SameMapping left right
mappingTails (CanonicalCons leftLater _) (CanonicalCons rightLater _) same = SameBindings toRight toLeft
  where
    toRight : {0 binding : Binding a} -> Elem binding left -> Elem binding right
    toRight member = case same.forward (There member) of
      Here => absurd (codesIrreflexive (afterMember leftLater member))
      There target => target

    toLeft : {0 binding : Binding a} -> Elem binding right -> Elem binding left
    toLeft member = case same.backward (There member) of
      Here => absurd (codesIrreflexive (afterMember rightLater member))
      There target => target

public export
0 sameMappingCanonical : (left, right : List (Binding a)) ->
  CanonicalEntries left -> CanonicalEntries right -> SameMapping left right -> left = right
sameMappingCanonical [] [] CanonicalEmpty CanonicalEmpty same = Refl
sameMappingCanonical [] (head :: tail) CanonicalEmpty rightOrder same = absurd (noEmptyMember (same.backward Here))
sameMappingCanonical (head :: tail) [] leftOrder CanonicalEmpty same = absurd (noEmptyMember (same.forward Here))
sameMappingCanonical (left :: leftTail) (right :: rightTail)
  leftOrder@(CanonicalCons leftLater leftRest) rightOrder@(CanonicalCons rightLater rightRest) same =
    case canonicalHeadsSame leftOrder rightOrder (same.forward Here) (same.backward Here) of
      Refl => cong (left ::) (sameMappingCanonical leftTail rightTail leftRest rightRest (mappingTails leftOrder rightOrder same))

public export
0 sameMappingValues : (left, right : StringKeySortedAssoc a) ->
  SameMapping (entries left) (entries right) -> left = right
sameMappingValues left right same = entriesInjective left right
  (sameMappingCanonical (entries left) (entries right) (entriesCanonical left) (entriesCanonical right) same)

-- A rejection of the actual insertion algorithm supplies an actual old
-- binding with the same codes. It cannot reject merely because a value codec
-- fails or because a is not equality-comparable.
0 insertionDuplicate : (incoming : Binding a) -> (previous : List (Binding a)) ->
  (0 ordered : CanonicalEntries previous) -> (error : AssocError) ->
  insertBinding incoming previous ordered = Left error ->
  (duplicate ** (Elem duplicate previous, bindingCodes incoming = bindingCodes duplicate))
insertionDuplicate incoming [] CanonicalEmpty error Refl impossible
insertionDuplicate incoming (head :: tail) (CanonicalCons later rest) error rejected
  with (compareCodes (bindingCodes incoming) (bindingCodes head))
  insertionDuplicate incoming (head :: tail) (CanonicalCons later rest) error Refl | CodesEarlier earlier impossible
  insertionDuplicate incoming (head :: tail) (CanonicalCons later rest) error rejected | CodesSame same = (head ** (Here, same))
  insertionDuplicate incoming (head :: tail) (CanonicalCons later rest) error rejected | CodesLater earlier
    with (insertBinding incoming tail rest) proof insertedEquation
    insertionDuplicate incoming (head :: tail) (CanonicalCons later rest) error rejected | CodesLater earlier | Left inner =
      let (duplicate ** (member, same)) = insertionDuplicate incoming tail rest inner insertedEquation
      in (duplicate ** (There member, same))
    insertionDuplicate incoming (head :: tail) (CanonicalCons later rest) error Refl | CodesLater earlier | Right inserted impossible

0 distinctNormalizationNotRejected : (source : List (Binding a)) -> DistinctKeys source ->
  (error : AssocError) -> normalizeEntries source = Left error -> Void
distinctNormalizationNotRejected [] DistinctEmpty error Refl impossible
distinctNormalizationNotRejected (head :: tail) (DistinctCons different rest) error rejected
  with (normalizeEntries tail) proof normalized
  distinctNormalizationNotRejected (head :: tail) (DistinctCons different rest) error rejected | Left inner =
    distinctNormalizationNotRejected tail rest inner normalized
  distinctNormalizationNotRejected (head :: tail) (DistinctCons different rest) error rejected | Right normalizedTail
    with (insertBinding head normalizedTail.normalizedEntries normalizedTail.normalizedOrder) proof insertedEquation
    distinctNormalizationNotRejected (head :: tail) (DistinctCons different rest) error rejected | Right normalizedTail | Left inner =
      let (duplicate ** (member, same)) = insertionDuplicate head normalizedTail.normalizedEntries normalizedTail.normalizedOrder inner insertedEquation
      in differentMember different (normalizedTail.normalizedMapping.backward member) same
    distinctNormalizationNotRejected (head :: tail) (DistinctCons different rest) error Refl | Right normalizedTail | Right inserted impossible

public export
0 normalizationComplete : (source : List (Binding a)) -> DistinctKeys source ->
  (normalized ** normalizeEntries source = Right normalized)
normalizationComplete source distinct with (normalizeEntries source) proof normalized
  normalizationComplete source distinct | Left error = absurd (distinctNormalizationNotRejected source distinct error normalized)
  normalizationComplete source distinct | Right value = (value ** Refl)

public export
0 fromListComplete : (source : List (Binding a)) -> DistinctKeys source ->
  (value ** fromList source = Right value)
fromListComplete source distinct =
  let (normalized ** accepted) = normalizationComplete source distinct
  in (normalizedValue normalized ** cong (map normalizedValue) accepted)

public export
0 fromListPreservesMapping : (source : List (Binding a)) -> (value : StringKeySortedAssoc a) ->
  fromList source = Right value -> SameMapping source (entries value)
fromListPreservesMapping source value accepted with (normalizeEntries source)
  fromListPreservesMapping source value Refl | Left error impossible
  fromListPreservesMapping source value accepted | Right normalized =
    case accepted of Refl => mappingTarget normalized.normalizedMapping (sym (normalizedValueEntries normalized))

public export
0 fromListSorted : (source : List (Binding a)) -> (value : StringKeySortedAssoc a) ->
  fromList source = Right value -> CanonicalEntries (entries value)
fromListSorted source value accepted = entriesCanonical value

public export
0 fromListUnique : (source : List (Binding a)) -> (value : StringKeySortedAssoc a) ->
  fromList source = Right value -> DistinctKeys (entries value)
fromListUnique source value accepted = canonicalDistinct (entriesCanonical value)

-- Set-membership preservation alone could hide a repeated identical binding.
-- This separate theorem follows the actual insertion/rejection branches and
-- proves that the accepted INPUT, not only its output, has distinct keys.
0 insertionAcceptsDistinct : (incoming : Binding a) -> (previous : List (Binding a)) ->
  (0 ordered : CanonicalEntries previous) -> (inserted : Inserted incoming previous) ->
  insertBinding incoming previous ordered = Right inserted -> AllDifferent (bindingCodes incoming) previous
insertionAcceptsDistinct incoming [] CanonicalEmpty inserted accepted = NoOtherBindings
insertionAcceptsDistinct incoming (head :: tail) (CanonicalCons later rest) inserted accepted
  with (compareCodes (bindingCodes incoming) (bindingCodes head))
  insertionAcceptsDistinct incoming (head :: tail) (CanonicalCons later rest) inserted accepted | CodesEarlier earlier =
    laterDifferent (LaterBinding earlier (afterTransitive earlier later))
  insertionAcceptsDistinct incoming (head :: tail) (CanonicalCons later rest) inserted Refl | CodesSame same impossible
  insertionAcceptsDistinct incoming (head :: tail) (CanonicalCons later rest) inserted accepted | CodesLater earlier
    with (insertBinding incoming tail rest) proof insertedEquation
    insertionAcceptsDistinct incoming (head :: tail) (CanonicalCons later rest) inserted Refl | CodesLater earlier | Left error impossible
    insertionAcceptsDistinct incoming (head :: tail) (CanonicalCons later rest) inserted accepted | CodesLater earlier | Right insertedTail =
      DifferentBinding (\same => earlierDifferent earlier (sym same))
        (insertionAcceptsDistinct incoming tail rest insertedTail insertedEquation)

0 normalizationAcceptsDistinct : (source : List (Binding a)) -> (normalized : Normalized source) ->
  normalizeEntries source = Right normalized -> DistinctKeys source
normalizationAcceptsDistinct [] normalized accepted = DistinctEmpty
normalizationAcceptsDistinct (head :: tail) normalized accepted
  with (normalizeEntries tail) proof normalizedEquation
  normalizationAcceptsDistinct (head :: tail) normalized Refl | Left error impossible
  normalizationAcceptsDistinct (head :: tail) normalized accepted | Right normalizedTail
    with (insertBinding head normalizedTail.normalizedEntries normalizedTail.normalizedOrder) proof insertedEquation
    normalizationAcceptsDistinct (head :: tail) normalized Refl | Right normalizedTail | Left error impossible
    normalizationAcceptsDistinct (head :: tail) normalized accepted | Right normalizedTail | Right inserted =
      DistinctCons
        (differentMapping tail
          (insertionAcceptsDistinct head normalizedTail.normalizedEntries normalizedTail.normalizedOrder inserted insertedEquation)
          normalizedTail.normalizedMapping.forward)
        (normalizationAcceptsDistinct tail normalizedTail normalizedEquation)

public export
0 fromListAcceptsOnlyDistinct : (source : List (Binding a)) -> (value : StringKeySortedAssoc a) ->
  fromList source = Right value -> DistinctKeys source
fromListAcceptsOnlyDistinct source value accepted with (normalizeEntries source) proof normalizedEquation
  fromListAcceptsOnlyDistinct source value Refl | Left error impossible
  fromListAcceptsOnlyDistinct source value accepted | Right normalized =
    normalizationAcceptsDistinct source normalized normalizedEquation

public export
0 fromListRejectsDuplicates : (source : List (Binding a)) -> (DistinctKeys source -> Void) ->
  (error ** fromList source = Left error)
fromListRejectsDuplicates source duplicate with (fromList source) proof checked
  fromListRejectsDuplicates source duplicate | Left error = (error ** Refl)
  fromListRejectsDuplicates source duplicate | Right value =
    absurd (duplicate (fromListAcceptsOnlyDistinct source value checked))

public export
0 normalizeIdempotent : (value : StringKeySortedAssoc a) -> fromList (entries value) = Right value
normalizeIdempotent value =
  let (rebuilt ** accepted) = fromListComplete (entries value) (canonicalDistinct (entriesCanonical value))
      same = fromListPreservesMapping (entries value) rebuilt accepted
      equal = sameMappingValues value rebuilt same
  in case equal of Refl => accepted

public export
0 sameMappingNormalizations : (left, right : List (Binding a)) ->
  (leftValue, rightValue : StringKeySortedAssoc a) -> SameMapping left right ->
  fromList left = Right leftValue -> fromList right = Right rightValue -> leftValue = rightValue
sameMappingNormalizations left right leftValue rightValue same leftAccepted rightAccepted =
  let leftMapping = fromListPreservesMapping left leftValue leftAccepted
      rightMapping = fromListPreservesMapping right rightValue rightAccepted
      reverseLeft = SameBindings leftMapping.backward leftMapping.forward
  in sameMappingValues leftValue rightValue
    (mappingTransitive reverseLeft (mappingTransitive same rightMapping))

-- Actual lookup follows the same code comparisons. Whole-binding membership
-- of an ordered list entails this result even without the primitive Unicode
-- bridge. The reverse implication for primitive String keys additionally
-- requires code-point identity <-> String content identity; it is not claimed
-- by SameMapping or by the model's order laws.
0 lookupMember : (key : ScalarString) -> (value : a) -> (source : List (Binding a)) ->
  CanonicalEntries source -> Elem (key, value) source -> lookupEntries key source = Just value
lookupMember key value [] CanonicalEmpty member = absurd (noEmptyMember member)
lookupMember key value ((headKey, headValue) :: tail) (CanonicalCons later rest) member
  with (compareKeys key headKey)
  lookupMember key value ((key, value) :: tail) (CanonicalCons later rest) Here | CodesEarlier earlier =
    absurd (codesIrreflexive earlier)
  lookupMember key value ((headKey, headValue) :: tail) (CanonicalCons later rest) (There member) | CodesEarlier earlier =
    absurd (codesAsymmetric earlier (afterMember later member))
  lookupMember key value ((key, value) :: tail) (CanonicalCons later rest) Here | CodesSame same = Refl
  lookupMember key value ((headKey, headValue) :: tail) (CanonicalCons later rest) (There member) | CodesSame same =
    absurd (earlierDifferent (afterMember later member) (sym same))
  lookupMember key value ((key, value) :: tail) (CanonicalCons later rest) Here | CodesLater greater =
    absurd (codesIrreflexive greater)
  lookupMember key value ((headKey, headValue) :: tail) (CanonicalCons later rest) (There member) | CodesLater greater =
    lookupMember key value tail rest member

public export
0 lookupPreservedBinding : (key : ScalarString) -> (value : a) -> (source : List (Binding a)) ->
  (result : StringKeySortedAssoc a) -> fromList source = Right result ->
  Elem (key, value) source -> lookupValue key result = Just value
lookupPreservedBinding key value source result accepted member =
  trans (lookupValueEntries key result)
    (lookupMember key value (entries result) (entriesCanonical result)
      ((fromListPreservesMapping source result accepted).forward member))

0 lookupFound : (key : ScalarString) -> (source : List (Binding a)) -> (value : a) ->
  lookupEntries key source = Just value ->
  (stored ** (Elem (stored, value) source, keyCodes key = keyCodes stored))
lookupFound key [] value Refl impossible
lookupFound key ((stored, storedValue) :: tail) value accepted with (compareKeys key stored)
  lookupFound key ((stored, storedValue) :: tail) value Refl | CodesEarlier earlier impossible
  lookupFound key ((stored, storedValue) :: tail) value accepted | CodesSame same =
    case accepted of Refl => (stored ** (Here, same))
  lookupFound key ((stored, storedValue) :: tail) value accepted | CodesLater later =
    let (found ** (member, same)) = lookupFound key tail value accepted
    in (found ** (There member, same))

public export
0 lookupReturnedBinding : (key : ScalarString) -> (result : StringKeySortedAssoc a) -> (value : a) ->
  lookupValue key result = Just value ->
  (stored ** (Elem (stored, value) (entries result), keyCodes key = keyCodes stored))
lookupReturnedBinding key result value accepted =
  lookupFound key (entries result) value (trans (sym (lookupValueEntries key result)) accepted)

public export
0 lookupReturnedSourceBinding : (key : ScalarString) -> (source : List (Binding a)) ->
  (result : StringKeySortedAssoc a) -> (value : a) -> fromList source = Right result ->
  lookupValue key result = Just value ->
  (stored ** (Elem (stored, value) source, keyCodes key = keyCodes stored))
lookupReturnedSourceBinding key source result value built found =
  let (stored ** (member, same)) = lookupReturnedBinding key result value found
  in (stored ** ((fromListPreservesMapping source result built).backward member, same))

-- An ordinary string-key mapping has content-equal keys and propositionally
-- equal values, irrespective of the ScalarString validation witnesses.
public export
record SameContentMapping (left, right : List (Binding a)) where
  constructor SameContentBindings
  0 contentForward : {0 binding : Binding a} -> Elem binding left ->
    (stored ** (Elem stored right, scalarValue (fst binding) = scalarValue (fst stored), snd binding = snd stored))
  0 contentBackward : {0 binding : Binding a} -> Elem binding right ->
    (stored ** (Elem stored left, scalarValue (fst binding) = scalarValue (fst stored), snd binding = snd stored))

0 contentBindingEqual : (left, right : Binding a) ->
  scalarValue (fst left) = scalarValue (fst right) -> snd left = snd right -> left = right
contentBindingEqual (leftKey, leftValue) (rightKey, rightValue) keySame valueSame =
  case scalarValueInjective leftKey rightKey keySame of
    Refl => case valueSame of Refl => Refl

0 memberTransport : first = second -> Elem second contents -> Elem first contents
memberTransport Refl member = member

public export
0 contentMappingTyped : {0 a : Type} -> {0 left, right : List (Binding a)} -> SameContentMapping left right -> SameMapping left right
contentMappingTyped {a} {left} {right} same = SameBindings toRight toLeft
  where
    toRight : {0 binding : Binding a} -> Elem binding left -> Elem binding right
    toRight {binding} member =
      let (stored ** (target, keySame, valueSame)) = same.contentForward member
      in memberTransport (contentBindingEqual binding stored keySame valueSame) target

    toLeft : {0 binding : Binding a} -> Elem binding right -> Elem binding left
    toLeft {binding} member =
      let (stored ** (target, keySame, valueSame)) = same.contentBackward member
      in memberTransport (contentBindingEqual binding stored keySame valueSame) target

public export
0 sameContentCanonicalValues : (left, right : StringKeySortedAssoc a) ->
  SameContentMapping (entries left) (entries right) -> left = right
sameContentCanonicalValues left right same = sameMappingValues left right (contentMappingTyped same)

-- The content/typed mapping connection above uses the actual pure Unicode
-- validation-evidence lemmas. Code-point identity <-> primitive String content
-- identity remains a separately tested backend boundary; no inhabitant of that
-- universal correspondence is postulated by these generic proofs.
