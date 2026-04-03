// ============================================================
// MapView.jsx – Interactive Map with Leaflet
// ============================================================
// Shows incident markers, SOS pins, volunteer locations,
// and auto-computed risk zone circles.
// ============================================================

import { useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import { useApp, ACTIONS } from "../context/AppContext";
import {
  clusterReports,
  getRiskLevel,
  typeEmoji,
  skillEmoji,
} from "../utils/helpers";
import styles from "./MapView.module.css";

// ---- Helper: create a custom div icon ----
function makeIcon(emoji, bgColor) {
  return L.divIcon({
    className: "",
    html: `
      <div style="
        background:${bgColor};
        width:32px; height:32px;
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        display:flex; align-items:center; justify-content:center;
        box-shadow:0 2px 12px rgba(0,0,0,0.5);
        border:2px solid rgba(255,255,255,0.18);
      ">
        <span style="transform:rotate(45deg); font-size:14px; line-height:1">${emoji}</span>
      </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -34],
  });
}

const ICONS = {
  flood:     makeIcon("🌊", "#4a9eff"),
  fire:      makeIcon("🔥", "#ff3b4e"),
  infra:     makeIcon("⚡", "#f5a623"),
  medical:   makeIcon("🏥", "#b47fff"),
  landslide: makeIcon("⛰️", "#8a6a4a"),
  storm:     makeIcon("🌪️", "#6aacff"),
  sos:       makeIcon("🆘", "#cc0000"),
  volunteer: makeIcon("🤝", "#22d3a0"),
};

export default function MapView({ flyToRef }) {
  const { state, dispatch } = useApp();
  const { reports, sosUsers, volunteers, userLocation } = state;

  // Refs so we can access the map instance and layers
  const mapRef      = useRef(null); // the Leaflet map object
  const containerRef= useRef(null); // the DOM div
  const markersRef  = useRef([]);   // all current markers
  const circlesRef  = useRef([]);   // all current zone circles

  // ---- Initialize map once on mount ----
  useEffect(() => {
    if (mapRef.current) return; // already initialized

    mapRef.current = L.map(containerRef.current, {
      center: [userLocation.lat, userLocation.lng],
      zoom: 13,
      zoomControl: true,
    });

    // Dark map tiles (no API key needed)
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        attribution: "© OpenStreetMap contributors © CARTO",
        maxZoom: 19,
      }
    ).addTo(mapRef.current);

    // Click to auto-fill lat/lng in report & volunteer forms
    mapRef.current.on("click", (e) => {
      // Dispatch clicked location to context (forms will read from it)
      dispatch({
        type: ACTIONS.SET_LOCATION,
        payload: { lat: e.latlng.lat, lng: e.latlng.lng },
      });
    });

    // Try to center on real device location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        dispatch({ type: ACTIONS.SET_LOCATION, payload: loc });
        mapRef.current.setView([loc.lat, loc.lng], 13);
      });
    }
  }, []); // eslint-disable-line

  // ---- Expose flyTo so parent can call it ----
  useEffect(() => {
    if (flyToRef) {
      flyToRef.current = (lat, lng) => {
        mapRef.current?.setView([lat, lng], 15);
      };
    }
  }, [flyToRef]);

  // ---- Re-render markers whenever data changes ----
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove old markers + circles
    markersRef.current.forEach((m) => mapRef.current.removeLayer(m));
    circlesRef.current.forEach((c) => mapRef.current.removeLayer(c));
    markersRef.current = [];
    circlesRef.current = [];

    // -- Incident markers --
    reports.forEach((r) => {
      const icon = ICONS[r.type] || ICONS.infra;
      const marker = L.marker([r.lat, r.lng], { icon })
        .bindPopup(`
          <div style="font-family:'DM Sans',sans-serif;min-width:180px">
            <strong style="color:#ff3b4e">${typeEmoji(r.type)} ${r.type.toUpperCase()}</strong>
            <p style="margin:5px 0;font-size:12px;color:#8b99b3">${r.desc}</p>
            <small style="color:#4a5568;font-family:monospace">
              📍 ${Number(r.lat).toFixed(4)}, ${Number(r.lng).toFixed(4)} | ${r.time}
            </small>
          </div>
        `)
        .addTo(mapRef.current);
      markersRef.current.push(marker);
    });

    // -- SOS markers --
    sosUsers.forEach((s) => {
      const marker = L.marker([s.lat, s.lng], { icon: ICONS.sos })
        .bindPopup(`
          <div style="font-family:'DM Sans',sans-serif">
            <strong style="color:#cc0000">🆘 SOS – ${s.name}</strong>
            <p style="margin:5px 0;font-size:12px;color:#8b99b3">Needs immediate assistance</p>
            <small style="color:#4a5568;font-family:monospace">${s.time}</small>
          </div>
        `)
        .addTo(mapRef.current);
      markersRef.current.push(marker);

      // Pulsing circle around SOS
      const circle = L.circle([s.lat, s.lng], {
        radius: 160,
        color: "#ff0000",
        fillColor: "#ff0000",
        fillOpacity: 0.15,
        weight: 2,
      }).addTo(mapRef.current);
      circlesRef.current.push(circle);
    });

    // -- Volunteer markers --
    volunteers.forEach((v) => {
      const marker = L.marker([v.lat, v.lng], { icon: ICONS.volunteer })
        .bindPopup(`
          <div style="font-family:'DM Sans',sans-serif">
            <strong style="color:#22d3a0">${skillEmoji(v.skill)} ${v.name}</strong>
            <p style="margin:5px 0;font-size:12px;color:#8b99b3">
              Skill: ${v.skill} | Status: ${v.status}
            </p>
          </div>
        `)
        .addTo(mapRef.current);
      markersRef.current.push(marker);
    });

    // -- Risk zone circles (computed from clustering) --
    const clusters = clusterReports(reports);
    clusters.forEach((cluster) => {
      const centLat = cluster.reduce((s, r) => s + r.lat, 0) / cluster.length;
      const centLng = cluster.reduce((s, r) => s + r.lng, 0) / cluster.length;
      const { color, radius, level } = getRiskLevel(cluster.length);

      const circle = L.circle([centLat, centLng], {
        radius,
        color,
        fillColor: color,
        fillOpacity: 0.16,
        weight: cluster.length >= 3 ? 2 : 1,
        dashArray: cluster.length === 1 ? "6,4" : null,
      })
        .bindPopup(`
          <div style="font-family:'DM Sans',sans-serif">
            <strong style="color:${color}">${level} RISK ZONE</strong>
            <p style="font-size:12px;color:#8b99b3;margin:4px 0">
              ${cluster.length} incident(s) in this area
            </p>
          </div>
        `)
        .addTo(mapRef.current);
      circlesRef.current.push(circle);
    });
  }, [reports, sosUsers, volunteers]);

  return (
    <div className={styles.wrapper}>
      {/* Legend */}
      <div className={styles.legend}>
        <div className={styles.legendPill}><span className={styles.dot} style={{ background: "var(--red)" }} /> High Risk</div>
        <div className={styles.legendPill}><span className={styles.dot} style={{ background: "var(--yellow)" }} /> Medium</div>
        <div className={styles.legendPill}><span className={styles.dot} style={{ background: "var(--green)" }} /> Safe</div>
        <div className={styles.legendPill}>🆘 SOS</div>
        <div className={styles.legendPill}>📍 Incident</div>
        <div className={styles.legendPill}>🤝 Volunteer</div>
      </div>

      {/* Leaflet container */}
      <div ref={containerRef} className={styles.map} />
    </div>
  );
}
