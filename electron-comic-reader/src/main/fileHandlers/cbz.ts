/**
 * CBZ / ZIP handler. Uses jszip to extract images on demand.
 * Pages are returned as data URLs and cached up to MAX_CACHE entries.
 */
import * as fs from "fs/promises";
import * as path from "path";
import JSZip from "jszip";
import type { LoadedComic } from "./index";

const IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "webp", "gif", "bmp", "avif"]);
const MAX_CACHE = 16;

function isImage(name: string): boolean {
  if (name.startsWith("__MACOSX")) return false;
  const lower = name.toLowerCase();
  if (lower.includes("/.")) return false;
  const ext = lower.split(".").pop() ?? "";
  return IMAGE_EXTS.has(ext);
}

function naturalSort(a: string, b: string) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

function mimeFor(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return ({
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
    bmp: "image/bmp",
    avif: "image/avif",
  } as Record<string, string>)[ext] ?? "image/jpeg";
}

export async function openCbz(filePath: string): Promise<LoadedComic> {
  const buf = await fs.readFile(filePath);
  const zip = await JSZip.loadAsync(buf);
  const entries = Object.values(zip.files)
    .filter((f) => !f.dir && isImage(f.name))
    .sort((a, b) => naturalSort(a.name, b.name));

  const cache = new Map<number, string>();
  const order: number[] = [];

  const getPage = async (index: number): Promise<string> => {
    if (cache.has(index)) return cache.get(index)!;
    const entry = entries[index];
    if (!entry) throw new Error(`Page ${index} not in archive`);
    const data = await entry.async("nodebuffer");
    const url = `data:${mimeFor(entry.name)};base64,${data.toString("base64")}`;
    cache.set(index, url);
    order.push(index);
    if (order.length > MAX_CACHE) {
      const evicted = order.shift()!;
      cache.delete(evicted);
    }
    return url;
  };

  return {
    kind: "cbz",
    pageCount: entries.length,
    getPage,
    dispose: () => {
      cache.clear();
      order.length = 0;
    },
  };
}

// Used by folder scanner to grab a fast cover thumbnail
export async function readCbzCover(filePath: string): Promise<string | null> {
  try {
    const c = await openCbz(filePath);
    if (!c.pageCount) return null;
    const cover = await c.getPage(0);
    await c.dispose?.();
    return cover;
  } catch {
    return null;
  }
}
