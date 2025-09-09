import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";
import React from "react";
import { ThemeProvider } from "./components/ThemeProvider.tsx"; // Import ThemeProvider
import { AuthProvider } from "./contexts/AuthContext.tsx"; // Import AuthProvider

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <AuthProvider> {/* AuthProvider now wraps App */}
        <App />
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);