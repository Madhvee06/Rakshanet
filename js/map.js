/**
 * map.js — RakshaNet Map Module (Leaflet)
 *
 * Handles all map interactions:
 *  - Map initialization with dark tile layer
 *  - Incident markers (colored by type)
 *  - SOS markers (pulsing red)
 *  - Risk zone circles (red/yellow/green)
 *  - Volunteer markers (teal)
 *  - Click-to-pin location for incident reporting
 *
 * NOTE: In production, swap Leaflet for Google Maps JavaScript API:
 *   <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_KEY&callback=initMap">
 *   Then replace L.map() with new google.maps.Map() etc.
 *   The logic remains identical — only the rendering API changes.
 */

let map;
let markers = {
  incidents:  [],
  sos:        [],
  volunteers: [],
  zones:      [],
  my:         null,
  pinned:     null,
};

let layerVisible = {
  incidents:  true,
  sos:        true,
  volunteers: true,
  zones:      true,
};

// Selected pin location for incident reporting
let selectedLat = null;
let selectedLng = null;

// ── Initialize Map ──────────────────────────────────────────
function initMap() {
  // Center on Mumbai
  map = L.map('map', {
    center: [19.076, 72.877],
    zoom: 12,
    zoomControl: false,
  });

  // OpenStreetMap tiles (free, no API key) — dark filtered via CSS
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 18,
  }).addTo(map);

  // Custom zoom control position
  L.control.zoom({ position: 'bottomright' }).addTo(map);

  // Click handler: pin location for reporting
  map.on('click', (e) => {
    const { lat, lng } = e.latlng;
    selectedLat = lat.toFixed(5);
    selectedLng = lng.toFixed(5);
    document.getElementById('coordDisplay').textContent = `${selectedLat}, ${selectedLng}`;

    // Place/move pin marker
    if (markers.pinned) map.removeLayer(markers.pinned);
    markers.pinned = L.marker([lat, lng], {
      icon: createIcon('📌', 20),
    }).addTo(map);

    showToast('Location pinned on map', 'info');
  });

  // Initial render
  renderAll();
}

// ── Master Render ────────────────────────────────────────────
function renderAll() {
  renderIncidents();
  renderSOSUsers();
  renderVolunteers();
  renderRiskZones();
}

// ── Risk Zone Circles ────────────────────────────────────────
function renderRiskZones() {
  // Clear existing zones
  markers.zones.forEach(z => map.removeLayer(z));
  markers.zones = [];

  if (!layerVisible.zones) return;

  const zones = computeRiskZones(DB.incidents);

  zones.forEach(zone => {
    const circle = L.circle([zone.lat, zone.lng], {
      radius: zone.radius,
      color: zone.color,
      fillColor: zone.color,
      fillOpacity: 0.12,
      weight: 2,
      opacity: 0.6,
      dashArray: zone.risk === 'high' ? null : '6,6',
    }).addTo(map);

    circle.bindPopup(`
      <div class="popup-content">
        <strong>${zone.label}</strong>
        <p>${zone.incidentCount} incident(s) reported in this area</p>
        <br/>
        <span class="popup-tag ${zone.risk === 'high' ? 'red' : zone.risk === 'medium' ? 'yellow' : 'green'}">
          ${zone.risk.toUpperCase()} RISK
        </span>
      </div>
    `);

    markers.zones.push(circle);
  });

  // Update stat counter
  const high = zones.filter(z => z.risk === 'high').length;
  document.getElementById('statHighRisk').textContent = high;
}

// ── Incident Markers ─────────────────────────────────────────
function renderIncidents() {
  markers.incidents.forEach(m => map.removeLayer(m));
  markers.incidents = [];

  if (!layerVisible.incidents) return;

  DB.incidents.forEach(inc => {
    const dtype = DISASTER_TYPES[inc.type] || { icon: '⚠️', color: '#94a3b8', label: inc.type };

    const marker = L.marker([inc.lat, inc.lng], {
      icon: createIcon(dtype.icon, 24, dtype.color),
    }).addTo(map);

    marker.bindPopup(`
      <div class="popup-content">
        <strong>${dtype.icon} ${dtype.label}</strong>
        <p>${inc.description}</p>
        <p style="margin-top:4px">Reported by: <em>${inc.reportedBy || 'Anonymous'}</em></p>
        <small>${timeAgo(inc.timestamp)}</small><br/>
        <span class="popup-tag blue">INCIDENT</span>
      </div>
    `);

    markers.incidents.push(marker);
  });

  document.getElementById('statIncidents').textContent = DB.incidents.length;
}

