/**
 * CBR / RAR handler. Uses node-unrar-js (pure-JS WASM) so no native binary is needed.
 */
import * as fs from "fs/promises";
import { createExtractorFromData } from "node-unrar-js";
import type { LoadedComic } from "./index";

const IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "webp", "gif", "bmp", "avif"]);
const MAX_CACHE = 16;

function isImage(name: string): boolean {
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

export async function openCbr(filePath: string): Promise<LoadedComic> {
  const buf = await fs.readFile(filePath);
  const data = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
  const extractor = await createExtractorFromData({ data });
  const list = extractor.getFileList();
  const headers = [...list.fileHeaders]
    .filter((h) => !h.flags.directory && isImage(h.name))
    .sort((a, b) => naturalSort(a.name, b.name));

  const cache = new Map<number, string>();
  const order: number[] = [];

  const getPage = async (index: number): Promise<string> => {
    if (cache.has(index)) return cache.get(index)!;
    const header = headers[index];
    if (!header) throw new Error(`Page ${index} not in archive`);
    const extracted = extractor.extract({ files: [header.name] });
    const file = [...extracted.files][0];
    if (!file?.extraction) throw new Error(`Failed to extract page ${index}`);
    const buffer = Buffer.from(file.extraction);
    const url = `data:${mimeFor(header.name)};base64,${buffer.toString("base64")}`;
    cache.set(index, url);
    order.push(index);
    if (order.length > MAX_CACHE) {
      const evicted = order.shift()!;
      cache.delete(evicted);
    }
    return url;
  };

  return {
    kind: "cbr",
    pageCount: headers.length,
    getPage,
    dispose: () => {
      cache.clear();
      order.length = 0;
    },
  };
}

export async function readCbrCover(filePath: string): Promise<string | null> {
  try {
    const c = await openCbr(filePath);
    if (!c.pageCount) return null;
    const cover = await c.getPage(0);
    await c.dispose?.();
    return cover;
  } catch {
    return null;
  }
}
