import type { ZodType } from "zod";

export interface GreetRequest {
  /** @minLength 1 */
  name: string;
}

export interface GreetResponse {
  message: string;
}

export interface Models {
  greetRequest: GreetRequest;
  greetResponse: GreetResponse;
}

export type ModelSchemas = { [K in keyof Models]: ZodType<Models[K]> };

export interface ILibrary {
  greet: (request: GreetRequest) => Promise<GreetResponse>;
  schemas: ModelSchemas;
}
