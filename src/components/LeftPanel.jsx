// ============================================================
// LeftPanel.jsx – Incident List, SOS List, Alert History
// ============================================================

import { useApp, ACTIONS } from "../context/AppContext";
import { typeEmoji } from "../utils/helpers";
import styles from "./LeftPanel.module.css";

// ---- Individual Report Card ----
function ReportCard({ report, onClick }) {
  return (
    <div
      className={`${styles.reportCard} ${styles[`sev_${report.severity}`]}`}
      onClick={onClick}
    >
      <div className={styles.cardHeader}>
        <span className={`${styles.typeBadge} ${styles[report.type]}`}>
          {typeEmoji(report.type)} {report.type.toUpperCase()}
        </span>
        <span className={styles.time}>{report.time}</span>
      </div>
      <div className={styles.desc}>{report.desc}</div>
      <div className={styles.coords}>
        📍 {Number(report.lat).toFixed(4)}, {Number(report.lng).toFixed(4)}
        &nbsp;|&nbsp; {report.user || "Anonymous"}
      </div>
    </div>
  );
}

// ---- SOS Card ----
function SOSCard({ sos, onClick }) {
  return (
    <div className={`${styles.reportCard} ${styles.sev_high}`} onClick={onClick}>
      <div className={styles.cardHeader}>
        <span className={`${styles.typeBadge} ${styles.sos}`}>
          🆘 SOS ACTIVE
        </span>
        <span className={styles.time}>{sos.time}</span>
      </div>
      <div className={styles.desc}>
        <strong>{sos.name}</strong> needs immediate help
      </div>
      <div className={styles.coords}>
        📍 {Number(sos.lat).toFixed(4)}, {Number(sos.lng).toFixed(4)}
      </div>
    </div>
  );
}

// ---- Alert Card ----
function AlertCard({ alert }) {
  return (
    <div className={styles.alertCard}>
      <div className={`${styles.alertIcon} ${styles[alert.type]}`}>
        {alert.icon}
      </div>
      <div className={styles.alertBody}>
        <strong>{alert.title}</strong>
        <p>{alert.msg}</p>
        <span className={styles.alertTime}>{alert.time}</span>
      </div>
    </div>
  );
}

// ---- Main LeftPanel ----
export default function LeftPanel({ onFlyTo }) {
  const { state, dispatch } = useApp();
  const { reports, sosUsers, alerts, activeTab } = state;

  function setTab(tab) {
    dispatch({ type: ACTIONS.SET_ACTIVE_TAB, payload: tab });
  }

  return (
    <aside className={styles.panel}>
      {/* Panel header */}
      <div className={styles.panelHeader}>
        <span className={styles.panelTitle}>Live Feed</span>
        <span className={styles.badge}>{reports.length} Reports</span>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tabBtn} ${activeTab === "reports" ? styles.active : ""}`}
          onClick={() => setTab("reports")}
        >
          📍 Incidents
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === "sos" ? styles.active : ""}`}
          onClick={() => setTab("sos")}
        >
          🚨 SOS {sosUsers.length > 0 && `(${sosUsers.length})`}
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === "alerts" ? styles.active : ""}`}
          onClick={() => setTab("alerts")}
        >
          📢 Alerts
        </button>
      </div>

      {/* Tab Content */}
      <div className={styles.tabContent}>

        {/* --- Incidents --- */}
        {activeTab === "reports" && (
          <div>
            {reports.length === 0 ? (
              <p className={styles.empty}>No incidents reported yet.</p>
            ) : (
              [...reports].reverse().map((r) => (
                <ReportCard
                  key={r.id}
                  report={r}
                  onClick={() => onFlyTo && onFlyTo(r.lat, r.lng)}
                />
              ))
            )}
          </div>
        )}

        {/* --- SOS --- */}
        {activeTab === "sos" && (
          <div>
            {sosUsers.length === 0 ? (
              <p className={styles.empty}>No active SOS signals.</p>
            ) : (
              sosUsers.map((s) => (
                <SOSCard
                  key={s.id}
                  sos={s}
                  onClick={() => onFlyTo && onFlyTo(s.lat, s.lng)}
                />
              ))
            )}
          </div>
        )}

        {/* --- Alerts --- */}
        {activeTab === "alerts" && (
          <div>
            {alerts.length === 0 ? (
              <p className={styles.empty}>No alerts yet.</p>
            ) : (
              [...alerts].reverse().map((a) => (
                <AlertCard key={a.id || a.title + a.time} alert={a} />
              ))
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
