import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// WebSocket redirect successfully working but HMR unavailable in Replit
// Suppress only Vite HMR errors while preserving all other functionality
if (import.meta.env.DEV && window.location.hostname.includes('replit.dev')) {
  const originalConsoleError = console.error;
  console.error = function(...args) {
    const message = args.join(' ');
    
    // Suppress only Vite HMR WebSocket errors - they're harmless in Replit deployment
    if (message.includes('[vite] failed to connect to websocket') ||
        message.includes('Check out your Vite / network configuration') ||
        message.includes('WebSocket (failing)') ||
        message.includes('your current setup:')) {
      return; // Don't log HMR connection errors
    }
    
    // Log all other errors normally
    originalConsoleError.apply(console, args);
  };
}

createRoot(document.getElementById("root")!).render(<App />);
