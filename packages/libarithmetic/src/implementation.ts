import { decode, encode } from "@std/msgpack";
import { exchange } from "./runtime.ts";
import { publicModelsSchema } from "./schemas.ts";

const schemas = publicModelsSchema.shape;

export function double(value: bigint): bigint {
  const request = schemas.doubleRequest.parse({ value });
  const reply = schemas.doubleReply.parse(decode(exchange(encode(request))));
  if ("error" in reply) throw new Error(reply.error);
  return reply.value;
}
