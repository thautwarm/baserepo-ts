export function createTray(
  name: string,
  icon: Uint8Array,
  open: () => void,
  quit: () => void | Promise<void>,
) {
  const tray = new Deno.Tray();
  if (tray.trayId === 0) {
    console.warn("Native tray unavailable; use the window controls.");
    return undefined;
  }
  tray.setIcon(icon);
  tray.setTooltip(name);
  tray.setMenu([
    { item: { label: "Open application", id: "open", enabled: true } },
    "separator",
    { item: { label: "Quit", id: "quit", enabled: true } },
  ]);
  tray.addEventListener("click", open);
  tray.addEventListener("menuclick", (event) => {
    switch (event.detail.id) {
      case "open":
        open();
        break;
      case "quit":
        void quit();
        break;
    }
  });
  return tray;
}
