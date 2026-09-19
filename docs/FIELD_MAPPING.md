# Field mapping — Travel Booking → Travel_Management_A02

Custom field value is a JSON string. On form **onChange** of this custom field, parse JSON and map `formFieldMap` (or top-level keys) into process fields.

## Recommended Kissflow form script (onChange of custom field)

```javascript
const raw = await kf.context.getField('Travel_Booking_JSON') // use your Field ID
let data
try {
  data = typeof raw === 'string' ? JSON.parse(raw) : raw
} catch (e) {
  return
}
if (!data || data.component !== 'refex-tms-travel-booking') return

const map = data.formFieldMap || {}
await kf.context.updateField(map)

// Optional explicit writes
await kf.context.updateField({
  Purpose_of_Travel: data.purpose,
  Travel_Type: data.travelType,
  Departure_Date: data.departureDate,
  FS_Departure_Date: data.departureDate,
  FS_From_City: data.from,
  FS_To_City: data.to,
  FS_Booking_Amount_1: data.bookingAmount,
  Mode_of_Transport: map.Mode_of_Transport,
  Is_accommodation_required: data.withHotel ? 'Yes' : 'No',
})
```

## Key process FieldIds

| Meaning | FieldId |
|---------|---------|
| Purpose | `Purpose_of_Travel` / `Purpose` |
| Mode | `Mode_of_Transport` |
| Trip type | `Travel_Type` (`oneWay` / `roundTrip` / `multiCity`) |
| Departure | `Departure_Date` / `FS_Departure_Date` |
| From / To | `FS_From_City` / `FS_To_City` |
| Amount | `FS_Booking_Amount_1` / `Booking_Amount_1` |
| Hotel flag | `Is_accommodation_required` |
| Hotel city | `City`, `Checkin_Date`, `Checkout_Date` |
| Cab | `Pickup_Location`, `Drop_Location` |

Full preference column list lives in `approvers-dashboard-v2` `PREFERENCE_COLUMNS.travel`.

## Do not call from the component iframe

Per Kissflow form-field rules (same as flight-search component):

- Do **not** use `kf.context.updateField` inside the component
- Only `actions.updateValue(payloadText)`
- Parent form onChange performs field writeback
