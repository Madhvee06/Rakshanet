// ============================================================
// MapControls.jsx – SOS Button, Report Button, Zone Stats
// ============================================================
// These controls float over the map.
// ============================================================

import { useApp, ACTIONS } from "../context/AppContext";
import { clusterReports, getRiskLevel, nowTime } from "../utils/helpers";
import { showToast } from "./AlertToast";
import styles from "./MapControls.module.css";

export default function MapControls({ onReportClick, onSOSClick }) {
  const { state, dispatch } = useApp();
  const { reports, sosActive, volunteers, userLocation } = state;

  // Compute zone stats from current reports
  const clusters = clusterReports(reports);
  const stats = clusters.reduce(
    (acc, c) => {
      const { level } = getRiskLevel(c.length);
      if (level === "HIGH")   acc.high++;
      else if (level === "MEDIUM") acc.med++;
      else acc.safe++;
      return acc;
    },
    { high: 0, med: 0, safe: 0 }
  );

  function handleSOS() {
    if (sosActive) {
      showToast("🆘 SOS Already Active", "Your distress signal is still broadcasting.", "warning");
      return;
    }

    // Trigger SOS in global state
    dispatch({ type: ACTIONS.TRIGGER_SOS });

    // Add alert to feed
    dispatch({
      type: ACTIONS.ADD_ALERT,
      payload: {
        id:    "al_sos_" + Date.now(),
        type:  "danger",
        icon:  "🆘",
        title: "SOS TRANSMITTED",
        msg:   "Your distress signal was sent. Nearby volunteers have been notified.",
        time:  nowTime(),
      },
    });

    showToast("🆘 SOS Activated", "Your location is now visible to rescuers.", "danger");

    // Open the SOS modal
    if (onSOSClick) onSOSClick();
  }

  return (
    <>
      {/* ── Zone stats (top-left) ── */}
      <div className={styles.zoneStats}>
        <div className={styles.zoneStat}>
          <span className={styles.dot} style={{ background: "var(--red)" }} />
          <span>{stats.high} High</span>
        </div>
        <div className={styles.zoneStat}>
          <span className={styles.dot} style={{ background: "var(--yellow)" }} />
          <span>{stats.med} Medium</span>
        </div>
        <div className={styles.zoneStat}>
          <span className={styles.dot} style={{ background: "var(--green)" }} />
          <span>{stats.safe} Safe</span>
        </div>
      </div>

      {/* ── SOS Button (bottom-center) ── */}
      <button
        className={`${styles.sosBtn} ${sosActive ? styles.sosBtnActive : ""}`}
        onClick={handleSOS}
        title="Tap to send SOS signal"
      >
        SOS
      </button>

      {/* ── Report Incident Button (bottom-right) ── */}
      <button
        className={styles.reportBtn}
        onClick={onReportClick}
        title="Report a new incident"
      >
        📍 Report Incident
      </button>
    </>
  );
}
