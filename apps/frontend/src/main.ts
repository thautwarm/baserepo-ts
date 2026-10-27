import { libgreeting } from "@template/libgreeting";
import "./style.css";

const root = document.querySelector<HTMLElement>("#app");
if (!root) throw new Error("Missing app element");
root.innerHTML = `<p class="eyebrow">TYPESCRIPT · DENO · SYSTEM WEBVIEW</p>
  <h1>Desktop workspace</h1>
  <p id="greeting"></p>
  <section><h2>Local runtime</h2><p id="status">Connecting to the local service…</p></section>
  <section><h2>Native operation</h2><p>Run the fixed system-information command in the Deno process.</p>
  <button id="native">Run native check</button><pre id="output">Ready</pre></section>
  <footer><span>Loopback HTTP · Embedded frontend</span><button id="quit">Quit application</button></footer>`;

const greeting = await libgreeting.greet({ name: "from the frontend workspace package" });
const greetingElement = document.querySelector("#greeting");
if (greetingElement) greetingElement.textContent = greeting.message;

async function request(path: string, method = "GET") {
  const response = await fetch(path, {
    method,
    headers: method === "POST" ? { "x-desktop-client": "frontend" } : {},
  });
  if (!response.ok) throw new Error(`Local service returned ${response.status}`);
  return response;
}

const status = document.querySelector("#status");
try {
  const data = await (await request("/api/status")).json();
  document.title = data.name;
  const heading = document.querySelector("h1");
  if (heading) heading.textContent = data.name;
  if (status)
    status.textContent = `${data.greeting} · Deno ${data.runtime} · ${data.platform} · PID ${data.pid}`;
} catch (error) {
  if (status) status.textContent = `Desktop service unavailable: ${String(error)}`;
}

document.querySelector("#native")?.addEventListener("click", async () => {
  const output = document.querySelector("#output");
  if (!output) return;
  try {
    const result = await (await request("/api/native", "POST")).json();
    output.textContent = `${result.output}\nExit code: ${result.exitCode}`;
  } catch (error) {
    output.textContent = String(error);
  }
});
document.querySelector("#quit")?.addEventListener("click", () => {
  void request("/api/quit", "POST").catch(() => {});
});
