module JSON.Object

import public Value.StringKeySortedAssoc

%default total

||| Positions are zero-based occurrences in the original pairs, before sorting.
||| They are not byte offsets; the parser can attach its own source bounds.
public export
data ObjectError = InvalidScalarKey Nat String UnicodeError
                 | DuplicateObjectKey ScalarString (List Nat)

export
Show ObjectError where
  show (InvalidScalarKey position raw IsolatedSurrogate) =
    "Invalid scalar object key at pair " ++ show position ++ ": " ++ show raw
  show (DuplicateObjectKey key positions) =
    "Duplicate object key " ++ show (scalarValue key) ++
    " at pair positions " ++ show positions

export
Interpolation ObjectError where
  interpolate = show

export
Eq ObjectError where
  InvalidScalarKey left raw IsolatedSurrogate == InvalidScalarKey right other IsolatedSurrogate =
    left == right && raw == other
  DuplicateObjectKey left positions == DuplicateObjectKey right occurrences =
    keyCodes left == keyCodes right && positions == occurrences
  _ == _ = False

checkedBindings : Nat -> List (String, a) -> Either ObjectError (List (Binding a))
checkedBindings position [] = Right []
checkedBindings position ((raw, value) :: rest) = do
  key <- case scalarString raw of
    Left reason => Left (InvalidScalarKey position raw reason)
    Right key => Right key
  remaining <- checkedBindings (S position) rest
  pure ((key, value) :: remaining)

occurrences : ScalarString -> Nat -> List (Binding a) -> List Nat
occurrences key position [] = []
occurrences key position ((stored, _) :: rest) =
  let remaining = occurrences key (S position) rest in
  case compareKeys key stored of
    CodesSame _ => position :: remaining
    _ => remaining

||| Validate only keys; the value type needs no Eq, Show or codec instance.
||| The actual foundation fromList performs checked normalization and never
||| overwrites a binding. Duplicate diagnostics retain all original positions.
||| No value codec runs here, including when the object is rejected.
export
checkedAssoc : List (String, a) -> Either ObjectError (StringKeySortedAssoc a)
checkedAssoc raw = do
  bindings <- checkedBindings 0 raw
  case Value.StringKeySortedAssoc.fromList bindings of
    Left (DuplicateKey key) => Left (DuplicateObjectKey key (occurrences key 0 bindings))
    Right value => Right value

0 scalarStringRecovers : (key : ScalarString) ->
  scalarString (scalarValue key) = Right key
scalarStringRecovers key =
  trans (scalarStringComplete (scalarValue key) (scalarValid key))
    (cong Right (scalarValueInjective
      (checkedScalar (scalarValue key) (scalarValid key)) key
      (checkedScalarValue (scalarValue key) (scalarValid key))))

0 checkedBindingsRecovers : (position : Nat) -> (bindings : List (Binding a)) ->
  checkedBindings position (map Value.StringKeySortedAssoc.bindingContent bindings) = Right bindings
checkedBindingsRecovers position [] = Refl
checkedBindingsRecovers position ((key, value) :: rest) =
  rewrite scalarStringRecovers key in
  rewrite checkedBindingsRecovers (S position) rest in Refl

||| Already checked scalar bindings retain the actual fromList success result.
||| No equality or codec instance is required for the values.
export
0 checkedAssocBindings : {0 a : Type} ->
  (bindings : List (Binding a)) -> (result : StringKeySortedAssoc a) ->
  (0 accepted : Value.StringKeySortedAssoc.fromList bindings = Right result) ->
  checkedAssoc (map Value.StringKeySortedAssoc.bindingContent bindings) = Right result
checkedAssocBindings bindings result accepted =
  rewrite checkedBindingsRecovers 0 bindings in
  rewrite accepted in Refl

-- A traversal changes values only. The erased transport below carries the
-- original key-order evidence to the rebuilt entries; it neither sorts again
-- nor converts an impossible normalization error into a value-codec error.
record TraversedEntries {0 a : Type} (0 source : List (Binding a)) (0 b : Type) where
  constructor Traversed
  traversedEntries : List (Binding b)
  0 traversedOrder : CanonicalEntries traversedEntries
  0 traversedAfter : {0 codes : List Nat} -> AllAfter codes source -> AllAfter codes traversedEntries

traverseEntries : {0 a, b, e : Type} ->
  (ScalarString -> a -> Either e b) ->
  (source : List (Binding a)) ->
  (0 ordered : CanonicalEntries source) ->
  Either e (TraversedEntries source b)
traverseEntries action [] CanonicalEmpty = Right (Traversed [] CanonicalEmpty (\_ => NoLaterBindings))
traverseEntries action ((key, value) :: rest) (CanonicalCons later ordered) = do
  mapped <- action key value
  remaining <- traverseEntries action rest ordered
  pure (Traversed ((key, mapped) :: remaining.traversedEntries)
    (CanonicalCons (remaining.traversedAfter later) remaining.traversedOrder)
    (\(LaterBinding earlier following) => LaterBinding earlier (remaining.traversedAfter following)))

||| Traverse in canonical key order, invoking the actual value codec once per
||| visited binding. A Left is returned unchanged and stops later callbacks.
||| The callback receives the actual scalar key so callers can prepend paths.
export
traverseAssocWithKey : {0 a, b, e : Type} ->
  (ScalarString -> a -> Either e b) ->
  StringKeySortedAssoc a -> Either e (StringKeySortedAssoc b)
traverseAssocWithKey action source = do
  rebuilt <- traverseEntries action (entries source) (entriesCanonical source)
  pure (normalizedValue (Normalization rebuilt.traversedEntries rebuilt.traversedOrder mappingReflexive))

||| Fallible value-only counterpart of the foundation's total mapValues.
export
traverseAssoc : {0 a, b, e : Type} ->
  (a -> Either e b) -> StringKeySortedAssoc a -> Either e (StringKeySortedAssoc b)
traverseAssoc action = traverseAssocWithKey (\_, value => action value)

-- Filtering is also key-preserving; it permits total dropNull on an already
-- canonical AST without reopening the checked legacy-pairs boundary.
filterEntries : {0 a : Type} -> (ScalarString -> a -> Bool) ->
  (source : List (Binding a)) -> (0 ordered : CanonicalEntries source) -> TraversedEntries source a
filterEntries predicate [] CanonicalEmpty = Traversed [] CanonicalEmpty (\_ => NoLaterBindings)
filterEntries predicate ((key, value) :: rest) (CanonicalCons later ordered) =
  let remaining = filterEntries predicate rest ordered in
  if predicate key value then
    Traversed ((key, value) :: remaining.traversedEntries)
      (CanonicalCons (remaining.traversedAfter later) remaining.traversedOrder)
      (\(LaterBinding earlier following) => LaterBinding earlier (remaining.traversedAfter following))
  else Traversed remaining.traversedEntries remaining.traversedOrder
    (\(LaterBinding _ following) => remaining.traversedAfter following)

export
filterAssoc : (ScalarString -> a -> Bool) -> StringKeySortedAssoc a -> StringKeySortedAssoc a
filterAssoc predicate source =
  let rebuilt = filterEntries predicate (entries source) (entriesCanonical source) in
  normalizedValue (Normalization rebuilt.traversedEntries rebuilt.traversedOrder mappingReflexive)
