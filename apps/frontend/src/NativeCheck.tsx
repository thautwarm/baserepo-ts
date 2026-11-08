import { useState } from "react";
import { desktopClient, type NativeResult } from "./desktop-client.ts";

type NativeState =
  | { kind: "idle" }
  | { kind: "running" }
  | { kind: "complete"; result: NativeResult }
  | { kind: "failed"; message: string };

export function NativeCheck() {
  const [state, setState] = useState<NativeState>({ kind: "idle" });

  async function run() {
    setState({ kind: "running" });
    try {
      setState({ kind: "complete", result: await desktopClient.runNative() });
    } catch (error) {
      setState({ kind: "failed", message: String(error) });
    }
  }

  return (
    <section>
      <h2>Native operation</h2>
      <p>Run the fixed system-information command in the Deno process.</p>
      <button
        type="button"
        disabled={state.kind === "running"}
        onClick={() => {
          void run();
        }}
      >
        Run native check
      </button>
      <pre aria-live="polite">{nativeOutput(state)}</pre>
    </section>
  );
}

function nativeOutput(state: NativeState): string {
  switch (state.kind) {
    case "idle":
      return "Ready";
    case "running":
      return "Running…";
    case "complete":
      return `${state.result.output}\nExit code: ${state.result.exitCode}`;
    case "failed":
      return state.message;
    default:
      return unreachable(state);
  }
}

function unreachable(value: never): never {
  throw new Error(`Unhandled native state: ${String(value)}`);
}
