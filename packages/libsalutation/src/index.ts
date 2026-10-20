import type { ILibrary } from "@template/libsalutation/types";
import { greet } from "./runtime.ts";
import { publicModelsSchema } from "./schemas.ts";

export const libsalutation: ILibrary = { greet, schemas: publicModelsSchema.shape };
