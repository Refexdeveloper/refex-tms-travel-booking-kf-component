# Refex TMS — Travel Booking (Kissflow Form Field)

One-form **Travel Booking** custom component for Kissflow process `Travel_Management_A02`.

Stores separately from the page dashboards (`employee-dashboard-v2`, `approvers-dashboard-v2`) and the existing flight-search field (`refex-tms-flightsearch-kf-component`).

## What it does

- Mode picker: Flight · Train · Bus · Flight+Hotel · Hotel · Cab
- Requester auto-filled from `kf.user` (no wasted step)
- Purpose + trip details on the same screen
- Live flight search via Cloud Run (`services_refex-tms-flightsearch`)
- Writes JSON into the custom field with `actions.updateValue`
- Payload includes `formFieldMap` for Kissflow form **onChange** → parent FieldIds

## Install in Kissflow

1. `npm install && npm run zip`
2. Upload `refex-tms-travel-booking-kf-component.zip` as a **Form Field** custom component
3. Add the field on Travel Management form (Object / Text JSON type)
4. Wire form **onChange** (see `docs/FIELD_MAPPING.md`)

## Scripts

```bash
npm install
npm run dev    # local form-field sandbox
npm run build
npm run zip    # uploadable ZIP
```

## Related repos (Refexdeveloper)

| Repo | Type | Role |
|------|------|------|
| `refex-tms-travel-booking-kf-component` | Form Field | This one-form booking UI |
| `refex-tms-flightsearch-kf-component` | Form Field | Dedicated flight search (legacy / deep) |
| `services_refex-tms-flightsearch` | Cloud Run | Travolution proxy |
| `employee-dashboard-v2` | Page | Employee KPIs / create popups |
| `approvers-dashboard-v2` | Page | Approver My Tasks |

## Kissflow APIs used by dashboards (not by this iframe)

See `docs/KISSFLOW_APIS.md` — process-report, pending, myitems, preference, openPopup.
