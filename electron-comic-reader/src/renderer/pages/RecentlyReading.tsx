/**
 * RecentlyReadingPage — Phase 5 Cinematic Hero Layout
 *
 * LEFT  40% : Large poster + title + progress + CTA + meta
 * RIGHT 60% : Dynamic background glow + ambient overlay
 *
 * Driven by DynamicBackgroundEngine (global context).
 */
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Clock, Play, ChevronRight, Heart } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { useLibrary, type LibraryItem } from "@/store/library";
import { useBackground } from "@/contexts/BackgroundContext";

interface Props {
  current:    "recent";
  onNavigate: (route: "library" | "recent" | "settings") => void;
  onOpen:     (item: LibraryItem) => void;
}

/* ═══════════════════════════════════════════════════════════════
   RECENTLY READING PAGE
═══════════════════════════════════════════════════════════════ */

export function RecentlyReadingPage({ current, onNavigate, onOpen }: Props) {
  const { items, refresh, updateItem } = useLibrary();
  const { setSrc }         = useBackground();

  // Comics read in the last 30 days, most recent first
  const recent = items
    .filter((c) => c.lastReadAt && c.lastReadAt > Date.now() - 30 * 24 * 3600 * 1000)
    .sort((a, b) => (b.lastReadAt ?? 0) - (a.lastReadAt ?? 0));

  const [selected, setSelected] = useState<LibraryItem | null>(null);

  // Pick initially selected comic
  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!selected && recent.length > 0) setSelected(recent[0]);
  }, [recent, selected]);

  // Drive the global background engine
  useEffect(() => {
    if (selected?.thumbnail) setSrc(selected.thumbnail);
  }, [selected, setSrc]);

  // Auto-cycle if nothing hovered for 30 s
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const idxRef   = useRef(0);

  useEffect(() => {
    if (recent.length < 2) return;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      idxRef.current = (idxRef.current + 1) % recent.length;
      setSelected(recent[idxRef.current]);
    }, 30_000);
    return () => clearInterval(timerRef.current);
  }, [recent]);

  /* ── Empty state ── */
  if (recent.length === 0) {
    return (
      <div style={{ height: "100vh", background: "transparent", position: "relative" }}>
        <Sidebar current={current} onNavigate={onNavigate} />
        <div
          style={{
            height:         "100%",
            marginLeft:     72,
            display:        "flex",
            flexDirection:  "column",
            alignItems:     "center",
            justifyContent: "center",
            gap:            16,
          }}
        >
          <div
            style={{
              width:        64,
              height:       64,
              borderRadius: 20,
              background:   "hsl(var(--primary) / 0.12)",
              border:       "1px solid hsl(var(--primary) / 0.25)",
              display:      "grid",
              placeItems:   "center",
              boxShadow:    "0 0 32px hsl(var(--primary) / 0.15)",
            }}
          >
            <BookOpen style={{ width: 28, height: 28, color: "hsl(var(--primary))" }} />
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: "0 0 6px", letterSpacing: "-0.02em" }}>
              Nothing read recently
            </p>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", margin: 0 }}>
              Open a comic from your library to see it here.
            </p>
          </div>
          <button
            onClick={() => onNavigate("library")}
            style={{
              marginTop:    8,
              height:       40,
              padding:      "0 20px",
              borderRadius: 10,
              border:       "1px solid hsl(var(--primary) / 0.4)",
              background:   "hsl(var(--primary) / 0.14)",
              color:        "hsl(var(--primary))",
              fontSize:     13,
              fontWeight:   600,
              cursor:       "pointer",
              transition:   "all 0.18s ease",
            }}
          >
            Go to Library
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: "100vh", background: "transparent", position: "relative", overflow: "hidden" }}>
      <Sidebar current={current} onNavigate={onNavigate} />

      <div style={{ height: "100%", marginLeft: 72, display: "flex" }}>

        {/* ══════════════════════════════════════════════════════
            LEFT PANEL — 40% — Poster + details + CTA
        ══════════════════════════════════════════════════════ */}
        <div
          style={{
            flex:           "0 0 40%",
            display:        "flex",
            flexDirection:  "column",
            justifyContent: "center",
            padding:        "40px 40px 40px 36px",
            gap:            0,
            position:       "relative",
            zIndex:         2,
            /* Subtle left-side dark panel that separates from the glow */
            background:     "linear-gradient(90deg, rgba(9,20,19,0.60) 0%, transparent 100%)",
          }}
        >
          <AnimatePresence mode="wait">
            {selected && (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                style={{ display: "flex", flexDirection: "column", gap: 28 }}
              >
                {/* ── Large poster ── */}
                <div
                  style={{
                    width:        200,
                    aspectRatio:  "2/3",
                    borderRadius: 16,
                    overflow:     "hidden",
                    boxShadow:    "0 32px 80px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.08)",
                    flexShrink:   0,
                    position:     "relative",
                  }}
                >
                  {selected.thumbnail ? (
                    <img
                      src={selected.thumbnail}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      alt=""
                    />
                  ) : (
                    <div
                      style={{
                        width:      "100%",
                        height:     "100%",
                        background: "linear-gradient(135deg, hsl(167 24% 10%), hsl(167 20% 16%))",
                        display:    "grid",
                        placeItems: "center",
                      }}
                    >
                      <BookOpen style={{ width: 40, height: 40, color: "rgba(255,255,255,0.2)" }} />
                    </div>
                  )}
                  {/* Shine overlay */}
                  <div
                    style={{
                      position:   "absolute",
                      inset:      0,
                      background: "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, transparent 50%)",
                      pointerEvents: "none",
                    }}
                  />
                </div>

                {/* ── Title ── */}
                <div>
                  <h1
                    style={{
                      margin:        0,
                      fontSize:      22,
                      fontWeight:    700,
                      letterSpacing: "-0.03em",
                      lineHeight:    1.25,
                      color:         "#ffffff",
                      maxWidth:      340,
                    }}
                  >
                    {selected.title}
                  </h1>

                  {/* Kind badge */}
                  <span
                    style={{
                      display:      "inline-block",
                      marginTop:    8,
                      padding:      "2px 8px",
                      borderRadius: 999,
                      fontSize:     10,
                      fontWeight:   700,
                      letterSpacing:"0.1em",
                      textTransform:"uppercase",
                      background:   "hsl(var(--primary) / 0.14)",
                      border:       "1px solid hsl(var(--primary) / 0.3)",
                      color:        "hsl(var(--primary))",
                    }}
                  >
                    {selected.kind ?? "CBZ"}
                  </span>
                </div>

                {/* ── Progress bar ── */}
                <ProgressSection item={selected} />

                {/* ── Continue Reading CTA ── */}
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <button
                    onClick={() => onOpen(selected)}
                    style={{
                      display:      "inline-flex",
                      alignItems:   "center",
                      gap:          10,
                      height:       48,
                      padding:      "0 24px",
                      borderRadius: 14,
                      border:       "none",
                      background:   "hsl(var(--primary))",
                      color:        "#ffffff",
                      fontSize:     14,
                      fontWeight:   700,
                      letterSpacing:"-0.01em",
                      cursor:       "pointer",
                      boxShadow:    "0 8px 32px hsl(var(--primary) / 0.5), 0 2px 8px rgba(0,0,0,0.4)",
                      transition:   "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px) scale(1.02)";
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 12px 40px hsl(var(--primary) / 0.65), 0 2px 8px rgba(0,0,0,0.4)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.transform = "none";
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 32px hsl(var(--primary) / 0.5), 0 2px 8px rgba(0,0,0,0.4)";
                    }}
                  >
                    <Play style={{ width: 16, height: 16 }} fill="currentColor" />
                    Continue Reading
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateItem(selected.id, { isBookmarked: !selected.isBookmarked });
                    }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      border: "1px solid rgba(255,255,255,0.15)",
                      background: selected.isBookmarked ? "hsl(var(--primary) / 0.2)" : "rgba(255,255,255,0.05)",
                      backdropFilter: "blur(8px)",
                      color: selected.isBookmarked ? "hsl(var(--primary))" : "#ffffff",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      boxShadow: selected.isBookmarked ? "0 0 16px hsl(var(--primary) / 0.3)" : "none",
                    }}
                    title={selected.isBookmarked ? "Remove from favorites" : "Favorite comic"}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = selected.isBookmarked ? "hsl(var(--primary) / 0.3)" : "rgba(255,255,255,0.12)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = selected.isBookmarked ? "hsl(var(--primary) / 0.2)" : "rgba(255,255,255,0.05)";
                    }}
                  >
                    <Heart style={{ width: 20, height: 20 }} fill={selected.isBookmarked ? "currentColor" : "none"} />
                  </button>
                </div>

                {/* ── Meta info ── */}
                <MetaRow item={selected} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ══════════════════════════════════════════════════════
            RIGHT PANEL — 60% — Ambient glow + recent list
        ══════════════════════════════════════════════════════ */}
        <div
          style={{
            flex:     "1",
            display:  "flex",
            flexDirection: "column",
            position: "relative",
            zIndex:   2,
          }}
        >
          {/* Ambient color glow pulled from selected cover */}
          <div
            style={{
              position:   "absolute",
              inset:      0,
              background: [
                "radial-gradient(ellipse 70% 60% at 60% 40%, hsl(var(--primary) / 0.08) 0%, transparent 70%)",
                "radial-gradient(ellipse 50% 40% at 40% 70%, rgba(255,255,255,0.025) 0%, transparent 60%)",
              ].join(", "),
              pointerEvents: "none",
            }}
          />

          {/* Recent comics scroll list */}
          <div
            style={{
              position:      "absolute",
              bottom:        40,
              left:          0,
              right:         40,
              display:       "flex",
              flexDirection: "column",
              gap:           8,
              maxHeight:     "55vh",
              overflowY:     "auto",
            }}
          >
            <p
              style={{
                fontSize:      10,
                fontWeight:    700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color:         "rgba(255,255,255,0.35)",
                margin:        "0 0 4px 4px",
              }}
            >
              Recent
            </p>
            {recent.map((c, i) => (
              <RecentRow
                key={c.id}
                item={c}
                isSelected={c.id === selected?.id}
                index={i}
                onSelect={() => { setSelected(c); clearInterval(timerRef.current); }}
                onOpen={() => onOpen(c)}
              />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PROGRESS SECTION
═══════════════════════════════════════════════════════════════ */

function ProgressSection({ item }: { item: LibraryItem }) {
  const pct = item.pageCount
    ? Math.round((item.currentPage / Math.max(1, item.pageCount - 1)) * 100)
    : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div
        style={{
          display:        "flex",
          alignItems:     "center",
          justifyContent: "space-between",
          fontSize:       12,
          color:          "rgba(255,255,255,0.55)",
        }}
      >
        <span>
          Page {item.currentPage + 1} of {item.pageCount ?? "?"}
        </span>
        <span style={{ color: pct >= 100 ? "hsl(142 70% 50%)" : "hsl(var(--primary))", fontWeight: 700 }}>
          {pct}%
        </span>
      </div>

      {/* Bar */}
      <div
        style={{
          height:       4,
          borderRadius: 999,
          background:   "rgba(255,255,255,0.10)",
          overflow:     "hidden",
          maxWidth:     280,
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
          style={{
            height:     "100%",
            borderRadius: 999,
            background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))",
            boxShadow:  "0 0 8px hsl(var(--primary) / 0.6)",
          }}
        />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   META ROW
═══════════════════════════════════════════════════════════════ */

function MetaRow({ item }: { item: LibraryItem }) {
  const lastRead = item.lastReadAt
    ? formatRelative(item.lastReadAt)
    : "Never opened";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "rgba(255,255,255,0.45)" }}>
        <Clock style={{ width: 13, height: 13, flexShrink: 0 }} />
        <span>Last read {lastRead}</span>
      </div>
      {item.pageCount && (
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
          {item.pageCount} pages · {item.kind?.toUpperCase() ?? "Comic"}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   RECENT ROW (right panel list)
═══════════════════════════════════════════════════════════════ */

function RecentRow({
  item,
  isSelected,
  index,
  onSelect,
  onOpen,
}: {
  item:       LibraryItem;
  isSelected: boolean;
  index:      number;
  onSelect:   () => void;
  onOpen:     () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const pct = item.pageCount
    ? Math.round((item.currentPage / Math.max(1, item.pageCount - 1)) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.22, delay: index * 0.04 }}
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display:      "flex",
        alignItems:   "center",
        gap:          12,
        padding:      "10px 14px",
        borderRadius: 12,
        cursor:       "pointer",
        border:       isSelected
          ? "1px solid hsl(var(--primary) / 0.35)"
          : "1px solid rgba(255,255,255,0.06)",
        background:   isSelected
          ? "hsl(var(--primary) / 0.10)"
          : hovered
          ? "rgba(255,255,255,0.05)"
          : "rgba(255,255,255,0.025)",
        transition:   "all 0.18s ease",
        boxShadow:    isSelected ? "0 0 16px hsl(var(--primary) / 0.12)" : "none",
      }}
    >
      {/* Thumbnail */}
      <div
        style={{
          width:        44,
          height:       62,
          borderRadius: 6,
          overflow:     "hidden",
          flexShrink:   0,
          background:   "hsl(var(--muted))",
          boxShadow:    isSelected ? "0 4px 16px hsl(var(--primary) / 0.4)" : "0 4px 12px rgba(0,0,0,0.5)",
          transition:   "box-shadow 0.18s ease",
        }}
      >
        {item.thumbnail ? (
          <img src={item.thumbnail} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center" }}>
            <BookOpen style={{ width: 18, height: 18, color: "rgba(255,255,255,0.2)" }} />
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize:     13,
            fontWeight:   isSelected ? 600 : 500,
            color:        isSelected ? "#fff" : "rgba(255,255,255,0.75)",
            overflow:     "hidden",
            textOverflow: "ellipsis",
            whiteSpace:   "nowrap",
            letterSpacing:"-0.01em",
            transition:   "color 0.15s ease",
          }}
        >
          {item.title}
        </div>
        {/* Mini progress bar */}
        <div style={{ marginTop: 6, height: 2, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden", maxWidth: 120 }}>
          <div
            style={{
              height:     "100%",
              width:      `${pct}%`,
              borderRadius: 999,
              background: isSelected
                ? "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))"
                : "rgba(255,255,255,0.3)",
              boxShadow: isSelected ? "0 0 6px hsl(var(--primary) / 0.5)" : "none",
            }}
          />
        </div>
        <div style={{ marginTop: 4, fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
          {pct}% · {item.currentPage + 1}/{item.pageCount ?? "?"}
        </div>
      </div>

      {/* Open arrow */}
      <button
        onClick={(e) => { e.stopPropagation(); onOpen(); }}
        style={{
          width:        30,
          height:       30,
          borderRadius: 8,
          border:       "1px solid rgba(255,255,255,0.08)",
          background:   hovered || isSelected ? "rgba(255,255,255,0.08)" : "transparent",
          color:        isSelected ? "hsl(var(--primary))" : "rgba(255,255,255,0.4)",
          display:      "grid",
          placeItems:   "center",
          cursor:       "pointer",
          flexShrink:   0,
          transition:   "all 0.15s ease",
        }}
      >
        <ChevronRight style={{ width: 14, height: 14 }} />
      </button>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════ */

function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  const m    = Math.floor(diff / 60_000);
  const h    = Math.floor(diff / 3_600_000);
  const d    = Math.floor(diff / 86_400_000);
  if (m < 2)  return "just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d < 7)  return `${d}d ago`;
  return new Date(ts).toLocaleDateString();
}
