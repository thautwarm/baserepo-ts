import type { ZodType } from "zod";
import type { PublicModels } from "./generated/public-models.ts";

export type { PublicModels } from "./generated/public-models.ts";

export type GreetRequest = PublicModels["greetRequest"];

export type Recipient = GreetRequest["recipients"][number];

export type GreetResponse = PublicModels["greetResponse"];

export type Greeting = GreetResponse["greetings"][number];

export type IntegerBatch = PublicModels["integerBatch"];

export type Integers = IntegerBatch["values"];

export interface ILibrary {
  greet(request: GreetRequest): GreetResponse;
  roundtripIntegers(batch: IntegerBatch): IntegerBatch;
  schemas: { [K in keyof PublicModels]: ZodType<PublicModels[K]> };
}
