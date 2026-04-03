// ============================================================
// Dashboard.jsx – Main Layout: Left + Map + Right
// ============================================================
// Orchestrates the three-column layout and manages
// which modals are open.
// ============================================================

import { useState, useRef } from "react";
import LeftPanel    from "./LeftPanel";
import MapView      from "./MapView";
import RightPanel   from "./RightPanel";
import MapControls  from "./MapControls";
import ReportForm   from "./ReportForm";
import SOSModal     from "./SOSModal";
import styles       from "./Dashboard.module.css";

export default function Dashboard() {
  const [showReport, setShowReport] = useState(false);
  const [showSOS,    setShowSOS]    = useState(false);

  // Ref to MapView's flyTo function
  const flyToRef = useRef(null);

  function flyTo(lat, lng) {
    if (flyToRef.current) flyToRef.current(lat, lng);
  }

  return (
    <div className={styles.dashboard}>
      {/* ── Left: incidents / SOS / alerts ── */}
      <LeftPanel onFlyTo={flyTo} />

      {/* ── Center: map + floating controls ── */}
      <div className={styles.mapWrapper}>
        <MapView flyToRef={flyToRef} />
        <MapControls
          onReportClick={() => setShowReport(true)}
          onSOSClick={()    => setShowSOS(true)}
        />
      </div>

      {/* ── Right: volunteers + offline notice ── */}
      <RightPanel onFlyTo={flyTo} />

      {/* ── Modals ── */}
      {showReport && <ReportForm onClose={() => setShowReport(false)} />}
      {showSOS    && <SOSModal   onClose={() => setShowSOS(false)}    />}
    </div>
  );
}
