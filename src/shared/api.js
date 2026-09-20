/* global globalThis */
import { CLOUD_RUN_API_BASE } from './kissflow.js'

export async function callCloudRun(url, options = {}) {
  if (typeof globalThis === 'undefined' || typeof globalThis.fetch !== 'function') {
    throw new Error('Network unavailable in this runtime')
  }
  return globalThis.fetch(url, options)
}

/**
 * Travolution / Cloud Run schema (same as refex-tms + refex-tms-flightsearch-kf-component).
 * Required: isInternational, fromCity, toCity, depDate, noOfAdults, noOfChildren, noOfInfant
 * Round trip: arrDate. Multi-city: segments[{ fromCity, toCity, depDate }]
 */
export function buildFlightSearchPayload({
  tripType = 'oneWay',
  from,
  to,
  depDate,
  arrDate,
  fareClass = 'Economy',
  domesticInternational = 'Domestic',
}) {
  const fromCode = String(from?.code || from?.iata || '').toUpperCase()
  const toCode = String(to?.code || to?.iata || '').toUpperCase()
  const fromCountry = from?.country || 'IN'
  const toCountry = to?.country || 'IN'
  const isInternational =
    domesticInternational === 'International' ||
    (fromCountry && toCountry && fromCountry !== toCountry)

  const payload = {
    tripType: tripType === 'roundTrip' ? 'roundTrip' : 'oneWay',
    isInternational: Boolean(isInternational),
    fareClass: fareClass || 'Economy',
    fromCity: fromCode,
    toCity: toCode,
    depDate,
    noOfAdults: 1,
    noOfChildren: 0,
    noOfInfant: 0,
    limit: 50,
    maxResults: 50,
    // also send segments for validators that require it
    segments: [
      {
        fromCity: fromCode,
        toCity: toCode,
        depDate,
      },
    ],
  }

  if (payload.tripType === 'roundTrip' && arrDate) {
    payload.arrDate = arrDate
  }

  return payload
}

export function normalizeFlightOptions(data, fromCode, toCode) {
  if (data && data.ok === false) {
    const err = data.error
    const msg =
      typeof err === 'string'
        ? err
        : err?.message || (Array.isArray(err?.issues) ? JSON.stringify(err) : JSON.stringify(data))
    throw new Error(msg)
  }

  const result = data?.result || data || {}
  if (String(result.status || '').toLowerCase() === 'failed') {
    throw new Error('The flight provider returned Failed for this search. No fare options were returned.')
  }

  const opts = result.options || result.Options || data?.options || []
  return opts.map((o, i) => ({
    ...o,
    id: o.id || o.flightId || `${o.airlineCode || 'FL'}-${o.flightNumber || i}-${i}`,
    airlineName: o.airlineName || o.airline || o.carrierName,
    airlineCode: o.airlineCode || o.carrierCode,
    flightNumber: o.flightNumber || o.flightNo || '',
    departureTime: o.departureTime || o.depTime || o.sourceTime,
    arrivalTime: o.arrivalTime || o.arrTime || o.destinationTime,
    sourceCityCode: o.sourceCityCode || o.from || fromCode,
    destinationCityCode: o.destinationCityCode || o.to || toCode,
    duration: o.duration || o.totalDuration || '',
    stops: o.stops ?? o.stopCount ?? 0,
    totalFare: o.totalFare ?? o.fare ?? o.price ?? 0,
    currencyCode: o.currencyCode || result.currencyCode || 'INR',
    uuid: o.uuid || o.id || '',
    __providerOrder: i,
  }))
}

export async function searchFlights(params) {
  const body = buildFlightSearchPayload(params)
  const response = await callCloudRun(`${CLOUD_RUN_API_BASE}/api/flights/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok && data.ok !== true) {
    const msg =
      typeof data.error === 'string'
        ? data.error
        : data.error
          ? JSON.stringify(data.error)
          : `Flight search failed (${response.status})`
    throw new Error(msg)
  }

  return {
    options: normalizeFlightOptions(data, body.fromCity, body.toCity),
    meta: {
      uuid: data?.result?.uuid || '',
      currencyCode: data?.result?.currencyCode || 'INR',
      request: body,
    },
  }
}

export async function searchAirports(q) {
  if (!q || String(q).trim().length < 2) return []
  const url = `${CLOUD_RUN_API_BASE}/api/airports?q=${encodeURIComponent(String(q).trim())}`
  try {
    const response = await callCloudRun(url, { headers: { Accept: 'application/json' } })
    if (!response.ok) return []
    const data = await response.json()
    return data.airports || data.results || data || []
  } catch {
    return []
  }
}

const CITY_SEED = [
  { code: 'MAA', city: 'Chennai', display: 'Chennai (MAA)', country: 'IN' },
  { code: 'DEL', city: 'New Delhi', display: 'New Delhi (DEL)', country: 'IN' },
  { code: 'BOM', city: 'Mumbai', display: 'Mumbai (BOM)', country: 'IN' },
  { code: 'BLR', city: 'Bengaluru', display: 'Bengaluru (BLR)', country: 'IN' },
  { code: 'HYD', city: 'Hyderabad', display: 'Hyderabad (HYD)', country: 'IN' },
  { code: 'CCU', city: 'Kolkata', display: 'Kolkata (CCU)', country: 'IN' },
  { code: 'PNQ', city: 'Pune', display: 'Pune (PNQ)', country: 'IN' },
  { code: 'COK', city: 'Kochi', display: 'Kochi (COK)', country: 'IN' },
  { code: 'GOI', city: 'Goa', display: 'Goa (GOI)', country: 'IN' },
  { code: 'AMD', city: 'Ahmedabad', display: 'Ahmedabad (AMD)', country: 'IN' },
  { code: 'JAI', city: 'Jaipur', display: 'Jaipur (JAI)', country: 'IN' },
  { code: 'LKO', city: 'Lucknow', display: 'Lucknow (LKO)', country: 'IN' },
]

export function searchCitiesLocal(q) {
  const s = String(q || '').trim().toLowerCase()
  if (!s) return CITY_SEED.slice(0, 8)
  return CITY_SEED.filter(
    (c) => c.city.toLowerCase().includes(s) || c.code.toLowerCase().includes(s) || c.display.toLowerCase().includes(s)
  ).slice(0, 8)
}

export const DEFAULT_FROM = CITY_SEED[0]
export const DEFAULT_TO = CITY_SEED[1]

export function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

export function formatMoney(n, currency = 'INR') {
  const num = Number(n || 0)
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(num)
  } catch {
    return `₹${num.toLocaleString('en-IN')}`
  }
}
