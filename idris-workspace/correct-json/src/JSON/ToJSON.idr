||| Interface and utilities for encoding Idris2 values to JSON
||| via an entermediate `Value` representation.
|||
||| For regular algebraic data types, implementations can automatically
||| be derived using elaborator reflection (see module `Derive.ToJSON`)
|||
||| Operators and functionality strongly influenced by Haskell's aeson
||| library
module JSON.ToJSON

import Data.List.Quantifiers as LQ
import Data.Vect.Quantifiers as VQ
import Data.SortedMap
import Data.List1
import Data.String
import Data.Vect
import JSON.Option
import JSON.Encoder

public export
interface ToJSON a where
  constructor MkToJSON
  toJSON : forall v . Encoder v => a -> Either String v

export %inline
jpair : ToJSON a => Encoder v => String -> a -> Either String (String,v)
jpair s val = do
  _ <- mapFst (\_ => "JSON: isolated surrogate object key") (scalarString s)
  value <- toJSON val
  pure (s, value)

export infixr 8 .=

||| Deprecated: Use `jpair` instead
export %deprecate %inline
(.=) : ToJSON a => Encoder v => String -> a -> Either String (String,v)
(.=) = jpair

export
encodeVia : (0 v : Type) -> Encoder v => ToJSON a => a -> Either String String
encodeVia v val = toJSON {v} val >>= stringify

export
encode : ToJSON a => a -> Either String String
encode = encodeVia JSON

||| Encodes a value as a single-field object. The field has the given
||| name.
|||
||| This corresponds to the `ObjectWithSingleField` option
||| for encoding sum types.
export
singleField : Encoder v => String -> v -> Either String v
singleField s x = objectChecked [(s,x)]

||| Encodes a value plus a string as a two-element array.
|||
||| This corresponds to the `TwoElemArray` option
||| for encoding sum types.
export
twoElemArray : Encoder v => String -> v -> v
twoElemArray s x = array [string s, x]

||| Encodes a value plus a string as a tagged object.
|||
||| This corresponds to the `TaggedObject` option
||| for encoding sum types.
export
taggedObject :
     {auto _ : Encoder v}
  -> (tagField, contentField, tag : String)
  -> v
  -> Either String v
taggedObject tf cf tag x = objectChecked [(tf, string tag), (cf, x)]

||| Encodes the tag and already encoded named fields in the same object.
export
taggedFields : Encoder v => (tagField, tag : String) -> List (String, v) -> Either String v
taggedFields tagField tag fields = objectChecked ((tagField, string tag) :: fields)

--------------------------------------------------------------------------------
--          Implementations
--------------------------------------------------------------------------------

export
ToJSON Void where
  toJSON x impossible

export
ToJSON String where toJSON = Right . string

export
ToJSON Char where toJSON = Right . string . singleton

export
ToJSON Double where toJSON = double

export
ToJSON Bits8 where toJSON = Right . integer . cast

export
ToJSON Bits16 where toJSON = Right . integer . cast

export
ToJSON Bits32 where toJSON = Right . integer . cast

export
ToJSON Bits64 where toJSON = Right . integer . cast

export
ToJSON Int8 where toJSON = Right . integer . cast

export
ToJSON Int16 where toJSON = Right . integer . cast

export
ToJSON Int32 where toJSON = Right . integer . cast

export
ToJSON Int64 where toJSON = Right . integer . cast

export
ToJSON Int where toJSON = Right . integer . cast

export
ToJSON Integer where toJSON = Right . integer

export
ToJSON Nat where toJSON = Right . integer . cast

export
ToJSON Bool where toJSON = Right . boolean

export
ToJSON a => ToJSON (Maybe a) where
  toJSON Nothing  = Right null
  toJSON (Just a) = toJSON a

export
ToJSON a => ToJSON (List a) where
  toJSON values = map array (traverse toJSON values)

export
ToJSON a => ToJSON (SnocList a) where
  toJSON = toJSON . (<>> [])

export
ToJSON a => ToJSON (List1 a) where
  toJSON = toJSON . forget

export
ToJSON a => ToJSON (Vect n a) where
  toJSON = toJSON . toList

export
ToJSON () where
  toJSON () = Right (array Nil)

export
ToJSON a => ToJSON b => ToJSON (Either a b) where
  toJSON (Left a) = jpair "Left" a >>= objectChecked . singleton
  toJSON (Right b) = jpair "Right" b >>= objectChecked . singleton

export
ToJSON a => ToJSON b => ToJSON (a, b) where
  toJSON (x,y) = do
    left <- toJSON x
    right <- toJSON y
    pure (array [left, right])

export
ToJSON a => ToJSON (SortedMap String a) where
  toJSON values = do
    checked <- mapFst show (checkedAssoc (SortedMap.toList values))
    rebuilt <- traverseAssoc toJSON checked
    pure (object rebuilt)

export
ToJSON a => ToJSON (StringKeySortedAssoc a) where
  toJSON values = map object (traverseAssoc toJSON values)

export
(ps : LQ.All.All (ToJSON . f) ts) => ToJSON (All f ts) where
  toJSON values = map array (sequence (forget (zipPropertyWith (\_,v => toJSON v) ps values)))


export
zipAllWith :
     (f : {0 x : a} -> p x -> q x -> r x)
  -> VQ.All.All p xs
  -> All q xs
  -> All r xs
zipAllWith f [] [] = []
zipAllWith f (px :: pxs) (qx :: qxs) = f px qx :: zipAllWith f pxs qxs

export
(ps : VQ.All.All (ToJSON . f) ts) => ToJSON (VQ.All.All f ts) where
  toJSON values = map array (sequence (toList (forget (zipAllWith (\_,v => toJSON v) ps values))))
