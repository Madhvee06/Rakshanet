/**
 * app.js — RakshaNet Application Logic
 *
 * Handles all UI interactions, state management, and
 * coordinates between data layer and map layer.
 */

// ── App State ────────────────────────────────────────────────
const AppState = {
  currentUser: null,         // Logged-in user (simulated)
  myLat: 19.0760,            // Default: Mumbai center
  myLng: 72.8777,
  myStatus: 'safe',
  sosActive: false,
  offlineMode: false,
  mySosId: null,             // Track current SOS entry
  alertHistory: [],
};

// ── Boot ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initMap();
  renderSidebars();
  startSimulation();
  tryGetUserLocation();
  updateStats();
});

// ── Get User Location ────────────────────────────────────────
function tryGetUserLocation() {
  if (!navigator.geolocation) return;

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      AppState.myLat = pos.coords.latitude;
      AppState.myLng = pos.coords.longitude;
      showMyLocationOnMap(AppState.myLat, AppState.myLng);
      checkAndShowProximityAlert(AppState.myLat, AppState.myLng);
    },
    () => {
      // Fallback to Mumbai — silently continue
      showMyLocationOnMap(AppState.myLat, AppState.myLng, 'Default Location (Mumbai)');
    }
  );
}

function useMyLocation() {
  selectedLat = AppState.myLat.toFixed(5);
  selectedLng = AppState.myLng.toFixed(5);
  document.getElementById('coordDisplay').textContent =
    `${selectedLat}, ${selectedLng}`;
  showMyLocationOnMap(AppState.myLat, AppState.myLng);
  showToast('Using your current location', 'info');
}

// ── SOS System ───────────────────────────────────────────────
function triggerSOS() {
  const btn = document.getElementById('sosBtn');

  if (AppState.sosActive) {
    // Cancel SOS
    AppState.sosActive = false;
    btn.classList.remove('active');
    if (AppState.mySosId) {
      DB.removeSOSUser(AppState.mySosId);
      AppState.mySosId = null;
    }
    renderSOSUsers();
    showToast('SOS cancelled. Stay safe!', 'success');
    updateTicker('SOS cancelled by user.');
    return;
  }

  // Activate SOS
  AppState.sosActive = true;
  btn.classList.add('active');

  const sosData = {
    name: AppState.currentUser?.name || 'Anonymous User',
    lat: AppState.myLat,
    lng: AppState.myLng,
    timestamp: Date.now(),
    message: 'EMERGENCY — needs immediate assistance',
  };

  DB.addSOSUser(sosData).then(doc => {
    AppState.mySosId = doc.id;
    renderSOSUsers();
    setUserStatus('help');

    // Add alert to history
    DB.addAlert({
      type: 'sos',
      title: '🆘 SOS Activated',
      message: `${sosData.name} triggered SOS at (${AppState.myLat.toFixed(3)}, ${AppState.myLng.toFixed(3)})`,
      severity: 'high',
    });

    renderAlerts();
    showAlertPopup('🆘 SOS Sent!', 'Your emergency signal has been broadcast. Help is being notified.');
    showToast('SOS sent! Emergency signal broadcast.', 'error');
    updateTicker(`🚨 SOS ACTIVE — ${sosData.name} needs help near your area`);
    updateStats();

    // If offline: show SMS modal too
    if (AppState.offlineMode) {
      document.getElementById('smsLocation').textContent =
        `${AppState.myLat.toFixed(4)}, ${AppState.myLng.toFixed(4)}`;
      document.getElementById('smsTime').textContent = formatTime(Date.now());
      openModal('smsModal');
    }
  });
}

