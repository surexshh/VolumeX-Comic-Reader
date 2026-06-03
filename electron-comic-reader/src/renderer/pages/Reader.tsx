import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Heart,
  Layout,
  List,
  Loader2,
  Maximize2,
  Minimize2,
  Sparkles,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  DEFAULT_AI_DIALOGUE_SETTINGS,
  loadSettings,
  saveSettings,
  useLibrary,
  type AIDialogueSettings,
  type LibraryItem,
  type ReadingMode,
  type Settings,
  type ZoomMode,
} from "@/store/library";
import { renderPdfPage } from "@/lib/pdfRender";
import { BookmarksPanel } from "@/components/BookmarksPanel";
import { AIDialogueLayer } from "@/components/AIDialogueLayer";
import { FloatingNavigationControls } from "@/components/reader/FloatingNavigationControls";
import type { DialoguePageInput } from "@/lib/aiDialogue";

interface Props {
  itemId: string;
  onBack: () => void;
}

export function Reader({ itemId, onBack }: Props) {
  const { items, updateItem } = useLibrary();
  const item = useMemo<LibraryItem | undefined>(
    () => items.find((i) => i.id === itemId),
    [items, itemId]
  );

  const [comicId, setComicId] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState(item?.pageCount ?? 0);
  const [page, setPage] = useState(item?.currentPage ?? 0);
  const [pageUrl, setPageUrl] = useState<string | null>(null);
  const [pageUrl2, setPageUrl2] = useState<string | null>(null);
  const [settings, setSettings] = useState<Settings>({
    readingMode: "single",
    zoomMode: "fit-height",
    zoomPercent: 100,
    aiDialogue: DEFAULT_AI_DIALOGUE_SETTINGS,
  });
  const [fullscreen, setFullscreen] = useState(false);
  const [showBars, setShowBars] = useState(true);
  const [navVisible, setNavVisible] = useState(true);
  const [bookmarksOpen, setBookmarksOpen] = useState(false);
  const [continuousDialogueUrl, setContinuousDialogueUrl] = useState<string | null>(null);

  const ctrRef = useRef<HTMLDivElement>(null);
  const pageAreaRef = useRef<HTMLDivElement>(null);
  const wheelTimerRef = useRef<number | null>(null);
  const navTimerRef = useRef<number | null>(null);
  const dragRef = useRef({ down: false, dragged: false, x: 0, y: 0, scrollX: 0, scrollY: 0 });

  const filePath = item?.filePath ?? "";
  const title = item?.title ?? "";
  const bookmarks = item?.bookmarks ?? [];

  // Load saved reading settings
  useEffect(() => {
    loadSettings().then(setSettings);
  }, []);

  // Open the comic in main; remember the handle id
  useEffect(() => {
    if (!filePath) return;
    let active = true;
    let id: string | null = null;
    (async () => {
      const handle = await window.api.openComic(filePath);
      if (!active) {
        await window.api.closeComic(handle.id);
        return;
      }
      id = handle.id;
      setComicId(handle.id);
      setPageCount(handle.pageCount);
    })();
    return () => {
      active = false;
      if (id) window.api.closeComic(id).catch(() => {});
    };
  }, [filePath]);

  // Fetch current page(s) for non-continuous modes
  useEffect(() => {
    if (!comicId || settings.readingMode === "continuous") return;
    let cancelled = false;
    (async () => {
      const url = await resolvePage(comicId, page);
      if (!cancelled) setPageUrl(url);
      if (settings.readingMode === "double" && page + 1 < pageCount) {
        const u2 = await resolvePage(comicId, page + 1);
        if (!cancelled) setPageUrl2(u2);
      } else {
        setPageUrl2(null);
      }
      if (page + 1 < pageCount) resolvePage(comicId, page + 1).catch(() => {});
    })();
    return () => {
      cancelled = true;
    };
  }, [comicId, page, pageCount, settings.readingMode]);

  // Persist current page (debounced)
  useEffect(() => {
    if (!item) return;
    const t = setTimeout(() => {
      updateItem(item.id, { currentPage: page, lastReadAt: Date.now() });
    }, 400);
    return () => clearTimeout(t);
  }, [item, page, updateItem]);

  // Keep the reader chrome predictable across every reading mode. Entering
  // fullscreen hides the bars; right-click can reveal/hide them while staying
  // fullscreen.
  useEffect(() => {
    let active = true;
    window.api.isFullscreen().then((fs) => {
      if (!active) return;
      setFullscreen(fs);
      setShowBars(!fs);
    });

    const fn = () => {
      const fs = !!document.fullscreenElement;
      if (fs) {
        setFullscreen(true);
        setShowBars(false);
      }
    };
    document.addEventListener("fullscreenchange", fn);
    return () => {
      active = false;
      document.removeEventListener("fullscreenchange", fn);
    };
  }, []);

  useEffect(() => {
    const wakeNavigation = () => {
      setNavVisible(true);
      if (navTimerRef.current) window.clearTimeout(navTimerRef.current);
      navTimerRef.current = window.setTimeout(() => setNavVisible(false), 2600);
    };

    wakeNavigation();
    const el = ctrRef.current;
    el?.addEventListener("mousemove", wakeNavigation);
    el?.addEventListener("pointerdown", wakeNavigation);
    return () => {
      el?.removeEventListener("mousemove", wakeNavigation);
      el?.removeEventListener("pointerdown", wakeNavigation);
      if (navTimerRef.current) window.clearTimeout(navTimerRef.current);
    };
  }, []);

  const isManga = settings.readingMode === "manga";

  const next = useCallback(() => {
    const step = settings.readingMode === "double" ? 2 : 1;
    setPage((p) => Math.min(pageCount - 1, p + step));
  }, [settings.readingMode, pageCount]);

  const prev = useCallback(() => {
    const step = settings.readingMode === "double" ? 2 : 1;
    setPage((p) => Math.max(0, p - step));
  }, [settings.readingMode]);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((s) => {
      const out = { ...s, ...patch };
      saveSettings(out);
      return out;
    });
  }, []);

  const updateAIDialogueSettings = useCallback((patch: Partial<AIDialogueSettings>) => {
    setSettings((s) => {
      const out = { ...s, aiDialogue: { ...s.aiDialogue, ...patch } };
      saveSettings(out);
      return out;
    });
  }, []);

  const setReaderFullscreen = useCallback(async (value: boolean) => {
    if (!value && document.fullscreenElement) {
      await document.exitFullscreen();
    }
    const fs = await window.api.setFullscreen(value);
    setFullscreen(fs);
    setShowBars(!fs);
  }, []);

  const toggleFullscreen = useCallback(() => {
    setReaderFullscreen(!fullscreen).catch(() => {
      if (!document.fullscreenElement) ctrRef.current?.requestFullscreen?.();
      else document.exitFullscreen();
    });
  }, [fullscreen, setReaderFullscreen]);

  const toggleBookmark = useCallback(() => {
    if (!item) return;
    const list = new Set(item.bookmarks ?? []);
    if (list.has(page)) list.delete(page);
    else list.add(page);
    updateItem(item.id, { bookmarks: Array.from(list).sort((a, b) => a - b) });
  }, [item, page, updateItem]);

  const removeBookmark = useCallback(
    (p: number) => {
      if (!item) return;
      updateItem(item.id, { bookmarks: (item.bookmarks ?? []).filter((b) => b !== p) });
    },
    [item, updateItem]
  );

  const resetZoom = useCallback(() => {
    if (settings.zoomMode === "custom") {
      updateSettings({ zoomMode: "fit-height", zoomPercent: 100 });
    } else {
      updateSettings({ zoomMode: "custom", zoomPercent: 150 });
    }
  }, [settings.zoomMode, updateSettings]);

  useEffect(() => {
    if (!settings.aiDialogue.enabled || !comicId || settings.readingMode !== "continuous") {
      setContinuousDialogueUrl(null);
      return;
    }
    let cancelled = false;
    resolvePage(comicId, page)
      .then((url) => {
        if (!cancelled) setContinuousDialogueUrl(url);
      })
      .catch(() => {
        if (!cancelled) setContinuousDialogueUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [comicId, page, settings.aiDialogue.enabled, settings.readingMode]);

  // Keyboard shortcuts
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement) return;

      const stepForward = isManga ? prev : next;
      const stepBackward = isManga ? next : prev;

      if (e.key === "ArrowRight") {
        e.preventDefault();
        stepForward();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        stepBackward();
      } else if (e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        next();
      } else if (e.key === "Backspace" || e.key === "PageUp") {
        e.preventDefault();
        prev();
      } else if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        updateSettings({
          zoomPercent: Math.min(400, settings.zoomPercent + 10),
          zoomMode: "custom",
        });
      } else if (e.key === "-") {
        e.preventDefault();
        updateSettings({
          zoomPercent: Math.max(25, settings.zoomPercent - 10),
          zoomMode: "custom",
        });
      } else if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        updateSettings({ readingMode: isManga ? "single" : "manga" });
      } else if (e.key === "p" || e.key === "P") {
        e.preventDefault();
        updateSettings({ readingMode: settings.readingMode === "double" ? "single" : "double" });
      } else if (e.key === "f" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        // Reserved for search
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === "b" || e.key === "B") {
        e.preventDefault();
        toggleBookmark();
      } else if (e.key === "Escape") {
        if (fullscreen || document.fullscreenElement) setReaderFullscreen(false);
        else onBack();
      } else if (e.key === "Home") {
        e.preventDefault();
        setPage(0);
      } else if (e.key === "End") {
        e.preventDefault();
        setPage(Math.max(0, pageCount - 1));
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [
    next,
    prev,
    isManga,
    updateSettings,
    settings.readingMode,
    toggleFullscreen,
    toggleBookmark,
    settings.zoomPercent,
    fullscreen,
    setReaderFullscreen,
    onBack,
    pageCount,
  ]);

  // Wheel handling: Ctrl+wheel zoom; else debounced page nav (paged modes)
  useEffect(() => {
    const el = ctrRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 10 : -10;
        updateSettings({
          zoomMode: "custom",
          zoomPercent: Math.max(25, Math.min(400, settings.zoomPercent + delta)),
        });
        return;
      }
      if (settings.readingMode === "continuous") return;
      if (wheelTimerRef.current) {
        e.preventDefault();
        return;
      }
      e.preventDefault();
      if (e.deltaY > 0) next();
      else if (e.deltaY < 0) prev();
      wheelTimerRef.current = window.setTimeout(() => {
        wheelTimerRef.current = null;
      }, 280);
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => {
      el.removeEventListener("wheel", handler);
      if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current);
    };
  }, [settings.readingMode, settings.zoomPercent, next, prev, updateSettings]);

  // Click zone gestures with drag-to-pan
  const handleZoneMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) {
      e.preventDefault();
      return;
    }
    const scroller = pageAreaRef.current;
    dragRef.current = {
      down: true,
      dragged: false,
      x: e.clientX,
      y: e.clientY,
      scrollX: scroller?.scrollLeft ?? 0,
      scrollY: scroller?.scrollTop ?? 0,
    };
  };
  const handleZoneMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current.down) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    if (!dragRef.current.dragged && Math.abs(dx) + Math.abs(dy) > 6) {
      dragRef.current.dragged = true;
    }
    if (dragRef.current.dragged && pageAreaRef.current) {
      pageAreaRef.current.scrollLeft = dragRef.current.scrollX - dx;
      pageAreaRef.current.scrollTop = dragRef.current.scrollY - dy;
    }
  };
  const handleZoneMouseUp = (side: "left" | "right") => (e: React.MouseEvent) => {
    // Only the primary (left) button paginates. Right- and middle-click are
    // ignored so right-click can be reserved for the fullscreen toggle.
    if (e.button !== 0) {
      e.preventDefault();
      dragRef.current.down = false;
      dragRef.current.dragged = false;
      return;
    }
    const wasDragged = dragRef.current.dragged;
    dragRef.current.down = false;
    dragRef.current.dragged = false;
    if (wasDragged) return;
    if (side === "left") prev();
    else next();
  };
  const handleZoneLeave = () => {
    dragRef.current.down = false;
    dragRef.current.dragged = false;
  };

  const suppressNonPrimaryClick = (e: React.MouseEvent) => {
    if (e.button !== 0) e.preventDefault();
  };

  // Right-click starts fullscreen from normal reading. Once fullscreen, it
  // toggles only the bars so the pages never advance from a right-click.
  const onContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (fullscreen) {
      setShowBars((shown) => !shown);
    } else {
      setReaderFullscreen(true).catch(() => ctrRef.current?.requestFullscreen?.());
    }
  };

  const sizeClass =
    settings.zoomMode === "fit-width"
      ? "w-full h-auto"
      : settings.zoomMode === "fit-height"
        ? "h-[calc(100vh-60px)] w-auto object-contain"
        : "max-w-none max-h-none";
  // Smoothly animate width changes so zoom in/out doesn't jump.
  const customStyle: React.CSSProperties =
    settings.zoomMode === "custom"
      ? { width: `${settings.zoomPercent}%`, height: "auto", transition: "width 140ms ease-out" }
      : { transition: "width 140ms ease-out, height 140ms ease-out" };

  const visibleDialoguePages = useMemo<DialoguePageInput[]>(() => {
    if (settings.readingMode === "continuous") {
      return continuousDialogueUrl
        ? [{ pageIndex: page, imageUrl: continuousDialogueUrl, placement: "single" }]
        : [];
    }
    const pages: DialoguePageInput[] = [];
    if (pageUrl) pages.push({ pageIndex: page, imageUrl: pageUrl, placement: "single" });
    if (settings.readingMode === "double" && pageUrl2 && page + 1 < pageCount) {
      pages.push({ pageIndex: page + 1, imageUrl: pageUrl2, placement: "right" });
    }
    return pages;
  }, [continuousDialogueUrl, page, pageCount, pageUrl, pageUrl2, settings.readingMode]);

  if (!item) {
    return (
      <div
        style={{
          display: "grid",
          height: "100vh",
          placeItems: "center",
          background: "hsl(var(--bg))",
          fontSize: 14,
          color: "rgba(255,255,255,0.35)",
        }}
      >
        Comic not found.
      </div>
    );
  }

  const toolbarVisible = showBars || !fullscreen;
  const activeBookmark = bookmarks.includes(page);
  const visual = settings?.visual ?? {
    layoutMode: "compact", motionMode: "balanced", readerBackground: "amoled",
    dynamicWallpaper: true, blurIntensity: 12, tileGlow: true, ambientExtraction: false
  };

  // Background style based on visual settings
  const readerBgStyle = useMemo(() => {
    switch (visual.readerBackground) {
      case "amoled":
        return { background: "#000000" };
      case "gradient":
        return { background: "linear-gradient(145deg, hsl(167 28% 6%), #000000)" };
      case "blurred":
        return { background: "rgba(9,20,19,0.45)", backdropFilter: "blur(48px)", WebkitBackdropFilter: "blur(48px)" };
      case "ambient":
        return { background: "transparent" }; // Let the DynamicBackgroundEngine handle the ambient color behind it
      default:
        return { background: "#000000" };
    }
  }, [visual.readerBackground]);

  return (
    <div
      ref={ctrRef}
      className="relative h-screen overflow-hidden text-foreground"
      style={readerBgStyle}
      onContextMenu={onContextMenu}
    >
      <div
        style={{
          position: "absolute",
          insetInline: 0,
          top: 0,
          zIndex: 30,
          display: "flex",
          height: 56,
          alignItems: "center",
          gap: 8,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(9,20,19,0.82)",
          backdropFilter: "blur(32px)",
          WebkitBackdropFilter: "blur(32px)",
          paddingLeft: 14,
          paddingRight: 14,
          color: "#ffffff",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          transition: "transform 0.2s ease, opacity 0.2s ease",
          transform: toolbarVisible ? "translateY(0)" : "translateY(-100%)",
          opacity: toolbarVisible ? 1 : 0,
          pointerEvents: toolbarVisible ? "auto" : "none",
        }}
      >
        {/* Back */}
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to library"
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.06)",
            color: "rgba(255,255,255,0.75)",
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
            flexShrink: 0,
            transition: "all 0.18s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.12)";
            (e.currentTarget as HTMLButtonElement).style.color = "#ffffff";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)";
            (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.75)";
          }}
        >
          <ArrowLeft style={{ width: 16, height: 16 }} />
        </button>

        {/* Title */}
        <div style={{ minWidth: 0, flex: 1 }}>
          <h1
            style={{
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "#ffffff",
              margin: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {title}
          </h1>
          <p
            style={{
              fontSize: 11,
              color: "rgba(255,255,255,0.4)",
              margin: 0,
              fontVariantNumeric: "tabular-nums",
              fontWeight: 500,
            }}
          >
            Page {pageCount === 0 ? 0 : page + 1} / {pageCount}
          </p>
        </div>

        {/* Reading mode switcher */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.04)",
            padding: 3,
            gap: 2,
          }}
        >
          {(["single", "double", "continuous", "manga"] as ReadingMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => updateSettings({ readingMode: mode })}
              style={{
                padding: "5px 12px",
                borderRadius: 9,
                border: settings.readingMode === mode
                  ? "1px solid hsl(var(--primary) / 0.4)"
                  : "1px solid transparent",
                background: settings.readingMode === mode
                  ? "hsl(var(--primary))"
                  : "transparent",
                color: settings.readingMode === mode
                  ? "#ffffff"
                  : "rgba(255,255,255,0.45)",
                fontSize: 12,
                fontWeight: settings.readingMode === mode ? 600 : 400,
                textTransform: "capitalize",
                cursor: "pointer",
                transition: "all 0.18s ease",
                boxShadow: settings.readingMode === mode
                  ? "0 0 12px hsl(var(--primary) / 0.4)"
                  : "none",
                letterSpacing: "-0.01em",
              }}
              onMouseEnter={(e) => {
                if (settings.readingMode !== mode) {
                  (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.8)";
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.07)";
                }
              }}
              onMouseLeave={(e) => {
                if (settings.readingMode !== mode) {
                  (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.45)";
                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                }
              }}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Zoom controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
          <button
            type="button"
            onClick={() => updateSettings({ zoomMode: "fit-width" })}
            style={{
              padding: "5px 10px",
              borderRadius: 8,
              border: "none",
              background: "transparent",
              fontSize: 12,
              color: "rgba(255,255,255,0.45)",
              cursor: "pointer",
              transition: "all 0.15s ease",
              fontWeight: 400,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.08)";
              (e.currentTarget as HTMLButtonElement).style.color = "#ffffff";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.45)";
            }}
          >
            Fit W
          </button>
          <button
            type="button"
            onClick={() => updateSettings({ zoomMode: "fit-height" })}
            style={{
              padding: "5px 10px",
              borderRadius: 8,
              border: "none",
              background: "transparent",
              fontSize: 12,
              color: "rgba(255,255,255,0.45)",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.08)";
              (e.currentTarget as HTMLButtonElement).style.color = "#ffffff";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.45)";
            }}
          >
            Fit H
          </button>
          <ReaderIconBtn
            label="Zoom out"
            onClick={() => updateSettings({ zoomMode: "custom", zoomPercent: Math.max(25, settings.zoomPercent - 10) })}
            icon={<ZoomOut style={{ width: 15, height: 15 }} />}
          />
          <button
            type="button"
            onClick={resetZoom}
            style={{
              padding: "5px 10px",
              borderRadius: 8,
              border: "none",
              background: "transparent",
              fontSize: 12,
              fontWeight: 600,
              color: settings.zoomMode === "custom" ? "hsl(var(--primary))" : "rgba(255,255,255,0.45)",
              cursor: "pointer",
              transition: "all 0.15s ease",
              fontVariantNumeric: "tabular-nums",
              minWidth: 42,
              textAlign: "center",
            }}
          >
            {settings.zoomMode === "custom" ? `${settings.zoomPercent}%` : "Auto"}
          </button>
          <ReaderIconBtn
            label="Zoom in"
            onClick={() => updateSettings({ zoomMode: "custom", zoomPercent: Math.min(400, settings.zoomPercent + 10) })}
            icon={<ZoomIn style={{ width: 15, height: 15 }} />}
          />
        </div>

        {/* AI Dialogue */}
        <button
          type="button"
          onClick={() => updateAIDialogueSettings({ enabled: !settings.aiDialogue.enabled })}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 12px",
            borderRadius: 10,
            border: settings.aiDialogue.enabled
              ? "1px solid hsl(var(--primary) / 0.5)"
              : "1px solid rgba(255,255,255,0.08)",
            background: settings.aiDialogue.enabled
              ? "hsl(var(--primary) / 0.18)"
              : "rgba(255,255,255,0.05)",
            color: settings.aiDialogue.enabled ? "#ffffff" : "rgba(255,255,255,0.5)",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s ease",
            boxShadow: settings.aiDialogue.enabled
              ? "0 0 16px hsl(var(--primary) / 0.35)"
              : "none",
            letterSpacing: "-0.01em",
          }}
        >
          <Sparkles style={{ width: 13, height: 13 }} />
          AI
        </button>

        {/* Favorite Comic toggle */}
        <ReaderIconBtn
          label={item.isBookmarked ? "Remove from Favorites" : "Favorite Comic"}
          onClick={() => updateItem(item.id, { isBookmarked: !item.isBookmarked })}
          active={item.isBookmarked}
          icon={
            <Heart 
              style={{ width: 16, height: 16, color: item.isBookmarked ? "hsl(var(--primary))" : "inherit" }} 
              fill={item.isBookmarked ? "currentColor" : "none"} 
            />
          }
        />

        {/* Bookmarks list (pages) */}
        <ReaderIconBtn
          label="Open page bookmarks"
          onClick={() => setBookmarksOpen(true)}
          icon={<List style={{ width: 16, height: 16 }} />}
        />

        {/* Bookmark page toggle */}
        <ReaderIconBtn
          label="Bookmark this page"
          onClick={toggleBookmark}
          active={activeBookmark}
          icon={
            activeBookmark
              ? <BookmarkCheck style={{ width: 16, height: 16, color: "hsl(var(--primary))" }} />
              : <Bookmark style={{ width: 16, height: 16 }} />
          }
        />

        {/* Fullscreen */}
        <ReaderIconBtn
          label="Toggle fullscreen"
          onClick={toggleFullscreen}
          icon={fullscreen ? <Minimize2 style={{ width: 16, height: 16 }} /> : <Maximize2 style={{ width: 16, height: 16 }} />}
        />
      </div>

      <div
        ref={pageAreaRef}
        className="absolute inset-0 overflow-auto pt-[60px]"
        style={{ paddingTop: toolbarVisible ? 60 : 0 }}
      >
        {!comicId ? (
          <div
            style={{
              display: "grid",
              height: "100%",
              placeItems: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 16,
                color: "rgba(255,255,255,0.35)",
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 16,
                  border: "1px solid hsl(var(--primary) / 0.3)",
                  background: "hsl(var(--primary) / 0.08)",
                  display: "grid",
                  placeItems: "center",
                  boxShadow: "0 0 24px hsl(var(--primary) / 0.2)",
                }}
              >
                <Loader2 style={{ width: 22, height: 22, color: "hsl(var(--primary))" }} className="animate-spin" />
              </div>
              <span style={{ fontSize: 13, fontWeight: 500 }}>Loading comic…</span>
            </div>
          </div>
        ) : settings.readingMode === "continuous" ? (
          <ContinuousView
            comicId={comicId}
            pageCount={pageCount}
            zoomMode={settings.zoomMode}
            zoomPercent={settings.zoomPercent}
            onScrollPage={setPage}
          />
        ) : (
          <div className="relative grid min-h-full place-items-center px-8 py-8">
            <button
              type="button"
              className="absolute inset-y-0 left-0 z-10 w-1/2 cursor-default"
              onMouseDown={handleZoneMouseDown}
              onMouseMove={handleZoneMouseMove}
              onMouseUp={handleZoneMouseUp("left")}
              onMouseLeave={handleZoneLeave}
              onAuxClick={suppressNonPrimaryClick}
              aria-label="Previous page zone"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 z-10 w-1/2 cursor-default"
              onMouseDown={handleZoneMouseDown}
              onMouseMove={handleZoneMouseMove}
              onMouseUp={handleZoneMouseUp("right")}
              onMouseLeave={handleZoneLeave}
              onAuxClick={suppressNonPrimaryClick}
              aria-label="Next page zone"
            />
            <AnimatePresence mode="wait">
              <motion.div
                key={page}
                initial={{ opacity: 0, x: isManga ? -15 : 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isManga ? 15 : -15 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className={
                  "relative z-0 flex w-full items-center justify-center gap-3 " +
                  (settings.readingMode === "double" ? (isManga ? "flex-row-reverse" : "flex-row") : "")
                }
              >
                {pageUrl ? (
                  <img
                    src={pageUrl}
                    draggable={false}
                    className={`${sizeClass} select-none shadow-2xl shadow-black/40`}
                    style={customStyle}
                  />
                ) : (
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                )}
                {settings.readingMode === "double" && pageUrl2 ? (
                  <img
                    src={pageUrl2}
                    draggable={false}
                    className={`${sizeClass} select-none shadow-2xl shadow-black/40`}
                    style={customStyle}
                  />
                ) : null}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>

      <AIDialogueLayer
        pages={visibleDialoguePages}
        settings={settings.aiDialogue}
        onSettingsChange={updateAIDialogueSettings}
      />

      <FloatingNavigationControls
        page={page}
        pageCount={pageCount}
        isManga={isManga}
        bookmarks={bookmarks}
        visible={navVisible}
        onJump={setPage}
        onNext={next}
        onPrev={prev}
        onFirst={() => setPage(0)}
        onLast={() => setPage(Math.max(0, pageCount - 1))}
      />

      <BookmarksPanel
        open={bookmarksOpen}
        bookmarks={bookmarks}
        pageCount={pageCount}
        onClose={() => setBookmarksOpen(false)}
        onJump={setPage}
        onRemove={removeBookmark}
      />
    </div>
  );
}

/* --------- Continuous mode --------- */
function ContinuousView({
  comicId,
  pageCount,
  zoomMode,
  zoomPercent,
  onScrollPage,
}: {
  comicId: string;
  pageCount: number;
  zoomMode: ZoomMode;
  zoomPercent: number;
  onScrollPage: (p: number) => void;
}) {
  const [urls, setUrls] = useState<(string | null)[]>(() => new Array(pageCount).fill(null));
  const observerRef = useRef<IntersectionObserver | null>(null);
  const visible = useRef<Set<number>>(new Set());

  useEffect(() => {
    setUrls(new Array(pageCount).fill(null));
  }, [pageCount, comicId]);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const idx = Number((entry.target as HTMLElement).dataset.index);
          if (entry.isIntersecting) {
            visible.current.add(idx);
            setUrls((prev) => {
              if (prev[idx]) return prev;
              resolvePage(comicId, idx).then((u) =>
                setUrls((p) => {
                  const c = [...p];
                  c[idx] = u;
                  return c;
                })
              );
              return prev;
            });
          } else {
            visible.current.delete(idx);
          }
        }
        if (visible.current.size) onScrollPage(Math.min(...visible.current));
      },
      { rootMargin: "300px 0px", threshold: 0.01 }
    );
    return () => observerRef.current?.disconnect();
  }, [comicId, onScrollPage]);

  const widthStyle =
    zoomMode === "fit-width"
      ? { width: "100%" }
      : zoomMode === "custom"
        ? { width: `${zoomPercent}%` }
        : { maxWidth: "min(90vw, 1100px)" };

  return (
    <div className="flex flex-col items-center gap-1 p-3">
      {Array.from({ length: pageCount }).map((_, i) => (
        <Slot key={i} index={i} url={urls[i]} observer={observerRef.current} style={widthStyle} />
      ))}
    </div>
  );
}

