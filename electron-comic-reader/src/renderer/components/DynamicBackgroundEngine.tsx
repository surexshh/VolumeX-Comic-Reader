/**
 * DynamicBackgroundEngine
 *
 * Full-screen cinematic blurred background:
 *  - Crossfades between images in 650 ms
 *  - Ken Burns slow zoom/pan (CSS keyframe, 14s alternate)
 *  - Dark cinematic overlay + radial vignette
 *  - Preload cache (no flash on revisit)
 *  - GPU-accelerated (will-change, translate3d)
 */
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useBackground } from "@/contexts/BackgroundContext";
import { useLibrary } from "@/store/library";
import { extractDominantColor } from "@/lib/colorExtractor";

/* ─── Preload cache ─────────────────────────────────────────── */
const preloadCache = new Set<string>();

function preloadImage(src: string): Promise<void> {
  if (preloadCache.has(src)) return Promise.resolve();
  return new Promise((resolve) => {
    const img = new Image();
    img.onload  = () => { preloadCache.add(src); resolve(); };
    img.onerror = () => resolve(); // fail silently
    img.src = src;
  });
}

/* ─── Layer type ────────────────────────────────────────────── */
interface Layer { src: string; id: number }

/* ─── Ken Burns origin pool ─────────────────────────────────── */
const KB_ORIGINS = ["50% 50%", "55% 45%", "45% 55%", "52% 48%"] as const;
let kbIdx = 0;
const nextOrigin = () => KB_ORIGINS[kbIdx++ % KB_ORIGINS.length];

/* ═══════════════════════════════════════════════════════════════
   ENGINE
═══════════════════════════════════════════════════════════════ */

export function DynamicBackgroundEngine() {
  const { src } = useBackground();

  const [active, setActive] = useState<Layer | null>(null);
  const [fading, setFading] = useState<Layer | null>(null);
  const idRef      = useRef(0);
  const cancelRef  = useRef<() => void>(() => {});

  /* When src changes → preload → crossfade */
  useEffect(() => {
    cancelRef.current(); // cancel any in-flight load
    let cancelled = false;
    cancelRef.current = () => { cancelled = true; };

    if (!src) {
      setFading((prev) => prev ?? null);
      setActive(null);
      return;
    }

    preloadImage(src).then(() => {
      if (cancelled) return;
      idRef.current += 1;
      const next: Layer = { src, id: idRef.current };
      // move current → fading, mount new as active
      setActive((prev) => { setFading(prev); return next; });
    });

    return () => { cancelled = true; };
  }, [src]);

  /* Clear fading layer after crossfade */
  useEffect(() => {
    if (!fading) return;
    const t = setTimeout(() => setFading(null), 900);
    return () => clearTimeout(t);
  }, [fading]);

  const { settings } = useLibrary();
  // Safe optional access + fallback
  const visual = settings?.visual ?? {
    layoutMode: "compact", motionMode: "balanced", readerBackground: "amoled",
    dynamicWallpaper: true, blurIntensity: 12, tileGlow: true, ambientExtraction: false
  };
  const [ambientColor, setAmbientColor] = useState<string>("rgba(220, 37, 37, 0.08)");

  // Extract ambient color
  useEffect(() => {
    if (!visual.ambientExtraction || !src) {
      setAmbientColor("rgba(220, 37, 37, 0.08)");
      return;
    }
    extractDominantColor(src)
      .then(color => setAmbientColor(color))
      .catch(() => setAmbientColor("rgba(220, 37, 37, 0.08)"));
  }, [src, visual.ambientExtraction]);

  if (!visual.dynamicWallpaper && !visual.ambientExtraction) {
    return (
      <div
        aria-hidden="true"
        style={{
          position: "fixed", inset: 0, zIndex: 0,
          background: "hsl(var(--bg))", pointerEvents: "none"
        }}
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      style={{
        position:      "fixed",
        inset:         0,
        zIndex:        0,
        overflow:      "hidden",
        pointerEvents: "none",
      }}
    >
      {/* ── LAYER 0 · Base dark fill (always behind images) ── */}
      <div
        style={{
          position:   "absolute",
          inset:      0,
          zIndex:     0,
          background: "hsl(var(--bg))",
        }}
      />

      {/* ── LAYER 1 · Fading-out image ────────────────────── */}
      <AnimatePresence>
        {fading && (
          <motion.div
            key={`f-${fading.id}`}
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            exit={{}}
            transition={{ duration: 0.65, ease: "easeInOut" }}
            style={{ position: "absolute", inset: 0, zIndex: 1, willChange: "opacity" }}
          >
            {visual.dynamicWallpaper && <BgImage src={fading.src} motionMode={visual.motionMode} blur={visual.blurIntensity} />}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── LAYER 2 · Active image (fades in) ─────────────── */}
      <AnimatePresence>
        {active && (
          <motion.div
            key={`a-${active.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.65, ease: "easeInOut" }}
            style={{ position: "absolute", inset: 0, zIndex: 2, willChange: "opacity" }}
          >
            {visual.dynamicWallpaper && <BgImage src={active.src} motionMode={visual.motionMode} blur={visual.blurIntensity} />}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── LAYER 3 · Cinematic dark overlay ──────────────── */}
      <div
        style={{
          position:   "absolute",
          inset:      0,
          zIndex:     3,
          background: "rgba(9, 20, 19, 0.55)",
        }}
      />

      {/* ── LAYER 4 · Vignette & Ambient Glow ───────────────── */}
      <div
        style={{
          position:   "absolute",
          inset:      0,
          zIndex:     4,
          background: [
            `radial-gradient(circle at 50% 30%, ${visual.ambientExtraction ? ambientColor : "transparent"} 0%, transparent 60%)`,
            "radial-gradient(ellipse 88% 82% at 50% 50%, transparent 25%, rgba(9,20,19,0.85) 100%)",
            "linear-gradient(180deg, rgba(9,20,19,0.2) 0%, transparent 18%, transparent 68%, rgba(9,20,19,0.7) 100%)",
          ].join(", "),
          transition: "background 0.8s ease",
        }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   BG IMAGE — Ken Burns via CSS keyframe
═══════════════════════════════════════════════════════════════ */

function BgImage({ src, motionMode, blur }: { src: string; motionMode: string; blur: number }) {
  /* stable origin per mount so Ken Burns doesn't jump on re-render */
  const origin = useRef(nextOrigin()).current;
  const isPerformance = motionMode === "performance";

  return (
    <div
      style={{
        position:           "absolute",
        inset:              -32,           /* overshoot so blur edges never show */
        backgroundImage:    `url(${JSON.stringify(src)})`,
        backgroundSize:     "cover",
        backgroundPosition: "center",
        backgroundRepeat:   "no-repeat",
        filter:             isPerformance ? "saturate(1.2) brightness(0.7)" : `blur(${blur}px) saturate(1.4) brightness(0.85)`,
        animation:          isPerformance ? "none" : "kenBurns 14s ease-in-out infinite alternate",
        transformOrigin:    origin,
        willChange:         isPerformance ? "auto" : "transform",
      }}
    />
  );
}
