// ============================================================
// main.jsx – Application Entry Point
// ============================================================
// Vite + React entry file. Renders <App /> into #root div.
// ============================================================

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