function Slot({
  index,
  url,
  observer,
  style,
}: {
  index: number;
  url: string | null;
  observer: IntersectionObserver | null;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current || !observer) return;
    const el = ref.current;
    observer.observe(el);
    return () => observer.unobserve(el);
  }, [observer]);
  return (
    <div ref={ref} data-index={index} style={style} className="min-h-[420px] w-full grid place-items-center">
      {url ? (
        <img src={url} draggable={false} className="w-full h-auto block" loading="lazy" />
      ) : (
        <div className="text-muted-foreground/60 text-xs">Loading page {index + 1}…</div>
      )}
    </div>
  );
}

/**
 * Resolve a page reference from main. PDF refs look like `pdf:N:<dataUrl>`.
 */
async function resolvePage(comicId: string, index: number): Promise<string> {
  const ref = await window.api.getPage(comicId, index);
  if (ref.startsWith("pdf:")) {
    const m = ref.match(/^pdf:(\d+):(.*)$/s);
    if (!m) throw new Error("Bad pdf ref");
    const pageIdx = parseInt(m[1], 10);
    const dataUrl = m[2];
    return renderPdfPage(dataUrl, pageIdx);
  }
  return ref;
}

/* ── Reader toolbar icon button helper ── */
function ReaderIconBtn({
  label,
  icon,
  onClick,
  active = false,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      style={{
        width: 34,
        height: 34,
        borderRadius: 9,
        border: active
          ? "1px solid hsl(var(--primary) / 0.4)"
          : "1px solid rgba(255,255,255,0.07)",
        background: active ? "hsl(var(--primary) / 0.15)" : "rgba(255,255,255,0.05)",
        color: active ? "hsl(var(--primary))" : "rgba(255,255,255,0.55)",
        display: "grid",
        placeItems: "center",
        cursor: "pointer",
        flexShrink: 0,
        transition: "all 0.18s ease",
        boxShadow: active ? "0 0 10px hsl(var(--primary) / 0.25)" : "none",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.1)";
          (e.currentTarget as HTMLButtonElement).style.color = "#ffffff";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)";
          (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.55)";
        }
      }}
    >
      {icon}
    </button>
  );
}
