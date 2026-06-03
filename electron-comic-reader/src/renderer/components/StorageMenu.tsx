/**
 * "Add folder to library" dropdown listing supported (local) and planned (cloud)
 * storage sources. Cloud entries are placeholders.
 */
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Cloud, FolderOpen, HardDrive } from "lucide-react";

interface Props {
  onAddLocal: () => void;
  onAddCloud: (provider: string) => void;
}

type SourceKey = "local" | "onedrive" | "dropbox" | "gdrive";
interface Source {
  key: SourceKey;
  label: string;
  icon: typeof FolderOpen;
  available: boolean;
}

const SOURCES: Source[] = [
  { key: "local", label: "Add local folder", icon: FolderOpen, available: true },
  { key: "onedrive", label: "Add OneDrive folder", icon: Cloud, available: false },
  { key: "dropbox", label: "Add Dropbox folder", icon: HardDrive, available: false },
  { key: "gdrive", label: "Add Google Drive folder", icon: Cloud, available: true },
];

export function StorageMenu({ onAddLocal, onAddCloud }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const t = setTimeout(() => document.addEventListener("click", handler), 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener("click", handler);
    };
  }, [open]);

  function handlePick(source: Source) {
    setOpen(false);
    if (source.key === "local") {
      onAddLocal();
      return;
    }
    if (source.available) {
      onAddCloud(source.key);
      return;
    }
    
    alert(`${source.label} — coming soon in Phase 2.\n\nCurrently, only Google Drive is supported.`);
  }

  return (
    <div style={{ position: "relative" }} ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          height: 36,
          paddingLeft: 12,
          paddingRight: 12,
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.1)",
          background: open ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.05)",
          color: "rgba(255,255,255,0.8)",
          fontSize: 13,
          fontWeight: 500,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          cursor: "pointer",
          transition: "all 0.18s ease",
          letterSpacing: "-0.01em",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.09)";
          (e.currentTarget as HTMLButtonElement).style.color = "#ffffff";
        }}
        onMouseLeave={(e) => {
          if (!open) {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)";
            (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.8)";
          }
        }}
      >
        <FolderOpen style={{ width: 14, height: 14 }} strokeWidth={1.8} />
        <span>Add folder</span>
        <ChevronDown
          style={{
            width: 13,
            height: 13,
            transition: "transform 0.2s ease",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 8px)",
            width: 240,
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "hsl(167 28% 8%)",
            backdropFilter: "blur(32px)",
            WebkitBackdropFilter: "blur(32px)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.7), 0 1px 0 rgba(255,255,255,0.05) inset",
            padding: 6,
            zIndex: 100,
            animation: "fadeInUp 0.15s ease-out",
          }}
        >
          {SOURCES.map((source) => {
            const Icon = source.icon;
            return (
              <button
                key={source.key}
                onClick={() => handlePick(source)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 12px",
                  borderRadius: 10,
                  border: "none",
                  background: "transparent",
                  fontSize: 13,
                  fontWeight: 500,
                  color: source.available ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.4)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = source.available
                    ? "hsl(var(--primary) / 0.1)"
                    : "rgba(255,255,255,0.04)";
                  if (source.available) {
                    (e.currentTarget as HTMLButtonElement).style.color = "#ffffff";
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                  (e.currentTarget as HTMLButtonElement).style.color = source.available
                    ? "rgba(255,255,255,0.9)"
                    : "rgba(255,255,255,0.4)";
                }}
              >
                <Icon
                  style={{
                    width: 14,
                    height: 14,
                    flexShrink: 0,
                    color: source.available ? "hsl(var(--primary))" : "rgba(255,255,255,0.25)",
                  }}
                  strokeWidth={1.8}
                />
                <span style={{ flex: 1 }}>{source.label}</span>
                {!source.available && (
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      padding: "2px 6px",
                      borderRadius: 999,
                      background: "rgba(255,255,255,0.07)",
                      color: "rgba(255,255,255,0.35)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    Soon
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
