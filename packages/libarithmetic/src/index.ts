import type { ILibrary } from "@template/libarithmetic/types";
import { double } from "./runtime.ts";
import { publicModelsSchema } from "./schemas.ts";

export const libarithmetic: ILibrary = { double, schemas: publicModelsSchema.shape };
