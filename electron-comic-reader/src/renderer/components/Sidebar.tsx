import { useState, useCallback } from "react";
import logoImage from "@/assets/logo-volumex.jpg";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookMarked,
  BookOpen,
  Download,
  Home,
  Search,
  Settings as SettingsIcon,
  ShoppingCart,
  SlidersHorizontal,
  Zap,
} from "lucide-react";

/* ─── Constants ──────────────────────────────────────────────── */

const COLLAPSED_W = 72;
const EXPANDED_W  = 240;

const SPRING = {
  type:      "spring" as const,
  stiffness: 380,
  damping:   40,
  mass:      0.8,
};

const LABEL_TRANSITION = {
  opacity:  { duration: 0.12 },
  x:        { duration: 0.14 },
};

/* ─── Nav definition ─────────────────────────────────────────── */

interface NavItem {
  key:     "library" | "recent" | "bookmarks" | "search" | "downloads" | "folders";
  label:   string;
  icon:    React.ElementType;
  enabled: boolean;
}

const NAV: NavItem[] = [
  { key: "library",   label: "Library",              icon: Home,            enabled: true  },
  { key: "recent",    label: "Currently reading",    icon: BookOpen,        enabled: true  },
  { key: "bookmarks", label: "Bookmarks",            icon: BookMarked,      enabled: true },
  { key: "search",    label: "Search in Volume",     icon: Search,          enabled: true },
  { key: "downloads", label: "Downloads",            icon: Download,        enabled: false },
  { key: "folders",   label: "Manage folders",       icon: SlidersHorizontal, enabled: true },
];

/* ─── Props ──────────────────────────────────────────────────── */

interface Props {
  current:    "library" | "recent" | "settings" | "bookmarks" | "search" | "folders";
  onNavigate: (route: "library" | "recent" | "settings" | "bookmarks" | "search" | "folders") => void;
}

/* ═══════════════════════════════════════════════════════════════
   SIDEBAR
═══════════════════════════════════════════════════════════════ */

