type WorkerRequest = {
  id: string;
  pageIndex: number;
  imageUrl: string;
  languageHint: string;
};

type WorkerDialogue = {
  id: string;
  pageIndex: number;
  text: string;
  confidence: number;
  bounds: { x: number; y: number; width: number; height: number };
  speakerHint: "left" | "center" | "right" | "narrator";
};

type WorkerResponse = {
  id: string;
  pageIndex: number;
  engine: "text-detector" | "tesseract" | "unavailable";
  dialogues: WorkerDialogue[];
  error?: string;
};

type TextDetectorLike = new () => {
  detect: (source: ImageBitmap) => Promise<Array<{ rawValue?: string; boundingBox?: DOMRectReadOnly }>>;
};

type TesseractLike = {
  recognize: (
    image: ImageBitmap | Blob,
    language?: string
  ) => Promise<{
    data?: {
      text?: string;
      words?: TesseractWord[];
    };
  }>;
};

type TesseractWord = {
  text?: string;
  confidence?: number;
  bbox?: { x0: number; y0: number; x1: number; y1: number };
};

const ctx = self as DedicatedWorkerGlobalScope & {
  TextDetector?: TextDetectorLike;
  Tesseract?: TesseractLike;
};

ctx.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const { id, pageIndex, imageUrl, languageHint } = event.data;
  try {
    const blob = await fetch(imageUrl).then((res) => res.blob());
    const bitmap = await createImageBitmap(blob);

    if (ctx.TextDetector) {
      const detector = new ctx.TextDetector();
      const results = await detector.detect(bitmap);
      ctx.postMessage({
        id,
        pageIndex,
        engine: "text-detector",
        dialogues: results
          .map((result, index) => toDialogue(pageIndex, index, result.rawValue ?? "", result.boundingBox, bitmap.width, bitmap.height, 0.82))
          .filter((dialogue) => dialogue.text.length > 0),
      } satisfies WorkerResponse);
      bitmap.close();
      return;
    }

    if (ctx.Tesseract) {
      const result = await ctx.Tesseract.recognize(bitmap, languageHint || "eng");
      const words = result.data?.words ?? [];
      const dialogues = wordsToLines(words, pageIndex, bitmap.width, bitmap.height);
      if (!dialogues.length && result.data?.text?.trim()) {
        dialogues.push({
          id: `${pageIndex}:ocr-text`,
          pageIndex,
          text: normalizeText(result.data.text),
          confidence: 0.65,
          bounds: { x: 0.12, y: 0.12, width: 0.76, height: 0.18 },
          speakerHint: "narrator",
        });
      }
      ctx.postMessage({ id, pageIndex, engine: "tesseract", dialogues } satisfies WorkerResponse);
      bitmap.close();
      return;
    }

    bitmap.close();
    ctx.postMessage({
      id,
      pageIndex,
      engine: "unavailable",
      dialogues: [],
      error: "No OCR engine is available. Add Tesseract/PaddleOCR or enable native TextDetector.",
    } satisfies WorkerResponse);
  } catch (error) {
    ctx.postMessage({
      id,
      pageIndex,
      engine: "unavailable",
      dialogues: [],
      error: error instanceof Error ? error.message : "OCR failed",
    } satisfies WorkerResponse);
  }
};

function toDialogue(
  pageIndex: number,
  index: number,
  rawText: string,
  box: DOMRectReadOnly | undefined,
  width: number,
  height: number,
  confidence: number
): WorkerDialogue {
  const bounds = box
    ? {
        x: clamp(box.x / width),
        y: clamp(box.y / height),
        width: clamp(box.width / width),
        height: clamp(box.height / height),
      }
    : { x: 0.15, y: 0.15 + index * 0.08, width: 0.7, height: 0.08 };

  return {
    id: `${pageIndex}:${index}:${bounds.x.toFixed(3)}:${bounds.y.toFixed(3)}`,
    pageIndex,
    text: normalizeText(rawText),
    confidence,
    bounds,
    speakerHint: inferSpeaker(bounds.x),
  };
}

function wordsToLines(
  words: TesseractWord[],
  pageIndex: number,
  width: number,
  height: number
): WorkerDialogue[] {
  const filtered = words
    .filter((word) => normalizeText(word.text ?? "").length > 0)
    .sort((a, b) => (a.bbox?.y0 ?? 0) - (b.bbox?.y0 ?? 0) || (a.bbox?.x0 ?? 0) - (b.bbox?.x0 ?? 0));

  const rows: typeof filtered[] = [];
  for (const word of filtered) {
    const box = word.bbox;
    if (!box) continue;
    const row = rows.find((candidate) => {
      const first = candidate[0]?.bbox;
      return first ? Math.abs(first.y0 - box.y0) < Math.max(18, (box.y1 - box.y0) * 0.8) : false;
    });
    if (row) row.push(word);
    else rows.push([word]);
  }

  return rows.map((row, index) => {
    const boxes = row.map((word) => word.bbox).filter(Boolean) as Array<{ x0: number; y0: number; x1: number; y1: number }>;
    const x0 = Math.min(...boxes.map((box) => box.x0));
    const y0 = Math.min(...boxes.map((box) => box.y0));
    const x1 = Math.max(...boxes.map((box) => box.x1));
    const y1 = Math.max(...boxes.map((box) => box.y1));
    return toDialogue(
      pageIndex,
      index,
      row.map((word) => word.text).join(" "),
      { x: x0, y: y0, width: x1 - x0, height: y1 - y0 } as DOMRectReadOnly,
      width,
      height,
      average(row.map((word) => word.confidence ?? 50)) / 100
    );
  });
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").replace(/[|_~`]/g, "").trim();
}

function inferSpeaker(x: number): WorkerDialogue["speakerHint"] {
  if (x < 0.35) return "left";
  if (x > 0.65) return "right";
  return "center";
}

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function clamp(value: number) {
  return Math.max(0, Math.min(1, value));
}

export {};
