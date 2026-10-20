module Salutation

public export
greet : String -> String
greet name = "Hello, " ++ name ++ "!"
