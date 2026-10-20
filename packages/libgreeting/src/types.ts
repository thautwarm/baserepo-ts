import type { ZodType } from "zod";

export interface GreetRequest {
  /** @minLength 1 */
  name: string;
}

export interface GreetResponse {
  message: string;
}

export interface PublicModels {
  greetRequest: GreetRequest;
  greetResponse: GreetResponse;
}

export type ModelSchemas = { [K in keyof PublicModels]: ZodType<PublicModels[K]> };

export interface ILibrary {
  greet: (request: GreetRequest) => Promise<GreetResponse>;
  schemas: ModelSchemas;
}
