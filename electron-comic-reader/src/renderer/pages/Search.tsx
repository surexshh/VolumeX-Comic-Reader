/**
 * Global Search Page — Cinematic, fast, real-time filtering.
 */
import { useEffect, useRef, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search as SearchIcon, X, Layers, BookOpen } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { useLibrary, type LibraryItem } from "@/store/library";
import { Card } from "./Library"; // Reuse the card from library

interface Props {
  current: "search";
  onNavigate: (route: string) => void;
  onOpen: (item: LibraryItem) => void;
}

export function SearchPage({ current, onNavigate, onOpen }: Props) {
  const { items, updateItem, removeItem } = useLibrary();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Debounced search logic for rendering
  const [debouncedQuery, setDebouncedQuery] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 150);
    return () => clearTimeout(t);
  }, [query]);

  const results = useMemo(() => {
    const q = debouncedQuery.toLowerCase().trim();
    if (!q) return [];
    return items.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.filePath.toLowerCase().includes(q)
    );
  }, [items, debouncedQuery]);

  return (
    <div style={{ height: "100vh", background: "transparent", position: "relative" }}>
      <Sidebar current={current as any} onNavigate={onNavigate as any} />

      <div
        style={{
          height: "100%",
          marginLeft: 72,
          display: "flex",
          flexDirection: "column",
          position: "relative",
          zIndex: 2,
        }}
      >
        {/* ── SEARCH HEADER ── */}
        <div
          style={{
            padding: "40px 60px 20px",
            background: "linear-gradient(180deg, rgba(9,20,19,0.95) 0%, rgba(9,20,19,0.7) 100%)",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 20,
          }}
        >
          <div style={{ position: "relative", width: "100%", maxWidth: 800 }}>
            <SearchIcon
              style={{
                position: "absolute",
                left: 24,
                top: "50%",
                transform: "translateY(-50%)",
                width: 24,
                height: 24,
                color: query ? "hsl(var(--primary))" : "rgba(255,255,255,0.4)",
                transition: "color 0.2s ease",
              }}
            />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your library (Title, File path)..."
              style={{
                width: "100%",
                height: 64,
                padding: "0 64px",
                fontSize: 18,
                fontWeight: 600,
                color: "#fff",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 20,
                outline: "none",
                boxShadow: query ? "0 0 0 2px hsl(var(--primary) / 0.5), 0 8px 32px rgba(0,0,0,0.5)" : "0 8px 32px rgba(0,0,0,0.3)",
                transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
              onFocus={(e) => {
                e.target.style.background = "rgba(255,255,255,0.07)";
                e.target.style.border = "1px solid hsl(var(--primary) / 0.4)";
                e.target.style.transform = "translateY(-2px)";
              }}
              onBlur={(e) => {
                if (!query) {
                  e.target.style.background = "rgba(255,255,255,0.04)";
                  e.target.style.border = "1px solid rgba(255,255,255,0.1)";
                }
                e.target.style.transform = "translateY(0)";
              }}
            />
            {query && (
              <button
                onClick={() => { setQuery(""); inputRef.current?.focus(); }}
                style={{
                  position: "absolute",
                  right: 20,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.1)",
                  border: "none",
                  color: "#fff",
                  display: "grid",
                  placeItems: "center",
                  cursor: "pointer",
                }}
              >
                <X style={{ width: 16, height: 16 }} />
              </button>
            )}
          </div>
          
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontWeight: 500, letterSpacing: "0.02em" }}>
            {query ? `Found ${results.length} results` : "Type to start searching across all imported comics."}
          </div>
        </div>

        {/* ── SEARCH RESULTS ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "40px 60px", background: "rgba(9,20,19,0.85)" }}>
          {query && results.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                minHeight: 300,
                gap: 16,
              }}
            >
              <Layers style={{ width: 48, height: 48, color: "rgba(255,255,255,0.15)" }} />
              <p style={{ fontSize: 16, color: "rgba(255,255,255,0.4)", margin: 0, fontWeight: 500 }}>
                No comics found for "{query}"
              </p>
            </div>
          ) : !query ? (
             <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                minHeight: 300,
                gap: 16,
                opacity: 0.5,
              }}
            >
              <SearchIcon style={{ width: 48, height: 48, color: "rgba(255,255,255,0.15)" }} />
            </div>
          ) : (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                  gap: 24,
                }}
              >
                {results.map((c) => (
                  <Card
                    key={c.id}
                    item={c}
                    onOpen={onOpen}
                    onDelete={removeItem}
                    onToggleBookmark={(id, val) => updateItem(id, { isBookmarked: val })}
                  />
                ))}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

      </div>
    </div>
  );
}
