module Main

import Salutation.JSON

%foreign "javascript:lambda: message => { throw new Error(message); }"
raise : String -> String

exchange : String -> String
exchange input = either raise id (greetJSON input)

integers : String -> String
integers input = either raise id (integersJSON input)

%foreign "javascript:lambda: (exchange, integers) => { globalThis[Symbol.for('monorepo.salutation')] = { exchange, integers }; }"
register : (String -> String) -> (String -> String) -> PrimIO ()

main : IO ()
main = primIO (register exchange integers)
