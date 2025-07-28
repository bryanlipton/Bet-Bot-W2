import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Fix Vite WebSocket connection in Replit environment
if (import.meta.env.DEV && window.location.hostname.includes('replit.dev')) {
  // Override WebSocket constructor to fix HMR connection
  const originalWebSocket = window.WebSocket;
  window.WebSocket = class extends originalWebSocket {
    constructor(url: string | URL, protocols?: string | string[]) {
      let fixedUrl = url.toString();
      
      // Fix Vite HMR WebSocket URL for Replit
      if (fixedUrl.includes('localhost:5173') || fixedUrl.includes('ws://localhost') || fixedUrl.includes('localhost')) {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        fixedUrl = `${protocol}//${window.location.host}`;
        console.log('🔧 Redirecting WebSocket connection from', url.toString(), 'to', fixedUrl);
      }
      
      super(fixedUrl, protocols);
    }
  };
}

// Remove error suppression to see if WebSocket connection is actually fixed
// if (import.meta.env.DEV) {
//   const originalConsoleError = console.error;
//   console.error = function(...args) {
//     const message = args.join(' ');
//     
//     // Suppress specific Vite WebSocket warnings that are harmless in Replit
//     if (message.includes('[vite] failed to connect to websocket') ||
//         message.includes('Check out your Vite / network configuration') ||
//         message.includes('WebSocket (failing)')) {
//       return; // Don't log these harmless warnings
//     }
//     
//     // Log all other errors normally
//     originalConsoleError.apply(console, args);
//   };
// }

createRoot(document.getElementById("root")!).render(<App />);
