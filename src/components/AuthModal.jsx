// ============================================================
// AuthModal.jsx – Login / Sign Up with Firebase Auth
// ============================================================

import { useState } from "react";
import { useApp, ACTIONS } from "../context/AppContext";
import { useSignIn, useSignUp } from "../hooks/useFirestore";
import styles from "./AuthModal.module.css";

export default function AuthModal({ onClose }) {
  const { dispatch } = useApp();

  // Toggle between login and signup
  const [mode, setMode] = useState("login"); // "login" | "signup"

  // Form fields
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");

  // Firebase hooks
  const { signIn, loading: signInLoading, error: signInError } = useSignIn();
  const { signUp, loading: signUpLoading, error: signUpError } = useSignUp();

  const loading = signInLoading || signUpLoading;
  const error   = signInError  || signUpError;

  async function handleSubmit() {
    let user = null;

    if (mode === "login") {
      user = await signIn(email, password);
    } else {
      if (!name.trim()) { alert("Please enter your name."); return; }
      user = await signUp(email, password, name.trim());
    }

    if (user) {
      // Save user to global context
      dispatch({
        type: ACTIONS.SET_USER,
        payload: {
          uid:         user.uid,
          email:       user.email,
          displayName: user.displayName || name,
        },
      });
      onClose();
    }
  }

  // Allow submitting with Enter key
  function handleKeyDown(e) {
    if (e.key === "Enter") handleSubmit();
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        {/* Title */}
        <div className="modal-title" style={{ color: "var(--blue)" }}>
          {mode === "login" ? "🔐 Sign In" : "🆕 Create Account"}
        </div>
        <div className="modal-sub">
          {mode === "login"
            ? "Sign in to save your reports and SOS history."
            : "Create a free account to join the RakshaNet network."}
        </div>

        {/* Sign-up only: Name */}
        {mode === "signup" && (
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              className="form-control"
              type="text"
              placeholder="e.g. Rahul Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
        )}

        {/* Email */}
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input
            className="form-control"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        {/* Password */}
        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            className="form-control"
            type="password"
            placeholder={mode === "signup" ? "Min. 6 characters" : "Your password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        {/* Error message */}
        {error && <div className={styles.errorMsg}>⚠️ {error}</div>}

        {/* Submit */}
        <button
          className="btn-primary"
          style={{ background: "linear-gradient(135deg, var(--blue), #2563eb)" }}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
        </button>

        {/* Toggle mode */}
        <div className={styles.toggleRow}>
          {mode === "login" ? (
            <>
              Don't have an account?{" "}
              <button className={styles.toggleBtn} onClick={() => setMode("signup")}>
                Sign Up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button className={styles.toggleBtn} onClick={() => setMode("login")}>
                Sign In
              </button>
            </>
          )}
        </div>

        <button className="btn-secondary" onClick={onClose}>
          Continue without account
        </button>
      </div>
    </div>
  );
}
