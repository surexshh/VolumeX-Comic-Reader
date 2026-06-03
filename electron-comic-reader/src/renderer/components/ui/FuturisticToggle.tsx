/**
 * FuturisticToggle / ToggleSwitch
 *
 * Pixel-perfect, overflow-proof toggle switch.
 *
 * Key insight: the track-fill span has overflow:hidden (clips the glow
 * animation only). The thumb is a sibling of that span — at z-index 2 —
 * so it is NEVER clipped and can never overflow the track container.
 *
 * Thumb travel = trackW - thumbW - 2*gap  (exact, no magic offsets)
 */
import { motion } from "framer-motion";

/* ─── Size tokens ────────────────────────────────────────────── */

interface SizeConfig {
  trackW: number;   // px
  trackH: number;   // px
  thumbW: number;   // px
  thumbH: number;   // px
  gap:    number;   // inner padding each side
}

const SIZES: Record<"sm" | "md" | "lg", SizeConfig> = {
  sm: { trackW: 44, trackH: 24, thumbW: 18, thumbH: 18, gap: 3 },
  md: { trackW: 52, trackH: 28, thumbW: 22, thumbH: 22, gap: 3 },
  lg: { trackW: 60, trackH: 32, thumbW: 26, thumbH: 26, gap: 3 },
};

const SPRING = {
  type:      "spring" as const,
  stiffness: 420,
  damping:   32,
  mass:      0.7,
};

/* ─── Props ──────────────────────────────────────────────────── */

interface Props {
  checked:      boolean;
  onChange:     (next: boolean) => void;
  size?:        "sm" | "md" | "lg";
  disabled?:    boolean;
  label?:       string;
  description?: string;
}

/* ═══════════════════════════════════════════════════════════════
   TOGGLE SWITCH
═══════════════════════════════════════════════════════════════ */

export function ToggleSwitch({
  checked,
  onChange,
  size        = "md",
  disabled    = false,
  label,
  description,
}: Props) {
  const { trackW, trackH, thumbW, thumbH, gap } = SIZES[size];

  /* Guaranteed-safe thumb positions */
  const xOff = gap;                      // OFF: left-most
  const xOn  = trackW - thumbW - gap;    // ON:  right-most

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      style={{
        display:    "inline-flex",
        alignItems: "center",
        gap:        10,
        background: "none",
        border:     "none",
        padding:    0,
        cursor:     disabled ? "not-allowed" : "pointer",
        opacity:    disabled ? 0.45 : 1,
        outline:    "none",
        flexShrink: 0,
      }}
    >
      {/* Optional label */}
      {(label || description) && (
        <span style={{ textAlign: "left", minWidth: 0 }}>
          {label && (
            <span style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#ffffff" }}>
              {label}
            </span>
          )}
          {description && (
            <span style={{ display: "block", marginTop: 2, fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.4 }}>
              {description}
            </span>
          )}
        </span>
      )}

      {/* ── Track wrapper: defines layout size only ── */}
      <span
        style={{
          position:     "relative",
          display:      "inline-block",
          width:        trackW,
          height:       trackH,
          flexShrink:   0,
          borderRadius: trackH / 2,
        }}
      >

        {/* ── Track fill — overflow:hidden clips glow only ── */}
        <span
          style={{
            position:     "absolute",
            inset:        0,
            borderRadius: "inherit",
            overflow:     "hidden",
            background:   checked
              ? "hsl(var(--primary) / 0.22)"
              : "rgba(255,255,255,0.07)",
            border:       checked
              ? "1px solid hsl(var(--primary) / 0.52)"
              : "1px solid rgba(255,255,255,0.10)",
            boxShadow:    checked
              ? "0 0 18px hsl(var(--primary) / 0.38), inset 0 1px 0 rgba(255,255,255,0.08)"
              : "inset 0 2px 4px rgba(0,0,0,0.40)",
            transition:   "background 0.22s ease, border-color 0.22s ease, box-shadow 0.25s ease",
          }}
        >
          {/* Gradient wash */}
          <span
            style={{
              position:   "absolute",
              inset:      0,
              background: "linear-gradient(90deg, hsl(var(--primary) / 0.88) 0%, hsl(var(--accent) / 0.55) 100%)",
              opacity:    checked ? 1 : 0,
              transition: "opacity 0.22s ease",
            }}
          />

          {/* Ambient glow pulse — clipped by parent overflow:hidden */}
          {checked && (
            <motion.span
              animate={{ opacity: [0.2, 0.5, 0.2], scale: [0.7, 1.2, 0.7] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
              style={{
                position:     "absolute",
                inset:        -10,
                background:   "hsl(var(--primary) / 0.45)",
                filter:       "blur(12px)",
                borderRadius: "50%",
              }}
            />
          )}
        </span>

        {/* ── Thumb — sibling of fill, z-index 2, never clipped ── */}
        <motion.span
          animate={{ x: checked ? xOn : xOff }}
          transition={SPRING}
          style={{
            position:     "absolute",
            top:          "50%",
            left:         0,
            translateY:   "-50%",
            width:        thumbW,
            height:       thumbH,
            borderRadius: "50%",
            willChange:   "transform",
            zIndex:       2,
            background:   "#ffffff",
            border:       checked
              ? "1px solid rgba(255,255,255,0.95)"
              : "1px solid rgba(255,255,255,0.75)",
            boxShadow:    checked
              ? `0 0 14px hsl(var(--primary) / 0.60), 0 2px 8px rgba(0,0,0,0.5)`
              : "0 2px 6px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.3)",
            transition:   "border-color 0.18s ease, box-shadow 0.22s ease",
          }}
        >
          {/* Inner dot */}
          <span
            style={{
              position:     "absolute",
              inset:        "22%",
              borderRadius: "50%",
              background:   checked
                ? "hsl(var(--primary) / 0.75)"
                : "rgba(0,0,0,0.12)",
              transition:   "background 0.22s ease",
            }}
          />
        </motion.span>

      </span>
    </button>
  );
}

/* Backward-compat alias — Settings.tsx imports FuturisticToggle */
export { ToggleSwitch as FuturisticToggle };
