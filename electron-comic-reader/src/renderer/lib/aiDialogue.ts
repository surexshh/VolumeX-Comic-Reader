import type { AIDialogueSettings, AIVoiceStyle, CharacterVoicePreference } from "@/store/library";

export interface DialoguePageInput {
  pageIndex: number;
  imageUrl: string;
  placement: "single" | "left" | "right";
}

export interface DialogueBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DialogueLine {
  id: string;
  pageIndex: number;
  text: string;
  confidence: number;
  bounds: DialogueBounds;
  speaker: string;
  voice: AIVoiceStyle;
  placement: DialoguePageInput["placement"];
}

export interface DialogueScanResult {
  key: string;
  engine: "text-detector" | "tesseract" | "unavailable";
  lines: DialogueLine[];
  error?: string;
}

type WorkerResponse = {
  id: string;
  pageIndex: number;
  engine: DialogueScanResult["engine"];
  dialogues: Array<{
    id: string;
    pageIndex: number;
    text: string;
    confidence: number;
    bounds: DialogueBounds;
    speakerHint: "left" | "center" | "right" | "narrator";
  }>;
  error?: string;
};

const scanCache = new Map<string, DialogueScanResult>();
let worker: Worker | null = null;
let requestId = 0;

const SPEAKER_BY_POSITION = {
  left: "Hero",
  center: "Narrator",
  right: "Heroine",
  narrator: "Narrator",
} satisfies Record<string, string>;

export async function scanDialoguePages(
  pages: DialoguePageInput[],
  settings: AIDialogueSettings
): Promise<DialogueScanResult> {
  const key = pages.map((page) => `${page.pageIndex}:${page.imageUrl}`).join("|");
  const cached = scanCache.get(key);
  if (cached) return cached;

  if (!pages.length) {
    return { key, engine: "unavailable", lines: [], error: "No visible page is ready for dialogue scanning." };
  }

  const results = await Promise.all(pages.map((page) => scanOnePage(page, settings)));
  const engine = results.find((result) => result.engine !== "unavailable")?.engine ?? "unavailable";
  const lines = results
    .flatMap((result) => result.lines)
    .sort((a, b) => a.pageIndex - b.pageIndex || a.bounds.y - b.bounds.y || a.bounds.x - b.bounds.x);
  const error = results.find((result) => result.error)?.error;
  const merged = { key, engine, lines, error };
  scanCache.set(key, merged);

  for (const [cacheKey] of scanCache) {
    if (scanCache.size <= 12) break;
    scanCache.delete(cacheKey);
  }

  return merged;
}

export function speakDialogueLine(
  line: DialogueLine,
  settings: AIDialogueSettings,
  onEnd: () => void
) {
  const synth = window.speechSynthesis;
  synth.cancel();

  if (settings.muted || !line.text.trim()) {
    const timeout = window.setTimeout(onEnd, Math.max(900, line.text.length * 45));
    return () => window.clearTimeout(timeout);
  }

  const utterance = new SpeechSynthesisUtterance(line.text);
  const preference = getVoicePreference(settings.characters, line.speaker, line.voice);
  utterance.volume = settings.volume;
  utterance.rate = preference.speed;
  utterance.pitch = preference.pitch;
  utterance.voice = chooseSystemVoice(line.voice);
  utterance.onend = onEnd;
  utterance.onerror = onEnd;
  synth.speak(utterance);
  return () => synth.cancel();
}

export function getVoicePreference(
  preferences: CharacterVoicePreference[],
  character: string,
  fallback: AIVoiceStyle
) {
  return preferences.find((item) => item.character.toLowerCase() === character.toLowerCase()) ?? {
    character,
    voice: fallback,
    speed: voicePreset(fallback).speed,
    pitch: voicePreset(fallback).pitch,
  };
}

export function voicePreset(style: AIVoiceStyle) {
  switch (style) {
    case "female":
      return { speed: 1.02, pitch: 1.12 };
    case "child":
      return { speed: 1.08, pitch: 1.36 };
    case "villain":
      return { speed: 0.84, pitch: 0.72 };
    case "robotic":
      return { speed: 0.9, pitch: 0.62 };
    case "narrator":
      return { speed: 0.92, pitch: 0.95 };
    case "anime":
      return { speed: 1.12, pitch: 1.24 };
    case "male":
    default:
      return { speed: 0.98, pitch: 0.9 };
  }
}

function scanOnePage(page: DialoguePageInput, settings: AIDialogueSettings) {
  return new Promise<DialogueScanResult>((resolve) => {
    const activeWorker = getWorker();
    const id = `ocr:${Date.now()}:${requestId++}`;
    const timeout = window.setTimeout(() => {
      resolve({
        key: `${page.pageIndex}:${page.imageUrl}`,
        engine: "unavailable",
        lines: [],
        error: "OCR timed out while processing the visible page.",
      });
    }, 15000);

    const onMessage = (event: MessageEvent<WorkerResponse>) => {
      if (event.data.id !== id) return;
      activeWorker.removeEventListener("message", onMessage);
      window.clearTimeout(timeout);
      resolve({
        key: `${page.pageIndex}:${page.imageUrl}`,
        engine: event.data.engine,
        error: event.data.error,
        lines: event.data.dialogues.map((dialogue, index) => {
          const speaker = SPEAKER_BY_POSITION[dialogue.speakerHint] ?? `Speaker ${index + 1}`;
          const voice = getVoicePreference(settings.characters, speaker, speaker === "Narrator" ? "narrator" : "male").voice;
          return {
            id: `${page.placement}:${dialogue.id}`,
            pageIndex: dialogue.pageIndex,
            text: dialogue.text,
            confidence: dialogue.confidence,
            bounds: dialogue.bounds,
            speaker,
            voice,
            placement: page.placement,
          };
        }),
      });
    };

    activeWorker.addEventListener("message", onMessage);
    activeWorker.postMessage({
      id,
      pageIndex: page.pageIndex,
      imageUrl: page.imageUrl,
      languageHint: settings.voicePack === "anime" ? "eng+jpn" : "eng",
    });
  });
}

function getWorker() {
  if (!worker) {
    worker = new Worker(new URL("../workers/dialogueOcr.worker.ts", import.meta.url), { type: "module" });
  }
  return worker;
}

function chooseSystemVoice(style: AIVoiceStyle) {
  const voices = window.speechSynthesis?.getVoices?.() ?? [];
  const query =
    style === "female" || style === "anime" || style === "child"
      ? ["female", "zira", "samantha", "google uk english female"]
      : style === "villain" || style === "male"
        ? ["male", "david", "mark", "google uk english male"]
        : style === "robotic"
          ? ["microsoft", "google"]
          : ["narrator", "natural", "english"];

  return (
    voices.find((voice) => query.some((term) => voice.name.toLowerCase().includes(term))) ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith("en")) ??
    null
  );
}
