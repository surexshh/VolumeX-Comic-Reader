import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, FolderOpen, Search, RefreshCw, Trash2, BookOpen, ChevronDown, Layers, Bookmark, BookmarkCheck } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { StorageMenu } from "@/components/StorageMenu";
import { CloudBrowser } from "@/components/CloudBrowser";
import { useLibrary, type LibraryItem } from "@/store/library";
import { useBackground } from "@/contexts/BackgroundContext";

interface Props {
  filter: "all" | "recent";
  current: "library" | "recent";
  onNavigate: (route: "library" | "recent" | "settings") => void;
  onOpen: (item: LibraryItem) => void;
}

export function Library({ filter, current, onNavigate, onOpen }: Props) {
  const { items, refresh, addItems, removeItem, updateItem, settings } = useLibrary();
  const visual = settings?.visual ?? {
    layoutMode: "compact", motionMode: "balanced", readerBackground: "amoled",
    dynamicWallpaper: true, blurIntensity: 12, tileGlow: true, ambientExtraction: false
  };
  const [cloudProvider, setCloudProvider] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [scanning, setScanning] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  /* ── Phase 3+4: dynamic background ────────────────────────── */
  const { setSrc } = useBackground();
  const isHoveringCard = useRef(false);
  const rotationRef    = useRef<ReturnType<typeof setInterval>>();
  const rotIdxRef      = useRef(0);

  // Seed background on first load + auto-rotate every 60 s
  useEffect(() => {
    if (!visual.dynamicWallpaper) {
      clearInterval(rotationRef.current);
      setSrc(null);
      return;
    }

    const thumbs = items.map((i) => i.thumbnail).filter(Boolean) as string[];
    if (!thumbs.length) return;

    // Set initial immediately
    setSrc(thumbs[0]);
    rotIdxRef.current = 0;

    clearInterval(rotationRef.current);
    rotationRef.current = setInterval(() => {
      if (isHoveringCard.current) return; // paused while user hovers
      rotIdxRef.current = (rotIdxRef.current + 1) % thumbs.length;
      setSrc(thumbs[rotIdxRef.current]);
    }, 30_000); // 30s rotation

    return () => clearInterval(rotationRef.current);
  }, [items, setSrc, visual.dynamicWallpaper]);

  const handleCardHover = (thumbnail: string | null) => {
    isHoveringCard.current = thumbnail !== null;
    if (thumbnail) setSrc(thumbnail);
  };

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Drag & drop file paths (Electron exposes file.path)
  useEffect(() => {
    const enter = (e: DragEvent) => {
      e.preventDefault();
      setDragging(true);
    };
    const leave = (e: DragEvent) => {
      e.preventDefault();
      if (e.relatedTarget === null) setDragging(false);
    };
    const over = (e: DragEvent) => e.preventDefault();
    const drop = async (e: DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (!e.dataTransfer) return;
      const files = Array.from(e.dataTransfer.files) as Array<File & { path: string }>;
      const paths = files.map((f) => f.path).filter(Boolean);
      await importPaths(paths);
    };
    window.addEventListener("dragenter", enter);
    window.addEventListener("dragleave", leave);
    window.addEventListener("dragover", over);
    window.addEventListener("drop", drop);
    return () => {
      window.removeEventListener("dragenter", enter);
      window.removeEventListener("dragleave", leave);
      window.removeEventListener("dragover", over);
      window.removeEventListener("drop", drop);
    };
  });

  async function importPaths(paths: string[]) {
    if (!paths.length) return;
    setScanning(true);
    try {
      const out: Omit<LibraryItem, "id" | "currentPage" | "addedAt" | "bookmarks">[] = [];
      for (const p of paths) {
        try {
          const scan = await window.api.scanFolder(p);
          if (scan.length) out.push(...scan);
          else {
            const handle = await window.api.openComic(p);
            let thumbnail: string | undefined;
            try {
              const cover = await window.api.getPage(handle.id, 0);
              if (!cover.startsWith("pdf:")) thumbnail = cover;
            } catch (err) {
              console.warn("Cover load failed for", p, err);
            }
            await window.api.closeComic(handle.id);
            const ext = p.split(".").pop()?.toLowerCase() ?? "";
            const kind: LibraryItem["kind"] = ext === "pdf" ? "pdf" : ext === "cbr" || ext === "rar" ? "cbr" : ext === "cbz" || ext === "zip" ? "cbz" : "folder";
            out.push({
              filePath: p,
              title: p.split(/[\\\/]/).pop()?.replace(/\.[^.]+$/, "") ?? p,
              kind,
              size: 0,
              pageCount: handle.pageCount,
              thumbnail,
            });
          }
        } catch (err) {
          console.error("Failed to import", p, err);
        }
      }
      if (out.length) await addItems(out);
    } finally {
      setScanning(false);
    }
  }

  async function pickFolder() {
    const folder = await window.api.openFolder();
    if (folder) await importPaths([folder]);
  }

  async function pickFiles() {
    const files = await window.api.openFiles();
    if (files.length) await importPaths(files);
  }

  const filtered = items
    .filter((c) =>
      filter === "recent" ? c.lastReadAt && c.lastReadAt > Date.now() - 30 * 24 * 3600 * 1000 : true
    )
    .filter((c) => c.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <div ref={dropRef} className={"h-screen " + (dragging ? "drop-target" : "")} style={{ background: "transparent", position: "relative" }}>
      <Sidebar current={current} onNavigate={onNavigate} />

      <main className="cover-main overflow-y-auto" style={{ height: "100%", marginLeft: 72 }}>
        {/* ── Header ── */}
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 10,
            height: 64,
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            background: "hsl(167 47% 6% / 0.92)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
          }}
        >
          <div
            style={{
              display: "flex",
              height: "100%",
              alignItems: "center",
              gap: 12,
              paddingLeft: 28,
              paddingRight: 28,
            }}
          >
            {/* Title + count */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h1
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  letterSpacing: "-0.025em",
                  color: "#ffffff",
                  margin: 0,
                }}
              >
                {filter === "recent" ? "Recently read" : "Library"}
              </h1>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.07)",
                  color: "rgba(255,255,255,0.5)",
                  letterSpacing: "0.02em",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                {items.length}
              </span>
            </div>

            {/* Right actions */}
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
              {/* Search */}
              <div style={{ position: "relative" }}>
                <Search
                  style={{
                    position: "absolute",
                    left: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 14,
                    height: 14,
                    color: "rgba(255,255,255,0.35)",
                    pointerEvents: "none",
                  }}
                />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search library…"
                  style={{
                    height: 36,
                    width: 220,
                    paddingLeft: 32,
                    paddingRight: 12,
                    fontSize: 13,
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.05)",
                    color: "#ffffff",
                    outline: "none",
                    transition: "all 0.2s ease",
                  }}
                  onFocus={(e) => {
                    e.target.style.border = "1px solid hsl(var(--primary) / 0.5)";
                    e.target.style.boxShadow = "0 0 0 3px hsl(var(--primary) / 0.1)";
                    e.target.style.background = "rgba(255,255,255,0.07)";
                  }}
                  onBlur={(e) => {
                    e.target.style.border = "1px solid rgba(255,255,255,0.08)";
                    e.target.style.boxShadow = "none";
                    e.target.style.background = "rgba(255,255,255,0.05)";
                  }}
                />
              </div>

              {/* Refresh */}
              <button
                onClick={() => refresh()}
                title="Refresh"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.07)",
                  background: "rgba(255,255,255,0.04)",
                  color: "rgba(255,255,255,0.5)",
                  display: "grid",
                  placeItems: "center",
                  cursor: "pointer",
                  transition: "all 0.18s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.08)";
                  (e.currentTarget as HTMLButtonElement).style.color = "#ffffff";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)";
                  (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.5)";
                }}
              >
                <RefreshCw className={"w-4 h-4 " + (scanning ? "animate-spin" : "")} />
              </button>

              {/* Add files */}
              <button
                onClick={pickFiles}
                title="Add comic files (CBZ / CBR / PDF / images)"
                style={{
                  height: 36,
                  paddingLeft: 14,
                  paddingRight: 14,
                  borderRadius: 10,
                  border: "none",
                  background: "hsl(var(--primary))",
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  cursor: "pointer",
                  boxShadow: "0 4px 16px hsl(var(--primary) / 0.4)",
                  transition: "all 0.2s ease",
                  letterSpacing: "-0.01em",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 24px hsl(var(--primary) / 0.6)";
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 16px hsl(var(--primary) / 0.4)";
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                }}
              >
                <Plus style={{ width: 14, height: 14 }} strokeWidth={2.5} />
                Add files
              </button>
              <div style={{ display: "flex", gap: 12 }}>
                <StorageMenu 
                  onAddLocal={pickFolder} 
                  onAddCloud={(provider) => setCloudProvider(provider)} 
                />
              </div>
            </div>
          </div>
        </header>

        {/* ── Content ── */}
        <div style={{ padding: "24px 28px" }}>
          {items.length === 0 ? (
            <Empty pickFiles={pickFiles} pickFolder={pickFolder} />
          ) : filtered.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 300,
                gap: 12,
              }}
            >
              <Layers style={{ width: 40, height: 40, color: "rgba(255,255,255,0.15)" }} />
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", margin: 0 }}>
                No comics match your search.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  visual.layoutMode === "compact" ? "repeat(auto-fill, minmax(130px, 1fr))" :
                  visual.layoutMode === "poster" ? "repeat(auto-fill, minmax(220px, 1fr))" :
                  "repeat(auto-fill, minmax(160px, 1fr))",
                gap: 
                  visual.layoutMode === "compact" ? 10 :
                  visual.layoutMode === "poster" ? 0 :
                  18,
                paddingBottom: 60,
              }}
            >
              {filtered.map((c) => (
                <Card
                  key={c.id}
                  item={c}
                  onOpen={onOpen}
                  onDelete={removeItem}
                  onToggleBookmark={(id, val) => updateItem(id, { isBookmarked: val })}
                  onHoverChange={handleCardHover}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <AnimatePresence>
        {cloudProvider && (
          <CloudBrowser
            provider={cloudProvider}
            onClose={() => setCloudProvider(null)}
            onImported={() => {
              refresh();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export function Card({
  item,
  onOpen,
  onDelete,
  onToggleBookmark,
  onHoverChange,
}: {
  item: LibraryItem;
  onOpen: (i: LibraryItem) => void;
  onDelete: (id: string) => void;
  onToggleBookmark: (id: string, val: boolean) => void;
  onHoverChange?: (thumbnail: string | null) => void;
}) {
  const { settings } = useLibrary();
  const visual = settings?.visual ?? {
    layoutMode: "compact", motionMode: "balanced", readerBackground: "amoled",
    dynamicWallpaper: true, blurIntensity: 12, tileGlow: true, ambientExtraction: false
  };
  const isPerformance = visual.motionMode === "performance";

  const progress = item.pageCount
    ? Math.round((item.currentPage / Math.max(1, item.pageCount - 1)) * 100)
    : 0;

  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{
        position: "relative",
        borderRadius: visual.layoutMode === "poster" ? 0 : 16,
        overflow: "hidden",
        border: visual.layoutMode === "poster" ? "none" : hovered
          ? "1px solid hsl(var(--primary) / 0.4)"
          : "1px solid rgba(255,255,255,0.07)",
        background: "hsl(var(--card))",
        cursor: "pointer",
        transition: isPerformance ? "none" : "all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
        transform: !isPerformance && hovered ? "translateY(-4px) scale(1.015)" : "translateY(0) scale(1)",
        boxShadow: visual.layoutMode === "poster" ? "none" : hovered
          ? "0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px hsl(var(--primary) / 0.2), 0 0 24px hsl(var(--primary) / 0.1)"
          : "0 4px 16px rgba(0,0,0,0.4)",
      }}
      onClick={() => onOpen(item)}
      onMouseEnter={() => { setHovered(true);  onHoverChange?.(item.thumbnail ?? null); }}
      onMouseLeave={() => { setHovered(false); onHoverChange?.(null); }}
    >
      {/* Cover */}
      <div style={{ aspectRatio: "2/3", background: "hsl(var(--muted))", position: "relative", overflow: "hidden" }}>
        {item.thumbnail ? (
          <img
            src={item.thumbnail}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.3s ease" }}
            loading="lazy"
            alt=""
          />
        ) : (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              background: "linear-gradient(135deg, hsl(167 24% 8%) 0%, hsl(167 20% 12%) 100%)",
            }}
          >
            <BookOpen style={{ width: 32, height: 32, color: "rgba(255,255,255,0.2)" }} />
          </div>
        )}

        {/* Hover gradient overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, transparent 40%, rgba(9,20,19,0.9) 100%)",
            opacity: hovered ? 1 : 0,
            transition: "opacity 0.25s ease",
          }}
        />

        {/* Kind badge */}
        <div
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            padding: "2px 6px",
            borderRadius: 6,
            background: "rgba(9,20,19,0.75)",
            backdropFilter: "blur(8px)",
            color: "rgba(255,255,255,0.7)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          {item.kind}
        </div>

        {/* Progress bar */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 3,
            background: "rgba(255,255,255,0.1)",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))",
              boxShadow: progress > 0 ? "0 0 8px hsl(var(--primary) / 0.8)" : "none",
              borderRadius: "0 2px 2px 0",
              transition: "width 0.3s ease",
            }}
          />
        </div>

        {/* Delete button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm(`Remove "${item.title}" from library?`)) onDelete(item.id);
          }}
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            width: 28,
            height: 28,
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(9,20,19,0.8)",
            backdropFilter: "blur(8px)",
            color: "rgba(255,255,255,0.7)",
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
            opacity: hovered ? 1 : 0,
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "hsl(var(--primary))";
            (e.currentTarget as HTMLButtonElement).style.color = "#ffffff";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(9,20,19,0.8)";
            (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.7)";
          }}
          title="Remove from library"
        >
          <Trash2 style={{ width: 14, height: 14 }} />
        </button>

        {/* Bookmark button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleBookmark(item.id, !item.isBookmarked);
          }}
          style={{
            position: "absolute",
            top: 8,
            right: 44, // Next to the delete button
            width: 28,
            height: 28,
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.12)",
            background: item.isBookmarked ? "hsl(var(--primary))" : "rgba(9,20,19,0.8)",
            backdropFilter: "blur(8px)",
            color: item.isBookmarked ? "#fff" : "rgba(255,255,255,0.7)",
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
            opacity: hovered || item.isBookmarked ? 1 : 0,
            transition: "all 0.2s ease",
            boxShadow: item.isBookmarked ? "0 0 12px hsl(var(--primary) / 0.5)" : "none",
          }}
          onMouseEnter={(e) => {
            if (!item.isBookmarked) {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.15)";
              (e.currentTarget as HTMLButtonElement).style.color = "#ffffff";
            }
          }}
          onMouseLeave={(e) => {
            if (!item.isBookmarked) {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(9,20,19,0.8)";
              (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.7)";
            }
          }}
          title={item.isBookmarked ? "Remove from bookmarks" : "Add to bookmarks"}
        >
          {item.isBookmarked ? <BookmarkCheck style={{ width: 14, height: 14 }} /> : <Bookmark style={{ width: 14, height: 14 }} />}
        </button>
      </div>

      {/* Info */}
      <div style={{ padding: "10px 12px 12px" }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            lineHeight: 1.35,
            color: "#ffffff",
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            letterSpacing: "-0.01em",
          }}
        >
          {item.title}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginTop: 6,
            fontSize: 11,
            color: "rgba(255,255,255,0.4)",
          }}
        >
          <span style={{ fontWeight: 500 }}>
            {(item.currentPage ?? 0) + 1} / {item.pageCount ?? "?"}
          </span>
          {progress > 0 && (
            <>
              <span style={{ opacity: 0.4 }}>·</span>
              <span style={{ color: "hsl(var(--primary))", fontWeight: 600 }}>{progress}%</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Empty({ pickFiles, pickFolder }: { pickFiles: () => void; pickFolder: () => void }) {
  return (
    <div
      style={{
        display: "grid",
        minHeight: "calc(100vh - 100px)",
        placeItems: "center",
      }}
    >
      <div
        style={{
          maxWidth: 480,
          textAlign: "center",
          padding: "48px 32px",
          borderRadius: 24,
          border: "1px solid rgba(255,255,255,0.06)",
          background: "hsl(var(--card))",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Ambient glow bg */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(circle at 50% 0%, hsl(var(--primary) / 0.08) 0%, transparent 60%)",
            pointerEvents: "none",
          }}
        />

        {/* Icon stack */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 24,
            background: "hsl(var(--primary) / 0.12)",
            border: "1px solid hsl(var(--primary) / 0.25)",
            display: "grid",
            placeItems: "center",
            margin: "0 auto 24px",
            boxShadow: "0 0 32px hsl(var(--primary) / 0.2)",
          }}
        >
          <BookOpen style={{ width: 36, height: 36, color: "hsl(var(--primary))" }} strokeWidth={1.5} />
        </div>

        <h2
          style={{
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            color: "#ffffff",
            margin: "0 0 12px",
          }}
        >
          Your library is empty
        </h2>
        <p
          style={{
            fontSize: 14,
            color: "rgba(255,255,255,0.45)",
            lineHeight: 1.6,
            margin: "0 0 32px",
          }}
        >
          Add comic books, manga, or PDF files to start reading.
          Volume will sync automatically with your folders.
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
          <button
            onClick={pickFolder}
            style={{
              height: 42,
              paddingLeft: 20,
              paddingRight: 20,
              borderRadius: 12,
              border: "none",
              background: "hsl(var(--primary))",
              color: "#ffffff",
              fontSize: 14,
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
              boxShadow: "0 4px 20px hsl(var(--primary) / 0.45)",
              transition: "all 0.2s ease",
              letterSpacing: "-0.01em",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 28px hsl(var(--primary) / 0.65)";
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 20px hsl(var(--primary) / 0.45)";
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
            }}
          >
            <FolderOpen style={{ width: 16, height: 16 }} />
            Add folder
          </button>
          <button
            onClick={pickFiles}
            style={{
              height: 42,
              paddingLeft: 20,
              paddingRight: 20,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.05)",
              color: "rgba(255,255,255,0.8)",
              fontSize: 14,
              fontWeight: 500,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.09)";
              (e.currentTarget as HTMLButtonElement).style.color = "#ffffff";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)";
              (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.8)";
            }}
          >
            <Plus style={{ width: 14, height: 14 }} strokeWidth={2} />
            Add files
          </button>
        </div>
      </div>
    </div>
  );
}
