import type { ZodType } from "zod";

export interface PublicModels {
  name: string;
}

export interface ILibrary {
  greet(name: string): string;
  schemas: { [K in keyof PublicModels]: ZodType<PublicModels[K]> };
}
