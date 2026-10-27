export const desktopPlatforms = ["macos", "windows", "linux"] as const;
export type DesktopPlatform = (typeof desktopPlatforms)[number];
type Architecture = "arm64" | "x64";

export function parseDesktopPlatform(value: string | undefined): DesktopPlatform {
  switch (value) {
    case "macos":
    case "windows":
    case "linux":
      return value;
    default:
      throw new Error(`Unsupported desktop platform: ${value}`);
  }
}

function parseArchitecture(value: string): Architecture {
  switch (value) {
    case "arm64":
    case "x64":
      return value;
    default:
      throw new Error(`Unsupported desktop architecture: ${value}`);
  }
}

function targetCpu(architecture: Architecture): string {
  switch (architecture) {
    case "arm64":
      return "aarch64";
    case "x64":
      return "x86_64";
    default:
      return unreachable(architecture);
  }
}

export function desktopTarget(platform: DesktopPlatform, hostArchitecture: string) {
  const architecture = parseArchitecture(hostArchitecture);
  switch (platform) {
    case "macos":
      return { architecture, triple: `${targetCpu(architecture)}-apple-darwin` };
    case "windows":
      return { architecture: "x64", triple: "x86_64-pc-windows-msvc" };
    case "linux":
      return { architecture, triple: `${targetCpu(architecture)}-unknown-linux-gnu` };
    default:
      return unreachable(platform);
  }
}

export function desktopFilenames(platform: DesktopPlatform, name: string) {
  switch (platform) {
    // Deno 2.9.8 appends .app to the output stem.
    case "macos":
      return { output: name, artifact: `${name}.app` };
    case "windows":
      return { output: `${name}.msi`, artifact: `${name}.msi` };
    case "linux":
      return { output: `${name}.AppImage`, artifact: `${name}.AppImage` };
    default:
      return unreachable(platform);
  }
}

function unreachable(value: never): never {
  throw new Error(`Unhandled desktop variant: ${String(value)}`);
}
