/**
 * IPC handlers exposed to the renderer via the secure preload bridge.
 *
 * Channels:
 *   dialog:openFiles      → string[] of file paths
 *   dialog:openFolder     → string | null directory path
 *   library:scanFolder    → ScannedItem[] with metadata
 *   comic:open            → { id, pageCount }
 *   comic:getPage         → string (data URL or comicpage:// URL)
 *   comic:close           → void
 *   store:get / store:set → persistent settings & library state
 *
 * The custom `comicpage://` protocol streams files from the user's disk into
 * the renderer without exposing arbitrary fs access to web content.
 */
import { app, BrowserWindow, dialog, ipcMain, protocol } from "electron";
import * as path from "path";
import * as fs from "fs/promises";
import Store from "electron-store";
import { scanFolder, type ScannedItem } from "./fileHandlers/folder";
import { getConnectedProviders } from "./cloudAuth";
import * as gdrive from "./cloudServices/gdrive";
import { openComic, getComicPage, type LoadedComic } from "./fileHandlers";

const store = new Store({ name: "library" });

/** In-memory map of opened comic id → loaded handle. */
const openComics = new Map<string, LoadedComic>();

/**
 * Register the comicpage:// scheme as privileged. MUST be called BEFORE
 * `app.whenReady()` resolves — the schemes are sealed once the app is ready.
 */
export function registerPrivilegedSchemes() {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: "comicpage",
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        stream: true,
        bypassCSP: true,
      },
    },
  ]);
}

export function registerIpcHandlers() {
  // Custom file:// passthrough for arbitrary user-opened files. URLs are shaped
  // as `comicpage://local/<encoded forward-slash path>` — putting the path in
  // the URL pathname (not the host) so that Chromium's URL parser doesn't
  // reject Windows drive letters / backslashes.
  protocol.handle("comicpage", async (request) => {
    let filePath = "";
    try {
      const u = new URL(request.url);
      // Strip the leading `/` from the pathname, then percent-decode.
      const encoded = u.pathname.replace(/^\//, "");
      filePath = decodeURIComponent(encoded);
      // Node accepts both `/` and `\` separators on Windows, so no further
      // normalization is required.
      const data = await fs.readFile(filePath);
      const ext = path.extname(filePath).slice(1).toLowerCase();
      const mime =
        (
          {
            jpg: "image/jpeg",
            jpeg: "image/jpeg",
            png: "image/png",
            webp: "image/webp",
            gif: "image/gif",
            bmp: "image/bmp",
            avif: "image/avif",
          } as Record<string, string>
        )[ext] ?? "application/octet-stream";
      return new Response(new Uint8Array(data), {
        status: 200,
        headers: {
          "Content-Type": mime,
          "Cache-Control": "no-cache",
        },
      });
    } catch (err) {
      console.error("[comicpage] failed to read", filePath || request.url, err);
      return new Response("Not found", { status: 404 });
    }
  });

  // ---- File dialogs ----
  ipcMain.handle("dialog:openFiles", async () => {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) return [];
    const res = await dialog.showOpenDialog(win, {
      title: "Open comic",
      properties: ["openFile", "multiSelections"],
      filters: [
        {
          name: "Comics",
          extensions: ["cbz", "cbr", "zip", "pdf", "jpg", "jpeg", "png", "webp", "gif", "bmp", "avif"],
        },
        { name: "All Files", extensions: ["*"] },
      ],
    });
    return res.canceled ? [] : res.filePaths;
  });

  ipcMain.handle("dialog:openFolder", async () => {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) return null;
    const res = await dialog.showOpenDialog(win, {
      title: "Choose folder",
      properties: ["openDirectory"],
    });
    return res.canceled ? null : res.filePaths[0];
  });

  // ---- Library scanning ----
  ipcMain.handle("library:scanFolder", async (_e, folderPath: string): Promise<ScannedItem[]> => {
    return scanFolder(folderPath);
  });

  // ---- Comic loading ----
  ipcMain.handle(
    "comic:open",
    async (_e, filePath: string): Promise<{ id: string; pageCount: number }> => {
      const comic = await openComic(filePath);
      const id = `${filePath}#${Date.now()}`;
      openComics.set(id, comic);
      return { id, pageCount: comic.pageCount };
    }
  );

  ipcMain.handle("comic:getPage", async (_e, id: string, index: number): Promise<string> => {
    const comic = openComics.get(id);
    if (!comic) throw new Error(`Comic not opened: ${id}`);
    return getComicPage(comic, index);
  });

  ipcMain.handle("comic:close", async (_e, id: string) => {
    const c = openComics.get(id);
    if (c?.dispose) await c.dispose();
    openComics.delete(id);
  });

  // ---- Persistent store ----
  ipcMain.handle("store:get", async (_e, key: string) => {
    return store.get(key);
  });

  // ---- Cloud Integrations ----
  ipcMain.handle("cloud:getConnected", async () => {
    return getConnectedProviders();
  });

  ipcMain.handle("cloud:login", async (_e, provider: string) => {
    if (provider === "gdrive") {
      await gdrive.login();
      return true;
    }
    throw new Error(`Provider ${provider} not implemented yet`);
  });

  ipcMain.handle("cloud:logout", async (_e, provider: string) => {
    if (provider === "gdrive") {
      await gdrive.logout();
      return true;
    }
  });

  ipcMain.handle("cloud:list", async (_e, provider: string, folderId?: string) => {
    if (provider === "gdrive") {
      return gdrive.listFiles(folderId);
    }
    return [];
  });

  // The renderer listens for "cloud:downloadProgress" during this
  ipcMain.handle("cloud:download", async (event, provider: string, fileId: string, fileName: string) => {
    if (provider === "gdrive") {
      return gdrive.downloadFile(fileId, fileName, (progress) => {
        event.sender.send(`cloud:downloadProgress:${fileId}`, progress);
      });
    }
    throw new Error(`Provider ${provider} not implemented`);
  });

  ipcMain.handle("store:set", async (_e, key: string, value: unknown) => {
    store.set(key, value as never);
  });

  ipcMain.handle("store:delete", async (_e, key: string) => {
    store.delete(key);
  });

  // ---- App actions ----
  ipcMain.handle("app:userDataPath", async () => app.getPath("userData"));

  ipcMain.handle("window:setFullscreen", async (event, value: boolean) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return false;
    win.setFullScreen(value);
    return win.isFullScreen();
  });

  ipcMain.handle("window:isFullscreen", async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    return win?.isFullScreen() ?? false;
  });

  ipcMain.handle("file:readAsDataUrl", async (_e, filePath: string) => {
    const data = await fs.readFile(filePath);
    const ext = path.extname(filePath).slice(1).toLowerCase();
    const mime =
      (
        {
          jpg: "image/jpeg",
          jpeg: "image/jpeg",
          png: "image/png",
          webp: "image/webp",
          gif: "image/gif",
          bmp: "image/bmp",
          avif: "image/avif",
        } as Record<string, string>
      )[ext] ?? "application/octet-stream";
    return `data:${mime};base64,${data.toString("base64")}`;
  });
}
