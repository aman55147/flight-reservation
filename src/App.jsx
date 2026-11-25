import { useEffect, useMemo, useRef, useState } from 'react'
import QRCode from 'qrcode'
import './App.css'

const TODAY = new Date().toISOString().slice(0, 10)

const AIRPORTS = {
  DEL: { city: 'New Delhi', name: 'Indira Gandhi International', country: 'India', group: 'India' },
  BOM: { city: 'Mumbai', name: 'Chhatrapati Shivaji Maharaj International', country: 'India', group: 'India' },
  BLR: { city: 'Bengaluru', name: 'Kempegowda International', country: 'India', group: 'India' },
  HYD: { city: 'Hyderabad', name: 'Rajiv Gandhi International', country: 'India', group: 'India' },
  MAA: { city: 'Chennai', name: 'Chennai International', country: 'India', group: 'India' },
  CCU: { city: 'Kolkata', name: 'Netaji Subhas Chandra Bose International', country: 'India', group: 'India' },
  GOI: { city: 'Goa', name: 'Manohar International', country: 'India', group: 'India' },
  COK: { city: 'Kochi', name: 'Cochin International', country: 'India', group: 'India' },
  LHR: { city: 'London', name: 'Heathrow Airport', country: 'United Kingdom', group: 'International' },
  CDG: { city: 'Paris', name: 'Charles de Gaulle Airport', country: 'France', group: 'International' },
  NRT: { city: 'Tokyo', name: 'Narita International', country: 'Japan', group: 'International' },
  DXB: { city: 'Dubai', name: 'Dubai International', country: 'United Arab Emirates', group: 'International' },
  SIN: { city: 'Singapore', name: 'Changi Airport', country: 'Singapore', group: 'International' },
  JFK: { city: 'New York', name: 'John F. Kennedy International', country: 'United States', group: 'International' },
  SFO: { city: 'San Francisco', name: 'San Francisco International', country: 'United States', group: 'International' },
  LAX: { city: 'Los Angeles', name: 'Los Angeles International', country: 'United States', group: 'International' },
  ORD: { city: 'Chicago', name: "O'Hare International", country: 'United States', group: 'International' },
}

const FLIGHTS = [
  { id: 'indigo-101', airline: 'IndiGo', initials: '6E', from: 'SFO', to: 'JFK', depart: '06:20', arrive: '14:45', duration: '5h 25m', stops: 'Nonstop', price: 289, cabin: 'Economy', color: 'blue' },
  { id: 'air-india-204', airline: 'Air India', initials: 'AI', from: 'SFO', to: 'JFK', depart: '09:10', arrive: '17:55', duration: '5h 45m', stops: 'Nonstop', price: 342, cabin: 'Economy', color: 'orange' },
  { id: 'qatar-318', airline: 'Qatar Airways', initials: 'QR', from: 'SFO', to: 'JFK', depart: '12:35', arrive: '21:20', duration: '5h 45m', stops: 'Nonstop', price: 315, cabin: 'Economy', color: 'purple' },
  { id: 'emirates-410', airline: 'Emirates', initials: 'EK', from: 'SFO', to: 'JFK', depart: '16:50', arrive: '01:30', duration: '5h 40m', stops: 'Nonstop', price: 258, cabin: 'Economy', color: 'blue' },
  { id: 'singapore-522', airline: 'Singapore Airlines', initials: 'SQ', from: 'SFO', to: 'JFK', depart: '19:15', arrive: '04:55', duration: '5h 40m', stops: '1 stop', price: 221, cabin: 'Economy', color: 'orange' },
]

const STORAGE_KEY = 'skyvoyage-bookings'
const FLOW_STORAGE_KEY = 'skyvoyage-search-flow'
const DEMO_ORDER_ID = 'SV-DEMO-ONLY'
const ROUTES = {
  home: '#/explore',
  results: '#/flights',
  checkout: '#/checkout',
  confirmation: '#/confirmation',
  bookings: '#/bookings',
  about: '#/about',
  contact: '#/contact',
  admin: '#/admin',
  help: '#/help',
}

function pageFromHash(hash) {
  const route = Object.entries(ROUTES).find(([, path]) => path === hash)
  return route?.[0] || 'home'
}

