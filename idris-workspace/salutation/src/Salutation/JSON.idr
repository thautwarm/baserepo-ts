module Salutation.JSON

import public JSON.Wire.Authoring
import Salutation

%language ElabReflection

-- Public model registry for TypeScript generation.
public export
record PublicModels where
  constructor MkPublicModels
  greetRequest : GreetRequest
  greetResponse : GreetResponse
  integerBatch : IntegerBatch

%runElab deriveJSON "Recipient" []
%runElab deriveJSON "GreetRequest" [UseWire "wireRecipient"]
%runElab deriveJSON "Greeting" []
%runElab deriveJSON "GreetResponse" [UseWire "wireGreeting"]
%runElab deriveJSON "Integers" []
%runElab deriveJSON "Maybe" [WireName "wireNullable", ExportName "NullableMaybe", WireBinding (NullableBinding "Nothing" "Just")]
%runElab deriveJSON "IntegerBatch" [UseWire "wireIntegers", FieldWire "nullableUnsigned" "wireNullable"]
%runElab deriveJSON "PublicModels" [UseWire "wireGreetRequest", UseWire "wireGreetResponse", UseWire "wireIntegerBatch"]

%runElab publishJSONRoot "wireGreetRequest" Component []
%runElab publishJSONRoot "wireGreetResponse" Component []
%runElab publishJSONRoot "wirePublicModels" Component []
%runElab publishJSONRoot "wireIntegerBatch" Component []

export
greetJSON : String -> Either String String
greetJSON input = do
  requestCodec <- graphCodecGreetRequest
  responseCodec <- graphCodecGreetResponse
  request <- decodeGraphText requestCodec input
  encodeGraphText responseCodec (greet request)

export
integersJSON : String -> Either String String
integersJSON input = do
  codec <- graphCodecIntegerBatch
  value <- decodeGraphText codec input
  encodeGraphText codec value
