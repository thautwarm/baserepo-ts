module Main

import Salutation.JSON

%foreign "javascript:lambda: message => { throw new Error(message); }"
raise : String -> String

exchange : String -> String
exchange input = either raise id (greetJSON input)

%foreign "javascript:lambda: exchange => { globalThis[Symbol.for('monorepo.salutation')] = { exchange }; }"
register : (String -> String) -> PrimIO ()

main : IO ()
main = primIO (register exchange)
