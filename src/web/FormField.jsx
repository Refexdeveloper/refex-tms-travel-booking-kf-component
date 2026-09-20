/* global globalThis */
import React, { useEffect, useMemo, useState } from 'react'
import { MODES, TRAVEL_FORM_FIELDS } from '../shared/kissflow.js'
import {
  DEFAULT_FROM,
  DEFAULT_TO,
  formatMoney,
  searchAirports,
  searchCitiesLocal,
  searchFlights,
  todayIso,
} from '../shared/api.js'

const COMPONENT_ID = 'refex-tms-travel-booking'

const styles = {
  root: {
    fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
    color: '#0d1f3c',
    background: 'linear-gradient(180deg, #f4f8fc 0%, #ffffff 40%)',
    borderRadius: 16,
    border: '1px solid #e5eaf2',
    padding: 16,
  },
  strip: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 12px',
    borderRadius: 12,
    background: '#fff',
    border: '1px solid #e5eaf2',
    marginBottom: 14,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: 'linear-gradient(135deg,#2d7bbf,#70b62c)',
    color: '#fff',
    display: 'grid',
    placeItems: 'center',
    fontWeight: 800,
    fontSize: 12,
  },
  modeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 10,
    marginBottom: 14,
  },
  modeCard: (active, soft, accent) => ({
    border: `1.5px solid ${active ? accent : '#e5eaf2'}`,
    background: active ? soft : '#fff',
    borderRadius: 14,
    padding: '12px 12px',
    cursor: 'pointer',
    textAlign: 'left',
    boxShadow: active ? `0 8px 18px ${accent}22` : '0 2px 8px rgba(20,40,80,0.04)',
  }),
  field: { display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 },
  label: { fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.04em' },
  input: {
    border: '1px solid #d7dee8',
    borderRadius: 10,
    padding: '10px 12px',
    fontSize: 14,
    background: '#fff',
  },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  btn: (primary) => ({
    border: primary ? 'none' : '1px solid #d7dee8',
    background: primary ? '#2d7bbf' : '#fff',
    color: primary ? '#fff' : '#0d1f3c',
    borderRadius: 10,
    padding: '10px 16px',
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: 13,
  }),
  flightCard: (selected) => ({
    border: `1px solid ${selected ? '#2d7bbf' : '#e5eaf2'}`,
    background: selected ? '#f0f7fd' : '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    display: 'flex',
    justifyContent: 'space-between',
    gap: 10,
    alignItems: 'center',
  }),
  pill: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 8px',
    borderRadius: 999,
    background: '#e8f6e0',
    color: '#3f6212',
    fontSize: 11,
    fontWeight: 700,
  },
  error: { color: '#b91c1c', fontSize: 13, marginTop: 8 },
  ok: { color: '#15803d', fontSize: 13, marginTop: 8 },
}

