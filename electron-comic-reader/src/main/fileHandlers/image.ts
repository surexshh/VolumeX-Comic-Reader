/**
 * Single image handler. Returns a comicpage:// URL pointing at the file.
 */
import type { LoadedComic } from "./index";
import { fileToComicPageUrl } from "./folder";

export async function openImage(filePath: string): Promise<LoadedComic> {
  const url = fileToComicPageUrl(filePath);
  return {
    kind: "image",
    pageCount: 1,
    getPage: async () => url,
  };
}
