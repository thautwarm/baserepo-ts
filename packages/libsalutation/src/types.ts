import type { ZodType } from "zod";

export interface Recipient {
  name: string;
}

export interface GreetRequest {
  recipients: Recipient[];
}

export interface Greeting {
  message: string;
}

export interface GreetResponse {
  greetings: Greeting[];
}

export interface PublicModels {
  greetRequest: GreetRequest;
  greetResponse: GreetResponse;
}

export interface ILibrary {
  greet(request: GreetRequest): GreetResponse;
  schemas: { [K in keyof PublicModels]: ZodType<PublicModels[K]> };
}
