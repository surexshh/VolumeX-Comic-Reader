import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  Captions,
  Loader2,
  Mic2,
  Pause,
  Play,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { AIDialogueSettings } from "@/store/library";
import {
  scanDialoguePages,
  speakDialogueLine,
  type DialogueLine,
  type DialoguePageInput,
} from "@/lib/aiDialogue";

interface Props {
  pages: DialoguePageInput[];
  settings: AIDialogueSettings;
  onSettingsChange: (patch: Partial<AIDialogueSettings>) => void;
}

export function AIDialogueLayer({ pages, settings, onSettingsChange }: Props) {
  const [lines, setLines] = useState<DialogueLine[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [engine, setEngine] = useState<"text-detector" | "tesseract" | "unavailable">("unavailable");
  const [message, setMessage] = useState<string | null>(null);
  const cleanupSpeechRef = useRef<(() => void) | null>(null);

  const activeLine = lines[activeIndex] ?? null;
  const pageKey = useMemo(() => pages.map((page) => `${page.pageIndex}:${page.imageUrl}`).join("|"), [pages]);

  useEffect(() => {
    cleanupSpeechRef.current?.();
    cleanupSpeechRef.current = null;
    setPlaying(false);
  }, [pageKey]);

  useEffect(() => {
    if (!settings.enabled || pages.length === 0) {
      setLines([]);
      setMessage(null);
      return;
    }

    let cancelled = false;
    setScanning(true);
    setMessage("Scanning visible page for speech bubbles...");
    scanDialoguePages(pages, settings)
      .then((result) => {
        if (cancelled) return;
        setEngine(result.engine);
        setLines(result.lines);
        setActiveIndex(0);
        setMessage(
          result.lines.length
            ? null
            : result.error ?? "No readable dialogue was detected on this page."
        );
        if (settings.autoPlay && result.lines.length) setPlaying(true);
      })
      .catch((error) => {
        if (cancelled) return;
        setLines([]);
        setMessage(error instanceof Error ? error.message : "Dialogue scanning failed.");
      })
      .finally(() => {
        if (!cancelled) setScanning(false);
      });

    return () => {
      cancelled = true;
    };
  }, [pageKey, pages, settings]);

  const playFrom = useCallback(
    (index: number) => {
      if (!lines[index]) return;
      cleanupSpeechRef.current?.();
      setActiveIndex(index);
      setPlaying(true);
    },
    [lines]
  );

  useEffect(() => {
    if (!playing || !activeLine || !settings.enabled) return;
    cleanupSpeechRef.current = speakDialogueLine(activeLine, settings, () => {
      setActiveIndex((index) => {
        const next = index + 1;
        if (next >= lines.length) {
          setPlaying(false);
          return index;
        }
        return next;
      });
    });

    return () => {
      cleanupSpeechRef.current?.();
      cleanupSpeechRef.current = null;
    };
  }, [activeLine, lines.length, playing, settings]);

  if (!settings.enabled) {
    return (
      <button
        type="button"
        onClick={() => onSettingsChange({ enabled: true })}
        className="absolute right-4 top-16 z-40 pointer-events-auto inline-flex items-center gap-2 rounded-md border border-primary/40 bg-black/55 px-3 py-2 text-xs text-white shadow-2xl backdrop-blur-xl hover:bg-primary/20"
        title="Enable AI Dialogue Mode"
      >
        <Sparkles className="h-4 w-4 text-primary" />
        AI Dialogue
      </button>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-40">
      {settings.dimBackground && (
        <div className="absolute inset-0 bg-black/20 transition-opacity duration-300" />
      )}

      {settings.bubbleGlow &&
        lines.map((line, index) => (
          <button
            key={line.id}
            type="button"
            onClick={() => playFrom(index)}
            className={
              "absolute rounded-lg border transition-all duration-300 pointer-events-auto " +
              (index === activeIndex
                ? "border-primary/90 bg-primary/10 shadow-[0_0_34px_rgba(220,0,0,0.65)]"
                : "border-white/10 bg-white/0 hover:border-primary/50")
            }
            style={placementStyle(line)}
            title={line.text}
          />
        ))}

      {settings.panelFocus && activeLine && (
        <div
          className="absolute rounded-xl border border-primary/40 shadow-[0_0_70px_rgba(220,0,0,0.35)] transition-all duration-500"
          style={placementStyle(activeLine, 2.2)}
        />
      )}

      <div className="absolute left-1/2 top-4 -translate-x-1/2 pointer-events-auto">
        <div className="flex items-center gap-2 rounded-md border border-white/10 bg-black/55 px-3 py-2 shadow-2xl backdrop-blur-xl">
          <Bot className="h-4 w-4 text-primary" />
          <span className="text-xs font-medium">AI Dialogue Mode</span>
          <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
            {engine === "unavailable" ? "OCR idle" : engine}
          </span>
          <button
            type="button"
            onClick={() => onSettingsChange({ enabled: false })}
            className="rounded px-2 py-1 text-[11px] text-muted-foreground hover:bg-white/10 hover:text-white"
          >
            Off
          </button>
        </div>
      </div>

      <div className="absolute bottom-16 left-1/2 w-[min(760px,calc(100vw-32px))] -translate-x-1/2 pointer-events-auto">
        <div className={subtitleClass(settings.subtitleStyle)}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <Mic2 className="h-4 w-4 shrink-0 text-primary" />
              <div className="truncate text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {activeLine ? `${activeLine.speaker} voice` : "Waiting for dialogue"}
              </div>
            </div>
            {scanning && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          </div>

          <div className="min-h-[54px] text-center text-lg font-semibold leading-snug">
            {activeLine?.text ?? message ?? "No dialogue loaded for this page."}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              disabled={!lines.length}
              onClick={() => setPlaying((value) => !value)}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-medium text-white hover:bg-primary/90 disabled:opacity-40"
            >
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {playing ? "Pause" : "Play"}
            </button>

            <button
              type="button"
              onClick={() => onSettingsChange({ muted: !settings.muted })}
              className="rounded-md border border-white/10 bg-white/5 p-2 text-muted-foreground hover:text-white"
              title={settings.muted ? "Unmute AI voices" : "Mute AI voices"}
            >
              {settings.muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>

            <label className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-muted-foreground">
              <Volume2 className="h-3.5 w-3.5" />
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={settings.volume}
                onChange={(event) => onSettingsChange({ volume: parseFloat(event.target.value) })}
                className="w-24 accent-primary"
              />
            </label>

            <button
              type="button"
              onClick={() => onSettingsChange({ autoPlay: !settings.autoPlay })}
              className={
                "inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs " +
                (settings.autoPlay
                  ? "border-primary/50 bg-primary/15 text-white"
                  : "border-white/10 bg-white/5 text-muted-foreground hover:text-white")
              }
            >
              <Captions className="h-4 w-4" />
              Auto-play
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function placementStyle(line: DialogueLine, padding = 1): React.CSSProperties {
  const widthScale = line.placement === "single" ? 100 : 50;
  const offset = line.placement === "right" ? 50 : 0;
  const x = offset + line.bounds.x * widthScale;
  const y = line.bounds.y * 100;
  const width = line.bounds.width * widthScale;
  const height = line.bounds.height * 100;
  return {
    left: `${Math.max(0, x - padding)}%`,
    top: `${Math.max(0, y - padding)}%`,
    width: `${Math.min(100, width + padding * 2)}%`,
    height: `${Math.min(100, height + padding * 2)}%`,
  };
}

function subtitleClass(style: AIDialogueSettings["subtitleStyle"]) {
  const base =
    "rounded-lg border px-5 py-4 shadow-2xl backdrop-blur-xl transition-all duration-300";
  if (style === "minimal") return `${base} border-white/10 bg-black/55`;
  if (style === "manga") return `${base} border-white/20 bg-white/90 text-black`;
  return `${base} border-primary/25 bg-black/65 shadow-[0_0_70px_rgba(220,0,0,0.25)]`;
}
