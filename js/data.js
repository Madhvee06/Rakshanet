/**
 * data.js — RakshaNet Sample Data & Firebase Simulation
 *
 * In production, all this data would live in Firebase Firestore.
 * Here we simulate it with in-memory objects and functions.
 *
 * Firebase collections (production):
 *   - incidents/   : geo-tagged disaster reports
 *   - sos_users/   : users who triggered SOS
 *   - users/       : community status (safe/help/missing)
 *   - volunteers/  : registered volunteers with skills
 *   - alerts/      : system-generated alert history
 */

// ── Disaster type metadata ──────────────────────────────────
const DISASTER_TYPES = {
  flood:          { icon: '🌊', color: '#3b82f6', label: 'Flood' },
  fire:           { icon: '🔥', color: '#ef4444', label: 'Fire' },
  earthquake:     { icon: '🏚️', color: '#f97316', label: 'Earthquake' },
  infrastructure: { icon: '🏗️', color: '#f59e0b', label: 'Infrastructure' },
  medical:        { icon: '🏥', color: '#ec4899', label: 'Medical Emergency' },
  gas_leak:       { icon: '💨', color: '#a78bfa', label: 'Gas Leak' },
  landslide:      { icon: '⛰️', color: '#78716c', label: 'Landslide' },
};

// ── Seed incidents (Mumbai area) ────────────────────────────
// Lat/Lng clustered around Mumbai to simulate hyper-local zones
const SEED_INCIDENTS = [
  {
    id: 'inc_001',
    type: 'flood',
    description: 'Waterlogging on SV Road near Andheri station underpass. Vehicle movement stopped.',
    lat: 19.1197, lng: 72.8464,
    timestamp: Date.now() - 1200000, // 20 min ago
    reportedBy: 'Rahul M.',
  },
  {
    id: 'inc_002',
    type: 'flood',
    description: 'Kurla East flooded, knee-deep water near BKC connector.',
    lat: 19.0760, lng: 72.8777,
    timestamp: Date.now() - 900000,
    reportedBy: 'Priya S.',
  },
  {
    id: 'inc_003',
    type: 'flood',
    description: 'Dadar TT underpass submerged. Diversion required.',
    lat: 19.0186, lng: 72.8426,
    timestamp: Date.now() - 600000,
    reportedBy: 'Suresh P.',
  },
  {
    id: 'inc_004',
    type: 'fire',
    description: 'Small fire reported in textile market, Dharavi. Fire brigade alerted.',
    lat: 19.0430, lng: 72.8555,
    timestamp: Date.now() - 300000,
    reportedBy: 'Ayesha K.',
  },
  {
    id: 'inc_005',
    type: 'infrastructure',
    description: 'Road cave-in on Eastern Express Highway near Ghatkopar.',
    lat: 19.0822, lng: 72.9081,
    timestamp: Date.now() - 1800000,
    reportedBy: 'Ravi T.',
  },
  {
    id: 'inc_006',
    type: 'medical',
    description: 'Elderly person collapsed at CST station concourse. Requires immediate help.',
    lat: 18.9400, lng: 72.8351,
    timestamp: Date.now() - 450000,
    reportedBy: 'Neha G.',
  },
  {
    id: 'inc_007',
    type: 'gas_leak',
    description: 'Strong gas smell near Chembur CNG station. Area evacuated.',
    lat: 19.0522, lng: 72.9005,
    timestamp: Date.now() - 720000,
    reportedBy: 'Vikram L.',
  },
  {
    id: 'inc_008',
    type: 'flood',
    description: 'Ghatkopar metro station exit 2 waterlogged. Commuters stranded.',
    lat: 19.0866, lng: 72.9076,
    timestamp: Date.now() - 480000,
    reportedBy: 'Meera D.',
  },
];

// ── Seed SOS Users ──────────────────────────────────────────
const SEED_SOS_USERS = [
  {
    id: 'sos_001',
    name: 'Anonymous User',
    lat: 19.1150, lng: 72.8500,
    timestamp: Date.now() - 600000,
    message: 'Trapped on second floor, flooding below.',
  },
  {
    id: 'sos_002',
    name: 'Farida H.',
    lat: 19.0790, lng: 72.8760,
    timestamp: Date.now() - 300000,
    message: 'Car stalled in flood water. Need tow.',
  },
];

// ── Seed Community Users (status) ───────────────────────────
const SEED_COMMUNITY = [
  { id: 'usr_001', name: 'Arjun N.',  status: 'safe',    avatar: '👨', lat: 19.100, lng: 72.850 },
  { id: 'usr_002', name: 'Kavita R.', status: 'safe',    avatar: '👩', lat: 19.060, lng: 72.880 },
  { id: 'usr_003', name: 'Rahul M.',  status: 'help',    avatar: '👦', lat: 19.120, lng: 72.846 },
  { id: 'usr_004', name: 'Priya S.',  status: 'safe',    avatar: '👧', lat: 19.076, lng: 72.877 },
  { id: 'usr_005', name: 'Omkar J.',  status: 'missing', avatar: '🧑', lat: 19.085, lng: 72.905 },
];

