import type { ZodType } from "zod";

export interface PublicModels {
  operand: number;
}

export interface ILibrary {
  double(value: number): number;
  schemas: { [K in keyof PublicModels]: ZodType<PublicModels[K]> };
}
