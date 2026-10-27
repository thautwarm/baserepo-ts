type DesktopOs = "darwin" | "windows" | "linux";

export function desktopOs(value: string): DesktopOs {
  switch (value) {
    case "darwin":
    case "windows":
    case "linux":
      return value;
    default:
      throw new Error(`Unsupported desktop OS: ${value}`);
  }
}

export function systemInformationCommand(os: DesktopOs) {
  switch (os) {
    case "windows":
      return { command: "cmd.exe", args: ["/c", "ver"] };
    case "darwin":
    case "linux":
      return { command: "uname", args: ["-sm"] };
    default:
      return unreachable(os);
  }
}

export function terminationSignals(os: DesktopOs): readonly ("SIGINT" | "SIGTERM")[] {
  switch (os) {
    case "windows":
      return ["SIGINT"];
    case "darwin":
    case "linux":
      return ["SIGINT", "SIGTERM"];
    default:
      return unreachable(os);
  }
}

function unreachable(value: never): never {
  throw new Error(`Unhandled desktop OS: ${String(value)}`);
}
