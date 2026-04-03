// ============================================================
// AppContext.jsx – Global State Management
// ============================================================
// Uses React Context + useReducer to share state across all
// components without prop drilling.
// Simulates Firebase data locally for demo; swap with real
// Firestore listeners in production.
// ============================================================

import { createContext, useContext, useReducer } from "react";

// ---- Initial dummy data (pre-loaded for demo) ----
const DUMMY_REPORTS = [
  { id: "r1", type: "flood", desc: "Severe waterlogging, knee-deep water on main road", lat: 19.072, lng: 72.881, severity: "high",   time: "09:14 AM", user: "Priya S." },
  { id: "r2", type: "flood", desc: "Drain overflow near market, traffic halted",          lat: 19.0735,lng: 72.88,  severity: "high",   time: "09:22 AM", user: "Rahul M." },
  { id: "r3", type: "fire",  desc: "Small fire reported near warehouse, spreading",        lat: 19.085, lng: 72.89,  severity: "high",   time: "08:55 AM", user: "Ananya T." },
  { id: "r4", type: "fire",  desc: "Smoke visible from 3rd floor building",                lat: 19.086, lng: 72.891, severity: "medium", time: "09:01 AM", user: "Vikram J." },
  { id: "r5", type: "infra", desc: "Electricity pole fell on road, live wire exposed",     lat: 19.064, lng: 72.875, severity: "high",   time: "08:30 AM", user: "Sunita P." },
  { id: "r6", type: "medical",desc:"Elderly woman collapsed, needs medical help",          lat: 19.078, lng: 72.882, severity: "high",   time: "09:35 AM", user: "Mohan D." },
  { id: "r7", type: "storm", desc: "Strong winds damaging makeshift shelters",             lat: 19.095, lng: 72.865, severity: "medium", time: "08:10 AM", user: "Leela R." },
  { id: "r8", type: "flood", desc: "Street flooding, residents stranded",                  lat: 19.073, lng: 72.8805,severity: "medium", time: "09:40 AM", user: "Kiran V." },
];

const DUMMY_SOS = [
  { id: "s1", name: "Amar Nath",    lat: 19.0695, lng: 72.8835, time: "09:50 AM", status: "help" },
  { id: "s2", name: "Geeta Sharma", lat: 19.0842, lng: 72.8895, time: "09:12 AM", status: "help" },
];

const DUMMY_VOLUNTEERS = [
  { id: "v1", name: "Dr. Kavita Rao", skill: "doctor", lat: 19.08,   lng: 72.883,  status: "available" },
  { id: "v2", name: "Suresh Patel",   skill: "driver", lat: 19.075,  lng: 72.879,  status: "available" },
  { id: "v3", name: "Meena Iyer",     skill: "helper", lat: 19.071,  lng: 72.876,  status: "busy" },
  { id: "v4", name: "Ravi Kumar",     skill: "driver", lat: 19.088,  lng: 72.892,  status: "available" },
  { id: "v5", name: "Dr. Ashok Jain", skill: "doctor", lat: 19.066,  lng: 72.874,  status: "available" },
];

const DUMMY_ALERTS = [
  { id: "a1", type: "danger",  icon: "🔴", title: "HIGH RISK ZONE: Dharavi North",       msg: "3+ flood incidents within 0.5km. Avoid area.",                    time: "09:42 AM" },
  { id: "a2", type: "danger",  icon: "🔥", title: "FIRE ALERT: Kurla Warehouse District", msg: "Multiple fire reports. Emergency services dispatched.",           time: "09:05 AM" },
  { id: "a3", type: "warning", icon: "⚡", title: "INFRASTRUCTURE HAZARD",                msg: "Fallen power line near Sion Bridge. Detour advised.",             time: "08:35 AM" },
  { id: "a4", type: "info",    icon: "💧", title: "FLOOD WATCH ACTIVE",                   msg: "IMD predicts 85mm rainfall in next 3 hours. Monitoring active.", time: "08:00 AM" },
];

// ---- Initial State ----
const initialState = {
  reports:      DUMMY_REPORTS,
  sosUsers:     DUMMY_SOS,
  volunteers:   DUMMY_VOLUNTEERS,
  alerts:       DUMMY_ALERTS,
  userStatus:   "safe",         // safe | help | missing
  sosActive:    false,
  isOnline:     true,
  currentUser:  null,           // Firebase auth user object
  userLocation: { lat: 19.076, lng: 72.8777 }, // Default: Mumbai
  activeTab:    "reports",      // reports | sos | alerts
};

// ---- Action types ----
export const ACTIONS = {
  ADD_REPORT:       "ADD_REPORT",
  TRIGGER_SOS:      "TRIGGER_SOS",
  CANCEL_SOS:       "CANCEL_SOS",
  ADD_VOLUNTEER:    "ADD_VOLUNTEER",
  ADD_ALERT:        "ADD_ALERT",
  SET_USER_STATUS:  "SET_USER_STATUS",
  SET_USER:         "SET_USER",
  TOGGLE_ONLINE:    "TOGGLE_ONLINE",
  SET_LOCATION:     "SET_LOCATION",
  SET_ACTIVE_TAB:   "SET_ACTIVE_TAB",
};

// ---- Reducer ----
function appReducer(state, action) {
  switch (action.type) {

    case ACTIONS.ADD_REPORT:
      return { ...state, reports: [...state.reports, action.payload] };

    case ACTIONS.TRIGGER_SOS: {
      const sosEntry = {
        id:     "sos_me_" + Date.now(),
        name:   state.currentUser?.displayName || "You (Current User)",
        lat:    state.userLocation.lat + (Math.random() - 0.5) * 0.002,
        lng:    state.userLocation.lng + (Math.random() - 0.5) * 0.002,
        time:   new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        status: "help",
      };
      return {
        ...state,
        sosActive: true,
        sosUsers:  [...state.sosUsers, sosEntry],
        userStatus: "help",
      };
    }

    case ACTIONS.CANCEL_SOS:
      return {
        ...state,
        sosActive: false,
        sosUsers:  state.sosUsers.filter(s => !s.id.startsWith("sos_me_")),
        userStatus: "safe",
      };

    case ACTIONS.ADD_VOLUNTEER:
      return { ...state, volunteers: [...state.volunteers, action.payload] };

    case ACTIONS.ADD_ALERT:
      return { ...state, alerts: [...state.alerts, action.payload] };

    case ACTIONS.SET_USER_STATUS:
      return { ...state, userStatus: action.payload };

    case ACTIONS.SET_USER:
      return { ...state, currentUser: action.payload };

    case ACTIONS.TOGGLE_ONLINE:
      return { ...state, isOnline: !state.isOnline };

    case ACTIONS.SET_LOCATION:
      return { ...state, userLocation: action.payload };

    case ACTIONS.SET_ACTIVE_TAB:
      return { ...state, activeTab: action.payload };

    default:
      return state;
  }
}

// ---- Context ----
const AppContext = createContext(null);

// ---- Provider component ----
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

// ---- Custom hook for easy access ----
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used inside <AppProvider>");
  }
  return context;
}
