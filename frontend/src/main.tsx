import { Component, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: "100vh", background: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", fontFamily: "sans-serif" }}>
          <div style={{ maxWidth: 480, textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Something went wrong</h1>
            <p style={{ color: "#71717a", fontSize: 14, marginBottom: 24 }}>
              {(this.state.error as Error).message || "An unexpected error occurred."}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{ background: "#FFD700", color: "#000", border: "none", borderRadius: 12, padding: "12px 28px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