function initials(name) {
  return String(name || 'U')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function parseValue(value) {
  if (!value) return null
  if (typeof value === 'object') return value
  try {
    return JSON.parse(String(value))
  } catch {
    return null
  }
}

function buildPayload(state) {
  const mode = state.mode
  const travelMode = mode === 'flightHotel' ? 'air' : mode
  const withHotel = mode === 'flightHotel' || !!state.withHotel
  const from = state.from?.display || state.from?.city || ''
  const to = state.to?.display || state.to?.city || state.city?.display || state.city?.city || ''
  const amount = Number(state.selectedFlight?.totalFare || state.amount || 0)

  return {
    component: COMPONENT_ID,
    version: 1,
    savedAt: new Date().toISOString(),
    mode: travelMode,
    withHotel,
    withCab: !!state.withCab,
    purpose: state.purpose || '',
    domesticInternational: state.domesticInternational || 'Domestic',
    beneficiary: state.beneficiary || 'Self',
    travelType: state.travelType || 'oneWay',
    from,
    to,
    fromAirport: state.from || null,
    toAirport: state.to || null,
    city: state.city || null,
    departureDate: state.departureDate || '',
    returnDate: state.returnDate || '',
    checkinDate: state.checkinDate || '',
    checkoutDate: state.checkoutDate || '',
    pickupLocation: state.pickupLocation || '',
    dropLocation: state.dropLocation || '',
    bookingAmount: amount,
    currencyCode: state.selectedFlight?.currencyCode || 'INR',
    selectedFlight: state.selectedFlight || null,
    flightSearchSnapshot: state.flightSnapshot || null,
    remarks: state.remarks || '',
    /** Keys for Kissflow form onChange → updateField */
    formFieldMap: {
      [TRAVEL_FORM_FIELDS.purpose]: state.purpose || '',
      [TRAVEL_FORM_FIELDS.domesticInternational]: state.domesticInternational || 'Domestic',
      [TRAVEL_FORM_FIELDS.modeOfTransport]:
        travelMode === 'air'
          ? 'Flight'
          : travelMode === 'train'
            ? 'Train'
            : travelMode === 'bus'
              ? 'Bus'
              : travelMode === 'cab'
                ? 'Cab'
                : 'Hotel',
      [TRAVEL_FORM_FIELDS.travelType]: state.travelType || 'oneWay',
      [TRAVEL_FORM_FIELDS.departureDate]: state.departureDate || '',
      [TRAVEL_FORM_FIELDS.fsDepartureDate]: state.departureDate || '',
      [TRAVEL_FORM_FIELDS.fromDate]: state.departureDate || '',
      [TRAVEL_FORM_FIELDS.toDate]: state.returnDate || state.checkoutDate || '',
      [TRAVEL_FORM_FIELDS.fsFromCity]: from,
      [TRAVEL_FORM_FIELDS.fsToCity]: to,
      [TRAVEL_FORM_FIELDS.commonFrom]: from,
      [TRAVEL_FORM_FIELDS.commonTo]: to,
      [TRAVEL_FORM_FIELDS.boardingFrom]: from,
      [TRAVEL_FORM_FIELDS.destinationTo]: to,
      [TRAVEL_FORM_FIELDS.bookingAmount]: amount,
      [TRAVEL_FORM_FIELDS.bookingAmountAlt]: amount,
      [TRAVEL_FORM_FIELDS.isAccommodation]: withHotel ? 'Yes' : 'No',
      [TRAVEL_FORM_FIELDS.beneficiary]: state.beneficiary || 'Self',
      [TRAVEL_FORM_FIELDS.comments]: state.remarks || '',
      [TRAVEL_FORM_FIELDS.city]: state.city?.city || to,
      [TRAVEL_FORM_FIELDS.checkin]: state.checkinDate || '',
      [TRAVEL_FORM_FIELDS.checkout]: state.checkoutDate || '',
      [TRAVEL_FORM_FIELDS.pickupLocation]: state.pickupLocation || '',
      [TRAVEL_FORM_FIELDS.dropLocation]: state.dropLocation || '',
    },
  }
}

function AirportInput({ label, value, onChange }) {
  const [q, setQ] = useState(value?.display || value?.city || '')
  const [opts, setOpts] = useState([])

  useEffect(() => {
    setQ(value?.display || value?.city || '')
  }, [value])

  useEffect(() => {
    let ignore = false
    const t = setTimeout(async () => {
      if (!q || q.length < 2) {
        setOpts([])
        return
      }
      const remote = await searchAirports(q)
      const list = Array.isArray(remote) && remote.length ? remote : searchCitiesLocal(q)
      if (!ignore) setOpts(list.slice(0, 8))
    }, 250)
    return () => {
      ignore = true
      clearTimeout(t)
    }
  }, [q])

  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      <input
        style={styles.input}
        value={q}
        placeholder="City / airport"
        onChange={(e) => {
          setQ(e.target.value)
          onChange(null)
        }}
      />
      {opts.length > 0 && (
        <div style={{ border: '1px solid #e5eaf2', borderRadius: 10, overflow: 'hidden', maxHeight: 160, overflowY: 'auto' }}>
          {opts.map((o, i) => {
            const display = o.display || `${o.city || ''} ${o.code ? `(${o.code})` : ''}`.trim()
            return (
              <button
                key={i}
                type="button"
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  border: 0,
                  borderBottom: '1px solid #f1f5f9',
                  background: '#fff',
                  padding: '8px 10px',
                  cursor: 'pointer',
                  fontSize: 13,
                }}
                onClick={() => {
                  const next = {
                    code: o.code || o.iata || '',
                    city: o.city || o.name || display,
                    name: o.name || o.city || '',
                    country: o.country || 'IN',
                    display,
                  }
                  onChange(next)
                  setQ(display)
                  setOpts([])
                }}
              >
                {display}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function CityInput({ label, value, onChange }) {
  const [q, setQ] = useState(value?.display || value?.city || '')
  const opts = useMemo(() => searchCitiesLocal(q), [q])

  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      <input
        style={styles.input}
        value={q}
        placeholder="City"
        onChange={(e) => {
          setQ(e.target.value)
          onChange(null)
        }}
      />
      {q && opts.length > 0 && (
        <div style={{ border: '1px solid #e5eaf2', borderRadius: 10, overflow: 'hidden' }}>
          {opts.map((o) => (
            <button
              key={o.code}
              type="button"
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                border: 0,
                borderBottom: '1px solid #f1f5f9',
                background: '#fff',
                padding: '8px 10px',
                cursor: 'pointer',
                fontSize: 13,
              }}
              onClick={() => {
                onChange(o)
                setQ(o.display)
              }}
            >
              {o.display}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function FormField(props) {
  const { value, actions } = props
  const updateValue = actions?.updateValue

  const restored = parseValue(value)
  const [mode, setMode] = useState(restored?.withHotel ? 'flightHotel' : restored?.mode || 'air')
  const [purpose, setPurpose] = useState(restored?.purpose || '')
  const [domesticInternational, setDomesticInternational] = useState(restored?.domesticInternational || 'Domestic')
  const [beneficiary, setBeneficiary] = useState(restored?.beneficiary || 'Self')
  const [travelType, setTravelType] = useState(restored?.travelType || 'oneWay')
  const [from, setFrom] = useState(restored?.fromAirport || DEFAULT_FROM)
  const [to, setTo] = useState(restored?.toAirport || DEFAULT_TO)
  const [city, setCity] = useState(restored?.city || null)
  const [departureDate, setDepartureDate] = useState(restored?.departureDate || todayIso())
  const [returnDate, setReturnDate] = useState(restored?.returnDate || '')
  const [checkinDate, setCheckinDate] = useState(restored?.checkinDate || '')
  const [checkoutDate, setCheckoutDate] = useState(restored?.checkoutDate || '')
  const [pickupLocation, setPickupLocation] = useState(restored?.pickupLocation || '')
  const [dropLocation, setDropLocation] = useState(restored?.dropLocation || '')
  const [withCab, setWithCab] = useState(!!restored?.withCab)
  const [remarks, setRemarks] = useState(restored?.remarks || '')
  const [amount, setAmount] = useState(restored?.bookingAmount || '')
  const [flights, setFlights] = useState([])
  const [selectedFlight, setSelectedFlight] = useState(restored?.selectedFlight || null)
  const [flightSnapshot, setFlightSnapshot] = useState(restored?.flightSearchSnapshot || null)
  const [searching, setSearching] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [requester] = useState(() => {
    const kf = typeof globalThis !== 'undefined' ? globalThis.kf : null
    const u = kf?.user
    return {
      name: u?.Name || u?.name || 'Employee',
      email: u?.Email || u?.email || '',
      id: u?._id || '',
    }
  })

  const isAir = mode === 'air' || mode === 'flightHotel'
  const isGround = mode === 'train' || mode === 'bus'
  const isHotel = mode === 'accommodation'
  const isCab = mode === 'cab'

  function writePayload(extra = {}) {
    const payload = buildPayload({
      mode,
      purpose,
      domesticInternational,
      beneficiary,
      travelType,
      from,
      to,
      city,
      departureDate,
      returnDate,
      checkinDate,
      checkoutDate,
      pickupLocation,
      dropLocation,
      withHotel: mode === 'flightHotel',
      withCab,
      remarks,
      amount,
      selectedFlight,
      flightSnapshot,
      ...extra,
    })
    const text = JSON.stringify(payload)
    if (typeof updateValue === 'function') {
      updateValue(text)
      setMessage('Trip details saved to Travel Booking field.')
      setError('')
    } else {
      setError('actions.updateValue unavailable — open inside Kissflow form.')
    }
    return payload
  }

  async function onSearchFlights() {
    if (!from?.code || !to?.code) {
      setError('Select From and To airports from the suggestions.')
      return
    }
    if (!departureDate) {
      setError('Departure date is required.')
      return
    }
    if (travelType === 'roundTrip') {
      if (!returnDate) {
        setError('Return date is required for round trip.')
        return
      }
      if (returnDate <= departureDate) {
        setError('Return date must be after departure.')
        return
      }
    }
    setSearching(true)
    setError('')
    setMessage('')
    setSelectedFlight(null)
    try {
      const { options, meta } = await searchFlights({
        tripType: travelType === 'roundTrip' ? 'roundTrip' : 'oneWay',
        from,
        to,
        depDate: departureDate,
        arrDate: returnDate,
        fareClass: 'Economy',
        domesticInternational,
      })
      setFlights(options)
      setFlightSnapshot(meta)
      setMessage(options.length ? `${options.length} flights found.` : 'No flights returned for this route/date.')
    } catch (err) {
      setError(err.message || 'Flight search failed')
      setFlights([])
    } finally {
      setSearching(false)
    }
  }

  function selectFlight(f) {
    setSelectedFlight(f)
    writePayload({ selectedFlight: f, amount: f?.totalFare, status: 'selected' })
  }

  function onSave() {
    if (!purpose.trim()) {
      setError('Purpose of travel is required.')
      return
    }
    if (isAir && !selectedFlight) {
      setError('Search and select a flight before submitting.')
      return
    }
    if (isGround && (!from || !to || !departureDate)) {
      setError('From, To and date are required.')
      return
    }
    if (isHotel && (!city || !checkinDate || !checkoutDate)) {
      setError('City, check-in and check-out are required.')
      return
    }
    if (isCab && (!pickupLocation || !dropLocation || !departureDate)) {
      setError('Pickup, drop and date are required.')
      return
    }
    writePayload({ status: 'ready_to_submit', submittedAt: new Date().toISOString() })
    setMessage('Saved. Click Kissflow Submit on the parent form to start Travel Desk workflow.')
  }

  return (
    <div style={styles.root} className="rtb-root">
      <style>{`
        @keyframes rtb-fade-up { from { opacity:0; transform:translateY(10px);} to { opacity:1; transform:none;} }
        @keyframes rtb-fly { 0%,100%{ transform:translateX(0);} 50%{ transform:translateX(4px);} }
        .rtb-root { animation: rtb-fade-up .35s ease both; }
        .rtb-mode { transition: transform .2s ease, box-shadow .2s ease, border-color .2s; }
        .rtb-mode:hover { transform: translateY(-2px); }
        .rtb-fly-ico { display:inline-block; animation: rtb-fly 1.6s ease-in-out infinite; }
        .rtb-flight { transition: border-color .2s, background .2s, transform .15s; }
        .rtb-flight:hover { transform: translateY(-1px); }
      `}</style>
      <div style={styles.strip}>
        <span style={styles.avatar}>{initials(requester.name)}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{requester.name}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>{requester.email || 'Requester auto-filled'}</div>
        </div>
        <span style={styles.pill}>Auto-filled</span>
      </div>

      <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 8 }}>What are you travelling by?</div>
      <div style={styles.modeGrid}>
        {MODES.map((m) => {
          const active = mode === m.id
          return (
            <button
              key={m.id}
              type="button"
              className="rtb-mode"
              style={styles.modeCard(active, m.soft, m.accent)}
              onClick={() => {
                setMode(m.id)
                setSelectedFlight(null)
                setFlights([])
                setMessage('')
                setError('')
              }}
            >
              <div style={{ fontWeight: 800, color: m.accent, fontSize: 13 }}>
                {m.id === 'air' || m.id === 'flightHotel' ? (
                  <span className="rtb-fly-ico" style={{ marginRight: 6 }}>
                    ✈
                  </span>
                ) : null}
                {m.label}
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{m.subtitle}</div>
            </button>
          )
        })}
      </div>

      <div style={styles.row}>
        <div style={{ ...styles.field, gridColumn: '1 / -1' }}>
          <label style={styles.label}>PURPOSE OF TRAVEL *</label>
          <input
            style={styles.input}
            value={purpose}
            placeholder="Client meeting, site visit, training…"
            onChange={(e) => setPurpose(e.target.value)}
          />
        </div>
        <div style={styles.field}>
          <label style={styles.label}>DOMESTIC / INTERNATIONAL</label>
          <select
            style={styles.input}
            value={domesticInternational}
            onChange={(e) => setDomesticInternational(e.target.value)}
          >
            <option>Domestic</option>
            <option>International</option>
          </select>
        </div>
        <div style={styles.field}>
          <label style={styles.label}>TRAVELLING FOR</label>
          <select style={styles.input} value={beneficiary} onChange={(e) => setBeneficiary(e.target.value)}>
            <option>Self</option>
            <option>Internal</option>
            <option>External</option>
          </select>
        </div>
      </div>

      {isAir && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            {['oneWay', 'roundTrip'].map((t) => (
              <button
                key={t}
                type="button"
                style={styles.btn(travelType === t)}
                onClick={() => setTravelType(t)}
              >
                {t === 'oneWay' ? 'One Way' : 'Round Trip'}
              </button>
            ))}
            <label style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
              <input type="checkbox" checked={withCab} onChange={(e) => setWithCab(e.target.checked)} />
              + Cab
            </label>
          </div>
          <div style={styles.row}>
            <AirportInput label="FROM" value={from} onChange={setFrom} />
            <AirportInput label="TO" value={to} onChange={setTo} />
            <div style={styles.field}>
              <label style={styles.label}>DEPARTURE</label>
              <input
                type="date"
                style={styles.input}
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
              />
            </div>
            {travelType === 'roundTrip' && (
              <div style={styles.field}>
                <label style={styles.label}>RETURN</label>
                <input
                  type="date"
                  style={styles.input}
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                />
              </div>
            )}
          </div>
          <button type="button" style={styles.btn(true)} onClick={onSearchFlights} disabled={searching}>
            {searching ? 'Searching…' : 'Search Flights'}
          </button>
          <div style={{ marginTop: 12, maxHeight: 280, overflowY: 'auto' }}>
            {flights.slice(0, 40).map((f, i) => {
              const selected =
                selectedFlight &&
                (selectedFlight.uuid === f.uuid ||
                  (selectedFlight.flightNumber === f.flightNumber && selectedFlight.departureTime === f.departureTime))
              return (
                <div key={f.uuid || f.id || i} className="rtb-flight" style={styles.flightCard(selected)}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>
                      {f.airlineName || f.airlineCode} {f.flightNumber || ''}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>
                      {f.sourceCityCode} {f.departureTime || ''} → {f.destinationCityCode} {f.arrivalTime || ''}
                      {f.stops != null ? ` · ${f.stops === 0 ? 'Non-stop' : `${f.stops} stop`}` : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800 }}>{formatMoney(f.totalFare, f.currencyCode)}</div>
                    <button type="button" style={{ ...styles.btn(selected), marginTop: 6 }} onClick={() => selectFlight(f)}>
                      {selected ? 'Selected' : 'Select'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {isGround && (
        <div style={styles.row}>
          <CityInput label="FROM" value={from} onChange={setFrom} />
          <CityInput label="TO" value={to} onChange={setTo} />
          <div style={styles.field}>
            <label style={styles.label}>TRAVEL DATE</label>
            <input
              type="date"
              style={styles.input}
              value={departureDate}
              onChange={(e) => setDepartureDate(e.target.value)}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>EST. AMOUNT (INR)</label>
            <input style={styles.input} type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
        </div>
      )}

      {isHotel && (
        <div style={styles.row}>
          <CityInput label="CITY" value={city} onChange={setCity} />
          <div style={styles.field}>
            <label style={styles.label}>CHECK-IN</label>
            <input type="date" style={styles.input} value={checkinDate} onChange={(e) => setCheckinDate(e.target.value)} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>CHECK-OUT</label>
            <input
              type="date"
              style={styles.input}
              value={checkoutDate}
              onChange={(e) => setCheckoutDate(e.target.value)}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>EST. AMOUNT (INR)</label>
            <input style={styles.input} type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
        </div>
      )}

      {isCab && (
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>PICKUP</label>
            <input
              style={styles.input}
              value={pickupLocation}
              onChange={(e) => setPickupLocation(e.target.value)}
              placeholder="Airport / hotel / address"
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>DROP</label>
            <input
              style={styles.input}
              value={dropLocation}
              onChange={(e) => setDropLocation(e.target.value)}
              placeholder="Destination"
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>DATE</label>
            <input
              type="date"
              style={styles.input}
              value={departureDate}
              onChange={(e) => setDepartureDate(e.target.value)}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>EST. AMOUNT (INR)</label>
            <input style={styles.input} type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
        </div>
      )}

      <div style={styles.field}>
        <label style={styles.label}>REMARKS</label>
        <textarea
          style={{ ...styles.input, minHeight: 64 }}
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="Optional notes for manager / travel desk"
        />
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
        <button type="button" style={styles.btn(true)} onClick={onSave}>
          Save & prepare submit
        </button>
      </div>
      {error && <div style={styles.error}>{error}</div>}
      {message && <div style={styles.ok}>{message}</div>}
    </div>
  )
}

export default FormField
