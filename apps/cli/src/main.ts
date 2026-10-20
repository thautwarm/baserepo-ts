import * as greeting from "@template/libgreeting";

const request = greeting.schemas.greetRequest.parse({ name: process.argv[2] ?? "world" });
const response = greeting.schemas.greetResponse.parse(await greeting.greet(request));
console.log(response.message);