// ── SOS Markers ──────────────────────────────────────────────
function renderSOSUsers() {
  markers.sos.forEach(m => map.removeLayer(m));
  markers.sos = [];

  if (!layerVisible.sos) return;

  DB.sosUsers.forEach(user => {
    // Pulsing red circle for SOS
    const circle = L.circleMarker([user.lat, user.lng], {
      radius: 12,
      color: '#ef4444',
      fillColor: '#ef4444',
      fillOpacity: 0.8,
      weight: 3,
    }).addTo(map);

    circle.bindPopup(`
      <div class="popup-content">
        <strong>🆘 SOS — ${user.name}</strong>
        <p>${user.message || 'Needs immediate assistance'}</p>
        <small>${timeAgo(user.timestamp)}</small><br/>
        <span class="popup-tag red">EMERGENCY</span>
      </div>
    `);

    // Outer pulsing ring
    const ring = L.circleMarker([user.lat, user.lng], {
      radius: 20,
      color: '#ef4444',
      fillColor: 'transparent',
      weight: 1,
      opacity: 0.4,
    }).addTo(map);

    markers.sos.push(circle, ring);
  });

  document.getElementById('statSOS').textContent = DB.sosUsers.length;
}

// ── Volunteer Markers ────────────────────────────────────────
function renderVolunteers() {
  markers.volunteers.forEach(m => map.removeLayer(m));
  markers.volunteers = [];

  if (!layerVisible.volunteers) return;

  DB.volunteers.forEach(vol => {
    if (!vol.available) return;

    const marker = L.marker([vol.lat, vol.lng], {
      icon: createIcon('🤝', 20, '#22c55e'),
    }).addTo(map);

    const skillIcons = {
      doctor: '🩺', driver: '🚗', engineer: '🔧',
      firstaid: '🩹', helper: '🙋', translator: '🗣️'
    };

    const skillStr = vol.skills.map(s => skillIcons[s] || s).join(' ');

    marker.bindPopup(`
      <div class="popup-content">
        <strong>🤝 ${vol.name}</strong>
        <p>Skills: ${skillStr}</p>
        <small>Available now</small><br/>
        <span class="popup-tag green">VOLUNTEER</span>
      </div>
    `);

    markers.volunteers.push(marker);
  });

  document.getElementById('statVolunteers').textContent =
    DB.volunteers.filter(v => v.available).length;
}

// ── My Location Marker ───────────────────────────────────────
function showMyLocationOnMap(lat, lng, label = 'You are here') {
  if (markers.my) map.removeLayer(markers.my);

  markers.my = L.marker([lat, lng], {
    icon: createIcon('🔵', 22),
  }).addTo(map).bindPopup(`
    <div class="popup-content">
      <strong>📍 ${label}</strong>
      <small>${lat.toFixed(5)}, ${lng.toFixed(5)}</small>
    </div>
  `).openPopup();

  map.setView([lat, lng], 14);
}

// ── Layer Toggle ─────────────────────────────────────────────
function toggleLayer(layerName, btn) {
  layerVisible[layerName] = !layerVisible[layerName];
  btn.classList.toggle('active', layerVisible[layerName]);
  renderAll();
}

// ── Fit to Data ──────────────────────────────────────────────
function fitMapToData() {
  const allPoints = [
    ...DB.incidents.map(i => [i.lat, i.lng]),
    ...DB.sosUsers.map(s => [s.lat, s.lng]),
  ];
  if (allPoints.length > 0) {
    map.fitBounds(allPoints, { padding: [40, 40] });
  }
}

// ── Fly to location ──────────────────────────────────────────
function flyTo(lat, lng, zoom = 15) {
  map.flyTo([lat, lng], zoom, { animate: true, duration: 0.8 });
}

// ── Custom Icon Factory ──────────────────────────────────────
function createIcon(emoji, size = 24, glowColor = null) {
  const glow = glowColor
    ? `filter: drop-shadow(0 0 4px ${glowColor});`
    : '';

  return L.divIcon({
    html: `<div style="font-size:${size}px;${glow}line-height:1;">${emoji}</div>`,
    className: '',
    iconSize:   [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor:[0, -size / 2],
  });
}

// ── Check proximity to risk zones (for alerts) ───────────────
function checkProximityAlerts(userLat, userLng) {
  const zones = computeRiskZones(DB.incidents);
  const nearby = zones.filter(z => {
    const dist = haversineDistance(userLat, userLng, z.lat, z.lng) * 1000; // meters
    return dist < z.radius + 300; // slightly outside zone radius
  });

  if (nearby.length > 0) {
    const worst = nearby.sort((a, b) => (a.risk === 'high' ? -1 : 1))[0];
    return worst;
  }
  return null;
}