// ── Submit Incident Report ───────────────────────────────────
function submitIncident() {
  const type = document.getElementById('incidentType').value;
  const desc = document.getElementById('incidentDesc').value.trim();

  if (!desc) {
    showToast('Please add a description', 'warning');
    return;
  }

  if (!selectedLat || !selectedLng) {
    showToast('Please pin a location on the map or use your location', 'warning');
    return;
  }

  const incident = {
    type,
    description: desc,
    lat: parseFloat(selectedLat),
    lng: parseFloat(selectedLng),
    timestamp: Date.now(),
    reportedBy: AppState.currentUser?.name || 'You',
  };

  DB.addIncident(incident).then(() => {
    // Clear form
    document.getElementById('incidentDesc').value = '';
    document.getElementById('coordDisplay').textContent = 'Click map to pin location';
    selectedLat = null;
    selectedLng = null;
    if (markers.pinned) { map.removeLayer(markers.pinned); markers.pinned = null; }

    // Re-render everything
    renderAll();
    renderSidebars();
    updateStats();

    const dtype = DISASTER_TYPES[type];
    showToast(`${dtype.icon} Incident reported successfully!`, 'success');

    // Check if new incident creates a risk zone
    const zones = computeRiskZones(DB.incidents);
    const nearbyZone = zones.find(z => {
      const dist = haversineDistance(incident.lat, incident.lng, z.lat, z.lng);
      return dist < 1.5;
    });

    if (nearbyZone && nearbyZone.risk === 'high') {
      DB.addAlert({
        type: 'risk_zone',
        title: '🔴 High Risk Zone Detected',
        message: `Multiple incidents near (${incident.lat.toFixed(3)}, ${incident.lng.toFixed(3)}). Area marked HIGH RISK.`,
        severity: 'high',
      });
      renderAlerts();
      showAlertPopup(
        '🔴 High Risk Zone Created',
        'Multiple incidents detected nearby. The area has been marked as HIGH RISK.'
      );
      updateTicker('⚠️ New HIGH RISK zone detected after latest incident report');
    }

    // Fly to incident
    flyTo(incident.lat, incident.lng);
    updateStats();
  });
}

