module Salutation.JSON

import JSON.Derive
import Salutation

%language ElabReflection

-- Keep single-field records as JSON objects.
recordOptions : Options
recordOptions = { unwrapUnary := False } defaultOptions

recordToJSON : List Name -> ParamTypeInfo -> Res (List TopLevel)
recordToJSON = customToJSON recordOptions

recordFromJSON : List Name -> ParamTypeInfo -> Res (List TopLevel)
recordFromJSON = customFromJSON recordOptions

%runElab derive "Recipient" [recordToJSON, recordFromJSON]
%runElab derive "GreetRequest" [recordToJSON, recordFromJSON]
%runElab derive "Greeting" [recordToJSON, recordFromJSON]
%runElab derive "GreetResponse" [recordToJSON, recordFromJSON]

export
greetJSON : String -> Either String String
greetJSON input = do
  request <- decodeEither input
  encode (greet request)
