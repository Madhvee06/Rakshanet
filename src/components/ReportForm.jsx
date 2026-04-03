// ============================================================
// ReportForm.jsx – Incident Reporting Modal
// ============================================================
// Users fill this form to report a disaster.
// In production: data is saved to Firestore via useAddDocument.
// For demo: data goes straight into local state.
// ============================================================

import { useState } from "react";
import { useApp, ACTIONS } from "../context/AppContext";
import { useAddDocument } from "../hooks/useFirestore";
import { nowTime, typeEmoji } from "../utils/helpers";
import styles from "./ReportForm.module.css";

export default function ReportForm({ onClose }) {
  const { state, dispatch } = useApp();
  const { userLocation } = state;

  // Firebase hook – saves report to Firestore
  const { addDocument, loading, error } = useAddDocument("reports");

  // Form fields
  const [form, setForm] = useState({
    type:     "flood",
    desc:     "",
    lat:      userLocation.lat.toFixed(4),
    lng:      userLocation.lng.toFixed(4),
    severity: "high",
  });

  // Update a single field
  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    if (!form.desc.trim()) {
      alert("Please add a description.");
      return;
    }
    const lat = parseFloat(form.lat);
    const lng = parseFloat(form.lng);
    if (isNaN(lat) || isNaN(lng)) {
      alert("Please enter valid coordinates.");
      return;
    }

    const report = {
      id:       "r_" + Date.now(),
      type:     form.type,
      desc:     form.desc.trim(),
      lat,
      lng,
      severity: form.severity,
      time:     nowTime(),
      user:     state.currentUser?.displayName || "Anonymous",
    };

    // 1. Save to Firestore (production)
    try {
      await addDocument(report);
    } catch {
      // If Firestore fails (e.g. no network), still update local state
      console.warn("Firestore save failed, using local state only.");
    }

    // 2. Update local state immediately (for demo responsiveness)
    dispatch({ type: ACTIONS.ADD_REPORT, payload: report });

    // 3. Add alert
    dispatch({
      type: ACTIONS.ADD_ALERT,
      payload: {
        id:    "al_" + Date.now(),
        type:  form.severity === "high" ? "danger" : "warning",
        icon:  typeEmoji(form.type),
        title: `New ${form.type.toUpperCase()} Report`,
        msg:   form.desc.substring(0, 80),
        time:  nowTime(),
      },
    });

    onClose();
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-title" style={{ color: "var(--yellow)" }}>
          📍 Report Incident
        </div>
        <div className="modal-sub">
          Your report helps predict and visualize high-risk zones in real time.
        </div>

        {/* Disaster Type */}
        <div className="form-group">
          <label className="form-label">Disaster Type</label>
          <select
            className="form-control"
            value={form.type}
            onChange={(e) => update("type", e.target.value)}
          >
            <option value="flood">🌊 Flood</option>
            <option value="fire">🔥 Fire</option>
            <option value="infra">⚡ Infrastructure Failure</option>
            <option value="medical">🏥 Medical Emergency</option>
            <option value="landslide">⛰️ Landslide</option>
            <option value="storm">🌪️ Storm / Cyclone</option>
          </select>
        </div>

        {/* Description */}
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            className="form-control"
            placeholder="Describe what you see…"
            value={form.desc}
            onChange={(e) => update("desc", e.target.value)}
          />
        </div>

        {/* Lat / Lng */}
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

        <div className={styles.mapHint}>
          💡 Tip: Click anywhere on the map to auto-fill coordinates.
        </div>

        {/* Severity */}
        <div className="form-group">
          <label className="form-label">Severity</label>
          <select
            className="form-control"
            value={form.severity}
            onChange={(e) => update("severity", e.target.value)}
          >
            <option value="high">🔴 High</option>
            <option value="medium">🟡 Medium</option>
            <option value="low">🟢 Low</option>
          </select>
        </div>

        {/* Error display */}
        {error && <div className={styles.errorMsg}>⚠️ {error}</div>}

        <button
          className="btn-primary"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Submitting…" : "Submit Report"}
        </button>
        <button className="btn-secondary" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}
