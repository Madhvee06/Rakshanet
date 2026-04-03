// ============================================================
// RightPanel.jsx – Volunteers List + Offline Notice
// ============================================================

import { useState } from "react";
import { useApp, ACTIONS } from "../context/AppContext";
import { useAddDocument } from "../hooks/useFirestore";
import { skillEmoji, nowTime } from "../utils/helpers";
import styles from "./RightPanel.module.css";

// ---- Single volunteer card ----
function VolunteerCard({ volunteer, onFlyTo }) {
  return (
    <div
      className={styles.volCard}
      onClick={() => onFlyTo && onFlyTo(volunteer.lat, volunteer.lng)}
    >
      <div className={`${styles.avatar} ${styles[volunteer.skill]}`}>
        {skillEmoji(volunteer.skill)}
      </div>
      <div className={styles.info}>
        <div className={styles.name}>{volunteer.name}</div>
        <div className={styles.skill}>{volunteer.skill.toUpperCase()}</div>
      </div>
      <div className={`${styles.status} ${styles[volunteer.status]}`}>
        {volunteer.status}
      </div>
    </div>
  );
}

// ---- Register Volunteer form (inline, collapsible) ----
function RegisterForm({ onClose }) {
  const { state, dispatch } = useApp();
  const { userLocation } = state;
  const { addDocument, loading, error } = useAddDocument("volunteers");

  const [form, setForm] = useState({
    name:  "",
    skill: "doctor",
    lat:   userLocation.lat.toFixed(4),
    lng:   userLocation.lng.toFixed(4),
  });

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    if (!form.name.trim()) { alert("Please enter your name."); return; }
    const lat = parseFloat(form.lat);
    const lng = parseFloat(form.lng);
    if (isNaN(lat) || isNaN(lng)) { alert("Please enter valid coordinates."); return; }

    const vol = {
      id: "v_" + Date.now(),
      name:   form.name.trim(),
      skill:  form.skill,
      lat, lng,
      status: "available",
      time:   nowTime(),
    };

    // Save to Firestore
    try { await addDocument(vol); } catch { /* fallback to local */ }

    // Update local state
    dispatch({ type: ACTIONS.ADD_VOLUNTEER, payload: vol });
    onClose();
  }

  return (
    <div className={styles.registerForm}>
      <div className={styles.registerTitle}>🤝 Register as Volunteer</div>

      <div className="form-group">
        <label className="form-label">Full Name</label>
        <input
          className="form-control"
          type="text"
          placeholder="e.g. Arjun Mehta"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Primary Skill</label>
        <select
          className="form-control"
          value={form.skill}
          onChange={(e) => update("skill", e.target.value)}
        >
          <option value="doctor">👨‍⚕️ Doctor / Medical</option>
          <option value="driver">🚗 Driver / Transport</option>
          <option value="helper">🙌 General Helper</option>
          <option value="engineer">🔧 Engineer / Technical</option>
        </select>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Latitude</label>
          <input
            className="form-control"
            type="number"
            step="0.0001"
            value={form.lat}
            onChange={(e) => update("lat", e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Longitude</label>
          <input
            className="form-control"
            type="number"
            step="0.0001"
            value={form.lng}
            onChange={(e) => update("lng", e.target.value)}
          />
        </div>
      </div>

      {error && <div className={styles.errorMsg}>⚠️ {error}</div>}

      <button
        style={{
          width: "100%", padding: "9px",
          background: "linear-gradient(135deg, var(--green), #19a87d)",
          border: "none", borderRadius: "var(--radius)",
          color: "#fff", fontFamily: "var(--font-display)",
          fontSize: "15px", fontWeight: 700, letterSpacing: "1px",
          textTransform: "uppercase", cursor: "pointer",
          transition: "transform 0.2s",
        }}
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? "Registering…" : "Register Now"}
      </button>
      <button className="btn-secondary" onClick={onClose}>Cancel</button>
    </div>
  );
}

// ---- Main RightPanel ----
export default function RightPanel({ onFlyTo }) {
  const { state } = useApp();
  const { volunteers, sosActive, isOnline } = state;
  const [showForm, setShowForm] = useState(false);

  const available = volunteers.filter((v) => v.status === "available").length;

  return (
    <aside className={styles.panel}>
      {/* Header */}
      <div className={styles.panelHeader}>
        <span className={styles.panelTitle}>Volunteers</span>
        <span className={styles.badge}>{available} Active</span>
      </div>

      {/* SOS active banner */}
      {sosActive && (
        <div className={styles.sosBanner}>
          <div className={styles.sosBannerTitle}>🚨 SOS ACTIVE</div>
          <div className={styles.sosBannerSub}>
            Your distress signal is broadcasting…
          </div>
        </div>
      )}

      {/* Register button / form toggle */}
      {showForm ? (
        <RegisterForm onClose={() => setShowForm(false)} />
      ) : (
        <button
          className={styles.registerBtn}
          onClick={() => setShowForm(true)}
        >
          ➕ Register as Volunteer
        </button>
      )}

      {/* Volunteer list */}
      {!showForm && (
        <div className={styles.volList}>
          {volunteers.length === 0 ? (
            <p className={styles.empty}>No volunteers registered yet.</p>
          ) : (
            volunteers.map((v) => (
              <VolunteerCard key={v.id} volunteer={v} onFlyTo={onFlyTo} />
            ))
          )}
        </div>
      )}

      {/* Offline / SMS Fallback notice */}
      <div className={`${styles.offlineNotice} ${!isOnline ? styles.offlineActive : ""}`}>
        <div className={styles.offlineTitle}>
          {isOnline ? "📡 Connectivity Mode" : "📵 Offline Mode Active"}
        </div>
        <div className={styles.offlineDesc}>
          {isOnline
            ? "Full connectivity. All data synced to Firebase in real time."
            : "Internet unavailable. RakshaNet can dispatch alerts via SMS to registered contacts and local emergency services."}
        </div>
        <div className={styles.smsPreview}>
          TO: +91-XXXXX &nbsp;|&nbsp; RAKSHA ALERT{"\n"}
          SOS @ {state.userLocation.lat.toFixed(4)}°N,{" "}
          {state.userLocation.lng.toFixed(4)}°E{"\n"}
          Status: NEED HELP &nbsp;|&nbsp; AUTO-MSG
        </div>
      </div>
    </aside>
  );
}
