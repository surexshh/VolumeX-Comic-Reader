/**
 * Folder handlers:
 *   - openImageFolder: treats a directory of images as a single comic
 *   - scanFolder: walks a directory looking for comics + image folders to add to library
 */
import * as fs from "fs/promises";
import * as path from "path";
import type { LoadedComic } from "./index";
import { readCbzCover } from "./cbz";
import { readCbrCover } from "./cbr";

const IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "webp", "gif", "bmp", "avif"]);
const COMIC_EXTS = new Set(["cbz", "cbr", "zip", "rar", "pdf"]);

function naturalSort(a: string, b: string) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

function isImage(name: string): boolean {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return IMAGE_EXTS.has(ext);
}

/**
 * Build a `comicpage://local/<encoded>` URL. We normalize backslashes to forward
 * slashes so Chromium's URL parser is happy, and percent-encode the entire path
 * so spaces/unicode/etc round-trip correctly.
 */
export function fileToComicPageUrl(filePath: string): string {
  const norm = filePath.replace(/\\/g, "/");
  return `comicpage://local/${encodeURIComponent(norm)}`;
}

export async function openImageFolder(folder: string): Promise<LoadedComic> {
  const entries = (await fs.readdir(folder, { withFileTypes: true }))
    .filter((d) => d.isFile() && isImage(d.name))
    .map((d) => path.join(folder, d.name))
    .sort(naturalSort);

  return {
    kind: "folder",
    pageCount: entries.length,
    getPage: async (index) => fileToComicPageUrl(entries[index]),
  };
}

export interface ScannedItem {
  filePath: string;
  title: string;
  kind: "cbz" | "cbr" | "pdf" | "folder";
  size: number;
  pageCount?: number;
  thumbnail?: string;
}

/**
 * Scan a folder recursively (depth-limited) for comic files and image folders.
 * Image folders are detected as: a directory containing > 1 image files and no
 * subdirectories.
 */
export async function scanFolder(root: string, depth = 4): Promise<ScannedItem[]> {
  const results: ScannedItem[] = [];

  async function walk(dir: string, level: number): Promise<void> {
    if (level > depth) return;
    let dirents;
    try {
      dirents = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    const subdirs = dirents.filter((d) => d.isDirectory());
    const files = dirents.filter((d) => d.isFile());
    const images = files.filter((f) => isImage(f.name));

    // If this directory looks like an image folder (has images, no nested dirs)
    if (images.length > 1 && subdirs.length === 0) {
      const filePath = dir;
      const sizes = await Promise.all(
        images.map(async (i) => (await fs.stat(path.join(dir, i.name))).size)
      );
      const totalSize = sizes.reduce((a, b) => a + b, 0);
      const cover = [...images].sort((a, b) => naturalSort(a.name, b.name))[0];
      results.push({
        filePath,
        title: path.basename(dir),
        kind: "folder",
        size: totalSize,
        pageCount: images.length,
        thumbnail: fileToComicPageUrl(path.join(dir, cover.name)),
      });
      return;
    }

    // Otherwise, walk files looking for comics
    for (const f of files) {
      const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
      if (!COMIC_EXTS.has(ext)) continue;
      const filePath = path.join(dir, f.name);
      const stat = await fs.stat(filePath);
      let kind: ScannedItem["kind"] = "cbz";
      if (ext === "cbr" || ext === "rar") kind = "cbr";
      else if (ext === "pdf") kind = "pdf";
      let thumbnail: string | undefined;
      if (kind === "cbz") thumbnail = (await readCbzCover(filePath)) ?? undefined;
      else if (kind === "cbr") thumbnail = (await readCbrCover(filePath)) ?? undefined;
      results.push({
        filePath,
        title: f.name.replace(/\.[^.]+$/, ""),
        kind,
        size: stat.size,
        thumbnail,
      });
    }

    // Recurse into subdirectories
    for (const sd of subdirs) {
      await walk(path.join(dir, sd.name), level + 1);
    }
  }

  await walk(root, 0);
  return results.sort((a, b) => naturalSort(a.title, b.title));
}
