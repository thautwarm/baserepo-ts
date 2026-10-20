module Salutation

import public Salutation.Types

public export
greet : GreetRequest -> GreetResponse
greet request = MkGreetResponse (map greeting request.recipients)
  where
    greeting : Recipient -> Greeting
    greeting person = MkGreeting ("Hello, " ++ person.name ++ "!")
