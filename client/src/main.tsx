import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// WebSocket override moved to index.html to run before Vite modules load

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
