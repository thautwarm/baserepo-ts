module Value.Unicode.Order

import public Value.Unicode

%default total

-- The order is on Unicode scalar code-point sequences, not locale, UTF-16
-- code-unit order, String's primitive Ord, case folding, or normalization.
-- unpack/ord/cast belong to the pinned backend boundary. The structural laws
-- below hold for the actual resulting Nat lists; they do not prove that bridge
-- injective or that another backend implements the same Unicode conversion.
public export
keyCodes : ScalarString -> List Nat
keyCodes value = map (\character => cast (ord character)) (unpack (scalarValue value))

public export
data NatBefore : Nat -> Nat -> Type where
  ZeroBefore : NatBefore Z (S right)
  SuccBefore : NatBefore left right -> NatBefore (S left) (S right)

public export
data NatComparison : Nat -> Nat -> Type where
  NatEarlier : (0 earlier : NatBefore left right) -> NatComparison left right
  NatSame : (0 same : left = right) -> NatComparison left right
  NatLater : (0 later : NatBefore right left) -> NatComparison left right

public export
0 naturalEarlierFromComparison : (left, right : Nat) -> compareNat left right = LT -> NatBefore left right
naturalEarlierFromComparison Z Z Refl impossible
naturalEarlierFromComparison Z (S right) valid = ZeroBefore
naturalEarlierFromComparison (S left) Z Refl impossible
naturalEarlierFromComparison (S left) (S right) valid = SuccBefore (naturalEarlierFromComparison left right valid)

public export
0 naturalSameFromComparison : (left, right : Nat) -> compareNat left right = EQ -> left = right
naturalSameFromComparison Z Z valid = Refl
naturalSameFromComparison Z (S right) Refl impossible
naturalSameFromComparison (S left) Z Refl impossible
naturalSameFromComparison (S left) (S right) valid = cong S (naturalSameFromComparison left right valid)

public export
0 naturalLaterFromComparison : (left, right : Nat) -> compareNat left right = GT -> NatBefore right left
naturalLaterFromComparison Z Z Refl impossible
naturalLaterFromComparison Z (S right) Refl impossible
naturalLaterFromComparison (S left) Z valid = ZeroBefore
naturalLaterFromComparison (S left) (S right) valid = SuccBefore (naturalLaterFromComparison left right valid)

-- The fixed compiler recognizes Prelude.Types.compareNat as a MagicCRef
-- (Compiler/Opts/Constructor.idr). Structural witness construction is erased;
-- runtime comparison does not recurse once for every numeric code-point unit.
public export
compareNatural : (left, right : Nat) -> NatComparison left right
compareNatural left right with (compareNat left right) proof compared
  compareNatural left right | LT = NatEarlier (naturalEarlierFromComparison left right compared)
  compareNatural left right | EQ = NatSame (naturalSameFromComparison left right compared)
  compareNatural left right | GT = NatLater (naturalLaterFromComparison left right compared)

public export
0 naturalIrreflexive : NatBefore value value -> Void
naturalIrreflexive ZeroBefore impossible
naturalIrreflexive (SuccBefore smaller) = naturalIrreflexive smaller

public export
0 naturalTransitive : NatBefore first second -> NatBefore second third -> NatBefore first third
naturalTransitive ZeroBefore (SuccBefore _) = ZeroBefore
naturalTransitive (SuccBefore first) (SuccBefore second) = SuccBefore (naturalTransitive first second)

public export
data CodesBefore : List Nat -> List Nat -> Type where
  PrefixBefore : CodesBefore [] (point :: rest)
  HeadBefore : NatBefore left right -> CodesBefore (left :: leftRest) (right :: rightRest)
  TailBefore : CodesBefore leftRest rightRest -> CodesBefore (point :: leftRest) (point :: rightRest)

public export
data CodesComparison : List Nat -> List Nat -> Type where
  CodesEarlier : (0 earlier : CodesBefore left right) -> CodesComparison left right
  CodesSame : (0 same : left = right) -> CodesComparison left right
  CodesLater : (0 later : CodesBefore right left) -> CodesComparison left right

public export
compareCodesWorker : {0 originalLeft, originalRight : List Nat} -> (left, right : List Nat) ->
  (0 growEarlier : CodesBefore left right -> CodesBefore originalLeft originalRight) ->
  (0 growSame : left = right -> originalLeft = originalRight) ->
  (0 growLater : CodesBefore right left -> CodesBefore originalRight originalLeft) ->
  CodesComparison originalLeft originalRight
compareCodesWorker [] [] earlier same later = CodesSame (same Refl)
compareCodesWorker [] (_ :: _) earlier same later = CodesEarlier (earlier PrefixBefore)
compareCodesWorker (_ :: _) [] earlier same later = CodesLater (later PrefixBefore)
compareCodesWorker (left :: leftRest) (right :: rightRest) earlier same later = case compareNatural left right of
  NatEarlier smaller => CodesEarlier (earlier (HeadBefore smaller))
  NatLater greater => CodesLater (later (HeadBefore greater))
  NatSame Refl => compareCodesWorker leftRest rightRest
    (\smaller => earlier (TailBefore smaller))
    (\equal => same (cong (left ::) equal))
    (\greater => later (TailBefore greater))

public export
compareCodes : (left, right : List Nat) -> CodesComparison left right
compareCodes left right = compareCodesWorker left right id id id

public export
0 codesIrreflexive : CodesBefore value value -> Void
codesIrreflexive PrefixBefore impossible
codesIrreflexive (HeadBefore smaller) = naturalIrreflexive smaller
codesIrreflexive (TailBefore smaller) = codesIrreflexive smaller

public export
0 codesTransitive : CodesBefore first second -> CodesBefore second third -> CodesBefore first third
codesTransitive PrefixBefore (HeadBefore _) = PrefixBefore
codesTransitive PrefixBefore (TailBefore _) = PrefixBefore
codesTransitive (HeadBefore first) (HeadBefore second) = HeadBefore (naturalTransitive first second)
codesTransitive (HeadBefore first) (TailBefore _) = HeadBefore first
codesTransitive (TailBefore _) (HeadBefore second) = HeadBefore second
codesTransitive (TailBefore first) (TailBefore second) = TailBefore (codesTransitive first second)

public export
0 codesAsymmetric : CodesBefore left right -> CodesBefore right left -> Void
codesAsymmetric first second = codesIrreflexive (codesTransitive first second)

public export
codesEarlier : List Nat -> List Nat -> Bool
codesEarlier left right = case compareCodes left right of
  CodesEarlier _ => True
  _ => False

public export
0 earlierSound : (left, right : List Nat) -> codesEarlier left right = True -> CodesBefore left right
earlierSound left right valid with (compareCodes left right)
  earlierSound left right valid | CodesEarlier earlier = earlier
  earlierSound left right Refl | CodesSame _ impossible
  earlierSound left right Refl | CodesLater _ impossible

public export
0 earlierComplete : (left, right : List Nat) -> CodesBefore left right -> codesEarlier left right = True
earlierComplete left right earlier with (compareCodes left right)
  earlierComplete left right earlier | CodesEarlier _ = Refl
  earlierComplete left right earlier | CodesSame same = case same of Refl => absurd (codesIrreflexive earlier)
  earlierComplete left right earlier | CodesLater later = absurd (codesAsymmetric earlier later)

public export
compareKeys : (left, right : ScalarString) -> CodesComparison (keyCodes left) (keyCodes right)
compareKeys left right = compareCodes (keyCodes left) (keyCodes right)

public export
keyEarlier : ScalarString -> ScalarString -> Bool
keyEarlier left right = codesEarlier (keyCodes left) (keyCodes right)
