import { createGreeting } from "./implementation.ts";
import { modelsSchema } from "./schemas.ts";
import type { ILibrary } from "./types.ts";

export const schemas: ILibrary["schemas"] = modelsSchema.shape;
export const greet: ILibrary["greet"] = async (request) => {
  return createGreeting(schemas.greetRequest.parse(request).name);
};
