# Plan: Add Vite + React standalone project setup

## Goal
Wire the existing TypeScript/React scaffold into a runnable Vite project.
Open in a browser with `npm run dev` — no IDE needed.

## Steps

1. **`package.json`** — React 18, TypeScript, Vite, `@vitejs/plugin-react`
2. **`tsconfig.json`** — standard React/DOM tsconfig
3. **`vite.config.ts`** — configure `@vitejs/plugin-react`
4. **`index.html`** — Vite entry HTML with `<div id="root">`
5. **`src/main.tsx`** — React root render
6. **`src/App.tsx`** — demo app mounting all components with mock data
   - Mock `AdminFeeConfig`, `OrgBillingProfile`, `PaymentSummary`, payments list
   - Tabs/sections for each component: FeeConfigPanel, MandateStatusBadge,
     PaymentFailureBanner, PaymentStatusBadge, PaymentSummaryBar,
     DirectDebitSetup, PaymentSettings, PaymentHistory

## Not needed
- Backend / API server (all mocked)
- IDE (VS Code is helpful for TS hints but not required)

## Running
```
npm install
npm run dev
```
Then open http://localhost:5173