export function Sidebar({ current, onNavigate }: Props) {
  const [expanded, setExpanded] = useState(false);

  const expand   = useCallback(() => setExpanded(true),  []);
  const collapse = useCallback(() => setExpanded(false), []);

  return (
    /**
     * Fixed host element — always 72 px wide so the rest of the
     * layout never reflows. The inner motion.div grows on top of
     * the page content (like a drawer).
     */
    <aside
      style={{
        position: "fixed",
        inset:    "0 auto 0 0",
        width:    COLLAPSED_W,
        zIndex:   100,
      }}
      onMouseEnter={expand}
      onMouseLeave={collapse}
    >
      {/* ── Animated panel ────────────────────────────────────── */}
      <motion.div
        animate={{ width: expanded ? EXPANDED_W : COLLAPSED_W }}
        transition={SPRING}
        style={{
          height:                  "100%",
          overflow:                "hidden",
          willChange:              "width",
          display:                 "flex",
          flexDirection:           "column",
          /* Glass */
          background:              "hsl(167 32% 4% / 0.92)",
          backdropFilter:          "blur(28px) saturate(160%)",
          WebkitBackdropFilter:    "blur(28px) saturate(160%)",
          borderRight:             "1px solid rgba(255,255,255,0.055)",
          boxShadow:               "4px 0 40px rgba(0,0,0,0.55)",
        }}
      >

        {/* ── Logo row ──────────────────────────────────────── */}
        <div
          style={{
            height:       64,
            display:      "flex",
            alignItems:   "center",
            paddingLeft:  20,
            gap:          12,
            flexShrink:   0,
            borderBottom: "1px solid rgba(255,255,255,0.04)",
          }}
        >
          {/* Brand mark */}
          <div
            style={{
              width:        32,
              height:       32,
              borderRadius: 8,
              overflow:     "hidden",
              display:      "grid",
              placeItems:   "center",
              flexShrink:   0,
              boxShadow:    "0 0 20px rgba(220, 37, 37, 0.45), 0 4px 12px rgba(0,0,0,0.4)",
            }}
          >
            <img src={logoImage} alt="VolumeX" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>

          {/* App name — fades in when expanded */}
          <motion.span
            animate={{
              opacity: expanded ? 1 : 0,
              x:       expanded ? 0 : -6,
            }}
            transition={LABEL_TRANSITION}
            style={{
              fontSize:       15,
              fontWeight:     800,
              letterSpacing:  "-0.03em",
              color:          "#ffffff",
              whiteSpace:     "nowrap",
              pointerEvents:  "none",
            }}
          >
            Volume
          </motion.span>
        </div>

        {/* ── Main nav ──────────────────────────────────────── */}
        <div
          style={{
            flex:          1,
            padding:       "10px 10px 0",
            display:       "flex",
            flexDirection: "column",
            gap:           2,
            overflowY:     "auto",
            overflowX:     "hidden",
          }}
        >
          {NAV.map((item) => {
            const active =
              (item.key === "library" && current === "library") ||
              (item.key === "bookmarks" && current === "bookmarks") ||
              (item.key === "recent"  && current === "recent") ||
              (item.key === "search"  && current === "search") ||
              (item.key === "folders" && current === "folders");

            return (
              <SidebarButton
                key={item.key}
                icon={<item.icon style={{ width: 18, height: 18 }} strokeWidth={1.8} />}
                label={item.label}
                active={active}
                dimmed={!item.enabled}
                expanded={expanded}
                onClick={() => {
                  if (item.enabled) {
                    onNavigate(item.key as any);
                  }
                }}
              />
            );
          })}
        </div>

        {/* ── Bottom section ────────────────────────────────── */}
        <div
          style={{
            padding:      "8px 10px 16px",
            borderTop:    "1px solid rgba(255,255,255,0.05)",
            display:      "flex",
            flexDirection:"column",
            gap:           2,
            flexShrink:    0,
          }}
        >
          {/* Premium */}
          <SidebarButton
            icon={<ShoppingCart style={{ width: 18, height: 18 }} strokeWidth={1.8} />}
            label="Volume Premium"
            active={false}
            dimmed={false}
            expanded={expanded}
            badge={<PROBadge />}
            onClick={() => {}}
          />

          {/* Settings */}
          <SidebarButton
            icon={<SettingsIcon style={{ width: 18, height: 18 }} strokeWidth={1.8} />}
            label="Settings"
            active={current === "settings"}
            dimmed={false}
            expanded={expanded}
            onClick={() => onNavigate("settings")}
          />
        </div>
      </motion.div>
    </aside>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SIDEBAR BUTTON
═══════════════════════════════════════════════════════════════ */

interface SidebarButtonProps {
  icon:     React.ReactNode;
  label:    string;
  active:   boolean;
  dimmed:   boolean;
  expanded: boolean;
  badge?:   React.ReactNode;
  onClick:  () => void;
}

function SidebarButton({
  icon,
  label,
  active,
  dimmed,
  expanded,
  badge,
  onClick,
}: SidebarButtonProps) {
  const [hovered, setHovered] = useState(false);

  const bg = active
    ? "hsl(var(--primary) / 0.13)"
    : hovered && !dimmed
    ? "rgba(255,255,255,0.065)"
    : "transparent";

  const borderColor = active
    ? "hsl(var(--primary) / 0.32)"
    : "transparent";

  const color = active
    ? "hsl(var(--primary))"
    : dimmed
    ? "rgba(255,255,255,0.22)"
    : hovered
    ? "rgba(255,255,255,0.9)"
    : "rgba(255,255,255,0.52)";

  return (
    <button
      type="button"
      onClick={onClick}
      /* Native browser tooltip — works perfectly in Electron */
      title={!expanded ? label : ""}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position:       "relative",
        display:        "flex",
        alignItems:     "center",
        gap:            12,
        height:         44,
        padding:        "0 13px",
        borderRadius:   12,
        border:         `1px solid ${borderColor}`,
        background:     bg,
        color,
        cursor:         dimmed && !active ? "default" : "pointer",
        width:          "100%",
        overflow:       "hidden",
        whiteSpace:     "nowrap",
        flexShrink:     0,
        boxShadow:      active ? "0 0 14px hsl(var(--primary) / 0.18)" : "none",
        transition:     "background 0.15s ease, color 0.15s ease, border-color 0.15s ease, box-shadow 0.18s ease",
      }}
    >
      {/* ── Neon active indicator ─────────────────────────── */}
      <AnimatePresence>
        {active && (
          <motion.span
            key="indicator"
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1 }}
            exit={{ scaleY: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            style={{
              position:     "absolute",
              left:         0,
              top:          "50%",
              translateY:   "-50%",
              width:        3,
              height:       "52%",
              borderRadius: "0 4px 4px 0",
              background:   "hsl(var(--primary))",
              boxShadow:    "0 0 12px hsl(var(--primary)), 0 0 24px hsl(var(--primary) / 0.5)",
              transformOrigin: "center",
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Icon (always visible, always at same x-position) ── */}
      <span
        style={{
          display:     "grid",
          placeItems:  "center",
          flexShrink:  0,
          width:       18,
          height:      18,
          color:       active ? "hsl(var(--primary))" : "inherit",
        }}
      >
        {icon}
      </span>

      {/* ── Label — fades in when sidebar expands ─────────── */}
      <motion.span
        animate={{
          opacity: expanded ? 1 : 0,
          x:       expanded ? 0 : -4,
        }}
        transition={LABEL_TRANSITION}
        style={{
          fontSize:       14,
          fontWeight:     active ? 600 : 400,
          letterSpacing:  active ? "-0.012em" : "0",
          flex:           1,
          overflow:       "hidden",
          textOverflow:   "ellipsis",
          minWidth:       0,
          pointerEvents:  "none",
        }}
      >
        {label}
      </motion.span>

      {/* ── Optional badge (PRO, "Soon", etc.) ────────────── */}
      {badge && (
        <motion.span
          animate={{ opacity: expanded ? 1 : 0 }}
          transition={{ duration: 0.12 }}
          style={{ flexShrink: 0, pointerEvents: "none" }}
        >
          {badge}
        </motion.span>
      )}

      {/* ── Collapsed active dot ──────────────────────────── */}
      <AnimatePresence>
        {active && !expanded && (
          <motion.span
            key="dot"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{
              position:     "absolute",
              bottom:       6,
              right:        8,
              width:        5,
              height:       5,
              borderRadius: "50%",
              background:   "hsl(var(--primary))",
              boxShadow:    "0 0 8px hsl(var(--primary))",
            }}
          />
        )}
      </AnimatePresence>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PRO BADGE
═══════════════════════════════════════════════════════════════ */

function PROBadge() {
  return (
    <span
      style={{
        fontSize:        9,
        fontWeight:      700,
        letterSpacing:   "0.1em",
        textTransform:   "uppercase",
        padding:         "2px 7px",
        borderRadius:    999,
        background:      "hsl(var(--primary) / 0.16)",
        color:           "hsl(var(--primary))",
        border:          "1px solid hsl(var(--primary) / 0.35)",
        flexShrink:      0,
      }}
    >
      Pro
    </span>
  );
}
