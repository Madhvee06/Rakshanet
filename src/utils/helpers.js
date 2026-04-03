// ============================================================
// helpers.js – Utility Functions for RakshaNet
// ============================================================

/**
 * Returns the current time as a formatted string (e.g. "09:45 AM")
 */
export function nowTime() {
  return new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Returns an emoji for each disaster type
 */
export function typeEmoji(type) {
  const map = {
    flood:     "🌊",
    fire:      "🔥",
    infra:     "⚡",
    medical:   "🏥",
    landslide: "⛰️",
    storm:     "🌪️",
  };
  return map[type] || "⚠️";
}

/**
 * Returns an emoji for each volunteer skill
 */
export function skillEmoji(skill) {
  const map = {
    doctor:   "👨‍⚕️",
    driver:   "🚗",
    helper:   "🙌",
    engineer: "🔧",
  };
  return map[skill] || "🙋";
}

/**
 * Calculates distance between two lat/lng points using Haversine formula.
 * Returns distance in kilometres.
 *
 * @param {number} lat1
 * @param {number} lng1
 * @param {number} lat2
 * @param {number} lng2
 * @returns {number} distance in km
 */
export function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth radius in km
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Groups reports into proximity clusters.
 * Reports within `thresholdKm` of each other form a cluster.
 *
 * @param {Array}  reports      - array of report objects with lat/lng
 * @param {number} thresholdKm  - clustering radius in km (default 0.75)
 * @returns {Array} array of clusters (each cluster = array of reports)
 */
export function clusterReports(reports, thresholdKm = 0.75) {
  const visited = new Set();
  const clusters = [];

  reports.forEach((r, i) => {
    if (visited.has(i)) return;
    const cluster = [r];
    visited.add(i);

    reports.forEach((r2, j) => {
      if (visited.has(j)) return;
      if (haversineDistance(r.lat, r.lng, r2.lat, r2.lng) < thresholdKm) {
        cluster.push(r2);
        visited.add(j);
      }
    });
    clusters.push(cluster);
  });

  return clusters;
}

/**
 * Determines risk level of a cluster by report count.
 * @param {number} count
 * @returns {{ level: string, color: string, radius: number }}
 */
export function getRiskLevel(count) {
  if (count >= 3) return { level: "HIGH",   color: "#ff3b4e", radius: 600 };
  if (count === 2) return { level: "MEDIUM", color: "#f5a623", radius: 450 };
  return               { level: "LOW",    color: "#22d3a0", radius: 300 };
}

/**
 * Returns nearest N volunteers sorted by distance from a point.
 * @param {Array}  volunteers
 * @param {number} lat
 * @param {number} lng
 * @param {number} n - number of results
 * @returns {Array}
 */
export function nearestVolunteers(volunteers, lat, lng, n = 3) {
  return volunteers
    .filter((v) => v.status === "available")
    .map((v) => ({
      ...v,
      distKm: haversineDistance(lat, lng, v.lat, v.lng),
    }))
    .sort((a, b) => a.distKm - b.distKm)
    .slice(0, n);
}
