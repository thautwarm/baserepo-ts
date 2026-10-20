import type { ILibrary } from "@template/libgreeting/types";
import { createGreeting } from "./implementation.ts";
import { publicModelsSchema } from "./schemas.ts";

const schemas = publicModelsSchema.shape;

export const libgreeting: ILibrary = {
  greet: async (request) => createGreeting(schemas.greetRequest.parse(request).name),
  schemas,
};
