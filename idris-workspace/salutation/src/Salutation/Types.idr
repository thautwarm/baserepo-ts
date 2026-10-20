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
