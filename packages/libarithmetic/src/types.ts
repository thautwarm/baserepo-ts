import type { ZodType } from "zod";

export interface DoubleRequest {
  /** @schema union([z.int(), z.bigint()]).transform(v => BigInt(v)).pipe(z.int64()) */
  value: bigint;
}

export type DoubleReply =
  | {
      /** @schema union([z.int(), z.bigint()]).transform(v => BigInt(v)).pipe(z.int64()) */
      value: bigint;
    }
  | { error: string };

export interface PublicModels {
  doubleRequest: DoubleRequest;
  doubleReply: DoubleReply;
}

export interface ILibrary {
  /** Doubles a signed 64-bit integer; throws if the result overflows i64. */
  double(value: bigint): bigint;
  schemas: { [K in keyof PublicModels]: ZodType<PublicModels[K]> };
}
