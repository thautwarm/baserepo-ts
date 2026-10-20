import { libgreeting } from "@template/libgreeting";

const request = libgreeting.schemas.greetRequest.parse({ name: process.argv[2] ?? "world" });
const response = libgreeting.schemas.greetResponse.parse(await libgreeting.greet(request));
console.log(response.message);
