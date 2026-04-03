// ============================================================
// SOSModal.jsx – SOS Activation & Cancellation
// ============================================================

import { useApp, ACTIONS } from "../context/AppContext";
import { nearestVolunteers, skillEmoji } from "../utils/helpers";
import styles from "./SOSModal.module.css";

export default function SOSModal({ onClose }) {
  const { state, dispatch } = useApp();
  const { userLocation, volunteers, sosActive } = state;

  // Find nearest 3 available volunteers
  const nearby = nearestVolunteers(volunteers, userLocation.lat, userLocation.lng, 3);

  function handleCancel() {
    dispatch({ type: ACTIONS.CANCEL_SOS });
    dispatch({
      type: ACTIONS.ADD_ALERT,
      payload: {
        id:    "al_" + Date.now(),
        type:  "info",
        icon:  "✅",
        title: "SOS CANCELLED",
        msg:   "User marked as safe. SOS signal deactivated.",
        time:  new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      },
    });
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        {/* Title */}
        <div className="modal-title" style={{ color: "var(--red)" }}>
          🚨 SOS ACTIVATED
        </div>
        <div className="modal-sub">
          Your distress signal has been broadcast to all nearby volunteers and
          emergency services.
        </div>

        {/* Location info */}
        <div className={styles.locationBox}>
          📍 Location: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
          <br />
          🕐 Time:{" "}
          {new Date().toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
          })}
          <br />
          📡 Signal strength: Strong
        </div>

        {/* Nearest volunteers */}
        <div className={styles.volSection}>
          <div className={styles.volTitle}>🤝 Nearest Volunteers Notified</div>
          {nearby.length === 0 ? (
            <p className={styles.noVol}>No volunteers available nearby.</p>
          ) : (
            nearby.map((v) => (
              <div key={v.id} className={styles.volItem}>
                <span>{skillEmoji(v.skill)}</span>
                <strong>{v.name}</strong>
                <span className={styles.dist}>
                  {(v.distKm * 1000).toFixed(0)}m away
                </span>
              </div>
            ))
          )}
        </div>

        {/* Buttons */}
        <button className="btn-secondary" onClick={onClose}>
          Close (signal remains active)
        </button>
        <button
          className={`btn-secondary btn-green ${styles.cancelBtn}`}
          onClick={handleCancel}
        >
          ✅ I am safe now – Cancel SOS
        </button>
      </div>
    </div>
  );
}
