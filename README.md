# 🛡️ RakshaNet – React + Vite + Firebase

## 📁 Folder Structure
```
rakshanet/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx                    ← Entry point
    ├── App.jsx                     ← Root component
    ├── App.module.css
    ├── firebase.js                 ← Firebase init (app, db, auth)
    ├── context/
    │   └── AppContext.jsx          ← Global state (useReducer)
    ├── hooks/
    │   └── useFirestore.js         ← Firebase hooks
    ├── utils/
    │   └── helpers.js              ← Haversine, clustering
    ├── styles/
    │   └── global.css              ← CSS variables + shared styles
    └── components/
        ├── Navbar.jsx / .module.css
        ├── Dashboard.jsx / .module.css
        ├── LeftPanel.jsx / .module.css
        ├── MapView.jsx / .module.css
        ├── MapControls.jsx / .module.css
        ├── RightPanel.jsx / .module.css
        ├── ReportForm.jsx / .module.css
        ├── SOSModal.jsx / .module.css
        ├── AuthModal.jsx / .module.css
        ├── AlertToast.jsx / .module.css
        └── LoadingScreen.jsx / .module.css
```

## ⚡ Quick Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Start dev server
```bash
npm run dev
# Open http://localhost:5173
```

### 3. Enable Firebase (optional for demo)
- Go to Firebase Console → project rakshanet-2c629
- Enable Firestore Database (test mode)
- Enable Authentication → Email/Password
- firebase.js is already configured

### 4. Build for production
```bash
npm run build
npm run preview
```

---

## 🔥 firebase.js
Already configured with your credentials. Exports: `app`, `db`, `auth`

---

## 📚 Firebase Usage Examples

### Save to Firestore
```jsx
import { useAddDocument } from "./hooks/useFirestore";

const { addDocument, loading } = useAddDocument("reports");
await addDocument({ type: "flood", desc: "Waterlogging", lat: 19.07, lng: 72.88 });
```

### Read from Firestore (real-time)
```jsx
import { useCollection } from "./hooks/useFirestore";

const { documents, loading } = useCollection("reports");
// documents = live array, auto-updates on any change
```

### Sign Up
```jsx
import { useSignUp } from "./hooks/useFirestore";

const { signUp } = useSignUp();
const user = await signUp("email@test.com", "password123", "Rahul Kumar");
```

### Sign In
```jsx
import { useSignIn } from "./hooks/useFirestore";

const { signIn } = useSignIn();
const user = await signIn("email@test.com", "password123");
```

### Track Current User
```jsx
import { useCurrentUser } from "./hooks/useFirestore";

const { user, loading } = useCurrentUser();
// user = Firebase user object, or null if logged out
```

### Update a Document
```jsx
import { useUpdateDocument } from "./hooks/useFirestore";

const { updateDocument } = useUpdateDocument("volunteers");
await updateDocument("docId123", { status: "busy" });
```

---

## 🧠 Disaster Prediction Logic
```
Reports within 0.75km → cluster together

Cluster size:
  ≥ 3  →  HIGH RISK   (red circle,    600m)
  = 2  →  MEDIUM RISK (yellow circle, 450m)
  = 1  →  LOW RISK    (green dashed,  300m)
```
Pure Haversine geometry — no ML needed.

---

## 🗺️ Firestore Collections

| Collection   | Key Fields                                        |
|--------------|---------------------------------------------------|
| reports      | type, desc, lat, lng, severity, time, user        |
| sos_users    | name, lat, lng, time, status                      |
| volunteers   | name, skill, lat, lng, status                     |
| alerts       | type, icon, title, msg, time                      |

---

## 🧩 Component Quick Reference

| Component         | Purpose                                           |
|-------------------|---------------------------------------------------|
| App.jsx           | Root: loading → layout → modals                   |
| AppContext.jsx     | All global state + dispatch actions               |
| Navbar.jsx        | Logo, status selector, connectivity badge         |
| Dashboard.jsx     | 3-column grid (left + map + right)                |
| LeftPanel.jsx     | Tabs: incidents, SOS, alert history               |
| MapView.jsx       | Leaflet map, markers, risk zones                  |
| MapControls.jsx   | SOS button, Report button, zone stats             |
| RightPanel.jsx    | Volunteer list + register form + SMS notice       |
| ReportForm.jsx    | Incident modal → saves to Firestore               |
| SOSModal.jsx      | SOS confirm + volunteer match + cancel            |
| AuthModal.jsx     | Firebase email login / signup                     |
| AlertToast.jsx    | Auto-dismiss global notification                  |
| LoadingScreen.jsx | Startup animation with progress bar               |
| useFirestore.js   | All Firebase hooks (add, read, update, auth)      |
| helpers.js        | Haversine, clustering, risk level, utilities      |

---

## 🛠️ Scripts

```bash
npm run dev      # Dev server → localhost:5173
npm run build    # Production build → /dist
npm run preview  # Preview production build
```

---

## 🚀 Production Checklist
- [ ] Update Firestore security rules
- [ ] Move Firebase config to .env variables
- [ ] Enable Firebase App Check
- [ ] Set up Firebase Hosting: firebase deploy
- [ ] Add PWA / service worker for offline
- [ ] Integrate Twilio for real SMS alerts
