import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Disable HMR completely in deployment environments
if (import.meta.env.DEV && (window.location.hostname.includes('replit.dev') || window.location.hostname.includes('.replit.app'))) {
  // Override import.meta.hot to disable HMR entirely
  if (import.meta.hot) {
    import.meta.hot.accept = () => {};
    import.meta.hot.dispose = () => {};
    import.meta.hot.invalidate = () => {};
  }
  
  // Suppress all Vite HMR related console output
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  
  console.error = function(...args) {
    const message = args.join(' ');
    if (message.includes('[vite]') || message.includes('websocket') || message.includes('HMR')) {
      return; // Suppress HMR messages
    }
    originalConsoleError.apply(console, args);
  };
  
  console.warn = function(...args) {
    const message = args.join(' ');
    if (message.includes('[vite]') || message.includes('HMR')) {
      return; // Suppress HMR warnings
    }
    originalConsoleWarn.apply(console, args);
  };
}

createRoot(document.getElementById("root")!).render(<App />);
