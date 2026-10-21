import type { ILibrary } from "@template/libsalutation/types";
import { greet, roundtripIntegers } from "./implementation.ts";
import { publicModelsSchema } from "./schemas.ts";

export const libsalutation: ILibrary = {
  greet,
  roundtripIntegers,
  schemas: publicModelsSchema.shape,
};
