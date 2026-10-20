module Main

import Salutation

%foreign "javascript:lambda: greet => { globalThis[Symbol.for('monorepo.salutation')] = { greet }; }"
register : (String -> String) -> PrimIO ()

main : IO ()
main = primIO (register greet)
