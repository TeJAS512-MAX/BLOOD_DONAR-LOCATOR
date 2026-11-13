import { Component, type ReactNode, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class RootErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: unknown) {
    console.error("RootErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            backgroundColor: "#0c0909",
            color: "#f8fafc",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            fontFamily: "system-ui, sans-serif",
            textAlign: "center",
          }}
        >
          <h1 style={{ color: "#ff4d6d", fontSize: "2rem", marginBottom: "1rem" }}>
            BloodLink Encountered an Interface Error
          </h1>
          <p style={{ maxWidth: "600px", color: "#94a3b8", marginBottom: "1.5rem" }}>
            {this.state.error?.message || "An unexpected error occurred during rendering."}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              padding: "0.75rem 1.75rem",
              borderRadius: "9999px",
              background: "#ff4d6d",
              color: "#ffffff",
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Reload Application
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </StrictMode>
);
