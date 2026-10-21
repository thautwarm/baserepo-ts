import type { ILibrary } from "@template/libsalutation/types";
import { checkGreetRequestSyntax } from "./generated/greet-request.ts";
import { checkGreetResponseSyntax } from "./generated/greet-response.ts";
import {
  checkIntegerBatchSyntax,
  parseWireJSON,
  stringifyWireJSON,
} from "./generated/integer-batch.ts";
import { exchange, exchangeIntegers } from "./runtime.ts";
import { publicModelsSchema } from "./schemas.ts";

export const greet: ILibrary["greet"] = (request) => {
  const input = checkGreetRequestSyntax(request);
  if (!input.ok) throw new Error(input.error);
  const output = parseWireJSON(exchange(stringifyWireJSON(input.value)));
  const response = checkGreetResponseSyntax(output);
  if (!response.ok) throw new Error(response.error);
  return publicModelsSchema.shape.greetResponse.parse(response.value);
};

export const roundtripIntegers: ILibrary["roundtripIntegers"] = (batch) => {
  const input = checkIntegerBatchSyntax(batch);
  if (!input.ok) throw new Error(input.error);
  const response = publicModelsSchema.shape.integerBatch.parse(
    parseWireJSON(exchangeIntegers(stringifyWireJSON(input.value))),
  );
  const checked = checkIntegerBatchSyntax(response);
  if (!checked.ok) throw new Error(checked.error);
  return response;
};
