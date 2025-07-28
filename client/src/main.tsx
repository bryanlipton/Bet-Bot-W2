import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Suppress harmless Vite WebSocket warnings in development
if (import.meta.env.DEV) {
  const originalConsoleError = console.error;
  console.error = function(...args) {
    const message = args.join(' ');
    
    // Suppress specific Vite WebSocket warnings that are harmless in Replit
    if (message.includes('[vite] failed to connect to websocket') ||
        message.includes('Check out your Vite / network configuration') ||
        message.includes('WebSocket (failing)')) {
      return; // Don't log these harmless warnings
    }
    
    // Log all other errors normally
    originalConsoleError.apply(console, args);
  };
}

createRoot(document.getElementById("root")!).render(<App />);
