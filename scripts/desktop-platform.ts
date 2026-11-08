export const desktopPlatforms = ["macos", "windows", "linux"] as const;
export type DesktopPlatform = (typeof desktopPlatforms)[number];
type Architecture = "arm64" | "x64";
export type DesktopPackageFormat = "app" | "dmg" | "msi" | "appimage" | "deb" | "rpm" | "directory";
export interface DesktopPackageFormats {
  macos?: "app" | "dmg";
  windows?: "msi" | "directory";
  linux?: "appimage" | "deb" | "rpm" | "directory";
}

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

export function defaultDesktopFormat(platform: DesktopPlatform): DesktopPackageFormat {
  switch (platform) {
    case "macos":
      return "app";
    case "windows":
      return "msi";
    case "linux":
      return "appimage";
    default:
      return unreachable(platform);
  }
}

export function parseDesktopFormat(value: string | undefined): DesktopPackageFormat {
  switch (value) {
    case "app":
    case "dmg":
    case "msi":
    case "appimage":
    case "deb":
    case "rpm":
    case "directory":
      return value;
    default:
      throw new Error(`Unsupported desktop package format: ${value}`);
  }
}

export function desktopFilenames(format: DesktopPackageFormat, name: string) {
  switch (format) {
    // Deno 2.9.8 appends .app to the output stem.
    case "app":
      return { output: name, artifact: `${name}.app` };
    case "dmg":
      return { output: `${name}.dmg`, artifact: `${name}.dmg` };
    case "msi":
      return { output: `${name}.msi`, artifact: `${name}.msi` };
    case "appimage":
      return { output: `${name}.AppImage`, artifact: `${name}.AppImage` };
    case "deb":
      return { output: `${name}.deb`, artifact: `${name}.deb` };
    case "rpm":
      return { output: `${name}.rpm`, artifact: `${name}.rpm` };
    case "directory":
      return { output: name, artifact: name };
    default:
      return unreachable(format);
  }
}

function unreachable(value: never): never {
  throw new Error(`Unhandled desktop variant: ${String(value)}`);
}
