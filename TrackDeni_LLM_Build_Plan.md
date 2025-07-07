# 🧠 TrackDeni LLM Build Plan (Step-by-Step Guide)

This file outlines how an LLM (or developer with LLM assistance) should build the TrackDeni web app, following the architecture and design system provided.

---

## 🚀 Phase 1: Project Setup & Configuration

### 1.1 Initialize the Project
- Use Vite or CRA to bootstrap a React app
- Install Tailwind CSS
- Add `Inter` font via Google Fonts or npm
- Configure `tailwind.config.js` with custom colors and typography

### 1.2 Set Up Folder Structure

```
src/
├── components/
├── pages/
├── store/
├── utils/
├── App.jsx
└── main.jsx
```

### 1.3 Install Dependencies
- Zustand (or Context API)
- Day.js
- UUID
- Tailwind plugins (forms, typography if needed)

---

## 📱 Phase 2: Core UI & Logic (Offline-First)

### 2.1 Build Base Components
- `Header.jsx`
- `CustomerCard.jsx`
- `DebtForm.jsx`

### 2.2 Set Up Global State
- Create `useDebtStore.js`
- Structure: customers[], debts[], payment history

### 2.3 Implement LocalStorage Persistence
- Sync Zustand state to localStorage
- Load from storage on app init

### 2.4 Build Page Views
- `Home.jsx`: debt overview, filters
- `AddDebt.jsx`: form with validation

### 2.5 Implement Actions
- Mark as paid (partial or full)
- Send SMS using `sms:` links
- Delete/edit customer or debt

---

## 🎬 Phase 3: App Flow & UX

### 3.1 Onboarding
- First-time language + 3-slide intro
- Store `hasSeenIntro` in localStorage

### 3.2 Free Tier Limit Logic
- Block after 5 customers
- Show Pro upgrade prompt

### 3.3 UX Enhancements
- Color badges for debt status
- Toasts and error handling

---

## 🔐 Phase 4: Pro Tier Features

### 4.1 Firebase Setup
- Auth: Phone or email login
- Firestore DB: Sync customers & debts

### 4.2 Login Flow
- Firebase UI modal
- Migrate local data to Firestore post-login

### 4.3 M-Pesa Integration
- Daraja API or manual method
- `/api/stkPush`, `/api/callback`
- Unlock Pro plan on success

---

## 📦 Phase 5: SMS Integration (Optional MVP)

- Manual: `sms:` link
- Pro: Africa’s Talking API
- Limit SMS bundles by plan

---

## 🚀 Phase 6: PWA & Deployment

### 6.1 Progressive Web App
- manifest.json
- Service worker (Vite PWA plugin)
- “Add to Home Screen” prompt

### 6.2 Deploy
- Deploy to Vercel or Netlify
- Custom domain (e.g. trackdeni.com)
- Mobile device testing

---

## 📊 Phase 7: Post-MVP Enhancements

- PDF Export
- IndexedDB backup
- Analytics dashboard
- Referral bonuses
- Android wrapper (TWA)

---

## 🔒 LLM Guardrails

- ✅ Clean, modular, functional code
- ✅ Tailwind only for styling
- ✅ Validate all form data
- ✅ Minimize dependencies
- ✅ Mobile-first and offline-friendly

---

Built with consistency, clarity, and purpose.
