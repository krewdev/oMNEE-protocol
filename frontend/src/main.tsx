import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Suppress browser extension errors (Solana wallet, autofill, etc.)
const originalError = window.console.error;
window.console.error = (...args: any[]) => {
  const errorString = args.join(" ");
  // Filter out known browser extension errors
  if (
    errorString.includes("solanaActionsContentScript") ||
    errorString.includes("autofillInstance") ||
    errorString.includes("chrome-extension://") ||
    errorString.includes("moz-extension://")
  ) {
    // Silently ignore extension errors
    return;
  }
  // Log real application errors
  originalError.apply(console, args);
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);