// ── User Status ──────────────────────────────────────────────
function setUserStatus(status) {
  AppState.myStatus = status;

  // Update button states
  document.querySelectorAll('.status-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById('statusSafe').classList.toggle('active', status === 'safe');
  document.getElementById('statusHelp').classList.toggle('active', status === 'help');
  document.getElementById('statusMissing').classList.toggle('active', status === 'missing');

  // Update display
  const statusDot = document.querySelector('.my-status-display .status-dot');
  const statusText = document.getElementById('myStatusText');

  statusDot.className = `status-dot ${status}`;
  statusText.textContent = status === 'safe' ? 'Safe ✅' :
                           status === 'help' ? 'Need Help ⚠️' :
                           'Missing ❌';

  const labels = { safe: 'Safe ✅', help: 'Need Help ⚠️', missing: 'Missing ❌' };
  showToast(`Status updated: ${labels[status]}`, status === 'safe' ? 'success' : 'warning');

  // If this is a known user, update DB
  if (AppState.currentUser) {
    DB.updateUserStatus(AppState.currentUser.id, status);
    renderCommunity();
  }
}

// ── Volunteer Registration ───────────────────────────────────
function registerVolunteer() {
  const name = document.getElementById('volunteerName').value.trim();
  const checkboxes = document.querySelectorAll('.skill-tag input:checked');
  const skills = Array.from(checkboxes).map(cb => cb.value);

  if (!name) { showToast('Please enter your name', 'warning'); return; }
  if (skills.length === 0) { showToast('Please select at least one skill', 'warning'); return; }

  const vol = {
    name,
    skills,
    lat: AppState.myLat + (Math.random() - 0.5) * 0.01,
    lng: AppState.myLng + (Math.random() - 0.5) * 0.01,
    available: true,
  };

  DB.addVolunteer(vol).then(() => {
    document.getElementById('volunteerName').value = '';
    checkboxes.forEach(cb => cb.checked = false);
    renderVolunteers();
    renderVolunteerList();
    updateStats();
    showToast(`🤝 ${name} registered as volunteer!`, 'success');
  });
}

// ── Offline Mode ─────────────────────────────────────────────
function toggleOfflineMode() {
  AppState.offlineMode = !AppState.offlineMode;

  const banner = document.getElementById('offlineBanner');
  const badge  = document.getElementById('connectivityBadge');
  const dot    = badge.querySelector('.conn-dot');
  const text   = document.getElementById('connText');

  if (AppState.offlineMode) {
    banner.classList.remove('hidden');
    dot.className = 'conn-dot offline';
    text.textContent = 'Offline';
    showToast('📵 Offline mode active. SMS fallback enabled.', 'warning');
  } else {
    banner.classList.add('hidden');
    dot.className = 'conn-dot online';
    text.textContent = 'Online';
    showToast('📶 Back online. Syncing data...', 'success');
  }
}

function simulateSMS() {
  document.getElementById('smsLocation').textContent =
    `${AppState.myLat.toFixed(4)}, ${AppState.myLng.toFixed(4)}`;
  document.getElementById('smsTime').textContent = formatTime(Date.now());
  openModal('smsModal');
}

// ── Auth Simulation ──────────────────────────────────────────
function simulateLogin() {
  const name  = document.getElementById('loginName').value.trim();
  const phone = document.getElementById('loginPhone').value.trim();

  if (!name) { showToast('Please enter your name', 'warning'); return; }

  AppState.currentUser = {
    id: 'usr_me',
    name,
    phone,
    status: 'safe',
  };

  document.getElementById('authBtn').textContent = `👤 ${name}`;

  // Add to community
  DB.community.unshift({
    id: 'usr_me',
    name,
    status: 'safe',
    avatar: '👤',
    lat: AppState.myLat,
    lng: AppState.myLng,
  });

  closeModal('authModal');
  renderCommunity();
  showToast(`Welcome, ${name}! You're now logged in.`, 'success');
}

// ── Proximity Alert Check ────────────────────────────────────
function checkAndShowProximityAlert(lat, lng) {
  const zone = checkProximityAlerts(lat, lng);
  if (zone) {
    const msg = zone.risk === 'high'
      ? `You are near a HIGH RISK zone with ${zone.incidentCount} reported incidents. Take precautions immediately!`
      : `You are near a MEDIUM RISK zone. Stay alert and monitor updates.`;

    showAlertPopup(zone.label, msg);

    DB.addAlert({
      type: 'proximity',
      title: zone.label,
      message: msg,
      severity: zone.risk,
    });
    renderAlerts();
  }
}

// ── Simulation: auto-add incidents for demo ──────────────────
function startSimulation() {
  // Every 25 seconds, add a simulated new incident
  let simCount = 0;
  const simIncidents = [
    { type: 'flood', description: 'New waterlogging report near Western Express Highway', lat: 19.094, lng: 72.862 },
    { type: 'medical', description: 'Medical emergency at Bandra Kurla Complex', lat: 19.066, lng: 72.870 },
    { type: 'fire', description: 'Small fire in slum pocket near Govandi', lat: 19.058, lng: 72.920 },
  ];

  setInterval(() => {
    if (simCount >= simIncidents.length) return;
    const sim = { ...simIncidents[simCount], timestamp: Date.now(), reportedBy: 'System Sensor' };
    DB.addIncident(sim);
    renderAll();
    renderSidebars();
    updateStats();

    const dtype = DISASTER_TYPES[sim.type];
    showToast(`🤖 New report: ${dtype.icon} ${dtype.label} detected`, 'warning');
    updateTicker(`New ${dtype.label} incident auto-detected by sensors`);
    simCount++;
  }, 25000);
}

// ── Render Right Sidebar ─────────────────────────────────────
function renderSidebars() {
  renderAlerts();
  renderIncidentList();
  renderCommunity();
  renderVolunteerList();
}

function renderAlerts() {
  const container = document.getElementById('alertsList');
  const countBadge = document.getElementById('alertCount');

  if (DB.alerts.length === 0) {
    container.innerHTML = '<div class="empty-state">No active alerts</div>';
    countBadge.textContent = '0';
    return;
  }

  countBadge.textContent = DB.alerts.length;
  container.innerHTML = DB.alerts.map(alert => `
    <div class="alert-item ${alert.severity === 'high' ? '' : 'medium'}">
      <span class="alert-item-icon">${alert.severity === 'high' ? '🔴' : '🟡'}</span>
      <div class="alert-item-body">
        <div class="alert-item-title">${alert.title}</div>
        <div class="alert-item-meta">${alert.message}</div>
        <div class="alert-item-meta">${timeAgo(alert.timestamp)}</div>
      </div>
    </div>
  `).join('');
}

function renderIncidentList() {
  const container = document.getElementById('incidentsList');
  const sorted = [...DB.incidents].sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);

  container.innerHTML = sorted.map(inc => {
    const dtype = DISASTER_TYPES[inc.type] || { icon: '⚠️', label: inc.type };
    return `
      <div class="incident-item" onclick="flyTo(${inc.lat}, ${inc.lng})">
        <span class="incident-item-icon">${dtype.icon}</span>
        <div class="incident-item-body">
          <div class="incident-item-type">${dtype.label}</div>
          <div class="incident-item-desc">${inc.description}</div>
          <div class="incident-item-time">${timeAgo(inc.timestamp)} · ${inc.reportedBy || 'Anonymous'}</div>
        </div>
      </div>
    `;
  }).join('');
}

