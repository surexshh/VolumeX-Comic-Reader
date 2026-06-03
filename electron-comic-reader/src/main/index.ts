/**
 * Electron main process entry.
 *
 * Single-window approach — the startup experience is handled entirely
 * by StartupOverlay.tsx inside the React app (no second window).
 *
 * Anti-flicker: backgroundColor '#091413' + show on 'ready-to-show'
 * so the window never renders white before React hydrates.
 */
import { app, BrowserWindow, shell } from "electron";
import * as path from "path";
import { registerIpcHandlers, registerPrivilegedSchemes } from "./ipcHandlers";

process.on("uncaughtException",  (err)    => console.error("[main] uncaughtException:",  err));
process.on("unhandledRejection", (reason) => console.error("[main] unhandledRejection:", reason));

registerPrivilegedSchemes();

const isDev = process.env.NODE_ENV === "development";

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width:           1280,
    height:          820,
    minWidth:        800,
    minHeight:       600,
    /* Prevent white flash — matches our dark theme exactly */
    backgroundColor: "#091413",
    /* Hidden until content is painted — no blank white frame */
    show:            false,
    autoHideMenuBar: true,
    webPreferences: {
      preload:          path.join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration:  false,
      sandbox:          false,
    },
  });

  /* Show only once the first paint is ready */
  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
    if (isDev) {
      mainWindow?.webContents.openDevTools({ mode: "detach" });
    }
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => { mainWindow = null; });
}

app.whenReady().then(() => {
  registerIpcHandlers();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
