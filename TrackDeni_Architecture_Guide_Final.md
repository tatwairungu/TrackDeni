# 🧱 TrackDeni — Architecture Guide (LLM Assistant Reference)

**Purpose:**  
Guide for assisting in the development of TrackDeni — a mobile-first, offline-capable debt tracker for small vendors in Africa.

**Principles:**  
- 💡 **Simplicity First** — Prioritize maintainable, human-readable code.  
- ⚡ **Performance-Centric** — No bloated libraries, minimal dependencies.  
- 📱 **Mobile-First** — Optimized for low-end Android phones, offline use.  
- 🚫 **No Muddy Code** — Avoid overly complex abstractions or unnecessary indirection.

---

## 🏗️ Tech Stack (MVP)

| Layer         | Technology        | Notes                                 |
|---------------|-------------------|----------------------------------------|
| Frontend      | React + Tailwind  | Component-based, mobile-optimized UI   |
| State Mgmt    | Zustand or Context| Lightweight; avoid Redux               |
| Storage       | `localStorage`    | Offline persistence (v1)               |
| Time Utils    | Day.js            | For due dates and reminders            |
| SMS           | Native SMS intent | Use `sms:` links in MVP                |
| Deployment    | Vercel/Netlify    | Free-tier hosting                      |

---

## 📐 Folder Structure

```
src/
├── components/       # Reusable components
│   ├── CustomerCard.jsx
│   ├── DebtForm.jsx
│   └── Header.jsx
├── pages/            # Page-level views
│   ├── Home.jsx
│   └── AddDebt.jsx
├── store/            # Global state logic (Zustand or Context)
│   └── useDebtStore.js
├── utils/            # Pure utility functions
│   └── dateUtils.js
├── App.jsx
└── main.jsx
```

---

## 🧾 Data Model (v1 - LocalStorage Based)

```json
{
  "customers": [
    {
      "id": "uuid",
      "name": "Jane Doe",
      "phone": "+2547xxxxxxx",
      "debts": [
        {
          "id": "uuid",
          "amount": 500,
          "reason": "Sukari 2kg",
          "dateBorrowed": "2025-07-07",
          "dueDate": "2025-07-14",
          "paid": false,
          "payments": [
            { "amount": 200, "date": "2025-07-10" }
          ]
        }
      ]
    }
  ]
}
```

- All data must be validated before saving.
- Helpers will exist for debt calculation (e.g. total owed, total paid).

---

## 📲 App Flow

1. **Onboarding Flow (First Time Use)**
   - Language selection
   - 3-slide feature intro
   - Sets `hasSeenIntro = true` in localStorage

2. **Home View**
   - Total Owed / Paid summary
   - List of all customers with outstanding debts
   - Quick filter: Due soon / Overdue / Paid

3. **Add Debt Form**
   - Fields: Name, Phone, Amount, Reason, Due Date
   - Save → update localStorage & global state

4. **Customer Detail**
   - Debt history
   - Mark as paid (partial or full)
   - Send reminder via `sms:` link

5. **Optional Login Flow (Firebase Auth)**
   - User can skip login and use offline
   - Login with phone or email
   - Cloud sync via Firestore for Pro users

---

## 🔧 Constraints

- No Redux
- No class components
- No large UI libraries (e.g., Material UI, Bootstrap)
- Only Tailwind for styling
- Focus on minimal re-renders and functional components
- Only add a backend (Firebase) when sync/multi-device is introduced

---

## ✅ LLM Instructions

When generating or editing code, always:
1. Keep logic clean and modular (prefer utils over inline logic).
2. Use descriptive function/component names.
3. Avoid unnecessary abstraction layers.
4. Validate data inputs and handle empty states.
5. Default to accessibility and responsive design.

---

## 🧩 Future Expansion Plan (Post-MVP)

- Firebase Auth + Firestore (Pro tier)
- Africa’s Talking SMS API
- PDF Export (jsPDF / html2pdf)
- Subscription payments (Gumroad, M-Pesa)
- Android wrapper (Trusted Web Activity or Flutter port)

---

**Generated: July 07, 2025**


---

## 💵 M-Pesa Payment Integration (Pro Tier Unlock)

**Use Case:**  
User hits free tier limit (e.g. 5 customers) and is prompted to upgrade to Pro.

### 🔌 Recommended: M-Pesa Daraja API (STK Push)

**Flow:**
1. User taps "Upgrade to Pro"
2. App prompts for phone number
3. Backend (Node.js or Firebase Function) sends STK push request
4. User receives prompt on phone and enters M-Pesa PIN
5. Payment confirmed via callback
6. Pro features unlocked and receipt/token stored

**Tech Required:**
- M-Pesa Paybill/Till number
- Safaricom Developer account
- Backend for authentication, STK push initiation, and callback handling
- Store receipt/token for audit and verification

### 🧪 Alternative (MVP):
- Show Paybill + instructions
- User sends payment manually and enters M-Pesa code
- Admin or auto-verify before unlocking Pro

---

## 🚀 Scalability Design Notes

TrackDeni is expected to scale to 1,000,000+ users. To support this:

### 📐 Design Guidelines
- Keep frontend lightweight and fast-loading (React + Tailwind + Code Splitting)
- Use Firebase Auth + Firestore with:
  - Document-level access rules
  - Paginated reads
  - Batched writes
- Store only critical Pro data in cloud (rest in IndexedDB/localStorage)
- Modularize UI components to support feature flags (A/B testing or region-based rollouts)

### 🧱 Backend Resilience
- Use Firebase Functions with concurrency scaling
- Add caching layer (e.g., Firestore cache / Redis)
- Queue operations (e.g., SMS sending) with retries

### 🛡️ Protection & Abuse Prevention
- Enforce rate limiting on API endpoints
- Detect abuse: frequent reminders or fake signups
- Validate phone numbers via OTP (future)



---

## 🔐 Hybrid Login Model (Free Tier vs Pro Tier)

To balance ease of access and scalability, TrackDeni uses a hybrid login model:

### 🟢 Free Tier (No Login Required)
- User can immediately start using the app without logging in
- All data is saved locally in `localStorage` or `IndexedDB`
- Can:
  - Add up to 5 customers
  - Use manual SMS reminders
  - See debt summaries
- Data is lost if the user clears browser data or changes device

### 🔒 Pro Tier (Login Required)
- Prompted when:
  - User tries to add a 6th customer
  - User tries to export data or use SMS bundles
  - User wants to backup/sync data
- Requires login via **Firebase Auth** (phone number or email)
- Enables:
  - Unlimited customer tracking
  - SMS bundles and auto-reminders
  - Sync across devices using Firestore
  - M-Pesa payment tracking

### 🔁 Login Prompt UX
- Friendly, non-intrusive dialog:  
  _"Track more customers and protect your data — sign up for free to unlock more features."_
- Include benefits and social proof where possible

### 🧠 Why This Works
- Keeps barrier to entry low for informal vendors
- Natural upgrade path tied to real value
- Aligns with monetization (Pro features tied to identity + cloud access)
