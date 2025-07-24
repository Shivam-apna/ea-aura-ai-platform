import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";
import React from "react";
import { ThemeProvider } from "./components/ThemeProvider.tsx"; // Import ThemeProvider

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <App />
    </ThemeProvider>
  </React.StrictMode>
);