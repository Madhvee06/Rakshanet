// ============================================================
// Navbar.jsx – Top Navigation Bar
// ============================================================

import { useApp, ACTIONS } from "../context/AppContext";
import styles from "./Navbar.module.css";

export default function Navbar({ onAuthClick }) {
  const { state, dispatch } = useApp();
  const { isOnline, userStatus, currentUser, sosActive } = state;

  // Update user status from the dropdown
  function handleStatusChange(e) {
    dispatch({ type: ACTIONS.SET_USER_STATUS, payload: e.target.value });
  }

  // Toggle simulated connectivity
  function handleToggleOnline() {
    dispatch({ type: ACTIONS.TOGGLE_ONLINE });
  }

  return (
    <nav className={styles.navbar}>
      {/* ── Logo ── */}
      <div className={styles.logo}>
        <div className={styles.logoIcon}>🛡️</div>
        <div>
          <div className={styles.logoText}>
            RAKSHA<span>NET</span>
          </div>
          <div className={styles.tagline}>Hyper-Local Disaster Resilience</div>
        </div>
      </div>

      {/* ── Spacer ── */}
      <div className={styles.spacer} />

      {/* ── Live Indicator ── */}
      <div className={styles.liveIndicator}>
        <div className={styles.pulseDot} />
        LIVE
      </div>

      {/* ── SOS Active badge ── */}
      {sosActive && (
        <div className={styles.sosBadge}>🆘 SOS ACTIVE</div>
      )}

      {/* ── User Status Selector ── */}
      <div className={styles.statusWrap}>
        <span className={styles.statusLabel}>My Status:</span>
        <select
          className={styles.statusSelect}
          value={userStatus}
          onChange={handleStatusChange}
        >
          <option value="safe">✅ Safe</option>
          <option value="help">⚠️ Need Help</option>
          <option value="missing">❌ Missing</option>
        </select>
      </div>

      {/* ── Logged-in user display OR login button ── */}
      {currentUser ? (
        <div className={styles.userChip}>
          👤 {currentUser.displayName || currentUser.email}
        </div>
      ) : (
        <button className={styles.loginBtn} onClick={onAuthClick}>
          🔐 Sign In
        </button>
      )}

      {/* ── Connectivity Badge ── */}
      <button
        className={`${styles.connectBadge} ${!isOnline ? styles.offline : ""}`}
        onClick={handleToggleOnline}
        title="Click to simulate offline mode"
      >
        <span>{isOnline ? "📶" : "📵"}</span>
        <span>{isOnline ? "ONLINE" : "OFFLINE"}</span>
      </button>
    </nav>
  );
}
