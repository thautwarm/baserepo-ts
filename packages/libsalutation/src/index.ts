import type { ILibrary } from "@template/libsalutation/types";
import { greet } from "./implementation.ts";
import { publicModelsSchema } from "./schemas.ts";

export const libsalutation: ILibrary = { greet, schemas: publicModelsSchema.shape };
