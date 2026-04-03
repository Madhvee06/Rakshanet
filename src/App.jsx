// ============================================================
// App.jsx – Root Component
// ============================================================
// Renders: LoadingScreen → Navbar + Dashboard
// Also mounts the global AlertToast and optional AuthModal.
// ============================================================

import { useState, useCallback } from "react";
import { AppProvider }    from "./context/AppContext";
import Navbar             from "./components/Navbar";
import Dashboard          from "./components/Dashboard";
import LoadingScreen      from "./components/LoadingScreen";
import AlertToast         from "./components/AlertToast";
import AuthModal          from "./components/AuthModal";
import "./styles/global.css";
import styles             from "./App.module.css";

// ---- Inner app (needs AppProvider context) ----
function AppInner() {
  const [loading,   setLoading]   = useState(true);
  const [showAuth,  setShowAuth]  = useState(false);

  const handleLoadDone = useCallback(() => setLoading(false), []);

  if (loading) {
    return <LoadingScreen onDone={handleLoadDone} />;
  }

  return (
    <div className={styles.app}>
      {/* Global floating toast notification */}
      <AlertToast />

      {/* Top navigation */}
      <Navbar onAuthClick={() => setShowAuth(true)} />

      {/* Main three-column layout */}
      <Dashboard />

      {/* Auth modal (optional) */}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}

// ---- Exported App: wraps everything in context provider ----
export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
