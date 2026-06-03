import React, { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            height: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#091413",
            color: "#fff",
            fontFamily: "system-ui, -apple-system, sans-serif",
            padding: 40,
          }}
        >
          <div
            style={{
              maxWidth: 500,
              padding: 40,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 24,
              boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              gap: 20,
            }}
          >
            <div style={{ width: 64, height: 64, borderRadius: 20, background: "rgba(220,37,37,0.1)", display: "grid", placeItems: "center" }}>
              <AlertTriangle style={{ width: 32, height: 32, color: "#DC2525" }} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>App Crashed</h2>
              <p style={{ margin: "12px 0 0", color: "rgba(255,255,255,0.6)", fontSize: 15, lineHeight: 1.5 }}>
                An unexpected error occurred in the React rendering tree. We've caught it to prevent a blank screen.
              </p>
            </div>
            
            <div style={{ width: "100%", padding: 16, background: "rgba(0,0,0,0.5)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)", textAlign: "left", overflowX: "auto" }}>
              <code style={{ fontSize: 13, color: "#ff8888", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {this.state.error?.toString()}
              </code>
            </div>

            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: 12,
                padding: "12px 24px",
                borderRadius: 12,
                background: "hsl(var(--primary))",
                border: "none",
                color: "#fff",
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                boxShadow: "0 8px 24px rgba(220,37,37,0.3)",
              }}
            >
              <RefreshCw style={{ width: 16, height: 16 }} />
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
