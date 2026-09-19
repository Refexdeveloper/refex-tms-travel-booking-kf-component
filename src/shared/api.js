/* global globalThis */
import { CLOUD_RUN_API_BASE } from './kissflow.js'

export async function callCloudRun(url, options = {}) {
  if (typeof globalThis === 'undefined' || typeof globalThis.fetch !== 'function') {
    throw new Error('Network unavailable in this runtime')
  }
  return globalThis.fetch(url, options)
}

export async function searchFlights(body) {
  const response = await callCloudRun(`${CLOUD_RUN_API_BASE}/api/flights/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `Flight search failed (${response.status})`)
  }
  return response.json()
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

/** Local Indian city suggestions for train/bus when Places API is unavailable */
const CITY_SEED = [
  { code: 'MAA', city: 'Chennai', display: 'Chennai (MAA)' },
  { code: 'DEL', city: 'New Delhi', display: 'New Delhi (DEL)' },
  { code: 'BOM', city: 'Mumbai', display: 'Mumbai (BOM)' },
  { code: 'BLR', city: 'Bengaluru', display: 'Bengaluru (BLR)' },
  { code: 'HYD', city: 'Hyderabad', display: 'Hyderabad (HYD)' },
  { code: 'CCU', city: 'Kolkata', display: 'Kolkata (CCU)' },
  { code: 'PNQ', city: 'Pune', display: 'Pune (PNQ)' },
  { code: 'COK', city: 'Kochi', display: 'Kochi (COK)' },
  { code: 'GOI', city: 'Goa', display: 'Goa (GOI)' },
  { code: 'AMD', city: 'Ahmedabad', display: 'Ahmedabad (AMD)' },
  { code: 'JAI', city: 'Jaipur', display: 'Jaipur (JAI)' },
  { code: 'LKO', city: 'Lucknow', display: 'Lucknow (LKO)' },
]

export function searchCitiesLocal(q) {
  const s = String(q || '').trim().toLowerCase()
  if (!s) return CITY_SEED.slice(0, 8)
  return CITY_SEED.filter(
    (c) => c.city.toLowerCase().includes(s) || c.code.toLowerCase().includes(s) || c.display.toLowerCase().includes(s)
  ).slice(0, 8)
}

export function todayIso() {
  const d = new Date()
  return d.toISOString().slice(0, 10)
}

export function formatMoney(n, currency = 'INR') {
  const num = Number(n || 0)
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(num)
  } catch {
    return `₹${num.toLocaleString('en-IN')}`
  }
}
