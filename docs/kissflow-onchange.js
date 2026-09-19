/**
 * Kissflow form event — paste on the Travel Booking custom field's onChange.
 *
 * Setup:
 * 1. Import refex-tms-travel-booking-kf-component.zip as a Form Field
 * 2. Add it on Travel_Management_A02 (Field ID example: Travel_Booking_JSON)
 * 3. Replace CUSTOM_FIELD_ID below with that Field ID
 * 4. Attach this script to the field's onChange
 */

const CUSTOM_FIELD_ID = 'Travel_Booking_JSON'

async function syncTravelBookingToForm() {
  const raw = await kf.context.getField(CUSTOM_FIELD_ID)
  let data
  try {
    data = typeof raw === 'string' ? JSON.parse(raw) : raw
  } catch (e) {
    return
  }
  if (!data || data.component !== 'refex-tms-travel-booking') return

  const map = data.formFieldMap || {}

  // Batch write — preferred
  if (Object.keys(map).length) {
    await kf.context.updateField(map)
  }

  // Explicit safety writes (in case formFieldMap keys differ in your account)
  await kf.context.updateField({
    Purpose_of_Travel: data.purpose || map.Purpose_of_Travel || '',
    Purpose: data.purpose || map.Purpose || '',
    DomesticInternational: data.domesticInternational || 'Domestic',
    Travel_Type: data.travelType || 'oneWay',
    Trip_Type: data.travelType || 'oneWay',
    Departure_Date: data.departureDate || '',
    FS_Departure_Date: data.departureDate || '',
    From_Date: data.departureDate || '',
    To_Date: data.returnDate || data.checkoutDate || '',
    FS_From_City: data.from || '',
    FS_To_City: data.to || '',
    common_From: data.from || '',
    common_To: data.to || '',
    Boarding_from: data.from || '',
    Destination_to_1: data.to || '',
    FS_Booking_Amount_1: Number(data.bookingAmount || 0),
    Booking_Amount_1: Number(data.bookingAmount || 0),
    Mode_of_Transport: map.Mode_of_Transport || '',
    Is_accommodation_required: data.withHotel ? 'Yes' : 'No',
    Beneficiary: data.beneficiary || 'Self',
    Comments: data.remarks || '',
    City: (data.city && (data.city.city || data.city.display)) || data.to || '',
    Checkin_Date: data.checkinDate || '',
    Checkout_Date: data.checkoutDate || '',
    Pickup_Location: data.pickupLocation || '',
    Drop_Location: data.dropLocation || '',
  })
}

syncTravelBookingToForm()
