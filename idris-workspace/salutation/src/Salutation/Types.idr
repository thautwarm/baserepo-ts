module Salutation.Types

public export
record Recipient where
  constructor MkRecipient
  name : String

public export
record GreetRequest where
  constructor MkGreetRequest
  recipients : List Recipient

public export
record Greeting where
  constructor MkGreeting
  message : String

public export
record GreetResponse where
  constructor MkGreetResponse
  greetings : List Greeting

public export
record Integers where
  constructor MkIntegers
  signed : Int64
  unsigned : Bits64

public export
record IntegerBatch where
  constructor MkIntegerBatch
  values : Integers
  signedValues : List Int64
  unsignedValues : List Bits64
  optionalSigned : Maybe Int64
  nullableUnsigned : Maybe Bits64
