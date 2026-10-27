export interface DesktopStatus {
  name: string;
  greeting: string;
  runtime: string;
  platform: string;
  pid: number;
}

export interface NativeResult {
  output: string;
  exitCode: number;
}

async function request(path: string, options?: RequestInit): Promise<Response> {
  const response = await fetch(path, options);
  if (!response.ok) throw new Error(`Desktop service returned ${response.status}`);
  return response;
}

function post(path: string) {
  return request(path, {
    method: "POST",
    headers: { "x-desktop-client": "frontend" },
  });
}

export const desktopClient = {
  async status(signal: AbortSignal): Promise<DesktopStatus> {
    return (await request("/api/status", { signal })).json();
  },
  async runNative(): Promise<NativeResult> {
    return (await post("/api/native")).json();
  },
  async quit(): Promise<void> {
    await post("/api/quit");
  },
};
