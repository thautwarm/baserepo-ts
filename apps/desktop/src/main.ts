import { libgreeting } from "@template/libgreeting";
import config from "../deno.json" with { type: "json" };
import { assets } from "./generated/assets.ts";
import { desktopOs, systemInformationCommand, terminationSignals } from "./platform.ts";
import { createHandler } from "./server.ts";
import { createTray } from "./tray.ts";

const name = config.desktop.app.name;
const window = new Deno.BrowserWindow({ title: name, width: 980, height: 780 });
const os = desktopOs(Deno.build.os);
const icon = assets.get("/tray.png");
if (!icon) throw new Error("Missing embedded tray icon");
createTray(name, icon.body, open, quit);

let stopping = false;
async function quit() {
  if (stopping) return;
  stopping = true;
  await server.shutdown();
  // Let the desktop backend perform native cleanup after the last window closes.
  window.close();
}
function open() {
  window.show();
  window.focus();
}
let origin = "";
const handler = createHandler({
  assets,
  origin: () => origin,
  status: async () => ({
    name,
    greeting: (await libgreeting.greet({ name: "from the desktop workspace package" })).message,
    runtime: Deno.version.deno,
    platform: Deno.build.os,
    pid: Deno.pid,
  }),
  native: async () => {
    const { command, args } = systemInformationCommand(os);
    const result = await new Deno.Command(command, {
      args,
      stdout: "piped",
      stderr: "piped",
    }).output();
    return { output: new TextDecoder().decode(result.stdout).trim(), exitCode: result.code };
  },
  quit,
});
const server = Deno.serve({ hostname: "127.0.0.1", port: 0, onListen() {} }, handler);
origin = `http://127.0.0.1:${server.addr.port}`;

window.addEventListener("close", () => {
  void quit();
});
for (const signal of terminationSignals(os))
  Deno.addSignalListener(signal, () => {
    void quit();
  });
