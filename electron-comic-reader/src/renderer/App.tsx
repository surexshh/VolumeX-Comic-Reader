import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Library } from "@/pages/Library";
import { Reader } from "@/pages/Reader";
import { SettingsPage } from "@/pages/Settings";
import { BookmarksPage } from "@/pages/Bookmarks";
import { RecentlyReadingPage } from "@/pages/RecentlyReading";
import { SearchPage } from "@/pages/Search";
import { ManageFoldersPage } from "@/pages/ManageFolders";
import { BackgroundProvider } from "@/contexts/BackgroundContext";
import { DynamicBackgroundEngine } from "@/components/DynamicBackgroundEngine";
import { StartupOverlay } from "@/components/StartupOverlay";

type Route =
  | { name: "library" }
  | { name: "recent" }
  | { name: "settings" }
  | { name: "bookmarks" }
  | { name: "search" }
  | { name: "folders" }
  | { name: "reader"; itemId: string };

export default function App() {
  const [route, setRoute] = useState<Route>({ name: "library" });
  const [overlayDone, setOverlayDone] = useState(false);

  // Global Ctrl+F shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        setRoute({ name: "search" });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const fn = (e: ErrorEvent) => console.error("[unhandled]", e.error || e.message);
    window.addEventListener("error", fn);
    return () => window.removeEventListener("error", fn);
  }, []);

  const navigate = (n: string) => setRoute({ name: n } as Route);

  /* Reader is fully self-contained — no background engine or overlay */
  if (route.name === "reader") {
    return <Reader itemId={route.itemId} onBack={() => setRoute({ name: "library" })} />;
  }

  return (
    <BackgroundProvider>
      {/* ── Cinematic background engine (fixed, z-index 0) ── */}
      <DynamicBackgroundEngine />

      {/* ── Page content (z-index 1, above background) ── */}
      <div style={{ position: "relative", zIndex: 1, height: "100vh" }}>

        {route.name === "settings" && (
          <SettingsPage onNavigate={navigate} current="settings" />
        )}

        {route.name === "recent" && (
          <RecentlyReadingPage
            current="recent"
            onNavigate={navigate}
            onOpen={(item) => setRoute({ name: "reader", itemId: item.id })}
          />
        )}

        {route.name === "library" && (
          <Library
            filter="all"
            onNavigate={navigate}
            onOpen={(item) => setRoute({ name: "reader", itemId: item.id })}
            current="library"
          />
        )}

        {route.name === "bookmarks" && (
          <BookmarksPage
            current="bookmarks"
            onNavigate={navigate}
            onOpen={(item) => setRoute({ name: "reader", itemId: item.id })}
          />
        )}

        {route.name === "search" && (
          <SearchPage
            current="search"
            onNavigate={navigate}
            onOpen={(item) => setRoute({ name: "reader", itemId: item.id })}
          />
        )}

        {route.name === "folders" && (
          <ManageFoldersPage
            current="folders"
            onNavigate={navigate}
          />
        )}

      </div>

      {/* ── Startup overlay (z-index 9999, above everything) ── */}
      <AnimatePresence>
        {!overlayDone && (
          <StartupOverlay
            dismissAfterMs={2400}
            onDismissed={() => setOverlayDone(true)}
          />
        )}
      </AnimatePresence>
    </BackgroundProvider>
  );
}
