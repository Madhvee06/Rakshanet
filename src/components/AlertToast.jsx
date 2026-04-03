// ============================================================
// AlertToast.jsx – Floating notification banner
// ============================================================
// A simple auto-dismissing toast. Trigger it by calling
// the exported `useToast` hook from any component.
// ============================================================

import { useState, useEffect, useCallback } from "react";
import styles from "./AlertToast.module.css";

// ---- Toast state lives here (module-level singleton) ----
let _setToast = null;

/**
 * Call this from anywhere to show a toast notification.
 * @param {string} title
 * @param {string} body
 * @param {"danger"|"warning"|"info"} type
 */
export function showToast(title, body, type = "danger") {
  if (_setToast) _setToast({ title, body, type, visible: true });
}

// ---- The actual component (mount once in App.jsx) ----
export default function AlertToast() {
  const [toast, setToast] = useState({ visible: false, title: "", body: "", type: "danger" });

  // Register setter so showToast() can reach it
  useEffect(() => { _setToast = setToast; }, []);

  // Auto-hide after 4 seconds
  useEffect(() => {
    if (!toast.visible) return;
    const timer = setTimeout(() => setToast((t) => ({ ...t, visible: false })), 4000);
    return () => clearTimeout(timer);
  }, [toast.visible, toast.title]);

  if (!toast.visible) return null;

  return (
    <div className={`${styles.toast} ${styles[toast.type]}`}>
      <div className={styles.icon}>
        {toast.type === "danger"  && "⚠️"}
        {toast.type === "warning" && "🔶"}
        {toast.type === "info"    && "ℹ️"}
      </div>
      <div className={styles.text}>
        <strong>{toast.title}</strong>
        {toast.body && <span>{toast.body}</span>}
      </div>
      <button
        className={styles.close}
        onClick={() => setToast((t) => ({ ...t, visible: false }))}
      >
        ✕
      </button>
    </div>
  );
}
