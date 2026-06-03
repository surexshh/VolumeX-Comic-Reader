import { useCallback, useEffect, useState } from "react";
import { cache, addItems, removeItem, type LibraryItem } from "./library";

export interface FolderConfig {
  path: string;
  addedAt: number;
  lastScanned: number;
  comicCount: number;
  status: "idle" | "scanning" | "error";
}

type Listener = () => void;
const listeners = new Set<Listener>();
let foldersCache: FolderConfig[] = [];

async function loadFolders(): Promise<FolderConfig[]> {
  const data = (await window.api.storeGet<FolderConfig[]>("folders")) ?? [];
  foldersCache = data.map(f => ({ ...f, status: "idle" }));
  listeners.forEach((l) => l());
  return foldersCache;
}

async function persistFolders() {
  await window.api.storeSet("folders", foldersCache.map(f => ({ ...f, status: "idle" })));
  listeners.forEach((l) => l());
}

/**
 * Scan a single folder:
 * 1. Find new files.
 * 2. Find deleted files and remove them from library.
 * 3. Update folder comicCount.
 */
export async function scanFolderConfig(path: string) {
  // Mark scanning
  foldersCache = foldersCache.map(f => f.path === path ? { ...f, status: "scanning" } : f);
  listeners.forEach((l) => l());

  try {
    const scannedItems = await window.api.scanFolder(path);
    const scannedPaths = new Set(scannedItems.map(i => i.filePath));
    
    // Find items in our DB that belong to this folder but no longer exist on disk
    const existingInDb = cache.filter(c => c.filePath.startsWith(path));
    const toRemove = existingInDb.filter(c => !scannedPaths.has(c.filePath));
    
    for (const item of toRemove) {
      await removeItem(item.id);
    }

    // Add new ones
    if (scannedItems.length > 0) {
      await addItems(scannedItems);
    }

    // Update folder stats
    foldersCache = foldersCache.map(f => {
      if (f.path === path) {
        return {
          ...f,
          status: "idle",
          lastScanned: Date.now(),
          comicCount: scannedItems.length
        };
      }
      return f;
    });
    await persistFolders();

  } catch (err) {
    console.error(`Failed to scan folder ${path}:`, err);
    foldersCache = foldersCache.map(f => f.path === path ? { ...f, status: "error" } : f);
    listeners.forEach((l) => l());
  }
}

/**
 * Perform a background sync of all managed folders.
 */
export async function scanAllFolders() {
  for (const f of foldersCache) {
    await scanFolderConfig(f.path);
  }
}

async function addFolder(path: string) {
  if (foldersCache.some(f => f.path === path)) return; // prevent duplicate
  
  const newFolder: FolderConfig = {
    path,
    addedAt: Date.now(),
    lastScanned: 0,
    comicCount: 0,
    status: "idle"
  };
  
  foldersCache = [...foldersCache, newFolder];
  await persistFolders();
  
  // Immediately scan
  await scanFolderConfig(path);
}

async function removeFolder(path: string) {
  foldersCache = foldersCache.filter(f => f.path !== path);
  await persistFolders();
}

export function useFolders() {
  const [, set] = useState(0);
  useEffect(() => {
    const fn = () => set((v) => v + 1);
    listeners.add(fn);
    if (!foldersCache.length) loadFolders();
    else fn();
    return () => {
      listeners.delete(fn);
    };
  }, []);
  
  return {
    folders: foldersCache,
    addFolder: useCallback(addFolder, []),
    removeFolder: useCallback(removeFolder, []),
    scanFolder: useCallback(scanFolderConfig, []),
    scanAll: useCallback(scanAllFolders, []),
  };
}

// Auto-scan on boot (debounce a bit to not block startup rendering)
setTimeout(() => {
  loadFolders().then(() => {
    scanAllFolders();
  });
}, 2000);
