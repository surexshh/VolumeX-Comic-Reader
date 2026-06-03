/**
 * Manage Folders Page — Dashboard for adding and auto-syncing directories.
 */
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FolderPlus, FolderOpen, RefreshCw, Trash2, HardDrive, Clock, Search } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { useFolders, type FolderConfig } from "@/store/folders";

interface Props {
  current: "folders";
  onNavigate: (route: string) => void;
}

export function ManageFoldersPage({ current, onNavigate }: Props) {
  const { folders, addFolder, removeFolder, scanFolder, scanAll } = useFolders();

  const handleAdd = async () => {
    const path = await window.api.openFolder();
    if (path) {
      await addFolder(path);
    }
  };

  return (
    <div style={{ height: "100vh", background: "rgba(9,20,19,1)", position: "relative" }}>
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
        {/* ── HEADER ── */}
        <div
          style={{
            padding: "40px 60px 30px",
            background: "linear-gradient(180deg, rgba(220,37,37,0.08) 0%, transparent 100%)",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 32,
                fontWeight: 800,
                letterSpacing: "-0.03em",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <HardDrive style={{ width: 28, height: 28, color: "hsl(var(--primary))" }} />
              Managed Folders
            </h1>
            <p style={{ margin: "8px 0 0", fontSize: 14, color: "rgba(255,255,255,0.45)" }}>
              Add directories to automatically sync and import comics into your library.
            </p>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            {folders.length > 0 && (
              <button
                onClick={() => scanAll()}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  height: 44,
                  padding: "0 20px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.15)",
                  background: "rgba(255,255,255,0.05)",
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.1)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)";
                }}
              >
                <RefreshCw style={{ width: 14, height: 14 }} />
                Sync All
              </button>
            )}

            <button
              onClick={handleAdd}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                height: 44,
                padding: "0 24px",
                borderRadius: 12,
                border: "none",
                background: "hsl(var(--primary))",
                color: "#ffffff",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 8px 24px hsl(var(--primary) / 0.4)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 12px 32px hsl(var(--primary) / 0.6)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "none";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 24px hsl(var(--primary) / 0.4)";
              }}
            >
              <FolderPlus style={{ width: 16, height: 16 }} strokeWidth={2.5} />
              Add Directory
            </button>
          </div>
        </div>

        {/* ── LIST ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "40px 60px" }}>
          {folders.length === 0 ? (
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
              <FolderOpen style={{ width: 48, height: 48, color: "rgba(255,255,255,0.1)" }} />
              <p style={{ fontSize: 16, color: "rgba(255,255,255,0.3)", margin: 0 }}>
                No folders managed yet.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <AnimatePresence>
                {folders.map((f) => (
                  <FolderCard
                    key={f.path}
                    folder={f}
                    onRemove={() => {
                      if (confirm(`Stop syncing "${f.path}"? Note: This will not delete the comics from your library unless you remove them manually.`)) {
                        removeFolder(f.path);
                      }
                    }}
                    onSync={() => scanFolder(f.path)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

function FolderCard({
  folder,
  onRemove,
  onSync,
}: {
  folder: FolderConfig;
  onRemove: () => void;
  onSync: () => void;
}) {
  const isScanning = folder.status === "scanning";
  const name = folder.path.split(/[\\\/]/).pop() || folder.path;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "20px 24px",
        borderRadius: 16,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
        transition: "background 0.2s ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.05)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.03)";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: "rgba(255,255,255,0.06)",
            display: "grid",
            placeItems: "center",
          }}
        >
          <FolderOpen style={{ width: 24, height: 24, color: "hsl(var(--primary))" }} />
        </div>

        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#fff", letterSpacing: "-0.01em" }}>
            {name}
          </h3>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>
            {folder.path}
          </p>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
        {/* Stats */}
        <div style={{ display: "flex", gap: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.3)", fontWeight: 700 }}>
              Comics
            </span>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>
              {folder.comicCount}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.3)", fontWeight: 700 }}>
              Last Synced
            </span>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>
              {folder.lastScanned ? new Date(folder.lastScanned).toLocaleDateString() : "Never"}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onSync}
            disabled={isScanning}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: isScanning ? "hsl(var(--primary))" : "#fff",
              display: "grid",
              placeItems: "center",
              cursor: isScanning ? "default" : "pointer",
            }}
            title="Sync folder"
          >
            {isScanning ? (
              <RefreshCw className="animate-spin" style={{ width: 16, height: 16 }} />
            ) : (
              <Search style={{ width: 16, height: 16 }} />
            )}
          </button>

          <button
            onClick={onRemove}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#ff4444",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
            }}
            title="Remove folder"
          >
            <Trash2 style={{ width: 16, height: 16 }} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
