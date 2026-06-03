/**
 * PDF handler. We don't load pdfjs in the main process because pdfjs v4+ is ESM
 * only and is awkward to require from a CommonJS-compiled main process. Instead
 * the main process counts pages with a small parser and returns the raw PDF
 * bytes as a sentinel `pdf:N:<dataUrl>` URL. The renderer (which already has
 * pdfjs available via Vite's ESM pipeline) does the actual rasterization.
 */
import * as fs from "fs/promises";
import type { LoadedComic } from "./index";

function countPdfPages(buf: Buffer): number {
  // PDFs encode their structure in mostly ASCII. Look for /Type /Pages /Count N
  // entries (the page-tree node) — the highest count is the document total.
  // Use 'binary' (latin1) so we can scan the whole buffer without re-encoding.
  const text = buf.toString("binary");

  let total = 0;
  const pagesMatches = text.matchAll(/\/Type\s*\/Pages[\s\S]{0,2048}?\/Count\s+(\d+)/g);
  for (const m of pagesMatches) {
    const n = parseInt(m[1], 10);
    if (n > total) total = n;
  }
  if (total > 0) return total;

  // Fallback: count individual /Type /Page leaves. This is a heuristic, but is
  // correct for the vast majority of generated comic PDFs.
  const leafMatches = text.match(/\/Type\s*\/Page(?![s])/g);
  return leafMatches?.length ?? 1;
}

export async function openPdf(filePath: string): Promise<LoadedComic> {
  const buf = await fs.readFile(filePath);
  const pageCount = countPdfPages(buf);
  const dataUrl = `data:application/pdf;base64,${buf.toString("base64")}`;

  return {
    kind: "pdf",
    pageCount,
    // Renderer recognises the "pdf:" scheme and rasterizes via pdfjs in-page.
    getPage: async (index) => `pdf:${index}:${dataUrl}`,
  };
}