function renderCommunity() {
  const container = document.getElementById('communityList');
  if (DB.community.length === 0) {
    container.innerHTML = '<div class="empty-state">No users reported</div>';
    return;
  }
  container.innerHTML = DB.community.map(user => `
    <div class="community-item">
      <div class="community-avatar">${user.avatar || '👤'}</div>
      <span class="community-name">${user.name}</span>
      <span class="community-status ${user.status}">${
        user.status === 'safe'    ? '✅ Safe' :
        user.status === 'help'    ? '⚠️ Help' :
        '❌ Missing'
      }</span>
    </div>
  `).join('');
}

function renderVolunteerList() {
  const container = document.getElementById('volunteerList');
  const skillIcons = {
    doctor: '🩺', driver: '🚗', engineer: '🔧',
    firstaid: '🩹', helper: '🙋', translator: '🗣️'
  };

  const available = DB.volunteers.filter(v => v.available);
  if (available.length === 0) {
    container.innerHTML = '<div class="empty-state">No volunteers available</div>';
    return;
  }

  container.innerHTML = available.map(vol => `
    <div class="volunteer-item">
      <span class="volunteer-item-icon">🤝</span>
      <div>
        <div class="volunteer-item-name">${vol.name}</div>
        <div class="volunteer-item-skills">
          ${vol.skills.map(s => `
            <span class="volunteer-skill-tag">${skillIcons[s] || s} ${s}</span>
          `).join('')}
        </div>
      </div>
    </div>
  `).join('');
}

// ── Stats Update ─────────────────────────────────────────────
function updateStats() {
  document.getElementById('statIncidents').textContent = DB.incidents.length;
  document.getElementById('statSOS').textContent = DB.sosUsers.length;
  document.getElementById('statVolunteers').textContent =
    DB.volunteers.filter(v => v.available).length;

  const zones = computeRiskZones(DB.incidents);
  document.getElementById('statHighRisk').textContent =
    zones.filter(z => z.risk === 'high').length;
}

// ── Ticker Update ────────────────────────────────────────────
function updateTicker(msg) {
  document.getElementById('tickerText').textContent = msg;
}

// ── Alert Popup ──────────────────────────────────────────────
function showAlertPopup(title, msg) {
  document.getElementById('alertPopupTitle').textContent = title;
  document.getElementById('alertPopupMsg').textContent = msg;
  document.getElementById('alertPopup').classList.remove('hidden');

  setTimeout(closeAlertPopup, 6000);
}

function closeAlertPopup() {
  document.getElementById('alertPopup').classList.add('hidden');
}

// ── Toast Notification ───────────────────────────────────────
function showToast(msg, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ── Modal Helpers ────────────────────────────────────────────
function openModal(id) {
  document.getElementById(id).classList.remove('hidden');
}

function closeModal(id, event) {
  if (event && event.target !== document.getElementById(id)) return;
  document.getElementById(id).classList.add('hidden');
}
