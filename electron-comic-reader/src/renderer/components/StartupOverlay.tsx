/**
 * StartupOverlay — in-app cinematic loading screen for VolumeX.
 *
 * Renders as a z-index:9999 fixed overlay inside the React tree.
 * No second window. No page navigation. Appears over the app,
 * fades out after `dismissAfterMs` (default 2400ms).
 *
 * Visual layers:
 *  1. Backdrop — rgba dark + backdrop-filter blur
 *  2. Radial vignette gradient
 *  3. VolumeX SVG logo (floating + glow-pulse)
 *  4. "VolumeX" wordmark
 *  5. Loading dots (3 crimson, staggered)
 *  6. Corner accents
 */
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import logoImage from "@/assets/logo-volumex.jpg";

/* ─── Props ──────────────────────────────────────────────────── */

interface Props {
  dismissAfterMs?: number;   // default: 2400
  onDismissed?:   () => void;
}

/* ─── Spring configs ─────────────────────────────────────────── */

const LOGO_SPRING = { type: "spring" as const, stiffness: 180, damping: 22, mass: 0.9 };
const FLOAT = {
  y:          [0, -10, 0],
  transition: { duration: 3.2, repeat: Infinity, ease: "easeInOut" as const },
};

/* ═══════════════════════════════════════════════════════════════
   MAIN OVERLAY
═══════════════════════════════════════════════════════════════ */

export function StartupOverlay({ dismissAfterMs = 2400, onDismissed }: Props) {
  const [visible, setVisible] = useState(true);

  /* Auto-dismiss */
  useEffect(() => {
    const t = setTimeout(() => setVisible(false), dismissAfterMs);
    return () => clearTimeout(t);
  }, [dismissAfterMs]);

  return (
    <AnimatePresence onExitComplete={onDismissed}>
      {visible && (
        <motion.div
          key="startup-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, exit: { duration: 0.65 } } as never}
          style={{
            position:        "fixed",
            inset:           0,
            zIndex:          9999,
            display:         "flex",
            flexDirection:   "column",
            alignItems:      "center",
            justifyContent:  "center",
            gap:             24,
            /* Backdrop */
            background:      "#000000",
          }}
        >
          {/* ── Radial vignette / Ambient Glow ── */}
          <div
            style={{
              position:      "absolute",
              inset:         0,
              background:    "radial-gradient(circle at 50% 45%, rgba(220,37,37,0.1) 0%, transparent 40%)",
              pointerEvents: "none",
            }}
          />

          {/* ── Logo + wordmark (floating group) ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            style={{
              position:       "relative",
              zIndex:         1,
              display:        "flex",
              flexDirection:  "column",
              alignItems:     "center",
              gap:            20,
            }}
          >
            {/* New Official Logo */}
            <motion.img 
              src={logoImage} 
              alt="VolumeX Logo"
              style={{
                width: 140,
                height: 140,
                borderRadius: 24,
                boxShadow: "0 12px 48px rgba(220,37,37,0.2), inset 0 2px 0 rgba(255,255,255,0.1)",
                objectFit: "cover"
              }}
              animate={{ 
                boxShadow: [
                  "0 12px 48px rgba(220,37,37,0.15), inset 0 2px 0 rgba(255,255,255,0.1)", 
                  "0 12px 48px rgba(220,37,37,0.3), inset 0 2px 0 rgba(255,255,255,0.1)",
                  "0 12px 48px rgba(220,37,37,0.15), inset 0 2px 0 rgba(255,255,255,0.1)"
                ] 
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Wordmark */}
            <Wordmark />
          </motion.div>

          {/* ── Minimal loading indicator ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            style={{ position: "relative", zIndex: 1, marginTop: 12 }}
          >
            <motion.div
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              style={{
                width: 48,
                height: 2,
                borderRadius: 1,
                background: "hsl(var(--primary))",
                boxShadow: "0 0 12px hsl(var(--primary) / 0.5)",
              }}
            />
          </motion.div>

        </motion.div>
      )}
    </AnimatePresence>
  );
}


/* ═══════════════════════════════════════════════════════════════
   WORDMARK — "Volume X"
═══════════════════════════════════════════════════════════════ */

function Wordmark() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.38, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      style={{
        display:      "flex",
        alignItems:   "baseline",
        gap:          0,
        fontSize:     26,
        fontWeight:   700,
        letterSpacing: "-0.03em",
        fontFamily:   "'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif",
        userSelect:   "none",
      }}
    >
      <span style={{ color: "rgba(255,255,255,0.88)" }}>Volume</span>
      <motion.span
        animate={{
          textShadow: [
            "0 0 8px rgba(220,37,37,0.6), 0 0 16px rgba(220,37,37,0.3)",
            "0 0 16px rgba(220,37,37,1), 0 0 32px rgba(220,37,37,0.6)",
            "0 0 8px rgba(220,37,37,0.6), 0 0 16px rgba(220,37,37,0.3)",
          ],
        }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        style={{
          color:      "#DC2525",
          fontWeight: 800,
        }}
      >
        X
      </motion.span>
    </motion.div>
  );
}


