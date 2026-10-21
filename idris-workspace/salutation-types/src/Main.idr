module Main

import Salutation.JSON
import Salutation.Types
import JSON.Wire.TypeScript

%foreign "javascript:lambda: () => process.argv[2] ?? ''"
selectedRoot : PrimIO String

%foreign "javascript:lambda: message => { throw new Error(message); }"
reject : String -> PrimIO ()

renderCodec : Either String (GraphCodec a) -> Either String String
renderCodec result = do
  codec <- result
  renderGraphTypeScriptFor CanonicalGraphSyntax (graphCodecDescription codec)

render : String -> Either String String
render "GreetRequest" = renderCodec graphCodecGreetRequest
render "GreetResponse" = renderCodec graphCodecGreetResponse
render "IntegerBatch" = renderCodec graphCodecIntegerBatch
render "IntegerBatchNative" = do
  codec <- graphCodecIntegerBatch
  renderGraphTypeScriptFor NativeJSONNumbers (graphCodecDescription codec)
render "PublicModels" = do
  source <- renderCodec graphCodecPublicModels
  pure (source ++ "\nexport type PublicModels = PublicModelsInputSyntax;\n")
render name = Left ("Unknown salutation wire root: " ++ name)

main : IO ()
main = do
  name <- primIO selectedRoot
  case render name of
    Left problem => primIO (reject problem)
    Right source => putStr source
