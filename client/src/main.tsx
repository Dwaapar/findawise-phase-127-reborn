import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Initialize PWA manager
import { pwaManager } from "./lib/pwa/PWAManager";

// PWA functionality initializes automatically via constructor

// Track app initialization
if ((window as any).analyticsSync) {
  (window as any).analyticsSync.track('app_initialized', {
    timestamp: Date.now(),
    userAgent: navigator.userAgent,
    pwa: {
      isStandalone: window.matchMedia('(display-mode: standalone)').matches,
      isIOSStandalone: (window.navigator as any).standalone === true
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
