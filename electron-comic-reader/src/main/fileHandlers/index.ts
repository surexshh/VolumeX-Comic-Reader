/**
 * Format dispatcher. Detects file kind and delegates to a format handler.
 * Each handler returns a LoadedComic exposing `pageCount` and `getPage(i)`.
 */
import * as path from "path";
import * as fs from "fs/promises";
import { openCbz } from "./cbz";
import { openCbr } from "./cbr";
import { openPdf } from "./pdf";
import { openImage } from "./image";
import { openImageFolder } from "./folder";

export type ComicKind = "cbz" | "cbr" | "pdf" | "image" | "folder";

export interface LoadedComic {
  kind: ComicKind;
  pageCount: number;
  /** Returns a data URL (or comicpage:// URL) for the given page index. */
  getPage: (index: number) => Promise<string>;
  dispose?: () => Promise<void> | void;
}

const IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "webp", "gif", "bmp", "avif"]);

export async function openComic(filePath: string): Promise<LoadedComic> {
  const stat = await fs.stat(filePath);
  if (stat.isDirectory()) return openImageFolder(filePath);

  const ext = path.extname(filePath).slice(1).toLowerCase();
  if (ext === "cbz" || ext === "zip") return openCbz(filePath);
  if (ext === "cbr" || ext === "rar") return openCbr(filePath);
  if (ext === "pdf") return openPdf(filePath);
  if (IMAGE_EXTS.has(ext)) return openImage(filePath);

  throw new Error(`Unsupported comic file: ${filePath}`);
}

export async function getComicPage(comic: LoadedComic, index: number): Promise<string> {
  if (index < 0 || index >= comic.pageCount) {
    throw new Error(`Page index out of range: ${index}`);
  }
  return comic.getPage(index);
}
