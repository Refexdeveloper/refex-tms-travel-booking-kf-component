# Agents — Travel Booking Kissflow Form Field

Work only inside this repository.

## Rules

- Write values with `actions.updateValue(JSON.stringify(payload))` only
- Do not call `kf.context.updateField` from the iframe
- Do not use `window` / `document` / bare `fetch` — use `globalThis.fetch`
- Preserve one-form UX: mode + purpose + trip on one screen
- Flight search uses Cloud Run Travolution proxy
- After changes: `npm run build` then `npm run zip`

## Payload contract

`component: "refex-tms-travel-booking"` plus `formFieldMap` for parent onChange.