// ── Seed Volunteers ─────────────────────────────────────────
const SEED_VOLUNTEERS = [
  { id: 'vol_001', name: 'Dr. Sangeeta Iyer', skills: ['doctor','firstaid'], lat: 19.108, lng: 72.855, available: true },
  { id: 'vol_002', name: 'Kiran Patil',       skills: ['driver','helper'],   lat: 19.072, lng: 72.881, available: true },
  { id: 'vol_003', name: 'Rohit Sharma',      skills: ['engineer','helper'], lat: 19.051, lng: 72.902, available: true },
  { id: 'vol_004', name: 'Fatima Shaikh',     skills: ['firstaid','translator'], lat: 19.040, lng: 72.856, available: false },
  { id: 'vol_005', name: 'Anand Kumar',       skills: ['driver'],            lat: 19.091, lng: 72.911, available: true },
];

// ── Risk Zone computation ────────────────────────────────────
/**
 * computeRiskZones()
 *
 * PREDICTION LOGIC:
 * 1. Group incidents within 1km radius clusters
 * 2. Cluster with 3+ incidents → HIGH RISK (Red)
 * 3. Cluster with 2  incidents → MEDIUM RISK (Yellow)
 * 4. All other areas           → SAFE (Green)
 *
 * This is simple, explainable logic — no AI/ML required.
 */
function computeRiskZones(incidents) {
  const zones = [];
  const processed = new Set();

  incidents.forEach((inc, i) => {
    if (processed.has(inc.id)) return;

    // Find nearby incidents within ~1km
    const nearby = incidents.filter((other, j) => {
      if (other.id === inc.id) return false;
      const dist = haversineDistance(inc.lat, inc.lng, other.lat, other.lng);
      return dist < 1.2; // km
    });

    const clusterCount = nearby.length + 1;
    nearby.forEach(n => processed.add(n.id));
    processed.add(inc.id);

    let risk, color, label;
    if (clusterCount >= 3) {
      risk = 'high';
      color = '#ef4444';
      label = '🔴 HIGH RISK ZONE';
    } else if (clusterCount === 2) {
      risk = 'medium';
      color = '#f59e0b';
      label = '🟡 MEDIUM RISK ZONE';
    } else {
      risk = 'low';
      color = '#22c55e';
      label = '🟢 SAFE ZONE';
    }

    // Zone center = centroid of cluster
    const allPts = [inc, ...nearby];
    const centerLat = allPts.reduce((s, p) => s + p.lat, 0) / allPts.length;
    const centerLng = allPts.reduce((s, p) => s + p.lng, 0) / allPts.length;

    zones.push({
      id: `zone_${i}`,
      lat: centerLat,
      lng: centerLng,
      risk,
      color,
      label,
      incidentCount: clusterCount,
      radius: 600 + clusterCount * 150, // meters
    });
  });

  return zones;
}

/**
 * haversineDistance(lat1, lng1, lat2, lng2)
 * Returns distance in kilometers between two coordinates.
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 +
            Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
            Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// ── Firebase Simulation Layer ────────────────────────────────
/**
 * In production, replace these functions with Firebase SDK calls:
 *
 * import { initializeApp } from "firebase/app";
 * import { getFirestore, collection, addDoc, onSnapshot } from "firebase/firestore";
 *
 * const app = initializeApp(firebaseConfig);
 * const db = getFirestore(app);
 */
const DB = {
  incidents:  [...SEED_INCIDENTS],
  sosUsers:   [...SEED_SOS_USERS],
  community:  [...SEED_COMMUNITY],
  volunteers: [...SEED_VOLUNTEERS],
  alerts:     [],

  // Simulate Firestore addDoc
  addIncident(data) {
    const doc = { ...data, id: 'inc_' + Date.now() };
    this.incidents.push(doc);
    return Promise.resolve(doc);
  },

  addSOSUser(data) {
    const doc = { ...data, id: 'sos_' + Date.now() };
    this.sosUsers.push(doc);
    return Promise.resolve(doc);
  },

  removeSOSUser(id) {
    this.sosUsers = this.sosUsers.filter(u => u.id !== id);
    return Promise.resolve();
  },

  updateUserStatus(id, status) {
    const user = this.community.find(u => u.id === id);
    if (user) user.status = status;
    return Promise.resolve();
  },

  addVolunteer(data) {
    const doc = { ...data, id: 'vol_' + Date.now() };
    this.volunteers.push(doc);
    return Promise.resolve(doc);
  },

  addAlert(data) {
    const doc = { ...data, id: 'alert_' + Date.now(), timestamp: Date.now() };
    this.alerts.unshift(doc);
    if (this.alerts.length > 20) this.alerts.pop();
    return Promise.resolve(doc);
  },
};

// ── Timestamp formatter ──────────────────────────────────────
function timeAgo(ts) {
  const diff = Date.now() - ts;
  if (diff < 60000)  return 'Just now';
  if (diff < 3600000) return Math.floor(diff / 60000) + ' min ago';
  if (diff < 86400000) return Math.floor(diff / 3600000) + ' hr ago';
  return Math.floor(diff / 86400000) + ' day(s) ago';
}

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}
