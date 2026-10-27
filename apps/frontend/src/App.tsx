import { libgreeting } from "@template/libgreeting";
import { useEffect, useState } from "react";
import { type DesktopStatus, desktopClient } from "./desktop-client.ts";
import { NativeCheck } from "./NativeCheck.tsx";

type PageState =
  | { kind: "loading" }
  | { kind: "ready"; greeting: string; desktop: DesktopStatus }
  | { kind: "failed"; message: string };

export function App() {
  const [state, setState] = useState<PageState>({ kind: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    void Promise.all([
      libgreeting.greet({ name: "from the React workspace package" }),
      desktopClient.status(controller.signal),
    ])
      .then(([greeting, desktop]) => {
        if (controller.signal.aborted) return;
        document.title = desktop.name;
        setState({ kind: "ready", greeting: greeting.message, desktop });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setState({ kind: "failed", message: String(error) });
      });
    return () => controller.abort();
  }, []);

  return (
    <main>
      <p className="eyebrow">REACT · TYPESCRIPT · DENO · SYSTEM WEBVIEW</p>
      <PageContent state={state} />
    </main>
  );
}

function PageContent({ state }: { state: PageState }) {
  switch (state.kind) {
    case "loading":
      return <p role="status">Connecting to the desktop service…</p>;
    case "failed":
      return <p role="alert">{state.message}</p>;
    case "ready":
      return (
        <>
          <h1>{state.desktop.name}</h1>
          <p>{state.greeting}</p>
          <section>
            <h2>Local runtime</h2>
            <p>
              {state.desktop.greeting} · Deno {state.desktop.runtime} · {state.desktop.platform} ·
              PID {state.desktop.pid}
            </p>
          </section>
          <NativeCheck />
          <footer>
            <span>React + TSX · Embedded frontend</span>
            <button
              type="button"
              onClick={() => {
                void desktopClient.quit().catch(() => {});
              }}
            >
              Quit application
            </button>
          </footer>
        </>
      );
    default:
      return unreachable(state);
  }
}

function unreachable(value: never): never {
  throw new Error(`Unhandled page state: ${String(value)}`);
}
