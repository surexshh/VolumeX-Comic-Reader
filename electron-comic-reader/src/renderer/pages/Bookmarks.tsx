/**
 * BookmarksPage — Cinematic Netflix-style favorites dashboard.
 */
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Play, BookmarkMinus, ChevronRight } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { useLibrary, type LibraryItem } from "@/store/library";
import { useBackground } from "@/contexts/BackgroundContext";

interface Props {
  current: "bookmarks";
  onNavigate: (route: "library" | "recent" | "settings" | "bookmarks") => void;
  onOpen: (item: LibraryItem) => void;
}

export function BookmarksPage({ current, onNavigate, onOpen }: Props) {
  const { items, updateItem } = useLibrary();
  const { setSrc } = useBackground();

  // Only favorited comics
  const favorites = items.filter((c) => c.isBookmarked);

  // Hero comic is the first one or whichever is currently selected/hovered
  const [hero, setHero] = useState<LibraryItem | null>(favorites.length > 0 ? favorites[0] : null);

  // Drive background engine
  useEffect(() => {
    if (hero?.thumbnail) setSrc(hero.thumbnail);
    else if (favorites.length > 0 && favorites[0].thumbnail) setSrc(favorites[0].thumbnail);
  }, [hero, favorites, setSrc]);

  // Keep hero in sync if it gets removed
  useEffect(() => {
    if (hero && !favorites.find((f) => f.id === hero.id)) {
      setHero(favorites.length > 0 ? favorites[0] : null);
    }
  }, [favorites, hero]);

  const removeBookmark = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    updateItem(id, { isBookmarked: false });
  };

  if (favorites.length === 0) {
    return (
      <div style={{ height: "100vh", background: "transparent", position: "relative" }}>
        <Sidebar current={current} onNavigate={onNavigate} />
        <div
          style={{
            height: "100%",
            marginLeft: 72,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              background: "hsl(var(--primary) / 0.12)",
              border: "1px solid hsl(var(--primary) / 0.25)",
              display: "grid",
              placeItems: "center",
              boxShadow: "0 0 32px hsl(var(--primary) / 0.15)",
            }}
          >
            <BookmarkMinus style={{ width: 28, height: 28, color: "hsl(var(--primary))" }} />
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: "0 0 6px", letterSpacing: "-0.02em" }}>
              No favorite comics
            </p>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", margin: 0 }}>
              Bookmark a comic from the library to see it here.
            </p>
          </div>
          <button
            onClick={() => onNavigate("library")}
            style={{
              marginTop: 8,
              height: 40,
              padding: "0 20px",
              borderRadius: 10,
              border: "1px solid hsl(var(--primary) / 0.4)",
              background: "hsl(var(--primary) / 0.14)",
              color: "hsl(var(--primary))",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.18s ease",
            }}
          >
            Go to Library
          </button>
        </div>
      </div>
    );
  }

  // Split into Hero and the rest for the rail
  const heroItem = hero ?? favorites[0];
  
  return (
    <div style={{ height: "100vh", background: "transparent", position: "relative", overflow: "hidden" }}>
      <Sidebar current={current} onNavigate={onNavigate} />

      <div style={{ height: "100%", marginLeft: 72, display: "flex", flexDirection: "column" }}>
        
        {/* ══════════════════════════════════════════════════════
            TOP: HERO SECTION
        ══════════════════════════════════════════════════════ */}
        <div
          style={{
            flex: "1 1 auto",
            display: "flex",
            alignItems: "center",
            padding: "40px 60px",
            gap: 60,
            position: "relative",
            zIndex: 2,
            background: "linear-gradient(180deg, rgba(9,20,19,0.2) 0%, rgba(9,20,19,0.85) 100%)",
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={heroItem.id}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
              style={{ display: "flex", gap: 40, alignItems: "center", maxWidth: "100%" }}
            >
              {/* Hero Poster */}
              <div
                style={{
                  width: 240,
                  aspectRatio: "2/3",
                  borderRadius: 18,
                  overflow: "hidden",
                  boxShadow: "0 40px 100px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.1)",
                  flexShrink: 0,
                  position: "relative",
                }}
              >
                {heroItem.thumbnail ? (
                  <img
                    src={heroItem.thumbnail}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    alt=""
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      background: "linear-gradient(135deg, hsl(167 24% 10%), hsl(167 20% 16%))",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <BookOpen style={{ width: 48, height: 48, color: "rgba(255,255,255,0.2)" }} />
                  </div>
                )}
                {/* Shine overlay */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%)",
                    pointerEvents: "none",
                  }}
                />
              </div>

              {/* Hero Info */}
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Badge */}
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 10px",
                    borderRadius: 999,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    background: "hsl(var(--primary) / 0.15)",
                    border: "1px solid hsl(var(--primary) / 0.4)",
                    color: "hsl(var(--primary))",
                    alignSelf: "flex-start",
                  }}
                >
                  Bookmarked
                </span>

                <h1
                  style={{
                    margin: 0,
                    fontSize: 48,
                    fontWeight: 800,
                    letterSpacing: "-0.04em",
                    lineHeight: 1.1,
                    color: "#ffffff",
                    textShadow: "0 4px 24px rgba(0,0,0,0.5)",
                    maxWidth: 600,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {heroItem.title}
                </h1>

                {/* Progress */}
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  {heroItem.pageCount ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, maxWidth: 300 }}>
                      <div style={{ flex: 1, height: 4, borderRadius: 999, background: "rgba(255,255,255,0.15)", overflow: "hidden" }}>
                        <div
                          style={{
                            height: "100%",
                            width: `${Math.round((heroItem.currentPage / Math.max(1, heroItem.pageCount - 1)) * 100)}%`,
                            background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))",
                            boxShadow: "0 0 12px hsl(var(--primary) / 0.8)",
                          }}
                        />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.8)" }}>
                        Page {heroItem.currentPage + 1}
                      </span>
                    </div>
                  ) : null}
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
                  <button
                    onClick={() => onOpen(heroItem)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 10,
                      height: 48,
                      padding: "0 32px",
                      borderRadius: 12,
                      border: "none",
                      background: "hsl(var(--primary))",
                      color: "#ffffff",
                      fontSize: 15,
                      fontWeight: 700,
                      cursor: "pointer",
                      boxShadow: "0 8px 32px hsl(var(--primary) / 0.5)",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 12px 40px hsl(var(--primary) / 0.7)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.transform = "none";
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 32px hsl(var(--primary) / 0.5)";
                    }}
                  >
                    <Play style={{ width: 18, height: 18 }} fill="currentColor" />
                    Read Now
                  </button>

                  <button
                    onClick={(e) => removeBookmark(e, heroItem.id)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.2)",
                      background: "rgba(255,255,255,0.1)",
                      backdropFilter: "blur(12px)",
                      color: "#ffffff",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    title="Remove from bookmarks"
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.15)";
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.4)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.1)";
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.2)";
                    }}
                  >
                    <BookmarkMinus style={{ width: 20, height: 20 }} />
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ══════════════════════════════════════════════════════
            BOTTOM: HORIZONTAL RAIL
        ══════════════════════════════════════════════════════ */}
        <div
          style={{
            flex: "0 0 auto",
            padding: "0 0 40px 60px",
            position: "relative",
            zIndex: 2,
            background: "rgba(9,20,19,0.85)",
          }}
        >
          <h2
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "#ffffff",
              marginBottom: 16,
              letterSpacing: "-0.01em",
            }}
          >
            My Favorites
          </h2>

          <div
            style={{
              display: "flex",
              gap: 16,
              overflowX: "auto",
              paddingBottom: 24,
              paddingRight: 60,
              /* Hide scrollbar visually but allow scroll */
              scrollbarWidth: "none",
            }}
          >
            {favorites.map((c) => (
              <RailCard
                key={c.id}
                item={c}
                isHero={c.id === heroItem.id}
                onHover={() => setHero(c)}
                onOpen={() => onOpen(c)}
                onRemove={(e) => removeBookmark(e, c.id)}
              />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

function RailCard({
  item,
  isHero,
  onHover,
  onOpen,
  onRemove,
}: {
  item: LibraryItem;
  isHero: boolean;
  onHover: () => void;
  onOpen: () => void;
  onRemove: (e: React.MouseEvent) => void;
}) {
  const [hovered, setHovered] = useState(false);

  const pct = item.pageCount
    ? Math.round((item.currentPage / Math.max(1, item.pageCount - 1)) * 100)
    : 0;

  return (
    <div
      onMouseEnter={() => { setHovered(true); onHover(); }}
      onMouseLeave={() => setHovered(false)}
      onClick={onOpen}
      style={{
        width: 140,
        flexShrink: 0,
        position: "relative",
        cursor: "pointer",
        transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
        transform: hovered ? "translateY(-8px) scale(1.05)" : "translateY(0) scale(1)",
        zIndex: hovered ? 10 : 1,
      }}
    >
      <div
        style={{
          width: "100%",
          aspectRatio: "2/3",
          borderRadius: 12,
          overflow: "hidden",
          background: "hsl(var(--muted))",
          boxShadow: hovered
            ? "0 20px 40px rgba(0,0,0,0.8), 0 0 0 2px hsl(var(--primary))"
            : isHero
            ? "0 8px 24px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.3)"
            : "0 8px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)",
          transition: "all 0.3s ease",
          position: "relative",
        }}
      >
        {item.thumbnail ? (
          <img src={item.thumbnail} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center" }}>
            <BookOpen style={{ width: 24, height: 24, color: "rgba(255,255,255,0.2)" }} />
          </div>
        )}

        {/* Progress indicator on card bottom */}
        {pct > 0 && (
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 4,
              background: "rgba(0,0,0,0.5)",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${pct}%`,
                background: "hsl(var(--primary))",
                boxShadow: "0 0 8px hsl(var(--primary))",
              }}
            />
          </div>
        )}

        {/* Hover overlay with remove button */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 40%, rgba(0,0,0,0.8) 100%)",
            opacity: hovered ? 1 : 0,
            transition: "opacity 0.2s ease",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: 8,
          }}
        >
          <button
            onClick={onRemove}
            title="Remove Bookmark"
            style={{
              alignSelf: "flex-end",
              width: 26,
              height: 26,
              borderRadius: 8,
              border: "none",
              background: "rgba(255,255,255,0.15)",
              backdropFilter: "blur(4px)",
              color: "#fff",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "hsl(var(--primary))"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.15)"; }}
          >
            <BookmarkMinus style={{ width: 14, height: 14 }} />
          </button>

          <div style={{ display: "flex", justifyContent: "center", paddingBottom: 8 }}>
            <Play style={{ width: 24, height: 24, color: "#fff", filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.5))" }} fill="currentColor" />
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 8,
          fontSize: 12,
          fontWeight: 600,
          color: isHero ? "#fff" : "rgba(255,255,255,0.7)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          textAlign: "center",
          transition: "color 0.2s ease",
        }}
      >
        {item.title}
      </div>
    </div>
  );
}
