import type { ILibrary } from "@template/libsalutation/types";
import { exchange } from "./runtime.ts";
import { publicModelsSchema } from "./schemas.ts";

const schemas = publicModelsSchema.shape;

export const greet: ILibrary["greet"] = (request) => {
  const input = schemas.greetRequest.parse(request);
  const output: unknown = JSON.parse(exchange(JSON.stringify(input)));
  return schemas.greetResponse.parse(output);
};
