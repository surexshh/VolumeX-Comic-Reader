/**
 * Cloud Browser Overlay — Premium glassmorphism UI for browsing remote folders.
 */
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Cloud, Folder, File, Download, ChevronRight, RefreshCw, LogOut } from "lucide-react";
import { useCloud } from "@/store/cloud";

interface CloudFile {
  id: string;
  name: string;
  isFolder: boolean;
  mimeType: string;
  size?: number;
  thumbnailLink?: string;
}

interface Props {
  provider: string; // e.g., "gdrive"
  onClose: () => void;
  onImported: () => void; // Trigger library refresh
}

export function CloudBrowser({ provider, onClose, onImported }: Props) {
  const { connected, login, logout } = useCloud();
  const isConnected = connected.includes(provider);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [files, setFiles] = useState<CloudFile[]>([]);
  const [history, setHistory] = useState<{ id: string; name: string }[]>([{ id: "root", name: "Root" }]);
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});

  const currentFolder = history[history.length - 1];

  useEffect(() => {
    if (isConnected) {
      fetchFiles(currentFolder.id);
    }
  }, [isConnected, currentFolder.id]);

  async function fetchFiles(folderId: string) {
    setLoading(true);
    setError("");
    try {
      const result = await window.api.cloudList(provider, folderId);
      setFiles(result);
    } catch (err: any) {
      setError(err.message || "Failed to load directory.");
      if (err.message.includes("refresh token")) {
        // Need to re-auth
        logout(provider);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin() {
    setLoading(true);
    try {
      await login(provider);
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload(file: CloudFile) {
    if (file.isFolder) {
      setHistory((prev) => [...prev, { id: file.id, name: file.name }]);
      return;
    }

    try {
      setDownloadProgress((prev) => ({ ...prev, [file.id]: 0 }));
      
      const unsubscribe = window.api.onCloudProgress(file.id, (percent) => {
        setDownloadProgress((prev) => ({ ...prev, [file.id]: percent }));
      });

      const destPath = await window.api.cloudDownload(provider, file.id, file.name);
      unsubscribe();

      setDownloadProgress((prev) => {
        const next = { ...prev };
        delete next[file.id];
        return next;
      });

      // We've successfully downloaded it to the cache. We should scan it into the library.
      await window.api.scanFolder(destPath.substring(0, destPath.lastIndexOf(/[\\/]/) || destPath.length)); // Hack: scan the cache dir to pick it up, or just rely on a global refresh
      onImported();

    } catch (err: any) {
      console.error(err);
      setError(`Download failed: ${err.message}`);
      setDownloadProgress((prev) => {
        const next = { ...prev };
        delete next[file.id];
        return next;
      });
    }
  }

  const navigateUp = (index: number) => {
    setHistory((prev) => prev.slice(0, index + 1));
  };

  const providerName = provider === "gdrive" ? "Google Drive" : provider === "dropbox" ? "Dropbox" : "OneDrive";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(9,20,19,0.85)",
        backdropFilter: "blur(24px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
      }}
    >
      <motion.div
        initial={{ y: 20, scale: 0.95 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 20, scale: 0.95 }}
        style={{
          width: "100%",
          maxWidth: 900,
          height: "85vh",
          background: "hsl(167 28% 8%)",
          borderRadius: 24,
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.8)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{ padding: "24px 32px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Cloud style={{ width: 28, height: 28, color: "hsl(var(--primary))" }} />
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#fff" }}>
                {providerName}
              </h2>
              {isConnected && (
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                  {history.map((h, i) => (
                    <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <button
                        onClick={() => navigateUp(i)}
                        style={{
                          background: "none",
                          border: "none",
                          color: i === history.length - 1 ? "#fff" : "rgba(255,255,255,0.4)",
                          fontSize: 13,
                          cursor: "pointer",
                          padding: 0,
                        }}
                      >
                        {h.name}
                      </button>
                      {i < history.length - 1 && <ChevronRight style={{ width: 14, height: 14, color: "rgba(255,255,255,0.2)" }} />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {isConnected && (
              <button
                onClick={() => logout(provider)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 16px",
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.05)",
                  border: "none",
                  color: "rgba(255,255,255,0.6)",
                  cursor: "pointer",
                }}
              >
                <LogOut style={{ width: 14, height: 14 }} />
                Disconnect
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "rgba(255,255,255,0.1)",
                border: "none",
                color: "#fff",
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
              }}
            >
              <X style={{ width: 18, height: 18 }} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: 32, position: "relative" }}>
          {!isConnected ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 24 }}>
              <div style={{ width: 80, height: 80, borderRadius: 24, background: "rgba(255,255,255,0.05)", display: "grid", placeItems: "center" }}>
                <Cloud style={{ width: 40, height: 40, color: "hsl(var(--primary))" }} />
              </div>
              <div style={{ textAlign: "center", maxWidth: 300 }}>
                <h3 style={{ margin: 0, fontSize: 18, color: "#fff" }}>Connect to {providerName}</h3>
                <p style={{ margin: "8px 0 0", fontSize: 14, color: "rgba(255,255,255,0.5)" }}>
                  Link your account to browse and import your comic collection directly.
                </p>
              </div>
              <button
                onClick={handleLogin}
                disabled={loading}
                style={{
                  padding: "12px 32px",
                  borderRadius: 12,
                  background: "hsl(var(--primary))",
                  border: "none",
                  color: "#fff",
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: loading ? "default" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? <RefreshCw className="animate-spin" style={{ width: 18, height: 18 }} /> : null}
                {loading ? "Connecting..." : "Connect Account"}
              </button>
              {error && <p style={{ color: "#ff4444", fontSize: 13 }}>{error}</p>}
            </div>
          ) : (
            <>
              {error && (
                <div style={{ padding: 16, background: "rgba(255,0,0,0.1)", color: "#ff4444", borderRadius: 12, marginBottom: 24 }}>
                  {error}
                </div>
              )}
              
              {loading && files.length === 0 ? (
                <div style={{ display: "flex", justifyContent: "center", paddingTop: 40 }}>
                  <RefreshCw className="animate-spin" style={{ width: 24, height: 24, color: "hsl(var(--primary))" }} />
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {files.map((file) => (
                    <div
                      key={file.id}
                      onClick={() => handleDownload(file)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "16px 20px",
                        borderRadius: 12,
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.05)",
                        cursor: "pointer",
                        transition: "background 0.2s ease",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        {file.isFolder ? (
                          <Folder style={{ width: 24, height: 24, color: "hsl(var(--primary))" }} />
                        ) : (
                          <File style={{ width: 24, height: 24, color: "rgba(255,255,255,0.4)" }} />
                        )}
                        <div>
                          <h4 style={{ margin: 0, fontSize: 15, color: "#fff", fontWeight: 500 }}>{file.name}</h4>
                          {!file.isFolder && file.size && (
                            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
                              {(file.size / 1024 / 1024).toFixed(1)} MB
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {!file.isFolder && (
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          {downloadProgress[file.id] !== undefined ? (
                            <div style={{ fontSize: 13, color: "hsl(var(--primary))", fontWeight: 600 }}>
                              {downloadProgress[file.id]}%
                            </div>
                          ) : (
                            <Download style={{ width: 18, height: 18, color: "rgba(255,255,255,0.3)" }} />
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {files.length === 0 && !loading && (
                    <p style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", marginTop: 40 }}>This folder is empty.</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
