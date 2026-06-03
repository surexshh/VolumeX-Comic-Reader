/**
 * Right-side slide-out panel that lists all bookmarks for the current comic.
 */
import { Bookmark, X } from "lucide-react";

interface Props {
  open: boolean;
  bookmarks: number[];
  pageCount: number;
  onClose: () => void;
  onJump: (page: number) => void;
  onRemove: (page: number) => void;
}

export function BookmarksPanel({ open, bookmarks, pageCount, onClose, onJump, onRemove }: Props) {
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(9, 20, 19, 0.6)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          zIndex: 40,
          transition: "opacity 0.2s ease",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
        }}
      />

      {/* Panel */}
      <aside
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: 300,
          background: "hsl(167 28% 7%)",
          borderLeft: "1px solid rgba(255,255,255,0.07)",
          zIndex: 50,
          boxShadow: "-20px 0 60px rgba(0,0,0,0.7)",
          transition: "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          transform: open ? "translateX(0)" : "translateX(100%)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 18px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            flexShrink: 0,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Bookmark style={{ width: 14, height: 14, color: "hsl(var(--primary))" }} />
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#ffffff", margin: 0, letterSpacing: "-0.01em" }}>
                Bookmarks
              </h3>
            </div>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "4px 0 0" }}>
              {bookmarks.length} {bookmarks.length === 1 ? "page" : "pages"} saved
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.05)",
              color: "rgba(255,255,255,0.5)",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.1)";
              (e.currentTarget as HTMLButtonElement).style.color = "#ffffff";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)";
              (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.5)";
            }}
          >
            <X style={{ width: 14, height: 14 }} />
          </button>
        </header>

        {/* List */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "10px 10px",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {bookmarks.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                gap: 12,
                color: "rgba(255,255,255,0.3)",
                textAlign: "center",
                padding: "0 24px",
              }}
            >
              <Bookmark style={{ width: 32, height: 32, opacity: 0.4 }} />
              <p style={{ fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                No bookmarks yet.{" "}
                <br />
                Press{" "}
                <kbd
                  style={{
                    padding: "2px 6px",
                    borderRadius: 6,
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "rgba(255,255,255,0.6)",
                    fontFamily: "monospace",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  B
                </kbd>{" "}
                to bookmark a page.
              </p>
            </div>
          ) : (
            bookmarks.map((p, i) => (
              <BookmarkRow
                key={p}
                page={p}
                index={i}
                pageCount={pageCount}
                onJump={() => { onJump(p); onClose(); }}
                onRemove={() => onRemove(p)}
              />
            ))
          )}
        </div>
      </aside>
    </>
  );
}

function BookmarkRow({
  page,
  index,
  pageCount,
  onJump,
  onRemove,
}: {
  page: number;
  index: number;
  pageCount: number;
  onJump: () => void;
  onRemove: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        borderRadius: 12,
        border: hovered ? "1px solid hsl(var(--primary) / 0.25)" : "1px solid transparent",
        background: hovered ? "hsl(var(--primary) / 0.07)" : "rgba(255,255,255,0.03)",
        cursor: "pointer",
        transition: "all 0.18s ease",
      }}
      onClick={onJump}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          display: "grid",
          placeItems: "center",
          background: "hsl(var(--primary) / 0.14)",
          flexShrink: 0,
        }}
      >
        <Bookmark style={{ width: 12, height: 12, color: "hsl(var(--primary))", fill: "hsl(var(--primary))" }} />
      </div>

      <span style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.9)", flex: 1 }}>
        Page {page + 1}
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginLeft: 6 }}>/ {pageCount}</span>
      </span>

      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        aria-label="Remove bookmark"
        style={{
          width: 24,
          height: 24,
          borderRadius: 6,
          border: "none",
          background: "transparent",
          color: "rgba(255,255,255,0.3)",
          display: "grid",
          placeItems: "center",
          cursor: "pointer",
          opacity: hovered ? 1 : 0,
          transition: "all 0.15s ease",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(220,50,50,0.2)";
          (e.currentTarget as HTMLButtonElement).style.color = "#f87171";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "transparent";
          (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.3)";
        }}
      >
        <X style={{ width: 11, height: 11 }} />
      </button>
    </div>
  );
}

import { useState } from "react";
