/**
 * Secure preload bridge. Only the listed channels are exposed to the renderer;
 * the renderer cannot reach Node APIs directly.
 */
import { contextBridge, ipcRenderer } from "electron";

const api = {
  // Dialogs
  openFiles: (): Promise<string[]> => ipcRenderer.invoke("dialog:openFiles"),
  openFolder: (): Promise<string | null> => ipcRenderer.invoke("dialog:openFolder"),

  // Library
  scanFolder: (folderPath: string) =>
    ipcRenderer.invoke("library:scanFolder", folderPath) as Promise<
      Array<{
        filePath: string;
        title: string;
        kind: "cbz" | "cbr" | "pdf" | "folder";
        size: number;
        pageCount?: number;
        thumbnail?: string;
      }>
    >,

  // Comic loading
  openComic: (filePath: string): Promise<{ id: string; pageCount: number }> =>
    ipcRenderer.invoke("comic:open", filePath),
  getPage: (id: string, index: number): Promise<string> =>
    ipcRenderer.invoke("comic:getPage", id, index),
  closeComic: (id: string): Promise<void> => ipcRenderer.invoke("comic:close", id),

  // Settings / persistent store
  storeGet: <T = unknown>(key: string): Promise<T> => ipcRenderer.invoke("store:get", key),
  storeSet: (key: string, val: unknown) => ipcRenderer.invoke("store:set", key, val),
  storeDelete: (key: string) => ipcRenderer.invoke("store:delete", key),

  // Cloud
  cloudGetConnected: () => ipcRenderer.invoke("cloud:getConnected"),
  cloudLogin: (provider: string) => ipcRenderer.invoke("cloud:login", provider),
  cloudLogout: (provider: string) => ipcRenderer.invoke("cloud:logout", provider),
  cloudList: (provider: string, folderId?: string) => ipcRenderer.invoke("cloud:list", provider, folderId),
  cloudDownload: (provider: string, fileId: string, fileName: string) => ipcRenderer.invoke("cloud:download", provider, fileId, fileName),
  onCloudProgress: (fileId: string, callback: (percent: number) => void) => {
    const handler = (_e: any, percent: number) => callback(percent);
    ipcRenderer.on(`cloud:downloadProgress:${fileId}`, handler);
    return () => {
      ipcRenderer.removeListener(`cloud:downloadProgress:${fileId}`, handler);
    };
  },

  // Misc
  userDataPath: (): Promise<string> => ipcRenderer.invoke("app:userDataPath"),
  setFullscreen: (value: boolean): Promise<boolean> =>
    ipcRenderer.invoke("window:setFullscreen", value),
  isFullscreen: (): Promise<boolean> => ipcRenderer.invoke("window:isFullscreen"),
  readAsDataUrl: (filePath: string): Promise<string> =>
    ipcRenderer.invoke("file:readAsDataUrl", filePath),
};

contextBridge.exposeInMainWorld("api", api);

export type ElectronApi = typeof api;