function readFlowData() {
  try {
    const stored = window.sessionStorage.getItem(FLOW_STORAGE_KEY)
    if (!stored) return {}
    const parsed = JSON.parse(stored)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function getCurrency(from, to) {
  return AIRPORTS[from]?.country === 'India' && AIRPORTS[to]?.country === 'India' ? 'INR' : 'USD'
}

function formatMoney(amount, currency = 'USD') {
  return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

function createBookingMetadata() {
  const timestamp = Date.now()
  return {
    id: `SV${timestamp.toString().slice(-8)}`,
    createdAt: new Date(timestamp).toISOString(),
  }
}

const DESTINATIONS = [
  { code: 'DXB', country: 'UNITED ARAB EMIRATES', tag: 'INTERNATIONAL BESTSELLER', price: 15800, art: 'dubai', route: 'DEL → DXB', detail: '4h 00m Non-stop', description: 'Experience architectural marvels, luxury shopping, and desert sky lounges with daily non-stop A350 departures.' },
  { code: 'SIN', country: 'REPUBLIC OF SINGAPORE', tag: 'GARDEN CITY ESCAPE', price: 16900, art: 'singapore', route: 'BOM → SIN', detail: '5h 35m Non-stop', description: 'Fly from Mumbai to Changi and explore Marina Bay Sands, Gardens by the Bay, and celebrated street dining.' },
  { code: 'LHR', country: 'UNITED KINGDOM', tag: 'FLAGSHIP LONG-HAUL', price: 38900, art: 'london', route: 'DEL → LHR', detail: '9h 20m Flagship', description: 'Fly our A350-1000 flagship to London Heathrow with full dining, OLED screens, and generous baggage.' },
]
const FESTIVE_OFFERS = [
  { style: 'christmas', label: 'CHRISTMAS GETAWAY · DEC 18-27', discount: 'Save 15%', title: 'Christmas lights escape', description: 'Explore London, Dubai, or Singapore in the festive season.', code: 'SANTASAVE15' },
  { style: 'new-year', label: 'NEW YEAR 2027 · DEC 28-JAN 5', discount: 'Save 12%', title: 'Make midnight memorable', description: 'Plan a city break and welcome the new year somewhere special.', code: 'TAKEOFF2027' },
  { style: 'harvest', label: 'PONGAL & MAKAR SANKRANTI · JAN 10-16', discount: 'Save 10%', title: 'Harvest-season homecoming', description: 'Celebrate with family on selected domestic demo routes.', code: 'HARVEST10' },
]

const SEAT_ROWS = [1, 2, 3, 4, 5, 6]
const SEAT_COLUMNS = ['A', 'B', 'C', 'D', 'E', 'F']
const UNAVAILABLE_SEATS = ['1B', '2E', '3A', '4D', '5B', '6F']
const BAGGAGE_OPTIONS = [
  { id: 'included', label: 'Personal item', detail: 'Included', inr: 0, usd: 0 },
  { id: '15kg', label: '15 kg checked bag', detail: 'Per traveler', inr: 1200, usd: 18 },
  { id: '20kg', label: '20 kg checked bag', detail: 'Per traveler', inr: 1900, usd: 29 },
]
const MEAL_OPTIONS = [
  { id: 'standard', label: 'Standard', detail: 'Classic airline meal' },
  { id: 'vegetarian', label: 'Vegetarian', detail: 'Meat-free meal' },
  { id: 'vegan', label: 'Vegan', detail: 'Plant-based meal' },
  { id: 'non-vegetarian', label: 'Non-vegetarian', detail: 'Meal with meat' },
]

function readStoredBookings() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return { bookings: [], error: '' }
    const parsed = JSON.parse(stored)
    if (!Array.isArray(parsed)) throw new Error('Saved bookings have an invalid format.')
    return { bookings: parsed, error: '' }
  } catch (error) {
    return { bookings: [], error: `We couldn't load saved bookings: ${error.message}` }
  }
}

function Icon({ name, size = 18, className = '' }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', className, 'aria-hidden': true }
  const paths = {
    aircraft: <><path d="M12 1.5c-.9 0-1.6.7-1.8 1.7L8.7 9.4 2 12.9c-.5.2-.8.7-.8 1.3v1.2l7.6-1.4-.4 4.2-1.9 1.8v1.3l5.5-1.1 5.5 1.1V20l-1.9-1.8-.4-4.2 7.6 1.4v-1.2c0-.6-.3-1.1-.8-1.3l-6.7-3.5-1.5-6.2c-.2-1-.9-1.7-1.8-1.7Z" fill="currentColor" stroke="#2d6d82" strokeWidth={0.45} /><path d="M12 4.2v4" fill="none" stroke="#54899a" strokeWidth={0.8} /></>,
    plane: <><path d="m2 16 20-8-8 14-2-7-10 1Z" /><path d="m12 15 4-5" /></>,
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    swap: <><path d="m16 3 4 4-4 4" /><path d="M4 7h16" /><path d="m8 21-4-4 4-4" /><path d="M20 17H4" /></>,
    pin: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    chevron: <path d="m7 10 5 5 5-5" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    luggage: <><rect x="4" y="7" width="16" height="14" rx="2" /><path d="M9 7V5a3 3 0 0 1 6 0v2M8 11v6m8-6v6" /></>,
    shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    bag: <><path d="M6 7h12l1 14H5L6 7Z" /><path d="M9 7V5a3 3 0 0 1 6 0v2" /></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
    sparkle: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-2-5.8L4 11l6-2.2L12 3Z" /><path d="m19 14 1.1 2.9L23 18l-2.9 1.1L19 22l-1-2.9L15 18l3-1.1 1-2.9Z" /></>,
  }
  return <svg {...common}>{paths[name] || paths.sparkle}</svg>
}

function formatDate(dateString) {
  if (!dateString) return 'Choose a date'
  return new Date(`${dateString}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function TicketPass({ booking, onPrint, printTarget = false }) {
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [qrError, setQrError] = useState('')
  const passengerList = Array.isArray(booking.passengers) && booking.passengers.length
    ? booking.passengers
    : [{ name: booking.passenger || 'Traveler', outboundSeat: booking.seats?.[0] || '', returnSeat: '' }]
  const legs = [
    { key: 'outbound', label: booking.returnFlight ? 'OUTBOUND' : 'FLIGHT', flight: booking.flight, date: booking.date },
    ...(booking.returnFlight ? [{ key: 'return', label: 'RETURN', flight: booking.returnFlight, date: booking.returnDate }] : []),
  ]

  useEffect(() => {
    let active = true
    QRCode.toDataURL(
      `SKYBOUND DEMO TICKET ONLY\nNOT VALID FOR AIR TRAVEL\nPNR: ${booking.id}`,
      { width: 180, margin: 1, color: { dark: '#17384a', light: '#ffffff' } },
    ).then((dataUrl) => {
      if (active) setQrDataUrl(dataUrl)
    }).catch((error) => {
      if (active) setQrError(`Demo ticket QR could not be generated: ${error.message}`)
    })
    return () => { active = false }
  }, [booking.id])

  return (
    <article className={`boarding-ticket ticket-pass ${printTarget ? 'print-target' : ''}`}>
      <header className="boarding-ticket-header">
        <div className="ticket-brand"><span className="brand-mark"><Icon name="plane" size={16} /></span><strong>Skybound</strong></div>
        <span className="demo-ticket-label">DEMO E-TICKET · NOT VALID FOR TRAVEL</span>
      </header>
      <div className="boarding-ticket-pnr"><span><small>BOOKING REFERENCE / PNR</small><strong>{booking.id}</strong></span><span className={`ticket-status ${booking.status === 'Cancelled' ? 'cancelled' : ''}`}>{booking.status}</span></div>
      <div className="boarding-ticket-legs">
        {legs.map(({ key, label, flight, date }) => (
          <section className="boarding-ticket-leg" key={key}>
            <div className="ticket-leg-title"><span>{label}</span><b>{formatDate(date)}</b></div>
            <div className="ticket-leg-route">
              <div><strong>{flight.from}</strong><span>{AIRPORTS[flight.from]?.city}</span><b>{flight.depart}</b></div>
              <div className="ticket-leg-middle"><Icon name="plane" size={17} /><span>{flight.duration}</span><small>{flight.stops}</small></div>
              <div><strong>{flight.to}</strong><span>{AIRPORTS[flight.to]?.city}</span><b>{flight.arrive}</b></div>
            </div>
            <div className="ticket-leg-meta"><span>{flight.airline} · {flight.initials} {flight.id?.split('-')[1] || ''}</span><span>Flight status: {getDemoFlightStatus(date)} · demo</span></div>
          </section>
        ))}
      </div>
      <div className="ticket-passengers">
        <div className="ticket-passengers-heading"><span>PASSENGER</span><span>OUTBOUND SEAT</span>{booking.returnFlight && <span>RETURN SEAT</span>}<span>MEAL</span></div>
        {passengerList.map((passenger, index) => (
          <div className="ticket-passenger-row" key={`${passenger.name || 'traveler'}-${index}`}>
            <strong>{passenger.name || booking.passenger || `Traveler ${index + 1}`}</strong>
            <span>{passenger.outboundSeat || booking.seats?.[index] || '—'}</span>
            {booking.returnFlight && <span>{passenger.returnSeat || booking.returnSeats?.[index] || '—'}</span>}
            <span>{MEAL_OPTIONS.find((option) => option.id === passenger.meal)?.label || MEAL_OPTIONS.find((option) => option.id === booking.mealPreference)?.label || 'Standard'}</span>
          </div>
        ))}
      </div>
      <div className="ticket-barcode-area">
        <div className="ticket-demo-barcode" aria-hidden="true" />
        <span>{booking.id} · DEMO REFERENCE ONLY</span>
        <div className="ticket-qr-wrap">
          {qrDataUrl ? <img className="ticket-qr" src={qrDataUrl} alt={`Demo-only QR code for booking reference ${booking.id}; not valid for travel`} /> : <div className="ticket-qr-placeholder" role="status">Preparing demo QR…</div>}
          {qrError && <span className="ticket-qr-error" role="alert">{qrError}</span>}
        </div>
      </div>
      <footer className="boarding-ticket-footer"><span>Mock ticket only — no live airline reservation or boarding credential.</span><button type="button" className="ticket-print-button" onClick={() => onPrint(booking.id)}>Print / save PDF</button></footer>
    </article>
  )
}

function createFlightResults(from, to, cabin = 'Economy') {
  const currency = getCurrency(from, to)
  return FLIGHTS.map((flight, index) => {
    const price = currency === 'INR'
      ? [5299, 6199, 5799, 4899, 4499][index]
      : flight.price + (from === 'DEL' && to === 'LHR' ? 110 : 35 + (index * 12))
    return { ...flight, from, to, price, currency, cabin }
  })
}

function createPassengerEntries(count, savedPassengers = [], legacySeats = [], legacyMeal = 'standard') {
  const passengerData = Array.isArray(savedPassengers) ? savedPassengers : []
  const seats = Array.isArray(legacySeats) ? legacySeats : []
  return Array.from({ length: count }, (_, index) => {
    const saved = passengerData[index] || {}
    return {
      name: saved.name || '',
      outboundSeat: saved.outboundSeat || saved.seat || seats[index] || '',
      returnSeat: saved.returnSeat || '',
      meal: saved.meal || legacyMeal,
    }
  })
}

function getDemoFlightStatus(date) {
  if (!date) return 'Scheduled'
  if (date < TODAY) return 'Completed'
  if (date === TODAY) return 'On time'
  return 'Scheduled'
}

function App() {
  const [flowData] = useState(readFlowData)
  const [page, setPage] = useState(() => pageFromHash(window.location.hash))
  const [loadingPage, setLoadingPage] = useState('')
  const navigationTimer = useRef(null)
  const initialTravelerCount = flowData.travelers || 1
  const [from, setFrom] = useState(flowData.from || 'DEL')
  const [to, setTo] = useState(flowData.to || 'BOM')
  const [departDate, setDepartDate] = useState(flowData.departDate || '')
  const [returnDate, setReturnDate] = useState(flowData.returnDate || '')
  const [travelers, setTravelers] = useState(initialTravelerCount)
  const [tripType, setTripType] = useState(flowData.tripType || 'round-trip')
  const [cabin, setCabin] = useState(flowData.cabin || 'Economy')
  const [results, setResults] = useState(() => flowData.results || [])
  const [returnResults, setReturnResults] = useState(() => flowData.returnResults || [])
  const [activeLeg, setActiveLeg] = useState(flowData.activeLeg || 'outbound')
  const [selectedFlight, setSelectedFlight] = useState(flowData.selectedFlight || null)
  const [selectedReturnFlight, setSelectedReturnFlight] = useState(flowData.selectedReturnFlight || null)
  const [passengers, setPassengers] = useState(() => createPassengerEntries(initialTravelerCount, flowData.passengers, flowData.seats, flowData.mealPreference))
  const [activePassengerIndex, setActivePassengerIndex] = useState(0)
  const [seatLeg, setSeatLeg] = useState('outbound')
  const [baggageOption, setBaggageOption] = useState(flowData.baggageOption || 'included')
  const [storedData] = useState(readStoredBookings)
  const [bookings, setBookings] = useState(storedData.bookings)
  const storageError = storedData.error
  const [notice, setNotice] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [travelerEmail, setTravelerEmail] = useState('')
  const [cardName, setCardName] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvc, setCardCvc] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [upiId, setUpiId] = useState('')
  const [bank, setBank] = useState('')
  const [qrAcknowledged, setQrAcknowledged] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [filter, setFilter] = useState('Recommended')
  const [airlineFilter, setAirlineFilter] = useState('All airlines')
  const [stopFilter, setStopFilter] = useState('All stops')
  const [priceLimit, setPriceLimit] = useState('any')
  const [departureFilter, setDepartureFilter] = useState('Any time')
  const [bookingLookup, setBookingLookup] = useState({ pnr: '', email: '' })
  const [bookingLookupIds, setBookingLookupIds] = useState(null)
  const [checkInError, setCheckInError] = useState('')
  const [printTicketId, setPrintTicketId] = useState('')
  const [copiedPromoCode, setCopiedPromoCode] = useState('')
  const [promoFeedback, setPromoFeedback] = useState('')

  const today = TODAY
  const currency = selectedFlight?.currency || getCurrency(from, to)
  const serviceFee = currency === 'INR' ? 650 : 36
  const seatPrice = currency === 'INR' ? 399 : 6
  const baggage = BAGGAGE_OPTIONS.find((option) => option.id === baggageOption) || BAGGAGE_OPTIONS[0]
  const baggagePrice = currency === 'INR' ? baggage.inr : baggage.usd
  const tripLegCount = selectedReturnFlight ? 2 : 1
  const flightFareTotal = selectedFlight ? (selectedFlight.price + (selectedReturnFlight?.price || 0)) * travelers : 0
  const seatCount = passengers.reduce((count, passenger) => count + (passenger.outboundSeat ? 1 : 0) + (selectedReturnFlight && passenger.returnSeat ? 1 : 0), 0)
  const seatTotal = seatPrice * seatCount
  const baggageTotal = baggagePrice * travelers * tripLegCount
  const total = selectedFlight ? flightFareTotal + serviceFee * travelers * tripLegCount + seatTotal + baggageTotal : 0
  const currentResults = activeLeg === 'return' ? returnResults : results
  const currentLegDate = activeLeg === 'return' ? returnDate : departDate
  const currentLegFrom = activeLeg === 'return' ? to : from
  const currentLegTo = activeLeg === 'return' ? from : to

  const visibleResults = useMemo(() => {
    let filtered = currentResults
    if (airlineFilter !== 'All airlines') filtered = filtered.filter((flight) => flight.airline === airlineFilter)
    if (stopFilter !== 'All stops') filtered = filtered.filter((flight) => flight.stops === stopFilter)
    if (priceLimit !== 'any') filtered = filtered.filter((flight) => flight.price <= Number(priceLimit))
    if (departureFilter === 'Morning') filtered = filtered.filter((flight) => Number(flight.depart.slice(0, 2)) < 12)
    if (departureFilter === 'Afternoon') filtered = filtered.filter((flight) => {
      const hour = Number(flight.depart.slice(0, 2))
      return hour >= 12 && hour < 18
    })
    if (departureFilter === 'Evening') filtered = filtered.filter((flight) => Number(flight.depart.slice(0, 2)) >= 18)
    if (filter === 'Lowest price') return [...filtered].sort((a, b) => a.price - b.price)
    if (filter === 'Earliest departure') return [...filtered].sort((a, b) => a.depart.localeCompare(b.depart))
    return filtered
  }, [airlineFilter, currentResults, departureFilter, filter, priceLimit, stopFilter])
  const activePassenger = passengers[activePassengerIndex] || passengers[0] || {}
  const currentSeatField = seatLeg === 'return' ? 'returnSeat' : 'outboundSeat'
  const assignedSeats = passengers.map((passenger, index) => index === activePassengerIndex ? '' : passenger[currentSeatField]).filter(Boolean)
  const visibleBookings = bookingLookupIds === null
    ? bookings
    : bookings.filter((booking) => bookingLookupIds.includes(booking.id))

  useEffect(() => {
    const syncRoute = () => {
      window.clearTimeout(navigationTimer.current)
      navigationTimer.current = null
      setLoadingPage('')
      setPage(pageFromHash(window.location.hash))
      setMobileMenuOpen(false)
    }
    window.addEventListener('hashchange', syncRoute)
    window.addEventListener('popstate', syncRoute)
    return () => {
      window.clearTimeout(navigationTimer.current)
      window.removeEventListener('hashchange', syncRoute)
      window.removeEventListener('popstate', syncRoute)
    }
  }, [])

  useEffect(() => {
    if (paymentMethod !== 'qr' || !selectedFlight) return undefined

    let active = true
    QRCode.toDataURL(
      `SKYBOUND DEMO ONLY\nReference: ${DEMO_ORDER_ID}\nAmount: ${currency} ${total.toFixed(2)}`,
      { width: 200, margin: 1, color: { dark: '#1b2927', light: '#ffffff' } },
    ).then((dataUrl) => {
      if (active) setQrDataUrl(dataUrl)
    }).catch((error) => {
      if (active) setNotice(`We couldn't generate the demo QR code: ${error.message}`)
    })

    return () => { active = false }
  }, [currency, paymentMethod, selectedFlight, total])

  useEffect(() => {
    if (!printTicketId) return undefined
    const finishPrint = () => setPrintTicketId('')
    window.addEventListener('afterprint', finishPrint)
    const timer = window.setTimeout(() => window.print(), 120)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('afterprint', finishPrint)
    }
  }, [printTicketId])

  function navigateTo(nextPage) {
    setMobileMenuOpen(false)
    if (window.location.hash !== ROUTES[nextPage]) window.history.pushState(null, '', ROUTES[nextPage])
    if (nextPage === page) return

    window.clearTimeout(navigationTimer.current)
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPage(nextPage)
      window.scrollTo({ top: 0, behavior: 'auto' })
      return
    }

    setLoadingPage(nextPage)
    navigationTimer.current = window.setTimeout(() => {
      setPage(nextPage)
      setLoadingPage('')
      navigationTimer.current = null
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 380)
  }

  function persistFlow(nextValues) {
    try {
      window.sessionStorage.setItem(FLOW_STORAGE_KEY, JSON.stringify(nextValues))
    } catch (error) {
      setNotice(`We couldn't save this search for page refresh: ${error.message}`)
    }
  }

  function startSearch(event) {
    event.preventDefault()
    setNotice('')
    if (!from || !to || from === to) {
      setNotice('Choose two different cities to find your next flight.')
      return
    }
    if (!departDate || departDate < today) {
      setNotice('Please choose a valid departure date.')
      return
    }
    if (tripType === 'round-trip' && !returnDate) {
      setNotice('Please choose a return date for your round trip.')
      return
    }
    if (tripType === 'round-trip' && returnDate < departDate) {
      setNotice('Your return date must be after your departure date.')
      return
    }
    const nextResults = createFlightResults(from, to, cabin)
    const nextReturnResults = tripType === 'round-trip' ? createFlightResults(to, from, cabin) : []
    const nextPassengers = createPassengerEntries(travelers, passengers)
    setResults(nextResults)
    setReturnResults(nextReturnResults)
    setPassengers(nextPassengers)
    setSelectedFlight(null)
    setSelectedReturnFlight(null)
    setActiveLeg('outbound')
    setActivePassengerIndex(0)
    setSeatLeg('outbound')
    setBaggageOption('included')
    setFilter('Recommended')
    setAirlineFilter('All airlines')
    setStopFilter('All stops')
    setPriceLimit('any')
    setDepartureFilter('Any time')
    persistFlow({
      from, to, departDate, returnDate, travelers, tripType, cabin,
      results: nextResults, returnResults: nextReturnResults, passengers: nextPassengers,
      selectedFlight: null, selectedReturnFlight: null, activeLeg: 'outbound',
    })
    navigateTo('results')
  }

  function swapAirports() {
    setFrom(to)
    setTo(from)
  }

  function chooseFlight(flight) {
    if (tripType === 'round-trip' && activeLeg === 'outbound') {
      setSelectedFlight(flight)
      setSelectedReturnFlight(null)
      setActiveLeg('return')
      setBaggageOption('included')
      const nextPassengers = createPassengerEntries(travelers, passengers)
      setPassengers(nextPassengers)
      setFilter('Recommended')
      setAirlineFilter('All airlines')
      setStopFilter('All stops')
      setPriceLimit('any')
      setDepartureFilter('Any time')
      persistFlow({
        from, to, departDate, returnDate, travelers, tripType, cabin, results, returnResults,
        selectedFlight: flight, selectedReturnFlight: null, activeLeg: 'return',
        passengers: nextPassengers, baggageOption: 'included',
      })
      window.scrollTo({ top: 0, behavior: 'smooth' })
      setNotice('')
      return
    }

    if (activeLeg === 'return') setSelectedReturnFlight(flight)
    else setSelectedFlight(flight)
    const outboundFlight = activeLeg === 'return' ? selectedFlight : flight
    const returnFlight = activeLeg === 'return' ? flight : null
    persistFlow({
      from, to, departDate, returnDate, travelers, tripType, cabin, results, returnResults,
      selectedFlight: outboundFlight, selectedReturnFlight: returnFlight, activeLeg,
      passengers, baggageOption,
    })
    setActivePassengerIndex(0)
    setSeatLeg('outbound')
    navigateTo('checkout')
    setNotice('')
  }

  function chooseSeat(seat) {
    setNotice('')
    const seatField = seatLeg === 'return' ? 'returnSeat' : 'outboundSeat'
    if (passengers.some((passenger, index) => index !== activePassengerIndex && passenger[seatField] === seat)) {
      setNotice(`Seat ${seat} is already assigned to another traveler.`)
      return
    }
    const nextPassengers = passengers.map((passenger, index) => index === activePassengerIndex
      ? { ...passenger, [seatField]: passenger[seatField] === seat ? '' : seat }
      : passenger)
    setPassengers(nextPassengers)
    persistFlow({
      from, to, departDate, returnDate, travelers, tripType, cabin, results, returnResults,
      selectedFlight, selectedReturnFlight, activeLeg, passengers: nextPassengers, baggageOption,
    })
  }

  function chooseBaggage(option) {
    setNotice('')
    setBaggageOption(option)
    persistFlow({
      from, to, departDate, returnDate, travelers, tripType, cabin, results, returnResults,
      selectedFlight, selectedReturnFlight, activeLeg, passengers, baggageOption: option,
    })
  }

  function updatePassenger(index, values) {
    setNotice('')
    const nextPassengers = passengers.map((passenger, passengerIndex) => passengerIndex === index
      ? { ...passenger, ...values }
      : passenger)
    setPassengers(nextPassengers)
    persistFlow({
      from, to, departDate, returnDate, travelers, tripType, cabin, results, returnResults,
      selectedFlight, selectedReturnFlight, activeLeg, passengers: nextPassengers, baggageOption,
    })
  }

  function choosePaymentMethod(method) {
    setPaymentMethod(method)
    setNotice('')
    setQrAcknowledged(false)
    if (method !== 'qr') setQrDataUrl('')
    if (method !== 'upi') setUpiId('')
    if (method !== 'netbanking') setBank('')
    if (method !== 'card') {
      setCardName('')
      setCardNumber('')
      setCardExpiry('')
      setCardCvc('')
    }
  }

  function completeBooking(event) {
    event.preventDefault()
    setNotice('')
    if (!selectedFlight || (tripType === 'round-trip' && !selectedReturnFlight)) {
      setNotice('Choose both outbound and return flights before checkout.')
      return
    }
    if (passengers.some((passenger) => !passenger.name.trim())) {
      setNotice('Enter the name for every traveler to continue.')
      return
    }
    if (paymentMethod === 'card') {
      const digits = cardNumber.replace(/\D/g, '')
      if (digits.length < 12 || !cardName.trim() || !cardExpiry.trim() || cardCvc.trim().length < 3) {
        setNotice('Please complete the card details to continue.')
        return
      }
    }
    if (paymentMethod === 'upi' && !/^[\w.-]{2,256}@[a-zA-Z][\w.-]{1,63}$/.test(upiId.trim())) {
      setNotice('Enter a valid demo UPI ID, such as name@bank.')
      return
    }
    if (paymentMethod === 'netbanking' && !bank) {
      setNotice('Choose a bank to continue with the demo checkout.')
      return
    }
    if (paymentMethod === 'qr' && !qrAcknowledged) {
      setNotice('Confirm that you understand this is a demo-only QR code.')
      return
    }
    const booking = {
      ...createBookingMetadata(),
      passenger: passengers[0].name.trim(),
      email: travelerEmail.trim(),
      passengers: passengers.map((passenger) => ({ ...passenger, name: passenger.name.trim() })),
      flight: selectedFlight,
      returnFlight: selectedReturnFlight,
      tripType,
      date: departDate,
      returnDate: tripType === 'round-trip' ? returnDate : '',
      travelers,
      seats: passengers.map((passenger) => passenger.outboundSeat).filter(Boolean),
      returnSeats: passengers.map((passenger) => passenger.returnSeat).filter(Boolean),
      baggageOption,
      mealPreference: passengers[0]?.meal || 'standard',
      seatTotal,
      baggageTotal,
      total,
      currency,
      paymentMethod,
      status: 'Confirmed',
      checkInStatus: 'Not checked in',
    }
    const nextBookings = [booking, ...bookings]
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextBookings))
      setBookings(nextBookings)
      setSelectedFlight(null)
      setSelectedReturnFlight(null)
      setCardName('')
      setCardNumber('')
      setCardExpiry('')
      setCardCvc('')
      setUpiId('')
      setBank('')
      setQrAcknowledged(false)
      persistFlow({
        from, to, departDate, returnDate, travelers, tripType, cabin, results, returnResults,
        passengers, selectedFlight, selectedReturnFlight, activeLeg,
      })
      navigateTo('confirmation')
    } catch (error) {
      setNotice(`We couldn't save your reservation. Please check your browser storage and try again. (${error.message})`)
    }
  }

  function openBookings() {
    setBookingLookupIds(null)
    setBookingLookup({ pnr: '', email: '' })
    setCheckInError('')
    navigateTo('bookings')
    setNotice('')
  }

  function lookupBookings(event) {
    event.preventDefault()
    setCheckInError('')
    const pnr = bookingLookup.pnr.trim().toLowerCase()
    const email = bookingLookup.email.trim().toLowerCase()
    const matches = bookings.filter((booking) => booking.id.toLowerCase() === pnr && (booking.email || '').trim().toLowerCase() === email)
    setBookingLookupIds(matches.map((booking) => booking.id))
    if (!matches.length) setCheckInError('No booking matched that PNR and email in this browser.')
  }

  function checkInBooking(bookingId) {
    const nextBookings = bookings.map((booking) => booking.id === bookingId
      ? { ...booking, checkInStatus: 'Checked in' }
      : booking)
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextBookings))
      setBookings(nextBookings)
      setNotice('Demo check-in complete. This does not create an official boarding pass.')
      setCheckInError('')
    } catch (error) {
      setCheckInError(`We couldn't update demo check-in: ${error.message}`)
    }
  }

  function printTicket(bookingId) {
    setPrintTicketId(bookingId)
  }

  function cancelBooking(bookingId) {
    const nextBookings = bookings.map((booking) => booking.id === bookingId ? { ...booking, status: 'Cancelled' } : booking)
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextBookings))
      setBookings(nextBookings)
      setNotice('Demo booking cancelled. Your PNR is retained for reference.')
    } catch (error) {
      setNotice(`We couldn't cancel this booking: ${error.message}`)
    }
  }

  function goHome() {
    navigateTo('home')
    setNotice('')
  }

  async function copyPromoCode(code) {
    setCopiedPromoCode('')
    setPromoFeedback('')
    if (!navigator.clipboard?.writeText) {
      setPromoFeedback('Clipboard access is unavailable. You can select and copy the code shown above.')
      return
    }

    try {
      await navigator.clipboard.writeText(code)
      setCopiedPromoCode(code)
      setPromoFeedback(`${code} copied. These demo offers do not change your booking total.`)
    } catch (error) {
      setPromoFeedback(`We couldn't copy ${code}: ${error.message}. You can select and copy the code above.`)
    }
  }

  function selectRoute(origin, destination) {
    setFrom(origin)
    setTo(destination)
    setDepartDate(today)
    setReturnDate('')
    setNotice('')

    if (page !== 'home') {
      navigateTo('home')
      window.setTimeout(() => {
        if (window.location.hash === ROUTES.home) {
          document.getElementById('flight-search')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 420)
      return
    }

    document.getElementById('flight-search')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  function setDestination(destination) {
    const origin = destination.route.split('→')[0].trim()
    selectRoute(origin, destination.code)
  }

  const cityGroups = ['India', 'International'].map((group) => ({
    name: group,
    cities: Object.entries(AIRPORTS).filter(([, airport]) => airport.group === group),
  }))

  return (
    <div className={`app-shell container-fluid ${page === 'home' ? 'home-page' : ''} ${printTicketId ? 'print-ticket-mode' : ''}`}>
      {storageError && <div className="storage-alert" role="alert">{storageError}</div>}
      <div className="demo-banner">
        <strong>ACADEMIC DEMO MODE</strong>
        <span>Sample airline inventory, INR pricing, and simulated Razorpay test checkout. No real airline seats or credit cards are charged.</span>
      </div>
      <header className="site-header">
        <a className="brand" href={ROUTES.home} onClick={(event) => { event.preventDefault(); goHome() }} aria-label="Skybound home">
          <span className="brand-mark"><Icon name="plane" size={19} /></span>
          <span className="brand-name">Sky<span>bound</span><small>FLY BEYOND BORDERS</small></span>
        </a>
        <button className="mobile-menu-toggle" type="button" aria-label="Toggle navigation" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          <Icon name={mobileMenuOpen ? 'close' : 'menu'} size={21} />
        </button>
        <nav className={`main-nav ${mobileMenuOpen ? 'is-open' : ''}`} aria-label="Main navigation">
          <a className={`nav-link ${page === 'home' ? 'active' : ''}`} href={ROUTES.home} onClick={(event) => { event.preventDefault(); goHome() }} aria-current={page === 'home' ? 'page' : undefined}>Home</a>
          <a className={`nav-link ${page === 'results' ? 'active' : ''}`} href={ROUTES.results} onClick={(event) => { event.preventDefault(); navigateTo('results') }} aria-current={page === 'results' ? 'page' : undefined}>Flights</a>
          <a className={`nav-link ${page === 'bookings' ? 'active' : ''}`} href={ROUTES.bookings} onClick={(event) => { event.preventDefault(); openBookings() }} aria-current={page === 'bookings' ? 'page' : undefined}>My bookings</a>
          <a className={`nav-link ${page === 'about' ? 'active' : ''}`} href={ROUTES.about} onClick={(event) => { event.preventDefault(); navigateTo('about') }} aria-current={page === 'about' ? 'page' : undefined}>About</a>
          <a className={`nav-link ${page === 'contact' ? 'active' : ''}`} href={ROUTES.contact} onClick={(event) => { event.preventDefault(); navigateTo('contact') }} aria-current={page === 'contact' ? 'page' : undefined}>Contact</a>
          <a className={`nav-link admin-link ${page === 'admin' ? 'active' : ''}`} href={ROUTES.admin} onClick={(event) => { event.preventDefault(); navigateTo('admin') }} aria-current={page === 'admin' ? 'page' : undefined}>Admin</a>
          <a className={`nav-link help-link ${page === 'help' ? 'active' : ''}`} href={ROUTES.help} onClick={(event) => { event.preventDefault(); navigateTo('help') }}>Help</a>
        </nav>
        <a className="profile-button" href={ROUTES.bookings} onClick={(event) => { event.preventDefault(); openBookings() }}><span className="profile-avatar">J</span><span>My trips</span><Icon name="chevron" size={15} /></a>
      </header>

      {loadingPage && (
        <div className="route-loader" role="status" aria-live="polite">
          <div className="route-loader-panel">
            <span className="route-loader-orbit"><Icon name="plane" size={23} /></span>
            <strong>Opening {loadingPage === 'help' ? 'Help' : loadingPage}...</strong>
            <span>Getting your next page ready</span>
            <i className="route-loader-progress" />
          </div>
        </div>
      )}

      <main aria-busy={Boolean(loadingPage)}>
        {page === 'home' && (
          <>
            <section className="hero-section">
              <div className="hero-copy">
                <div className="eyebrow"><span className="eyebrow-line" /><Icon name="plane" size={16} /> YOUR NEXT JOURNEY STARTS HERE</div>
                <h1>Find your next <span>great escape.</span></h1>
                <p>Explore sample routes, compare clear fares, and shape a trip that feels like yours — all in just a few clicks.</p>
                <div className="hero-stats">
                  <div><strong>17</strong><span>Demo destinations</span></div>
                  <div><strong>4 cabins</strong><span>From economy to first</span></div>
                  <div><strong>Your way</strong><span>One-way or return</span></div>
                  <div><strong>Zero charge</strong><span>Safe demo checkout</span></div>
                </div>
              </div>
              <div className="hero-art" aria-label="Illustration of an airplane flying toward the sunset over a mountain landscape">
                <div className="aceternity-spotlight" aria-hidden="true" />
                <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
                <div className="hero-sky-glow" aria-hidden="true" />
                <div className="hero-cloud hero-cloud-one" aria-hidden="true" />
                <div className="hero-cloud hero-cloud-two" aria-hidden="true" />
                <div className="hero-flight-trail" aria-hidden="true" />
                <div className="sun-disc" />
                <div className="hero-plane"><Icon name="aircraft" size={58} /></div>
                <div className="hero-route-label"><span className="route-dot" />DELHI TO WHEREVER YOU DREAM</div>
                <div className="mountain mountain-back" /><div className="mountain mountain-front" />
                <div className="hero-art-note"><span>01 / 04</span><span>CHASE THE HORIZON</span></div>
                <div className="hero-route-card" aria-label="Sample fare from Delhi to Mumbai from 4,499 rupees">
                  <span><i /> WEEKEND FAVOURITE</span>
                  <strong>Delhi <b>→</b> Mumbai</strong>
                  <small>Sample fares from <em>₹4,499</em></small>
                </div>
              </div>
              <div className="hero-index"><span>01</span><span className="index-rule" /><span>04</span></div>
            </section>

            <section className="search-wrap" id="flight-search">
              <div className="search-tabs">
                <button className={`trip-tab ${tripType === 'round-trip' ? 'selected' : ''}`} onClick={() => setTripType('round-trip')} type="button"><span className="radio-dot" />Round trip</button>
                <button className={`trip-tab ${tripType === 'one-way' ? 'selected' : ''}`} onClick={() => { setTripType('one-way'); setReturnDate('') }} type="button"><span className="radio-dot" />One way</button>
                <span className="search-caption"><Icon name="sparkle" size={14} /> Find your flight</span>
              </div>
              <form className="flight-search" onSubmit={startSearch}>
                <label className="search-field city-field">
                  <span className="field-label">FROM</span>
                  <span className="field-control"><Icon name="pin" size={19} /><select aria-label="Departure city" value={from} onChange={(event) => setFrom(event.target.value)}>{cityGroups.map((group) => <optgroup label={group.name} key={group.name}>{group.cities.map(([code, airport]) => <option key={code} value={code}>{airport.city} ({code})</option>)}</optgroup>)}</select></span>
                  <span className="field-sub">{AIRPORTS[from]?.name}</span>
                </label>
                <button type="button" className="swap-button" onClick={swapAirports} aria-label="Swap departure and arrival cities"><Icon name="swap" size={17} /></button>
                <label className="search-field city-field">
                  <span className="field-label">TO</span>
                  <span className="field-control"><Icon name="pin" size={19} /><select aria-label="Arrival city" value={to} onChange={(event) => setTo(event.target.value)}>{cityGroups.map((group) => <optgroup label={group.name} key={group.name}>{group.cities.map(([code, airport]) => <option key={code} value={code}>{airport.city} ({code})</option>)}</optgroup>)}</select></span>
                  <span className="field-sub">{AIRPORTS[to]?.name}</span>
                </label>
                <label className="search-field date-field">
                  <span className="field-label">DEPART</span>
                  <span className="field-control"><Icon name="calendar" size={18} /><input aria-label="Departure date" type="date" min={today} value={departDate} onChange={(event) => setDepartDate(event.target.value)} required /></span>
                  <span className="field-sub">{formatDate(departDate)}</span>
                </label>
                {tripType === 'round-trip' && <label className="search-field date-field return-field">
                  <span className="field-label">RETURN</span>
                  <span className="field-control"><Icon name="calendar" size={18} /><input aria-label="Return date" type="date" min={departDate || today} value={returnDate} onChange={(event) => setReturnDate(event.target.value)} required /></span>
                  <span className="field-sub">{formatDate(returnDate)}</span>
                </label>}
                <label className="search-field traveler-field">
                  <span className="field-label">TRAVELERS</span>
                  <span className="field-control"><Icon name="users" size={19} /><select aria-label="Number of travelers" value={travelers} onChange={(event) => setTravelers(Number(event.target.value))}>{[1, 2, 3, 4, 5, 6].map((count) => <option key={count} value={count}>{count} {count === 1 ? 'traveler' : 'travelers'}</option>)}</select></span>
                  <span className="field-sub">{cabin} · personal item included</span>
                </label>
                <label className="search-field cabin-field">
                  <span className="field-label">CABIN</span>
                  <span className="field-control"><Icon name="sparkle" size={18} /><select aria-label="Cabin class" value={cabin} onChange={(event) => setCabin(event.target.value)}>{['Economy', 'Premium Economy', 'Business', 'First Class'].map((option) => <option key={option}>{option}</option>)}</select></span>
                  <span className="field-sub">Choose your comfort level</span>
                </label>
                <div className="quick-routes">
                  <span>Quick Demo Routes:</span>
                  {[['DEL','BOM'],['BOM','BLR'],['DEL','DXB'],['BOM','SIN'],['DEL','LHR']].map(([origin, destination]) => (
                    <button type="button" key={`${origin}-${destination}`} onClick={() => selectRoute(origin, destination)}>{origin} → {destination}</button>
                  ))}
                </div>
                <button className="search-button" type="submit"><span>Search flights</span><Icon name="arrow" size={18} /></button>
              </form>
              {notice && <p className="inline-notice" role="alert">{notice}</p>}
            </section>

            <section className="destinations-section">
              <div className="section-heading">
                <div><span className="eyebrow"><span className="eyebrow-line" />CURATED FLAGSHIP ROUTES</span><h2>Popular International &amp; <span>Domestic Destinations</span></h2></div>
                <button className="text-link" onClick={() => document.getElementById('flight-search')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>Explore All-India Demo Network <Icon name="arrow" size={17} /></button>
              </div>
              <div className="destination-grid">
                {DESTINATIONS.map((destination) => {
                  const airport = AIRPORTS[destination.code]
                  const priceCurrency = 'INR'
                  return <button className="destination-card" key={destination.code} onClick={() => setDestination(destination)} aria-label={`View flights to ${airport.city}, starting from ${formatMoney(destination.price, priceCurrency)}`}>
                    <span className={`destination-image destination-${destination.art}`}>
                      <span className="destination-tag">{destination.tag}</span>
                      <span className="destination-image-city">{airport.city}</span>
                      <span className="destination-image-code">{destination.code} · {airport.country}</span>
                      <span className="destination-hover-panel" aria-hidden="true">
                        <span className="destination-hover-eyebrow">{destination.route} · {destination.detail}</span>
                        <strong>Discover {airport.city}</strong>
                        <span>{destination.description}</span>
                        <b>Explore flights <Icon name="arrow" size={14} /></b>
                      </span>
                    </span>
                    <span className="destination-info"><span><strong>{airport.city}</strong><small>{destination.country}</small></span><span className="destination-price">Economy from <b>{formatMoney(destination.price, priceCurrency)}</b></span></span>
                    <span className="destination-description">{destination.description}</span>
                    <span className="destination-footer"><span>Route: {destination.route} ({destination.detail})</span><span className="destination-book">Book Route</span></span>
                  </button>
                })}
              </div>
            </section>
            <section className="promo-section">
              <div className="promo-heading"><span>FESTIVE SEASON · WINTER 2026-27</span><h2>Celebrate the season with Skybound</h2></div>
              <p className="promo-disclaimer">Sample promo codes for the frontend demo only. They are illustrative and do not change booking prices.</p>
              <div className="promo-grid">
                {FESTIVE_OFFERS.map((offer) => <article className={`promo-card promo-${offer.style}`} key={offer.code}>
                  <div className="promo-top"><span>{offer.label}</span><strong>{offer.discount}</strong></div>
                  <h3>{offer.title}</h3>
                  <p>{offer.description}</p>
                  <div className="promo-code"><code>{offer.code}</code><button type="button" onClick={() => copyPromoCode(offer.code)}>{copiedPromoCode === offer.code ? 'Copied!' : 'Copy code'}</button></div>
                </article>)}
              </div>
              {promoFeedback && <p className="promo-feedback" role="status">{promoFeedback}</p>}
            </section>
            <section className="benefits-section">
              <div className="promo-heading"><span>Engineered For Reliability</span><h2>Why Travellers Choose Skybound</h2></div>
              <div className="benefits-grid">
                <article><span className="benefit-icon"><Icon name="shield" size={22} /></span><h3>100% transparent INR pricing</h3><p>Every fare, airport charge, and checkout component is visible before booking.</p></article>
                <article><span className="benefit-icon"><Icon name="plane" size={22} /></span><h3>Instant PNR &amp; boarding pass</h3><p>Receive a unique PNR and printable pass immediately after confirmation.</p></article>
                <article><span className="benefit-icon"><Icon name="sparkle" size={22} /></span><h3>Complimentary seat &amp; meal choice</h3><p>Choose seats and meals while reviewing your full itinerary.</p></article>
                <article><span className="benefit-icon"><Icon name="shield" size={22} /></span><h3>Safe sandbox checkout</h3><p>Test every payment option without processing real money or storing card data.</p></article>
              </div>
            </section>
            <section className="testimonials-section">
              <div className="promo-heading"><span>Verified Flyer Feedback</span><h2>What Frequent Flyers Say</h2></div>
              <div className="testimonials-grid">
                <article><div className="stars">★★★★★</div><p>“The booking flow is clear, fast, and the PNR confirmation feels complete.”</p><strong>Aarav Mehta</strong><span>Product Architect · Bengaluru</span></article>
                <article><div className="stars">★★★★★</div><p>“Cabin comparison and itinerary details make corporate travel planning effortless.”</p><strong>Dr. Naina Kapoor</strong><span>Trade Consultant · New Delhi</span></article>
                <article><div className="stars">★★★★★</div><p>“Clean typography, clear fares, and a seamless multi-passenger reservation flow.”</p><strong>Rohan Deshmukh</strong><span>UX Lead · Mumbai</span></article>
              </div>
            </section>
            <section className="bottom-promise"><div className="promise-icon"><Icon name="sparkle" size={20} /></div><p>Less planning, more <span>being there.</span></p><span>Great journeys start with a little curiosity.</span></section>
          </>
        )}

        {page === 'results' && (
          <section className="inner-page results-page">
            <button className="back-link" onClick={goHome}>← Back to search</button>
            <div className="results-heading">
              <div>
                <span className="eyebrow"><span className="eyebrow-line" />YOUR NEXT ADVENTURE</span>
                <h1>{AIRPORTS[currentLegFrom]?.city} <span className="heading-arrow">→</span> {AIRPORTS[currentLegTo]?.city} <span className="currency-chip">{getCurrency(currentLegFrom, currentLegTo)} fares</span></h1>
                <p>{formatDate(currentLegDate)} <span>·</span> {travelers} {travelers === 1 ? 'traveler' : 'travelers'} <span>·</span> {tripType === 'round-trip' ? 'Round trip' : 'One way'}</p>
              </div>
              <button className="edit-search" onClick={goHome}>Edit search <Icon name="arrow" size={16} /></button>
            </div>
            {tripType === 'round-trip' && <div className="leg-progress" aria-label="Round-trip flight selection">
              <button className={`leg-step ${activeLeg === 'outbound' ? 'active' : 'complete'}`} onClick={() => {
                setActiveLeg('outbound')
                setSelectedFlight(null)
                setSelectedReturnFlight(null)
              }} type="button"><span>01</span><strong>Outbound</strong><small>{selectedFlight ? `${selectedFlight.airline} · ${formatMoney(selectedFlight.price, currency)}` : 'Choose departure flight'}</small></button>
              <span className="leg-step-rule" />
              <button className={`leg-step ${activeLeg === 'return' ? 'active' : selectedReturnFlight ? 'complete' : ''}`} disabled={!selectedFlight} onClick={() => setActiveLeg('return')} type="button"><span>02</span><strong>Return</strong><small>{selectedReturnFlight ? `${selectedReturnFlight.airline} · ${formatMoney(selectedReturnFlight.price, currency)}` : 'Choose return flight'}</small></button>
            </div>}
            {activeLeg === 'return' && selectedFlight && <div className="chosen-flight-note">
              <span>Outbound selected: <strong>{selectedFlight.airline}</strong> · {selectedFlight.depart} → {selectedFlight.arrive} · {formatMoney(selectedFlight.price, currency)} per traveler</span>
              <button type="button" onClick={() => { setActiveLeg('outbound'); setSelectedFlight(null); setSelectedReturnFlight(null) }}>Change outbound</button>
            </div>}
            <div className="results-layout">
              <div className="flight-list">
                <div className="results-toolbar">
                  <span><strong>{visibleResults.length} flights</strong> found for {activeLeg === 'return' ? 'your return' : 'your departure'}</span>
                  <label>Sort by <select aria-label="Sort flights" value={filter} onChange={(event) => setFilter(event.target.value)}><option>Recommended</option><option>Lowest price</option><option>Earliest departure</option></select></label>
                </div>
                <div className="flight-filters">
                  <label>Airline<select aria-label="Filter by airline" value={airlineFilter} onChange={(event) => setAirlineFilter(event.target.value)}>
                    <option>All airlines</option>{Array.from(new Set(currentResults.map((flight) => flight.airline))).map((airline) => <option key={airline}>{airline}</option>)}
                  </select></label>
                  <label>Stops<select aria-label="Filter by stops" value={stopFilter} onChange={(event) => setStopFilter(event.target.value)}><option>All stops</option><option>Nonstop</option><option>1 stop</option></select></label>
                  <label>Departure<select aria-label="Filter by departure time" value={departureFilter} onChange={(event) => setDepartureFilter(event.target.value)}><option>Any time</option><option>Morning</option><option>Afternoon</option><option>Evening</option></select></label>
                  <label>Max fare<select aria-label="Filter by maximum fare" value={priceLimit} onChange={(event) => setPriceLimit(event.target.value)}>
                    <option value="any">Any price</option>
                    {(currentResults[0]?.currency === 'INR' ? [5000, 6000, 10000, 20000] : [250, 350, 500, 1000]).map((price) => <option value={price} key={price}>Up to {formatMoney(price, currentResults[0]?.currency || currency)}</option>)}
                  </select></label>
                </div>
                {visibleResults.length ? visibleResults.map((flight, index) => <article className={`flight-card ${index === 0 && filter === 'Recommended' ? 'recommended' : ''}`} key={flight.id}>
                  {index === 0 && filter === 'Recommended' && <span className="best-badge"><Icon name="sparkle" size={13} /> BEST VALUE</span>}
                  <div className={`airline-mark ${flight.color}`}>{flight.initials}</div>
                  <div className="flight-airline"><strong>{flight.airline}</strong><span>{flight.cabin} · {flight.id.split('-')[1]}</span></div>
                  <div className="flight-times"><strong>{flight.depart}</strong><div className="flight-duration"><span>{flight.duration}</span><span className="duration-rule"><i /></span><span>{flight.stops}</span></div><strong>{flight.arrive}</strong></div>
                  <div className="flight-price"><strong>{formatMoney(flight.price, flight.currency)}</strong><span>per traveler · {flight.currency}</span></div>
                  <button className="select-flight" onClick={() => chooseFlight(flight)}>{tripType === 'round-trip' ? activeLeg === 'outbound' ? 'Choose outbound' : 'Choose return' : 'Select flight'} <Icon name="arrow" size={16} /></button>
                </article>) : <div className="no-flights"><strong>No flights match these filters.</strong><span>Adjust your filters to see more sample schedules.</span><button type="button" onClick={() => { setAirlineFilter('All airlines'); setStopFilter('All stops'); setPriceLimit('any'); setDepartureFilter('Any time') }}>Clear filters</button></div>}
                <p className="demo-disclaimer">Sample fares shown for demo purposes. Prices may vary.</p>
              </div>
              <aside className="results-aside"><div className="aside-sparkle"><Icon name="sparkle" size={20} /></div><span className="eyebrow">A LITTLE EXTRA</span><h3>Travel your way.</h3><p>Every fare includes a personal item, flexible changes, and support when you need it.</p><div className="aside-feature"><Icon name="bag" size={17} /><span>Personal item included</span></div><div className="aside-feature"><Icon name="shield" size={17} /><span>Protected booking</span></div></aside>
            </div>
          </section>
        )}

        {page === 'checkout' && !selectedFlight && (
          <section className="inner-page empty-bookings"><span className="empty-icon"><Icon name="plane" size={25} /></span><h2>Choose a flight first</h2><p>Your checkout is ready when you select a flight from the results.</p><button className="pay-button" onClick={goHome}>Search flights <Icon name="arrow" size={18} /></button></section>
        )}

        {page === 'checkout' && selectedFlight && (
          <section className="inner-page checkout-page">
            <button className="back-link" onClick={() => { if (tripType === 'round-trip') { setActiveLeg('return'); setSelectedReturnFlight(null) } navigateTo('results') }}>← Back to flights</button>
            <div className="checkout-heading"><span className="eyebrow"><span className="eyebrow-line" />ALMOST THERE</span><h1>Make it <span>official.</span></h1><p>Your next favorite story is just a few details away.</p></div>
            <div className="checkout-layout">
              <form className="checkout-form" onSubmit={completeBooking}>
                <section className="checkout-section"><div className="checkout-section-title"><span className="step-number">01</span><div><h2>Traveler details</h2><p>Make sure it matches your travel ID.</p></div></div>
                  <div className="passenger-details-grid">
                    {passengers.map((passenger, index) => <label className="form-field" key={`traveler-${index}`}>Traveler {index + 1} full name<input className="form-control" required autoComplete={index === 0 ? 'name' : 'off'} value={passenger.name} onChange={(event) => updatePassenger(index, { name: event.target.value })} placeholder={index === 0 ? 'e.g. Jordan Lee' : `Traveler ${index + 1} name`} /></label>)}
                    <label className="form-field">Contact email<input className="form-control" required type="email" autoComplete="email" value={travelerEmail} onChange={(event) => setTravelerEmail(event.target.value)} placeholder="you@example.com" /></label>
                  </div>
                </section>
                <section className="checkout-section trip-options-section">
                  <div className="checkout-section-title"><span className="step-number">02</span><div><h2>Customize your trip</h2><p>Choose seats, checked baggage, and meals for your flight.</p></div></div>
                  <div className="passenger-tabs" role="tablist" aria-label="Choose traveler for preferences">
                    {passengers.map((passenger, index) => <button
                      aria-selected={activePassengerIndex === index}
                      className={`passenger-tab ${activePassengerIndex === index ? 'selected' : ''}`}
                      key={`passenger-tab-${index}`}
                      onClick={() => setActivePassengerIndex(index)}
                      role="tab"
                      type="button"
                    >Traveler {index + 1}{passenger.name ? ` · ${passenger.name}` : ''}</button>)}
                  </div>
                  <div className="trip-option-block">
                    <div className="trip-option-heading"><strong>Choose a seat for {activePassenger.name || `Traveler ${activePassengerIndex + 1}`}</strong><span>{formatMoney(seatPrice, currency)} per seat, per leg</span></div>
                    {selectedReturnFlight && <div className="seat-leg-tabs" role="tablist" aria-label="Choose which flight leg to assign a seat">
                      <button aria-pressed={seatLeg === 'outbound'} className={seatLeg === 'outbound' ? 'selected' : ''} onClick={() => setSeatLeg('outbound')} type="button">Outbound · {formatDate(departDate)}</button>
                      <button aria-pressed={seatLeg === 'return'} className={seatLeg === 'return' ? 'selected' : ''} onClick={() => setSeatLeg('return')} type="button">Return · {formatDate(returnDate)}</button>
                    </div>}
                    <div className="seat-legend"><span><i className="seat-legend-available" />Available</span><span><i className="seat-legend-selected" />Selected</span><span><i className="seat-legend-unavailable" />Unavailable</span></div>
                    <div className="seat-map" role="group" aria-label="Select seats for your flight">
                      <div className="seat-column-headings"><span className="seat-row-spacer" /><div className="seat-row-seats">{SEAT_COLUMNS.map((column) => <span className={column === 'D' ? 'aisle-column' : ''} key={column}>{column}</span>)}</div></div>
                      {SEAT_ROWS.map((row) => (
                        <div className="seat-row" key={row}>
                          <span className="seat-row-number">{row}</span>
                          <div className="seat-row-seats">
                            {SEAT_COLUMNS.map((column) => {
                              const seat = `${row}${column}`
                              const unavailable = UNAVAILABLE_SEATS.includes(seat) || assignedSeats.includes(seat)
                              const selected = activePassenger[currentSeatField] === seat
                              return <button
                                aria-label={`Seat ${seat}, ${unavailable ? 'unavailable or assigned' : selected ? 'selected' : 'available'}`}
                                aria-pressed={selected}
                                className={`seat-button ${column === 'D' ? 'aisle-column' : ''} ${unavailable ? 'unavailable' : ''} ${selected ? 'selected' : ''}`}
                                disabled={UNAVAILABLE_SEATS.includes(seat) || (assignedSeats.includes(seat) && !selected)}
                                key={seat}
                                onClick={() => chooseSeat(seat)}
                                type="button"
                              >{seat}</button>
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="trip-option-hint">{passengers.filter((passenger) => passenger[currentSeatField]).length} of {travelers} travelers have a seat for this leg. Seat selection is optional and simulated.</p>
                  </div>
                  <div className="trip-option-block">
                    <div className="trip-option-heading"><strong>Checked baggage</strong><span>Per traveler, for each flight leg · personal item included</span></div>
                    <div className="option-card-grid baggage-options">
                      {BAGGAGE_OPTIONS.map((option) => {
                        const price = currency === 'INR' ? option.inr : option.usd
                        return <button
                          aria-pressed={baggageOption === option.id}
                          className={`trip-choice-card ${baggageOption === option.id ? 'selected' : ''}`}
                          key={option.id}
                          onClick={() => chooseBaggage(option.id)}
                          type="button"
                        >
                          <span className="trip-choice-icon"><Icon name="luggage" size={17} /></span>
                          <strong>{option.label}</strong>
                          <small>{option.detail}</small>
                          <b>{price ? `+${formatMoney(price, currency)} / traveler` : 'No extra charge'}</b>
                        </button>
                      })}
                    </div>
                  </div>
                  <div className="trip-option-block">
                    <div className="trip-option-heading"><strong>Meal for {activePassenger.name || `Traveler ${activePassengerIndex + 1}`}</strong><span>Included for this flight</span></div>
                    <div className="option-card-grid meal-options">
                      {MEAL_OPTIONS.map((option) => (
                        <button
                          aria-pressed={activePassenger.meal === option.id}
                          className={`trip-choice-card meal-choice ${activePassenger.meal === option.id ? 'selected' : ''}`}
                          key={option.id}
                          onClick={() => updatePassenger(activePassengerIndex, { meal: option.id })}
                          type="button"
                        >
                          <span className="meal-choice-indicator" />
                          <strong>{option.label}</strong>
                          <small>{option.detail}</small>
                        </button>
                      ))}
                    </div>
                  </div>
                </section>
                <section className="checkout-section payment-section"><div className="checkout-section-title"><span className="step-number">03</span><div><h2>Payment</h2><p>Choose an option for the demo checkout.</p></div></div>
                  <div className="payment-methods" role="tablist" aria-label="Payment method">
                    <button type="button" role="tab" aria-selected={paymentMethod === 'upi'} className={`payment-method ${paymentMethod === 'upi' ? 'selected' : ''}`} onClick={() => choosePaymentMethod('upi')}><span className="method-symbol">U</span><span>UPI</span></button>
                    <button type="button" role="tab" aria-selected={paymentMethod === 'netbanking'} className={`payment-method ${paymentMethod === 'netbanking' ? 'selected' : ''}`} onClick={() => choosePaymentMethod('netbanking')}><span className="method-symbol">N</span><span>Net banking</span></button>
                    <button type="button" role="tab" aria-selected={paymentMethod === 'qr'} className={`payment-method ${paymentMethod === 'qr' ? 'selected' : ''}`} onClick={() => choosePaymentMethod('qr')}><span className="method-symbol">▦</span><span>QR code</span></button>
                    <button type="button" role="tab" aria-selected={paymentMethod === 'card'} className={`payment-method ${paymentMethod === 'card' ? 'selected' : ''}`} onClick={() => choosePaymentMethod('card')}><span className="method-symbol">▭</span><span>Card</span></button>
                  </div>
                  {paymentMethod === 'upi' && <div className="payment-panel" role="tabpanel">
                    <label className="form-field">UPI ID<input className="form-control" autoComplete="off" value={upiId} onChange={(event) => setUpiId(event.target.value)} placeholder="yourname@bank" /></label>
                    <p className="payment-panel-hint">Enter any valid-format UPI ID to preview the demo flow. No UPI request will be sent.</p>
                  </div>}
                  {paymentMethod === 'netbanking' && <div className="payment-panel" role="tabpanel">
                    <label className="form-field">Choose your bank<select className="form-select" value={bank} onChange={(event) => setBank(event.target.value)}><option value="">Select a bank</option><option value="state-bank">State Bank of India</option><option value="hdfc">HDFC Bank</option><option value="icici">ICICI Bank</option><option value="axis">Axis Bank</option><option value="other">Other bank</option></select></label>
                    <p className="payment-panel-hint">A real checkout would securely redirect to your bank. This demo does not connect to banks.</p>
                  </div>}
                  {paymentMethod === 'qr' && <div className="payment-panel qr-panel" role="tabpanel">
                    {qrDataUrl ? <img className="payment-qr" src={qrDataUrl} alt="Demo-only QR code containing a Skybound sample order reference and amount" /> : <div className="qr-loading" role="status">Generating demo QR code…</div>}
                    <strong>Demo QR · {DEMO_ORDER_ID}</strong>
                    <p>For display/testing only. This is not a UPI payment QR—scanning it will not transfer money.</p>
                    <label className="qr-acknowledgement"><input type="checkbox" checked={qrAcknowledged} onChange={(event) => setQrAcknowledged(event.target.checked)} />I understand this QR code is for demo purposes only.</label>
                  </div>}
                  {paymentMethod === 'card' && <div className="payment-panel" role="tabpanel">
                    <div className="card-brands">VISA · MC · AMEX</div>
                    <label className="form-field">Name on card<input className="form-control" autoComplete="cc-name" value={cardName} onChange={(event) => setCardName(event.target.value)} placeholder="Name as it appears on card" /></label>
                    <label className="form-field">Card number<input className="form-control" inputMode="numeric" autoComplete="cc-number" maxLength={23} value={cardNumber} onChange={(event) => setCardNumber(event.target.value.replace(/[^\d ]/g, '').slice(0, 19))} placeholder="0000  0000  0000  0000" /></label>
                    <div className="form-row payment-row"><label className="form-field">Expiry date<input className="form-control" autoComplete="cc-exp" maxLength={5} value={cardExpiry} onChange={(event) => setCardExpiry(event.target.value.replace(/[^\d/]/g, '').slice(0, 5))} placeholder="MM / YY" /></label><label className="form-field">Security code<input className="form-control" inputMode="numeric" autoComplete="cc-csc" maxLength={4} value={cardCvc} onChange={(event) => setCardCvc(event.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="CVC" /></label></div>
                    <div className="demo-payment-note"><Icon name="shield" size={17} /><span>Demo only — no payment is processed and card details are never saved.</span></div>
                  </div>}
                  <div className="demo-payment-note payment-security-note"><Icon name="shield" size={17} /><span>Frontend demo only. UPI, bank, QR, and card options do not process real payments.</span></div>
                </section>
                {notice && <p className="inline-notice" role="alert">{notice}</p>}
                <button className="pay-button" type="submit"><span>Confirm demo booking · {formatMoney(total, currency)}</span><Icon name="arrow" size={18} /></button>
                <p className="checkout-terms">By continuing, you agree to our <a href="mailto:concierge@skybound-demo.in">booking terms</a>.</p>
              </form>
              <aside className="booking-summary">
                <span className="eyebrow">YOUR ITINERARY</span>
                {[{ label: 'Outbound', flight: selectedFlight, date: departDate }, ...(selectedReturnFlight ? [{ label: 'Return', flight: selectedReturnFlight, date: returnDate }] : [])].map((leg) => (
                  <div className="summary-leg" key={leg.label}>
                    <span className="summary-leg-label">{leg.label} · {formatDate(leg.date)}</span>
                    <div className="summary-route"><div><strong>{leg.flight.depart}</strong><b>{leg.flight.from}</b><span>{AIRPORTS[leg.flight.from]?.city}</span></div><div className="summary-route-line"><Icon name="plane" size={16} /><span>{leg.flight.duration}</span></div><div><strong>{leg.flight.arrive}</strong><b>{leg.flight.to}</b><span>{AIRPORTS[leg.flight.to]?.city}</span></div></div>
                    <div className="summary-airline"><span className={`airline-mark ${leg.flight.color}`}>{leg.flight.initials}</span><span><strong>{leg.flight.airline}</strong><small>{leg.flight.cabin} · {leg.flight.stops}</small></span></div>
                  </div>
                ))}
                <div className="summary-divider" />
                <div className="price-line"><span>Flights · {travelers} {travelers === 1 ? 'traveler' : 'travelers'}</span><span>{formatMoney(flightFareTotal, currency)}</span></div>
                <div className="price-line"><span>Taxes &amp; fees</span><span>{formatMoney(serviceFee * travelers * tripLegCount, currency)}</span></div>
                <div className="price-line"><span>Seat selection · {seatCount}</span><span>{formatMoney(seatTotal, currency)}</span></div>
                <div className="price-line"><span>{baggage.label} · {travelers} × {tripLegCount} leg{tripLegCount === 1 ? '' : 's'}</span><span>{formatMoney(baggageTotal, currency)}</span></div>
                <div className="price-line"><span>Meals · {travelers} traveler{travelers === 1 ? '' : 's'}</span><span>Included</span></div>
                <div className="summary-divider" />
                <div className="price-line total-line"><strong>Total</strong><strong>{formatMoney(total, currency)}</strong></div>
                <p className="summary-footnote"><Icon name="shield" size={15} /> Sample fares. No real payment is processed.</p>
              </aside>
            </div>
          </section>
        )}

        {page === 'confirmation' && (
          <section className="inner-page confirmation-page">
            <div className="confirmation-card ticket-confirmation-card">
              <span className="confirmation-check"><Icon name="check" size={28} /></span>
              <span className="eyebrow">IT'S REALLY HAPPENING</span>
              <h1>You're going <span>places.</span></h1>
              <p>Your demo reservation is saved on this device. Here is your printable e-ticket.</p>
              {bookings[0] && <TicketPass booking={bookings[0]} onPrint={printTicket} printTarget={printTicketId === bookings[0].id} />}
              <button className="pay-button confirmation-button" onClick={openBookings}>View my bookings <Icon name="arrow" size={18} /></button>
              <button className="text-link confirmation-home" onClick={goHome}>Back to explore</button>
            </div>
          </section>
        )}

        {page === 'bookings' && (
          <section className="inner-page bookings-page">
            <span className="eyebrow"><span className="eyebrow-line" />YOUR TRAVEL JOURNAL</span>
            <h1>My <span>bookings.</span></h1>
            <p className="bookings-intro">Find a saved trip with its PNR and contact email, then view its demo ticket or status.</p>
            {notice && <p className="inline-notice" role="alert">{notice}</p>}
            <form className="booking-lookup" onSubmit={lookupBookings}>
              <label className="form-field">PNR / booking reference<input className="form-control" required value={bookingLookup.pnr} onChange={(event) => setBookingLookup({ ...bookingLookup, pnr: event.target.value })} placeholder="e.g. SV12345678" /></label>
              <label className="form-field">Contact email<input className="form-control" required type="email" value={bookingLookup.email} onChange={(event) => setBookingLookup({ ...bookingLookup, email: event.target.value })} placeholder="Email used at checkout" /></label>
              <button className="pay-button" type="submit">Find booking <Icon name="arrow" size={17} /></button>
              {bookingLookupIds !== null && <button className="clear-lookup" type="button" onClick={() => { setBookingLookupIds(null); setBookingLookup({ pnr: '', email: '' }); setCheckInError('') }}>Show all saved bookings</button>}
            </form>
            {checkInError && <p className="inline-notice" role="alert">{checkInError}</p>}
            {visibleBookings.length ? <div className="saved-bookings">{visibleBookings.map((booking) => <article className="saved-booking" key={booking.id}>
              <div className="saved-booking-top"><span className={`booking-status ${booking.status === 'Cancelled' ? 'cancelled' : ''}`}><i />{booking.status}</span><span>PNR · {booking.id}</span></div>
              <div className="saved-itineraries">
                {[{ label: 'Outbound', flight: booking.flight, date: booking.date }, ...(booking.returnFlight ? [{ label: 'Return', flight: booking.returnFlight, date: booking.returnDate }] : [])].map((leg) => <div className="saved-itinerary-leg" key={leg.label}>
                  <div className="saved-itinerary-heading"><strong>{leg.label}</strong><span>{formatDate(leg.date)} · {getDemoFlightStatus(leg.date)} (demo)</span></div>
                  <div className="saved-route"><div><strong>{leg.flight.from}</strong><span>{AIRPORTS[leg.flight.from]?.city} · {leg.flight.depart}</span></div><div className="saved-route-line"><span>{leg.flight.airline}</span><i /><span>{leg.flight.duration}</span></div><div><strong>{leg.flight.to}</strong><span>{AIRPORTS[leg.flight.to]?.city} · {leg.flight.arrive}</span></div></div>
                </div>)}
              </div>
              <div className="saved-booking-bottom"><span>{booking.passenger} · {booking.travelers} {booking.travelers === 1 ? 'traveler' : 'travelers'} · {booking.flight.cabin}</span><strong>{formatMoney(booking.total, booking.currency || booking.flight.currency || 'USD')}</strong></div>
              <p className="saved-booking-options">
                Seats: {booking.passengers?.some((passenger) => passenger.outboundSeat || passenger.returnSeat)
                  ? booking.passengers.map((passenger) => [passenger.outboundSeat, passenger.returnSeat].filter(Boolean).join(' / ')).filter(Boolean).join(', ')
                  : booking.seats?.length ? booking.seats.join(', ') : 'Not selected'}
                {' · '}Baggage: {BAGGAGE_OPTIONS.find((option) => option.id === booking.baggageOption)?.label || 'Personal item'}
                {' · '}Check-in: {booking.checkInStatus || 'Not checked in'}
              </p>
              <details className="ticket-disclosure"><summary>View demo e-ticket and QR</summary><TicketPass booking={booking} onPrint={printTicket} printTarget={printTicketId === booking.id} /></details>
              <div className="booking-actions">
                {booking.status !== 'Cancelled' && booking.checkInStatus !== 'Checked in' && <button type="button" onClick={() => checkInBooking(booking.id)}>Demo check-in</button>}
                {booking.status !== 'Cancelled' && <button type="button" className="cancel-button" onClick={() => cancelBooking(booking.id)}>Cancel demo booking</button>}
              </div>
            </article>)}</div> : bookingLookupIds !== null
              ? <div className="empty-bookings"><span className="empty-icon"><Icon name="pin" size={25} /></span><h2>No matching booking</h2><p>Check that the PNR and checkout email match a booking saved in this browser.</p></div>
              : <div className="empty-bookings"><span className="empty-icon"><Icon name="plane" size={25} /></span><h2>No trips on the horizon. Yet.</h2><p>Your booked flights will find a home here. Where will you go first?</p><button className="pay-button" onClick={goHome}>Find your next flight <Icon name="arrow" size={18} /></button></div>}
          </section>
        )}

        {page === 'about' && (
          <section className="inner-page feature-page">
            <span className="eyebrow"><span className="eyebrow-line" />FULL-STACK DEMO PLATFORM</span>
            <h1>Built for thoughtful <span>journeys.</span></h1>
            <p className="help-intro">A React and Vite reservation experience with local PNR persistence, fare transparency, and a complete simulated checkout.</p>
            <div className="feature-grid">
              <article><strong>115+</strong><h2>Demo airports</h2><p>Domestic and international route coverage in a consistent searchable inventory.</p></article>
              <article><strong>4</strong><h2>Cabin choices</h2><p>Economy, Premium Economy, Business, and First Class booking selections.</p></article>
              <article><strong>PNR</strong><h2>Local reservation vault</h2><p>Bookings remain in browser storage for later viewing and cancellation.</p></article>
              <article><strong>0</strong><h2>Real payments</h2><p>UPI, QR, bank, and card screens are safe frontend demonstrations only.</p></article>
            </div>
          </section>
        )}

        {page === 'contact' && (
          <section className="inner-page contact-page">
            <span className="eyebrow"><span className="eyebrow-line" />TRAVEL DESK</span>
            <h1>Send us a <span>message.</span></h1>
            <div className="contact-layout">
              <aside className="contact-details"><h2>Concierge desk</h2><p>Skybound House, Aerocity, New Delhi 110037</p><p>+91 (011) 4090-8800</p><p>concierge@skybound-demo.in</p></aside>
              <form className="contact-form" onSubmit={(event) => { event.preventDefault(); event.currentTarget.reset(); setNotice('Your demo inquiry has been recorded. No real message was sent.') }}>
                <label className="form-field">Your name<input className="form-control" required name="name" /></label>
                <label className="form-field">Email address<input className="form-control" required type="email" name="email" /></label>
                <label className="form-field">PNR reference (optional)<input className="form-control" name="pnr" /></label>
                <label className="form-field">Message<textarea className="form-control" required name="message" rows={5} /></label>
                <button className="pay-button" type="submit">Submit demo inquiry <Icon name="arrow" size={18} /></button>
                {notice && <p className="inline-notice" role="alert">{notice}</p>}
              </form>
            </div>
          </section>
        )}

        {page === 'admin' && (
          <section className="inner-page admin-page">
            <span className="eyebrow"><span className="eyebrow-line" />OPERATIONS VIEW</span>
            <h1>Reservation <span>operations.</span></h1>
            <div className="admin-metrics">
              <article><span>Total reservations</span><strong>{bookings.length}</strong></article>
              <article><span>Confirmed</span><strong>{bookings.filter((booking) => booking.status === 'Confirmed').length}</strong></article>
              <article><span>Demo revenue</span><strong>{formatMoney(bookings.filter((booking) => booking.status !== 'Cancelled').reduce((sum, booking) => sum + (booking.total || 0), 0), 'INR')}</strong></article>
            </div>
            <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>PNR</th><th>Passenger</th><th>Route</th><th>Cabin</th><th>Status</th><th>Amount</th></tr></thead><tbody>{bookings.map((booking) => <tr key={booking.id}><td>{booking.id}</td><td>{booking.passenger}</td><td>{booking.flight.from} → {booking.flight.to}</td><td>{booking.flight.cabin}</td><td>{booking.status}</td><td>{formatMoney(booking.total, booking.currency || 'INR')}</td></tr>)}</tbody></table>{!bookings.length && <p className="admin-empty">No reservations in the local PNR vault.</p>}</div>
          </section>
        )}

        {page === 'help' && (
          <section className="inner-page help-page">
            <span className="eyebrow"><span className="eyebrow-line" />HERE FOR YOUR JOURNEY</span>
            <h1>How can we <span>help?</span></h1>
            <p className="help-intro">Quick answers for searching, booking, and managing your Skybound demo trip.</p>
            <div className="help-layout">
              <div className="help-faq">
                <h2>Frequently asked questions</h2>
                <details className="help-question">
                  <summary>How do I find a flight?</summary>
                  <p>Go to Explore, choose your departure and arrival cities, select a departure date and traveler count, then select <strong>Search flights</strong>. Choose a flight from the results to continue.</p>
                </details>
                <details className="help-question">
                  <summary>Can I book a one-way trip?</summary>
                  <p>Yes. On the Explore page, select <strong>One way</strong> before searching. Round trips require a return date on or after your departure date.</p>
                </details>
                <details className="help-question">
                  <summary>Are these flights and prices real?</summary>
                  <p>No. Flight schedules and fares are sample data for this frontend demo and are not live or bookable.</p>
                </details>
                <details className="help-question">
                  <summary>Does checkout process a real payment?</summary>
                  <p>No. Card, UPI, net banking, and QR options are for demonstration only. No payment is processed, and you should not enter real payment details.</p>
                </details>
                <details className="help-question">
                  <summary>Where can I find a booking I made?</summary>
                  <p>Open <strong>My bookings</strong> in the navigation. Demo reservations are saved in this browser on this device, so they may not appear in another browser or after browser storage is cleared.</p>
                </details>
                <details className="help-question">
                  <summary>Can I use the ticket or check in for a real flight?</summary>
                  <p>No. The printable ticket, QR code, flight status, and check-in are simulated for this frontend demo and are not valid for travel.</p>
                </details>
              </div>
              <aside className="help-contact">
                <span className="help-contact-icon"><Icon name="sparkle" size={20} /></span>
                <h2>Need a hand?</h2>
                <p>This is a frontend demo, so live customer support and real booking changes aren't available. You can still explore the sample booking flow or view reservations saved in this browser.</p>
                <button className="pay-button" onClick={goHome}>Explore flights <Icon name="arrow" size={18} /></button>
                <button className="help-bookings-link" onClick={openBookings}>Go to my bookings</button>
              </aside>
            </div>
          </section>
        )}
      </main>

      <footer className="site-footer">
        <div className="footer-main">
          <div className="footer-about"><a className="brand footer-brand" href={ROUTES.home} onClick={(event) => { event.preventDefault(); goHome() }}><span className="brand-mark"><Icon name="plane" size={17} /></span><span className="brand-name">Sky<span>bound</span><small>FLY BEYOND BORDERS</small></span></a><p>Modern React flight reservation demo with transparent fares, instant PNRs, and simulated checkout.</p></div>
          <div><h3>Quick Links</h3><button type="button" onClick={goHome}>Search Flights</button><button type="button" onClick={() => navigateTo('results')}>Available Schedules</button><button type="button" onClick={openBookings}>Manage PNR Bookings</button><button type="button" onClick={() => navigateTo('about')}>Fleet &amp; Architecture</button></div>
          <div><h3>Popular Routes</h3>{[['DEL', 'BOM', 'Delhi → Mumbai'], ['BOM', 'BLR', 'Mumbai → Bengaluru'], ['DEL', 'DXB', 'Delhi → Dubai'], ['BOM', 'SIN', 'Mumbai → Singapore'], ['DEL', 'LHR', 'Delhi → London']].map(([origin, destination, label]) => <button type="button" key={`${origin}-${destination}`} onClick={() => selectRoute(origin, destination)}>{label}</button>)}</div>
          <div><h3>Aviation Support</h3><span>Skybound House, Aerocity</span><span>New Delhi 110037</span><span>+91 (011) 4090-8800</span><span>concierge@skybound-demo.in</span></div>
        </div>
        <div className="footer-bottom"><span>© 2026 Skybound Aviation Systems</span><span>Demo Environment · No real payments</span></div>
      </footer>
    </div>
  )
}

export default App
