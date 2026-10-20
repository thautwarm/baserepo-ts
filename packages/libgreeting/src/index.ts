import * as bindings from "./bindings.ts";
import type { ILibrary } from "./types.ts";

export type { GreetRequest, GreetResponse, ILibrary, ModelSchemas, Models } from "./types.ts";

export const greet: ILibrary["greet"] = bindings.greet;
export const schemas: ILibrary["schemas"] = bindings.schemas;
