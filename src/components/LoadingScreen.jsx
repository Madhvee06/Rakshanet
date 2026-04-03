// ============================================================
// LoadingScreen.jsx – Startup animation
// ============================================================

import { useEffect, useState } from "react";
import styles from "./LoadingScreen.module.css";

const STEPS = [
  "INITIALIZING SENSOR NETWORK…",
  "LOADING GEODATA LAYERS…",
  "CONNECTING TO FIREBASE…",
  "CALIBRATING RISK ZONES…",
  "SYSTEM READY ✓",
];

export default function LoadingScreen({ onDone }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setStep(i);
      if (i >= STEPS.length - 1) {
        clearInterval(interval);
        // Fade out after final step
        setTimeout(onDone, 500);
      }
    }, 380);
    return () => clearInterval(interval);
  }, [onDone]);

  return (
    <div className={styles.screen}>
      <div className={styles.logo}>
        RAKSHA<span>NET</span>
      </div>
      <div className={styles.tagline}>Hyper-Local Disaster Resilience Network</div>
      <div className={styles.barWrap}>
        <div
          className={styles.bar}
          style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
        />
      </div>
      <div className={styles.status}>{STEPS[step]}</div>
    </div>
  );
}
