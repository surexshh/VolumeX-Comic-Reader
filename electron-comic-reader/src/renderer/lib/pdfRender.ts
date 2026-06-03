/**
 * Renderer-side PDF rasterization using pdfjs-dist. The main process returns
 * the raw PDF as a data URL once and we render each page on demand.
 */
import * as pdfjs from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl as unknown as string;

const docCache = new Map<string, Promise<any>>();
const pageCache = new Map<string, string>();

function getDoc(dataUrl: string) {
  if (docCache.has(dataUrl)) return docCache.get(dataUrl)!;
  const promise = (async () => {
    const bin = atob(dataUrl.split(",")[1]);
    const buf = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
    return pdfjs.getDocument({ data: buf }).promise;
  })();
  docCache.set(dataUrl, promise);
  return promise;
}

export async function renderPdfPage(dataUrl: string, index: number, scale = 2): Promise<string> {
  const cacheKey = `${dataUrl.slice(0, 64)}:${index}`;
  if (pageCache.has(cacheKey)) return pageCache.get(cacheKey)!;

  const doc = await getDoc(dataUrl);
  const page = await doc.getPage(index + 1);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("ctx");
  await page.render({ canvasContext: ctx, viewport, canvas }).promise;
  const url = await new Promise<string>((resolve) => {
    canvas.toBlob(
      (b) => {
        if (!b) throw new Error("toBlob");
        resolve(URL.createObjectURL(b));
      },
      "image/jpeg",
      0.9
    );
  });
  pageCache.set(cacheKey, url);
  return url;
}
