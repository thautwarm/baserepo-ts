export interface StaticAsset {
  readonly body: Uint8Array;
  readonly contentType: string;
}
export type StaticAssets = ReadonlyMap<string, StaticAsset>;

interface HandlerOptions {
  assets: StaticAssets;
  origin: () => string;
  status: () => Promise<unknown>;
  native: () => Promise<{ output: string; exitCode: number }>;
  quit: () => void | Promise<void>;
}

export function createHandler(options: HandlerOptions) {
  const session = crypto.randomUUID();
  return async (request: Request): Promise<Response> => {
    const url = new URL(request.url);
    const origin = options.origin();
    const headers = new Headers({
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    const json = (value: unknown, status = 200) => Response.json(value, { status, headers });
    if (url.origin !== origin || request.headers.get("host") !== new URL(origin).host)
      return json({ error: "Invalid host" }, 403);
    const requestOrigin = request.headers.get("origin");
    if (requestOrigin && requestOrigin !== origin) return json({ error: "Invalid origin" }, 403);
    if (url.pathname.startsWith("/api/")) {
      const cookies = request.headers
        .get("cookie")
        ?.split(";")
        .map((part) => part.trim());
      if (!cookies?.includes(`desktop_session=${session}`))
        return json({ error: "Session required" }, 401);
      if (
        request.method === "POST" &&
        (requestOrigin !== origin || request.headers.get("x-desktop-client") !== "frontend")
      )
        return json({ error: "Invalid client" }, 403);
      if (request.method === "GET" && url.pathname === "/api/status")
        return json(await options.status());
      if (request.method === "POST" && url.pathname === "/api/native")
        return json(await options.native());
      if (request.method === "POST" && url.pathname === "/api/quit") {
        setTimeout(() => {
          void options.quit();
        }, 100);
        return json({ ok: true });
      }
      return json({ error: "Not found" }, 404);
    }
    if (request.method !== "GET" && request.method !== "HEAD")
      return json({ error: "Method not allowed" }, 405);
    const path = url.pathname === "/" ? "/index.html" : url.pathname;
    const asset = options.assets.get(path);
    if (!asset) return json({ error: "Not found" }, 404);
    headers.set("Content-Type", asset.contentType);
    headers.set(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'",
    );
    if (path === "/index.html")
      headers.set("Set-Cookie", `desktop_session=${session}; HttpOnly; SameSite=Strict; Path=/`);
    return new Response(request.method === "HEAD" ? null : new Uint8Array(asset.body), { headers });
  };
}
