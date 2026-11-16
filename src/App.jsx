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

const STORAGE_KEY = 'skybound-bookings'
const FLOW_STORAGE_KEY = 'skybound-search-flow'
const DEMO_ORDER_ID = 'SB-DEMO-ONLY'
const ROUTES = { home: '#/explore', results: '#/flights', checkout: '#/checkout', confirmation: '#/confirmation', bookings: '#/bookings', help: '#/help' }

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
    id: `SB${timestamp.toString().slice(-8)}`,
    createdAt: new Date(timestamp).toISOString(),
  }
}

const DESTINATIONS = [
  { code: 'GOI', country: 'INDIA', tag: 'SUN, SAND & SLOW DAYS', price: 4299, art: 'goa' },
  { code: 'BLR', country: 'INDIA', tag: 'COFFEE & CREATIVE ENERGY', price: 3899, art: 'bengaluru' },
  { code: 'DEL', country: 'INDIA', tag: 'HISTORY IN EVERY LANE', price: 4599, art: 'delhi' },
  { code: 'SIN', country: 'SINGAPORE', tag: 'A CITY THAT SPARKS', price: 189, art: 'singapore' },
  { code: 'DXB', country: 'UAE', tag: 'DESERT MEETS THE SKY', price: 229, art: 'dubai' },
  { code: 'LHR', country: 'UNITED KINGDOM', tag: 'OLD SOUL, NEW STORIES', price: 419, art: 'london' },
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

function createFlightResults(from, to) {
  const currency = getCurrency(from, to)
  return FLIGHTS.map((flight, index) => {
    const price = currency === 'INR'
      ? [5299, 6199, 5799, 4899, 4499][index]
      : flight.price + (from === 'DEL' && to === 'LHR' ? 110 : 35 + (index * 12))
    return { ...flight, from, to, price, currency }
  })
}

function App() {
  const [flowData] = useState(readFlowData)
  const [page, setPage] = useState(() => pageFromHash(window.location.hash))
  const [loadingPage, setLoadingPage] = useState('')
  const navigationTimer = useRef(null)
  const [from, setFrom] = useState(flowData.from || 'DEL')
  const [to, setTo] = useState(flowData.to || 'BOM')
  const [departDate, setDepartDate] = useState(flowData.departDate || '')
  const [returnDate, setReturnDate] = useState(flowData.returnDate || '')
  const [travelers, setTravelers] = useState(flowData.travelers || 1)
  const [tripType, setTripType] = useState(flowData.tripType || 'round-trip')
  const [results, setResults] = useState(() => flowData.results || [])
  const [selectedFlight, setSelectedFlight] = useState(flowData.selectedFlight || null)
  const [storedData] = useState(readStoredBookings)
  const [bookings, setBookings] = useState(storedData.bookings)
  const storageError = storedData.error
  const [notice, setNotice] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [travelerName, setTravelerName] = useState('')
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

  const today = TODAY
  const currency = selectedFlight?.currency || getCurrency(from, to)
  const serviceFee = currency === 'INR' ? 650 : 36
  const total = selectedFlight ? selectedFlight.price * travelers + serviceFee * travelers : 0

  const visibleResults = useMemo(() => {
    if (filter === 'Lowest price') return [...results].sort((a, b) => a.price - b.price)
    if (filter === 'Earliest departure') return [...results].sort((a, b) => a.depart.localeCompare(b.depart))
    return results
  }, [filter, results])

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
    if (tripType === 'round-trip' && returnDate && returnDate < departDate) {
      setNotice('Your return date must be after your departure date.')
      return
    }
    const nextResults = createFlightResults(from, to)
    setResults(nextResults)
    setSelectedFlight(null)
    persistFlow({ from, to, departDate, returnDate, travelers, tripType, results: nextResults })
    navigateTo('results')
  }

  function swapAirports() {
    setFrom(to)
    setTo(from)
  }

  function chooseFlight(flight) {
    setSelectedFlight(flight)
    persistFlow({ from, to, departDate, returnDate, travelers, tripType, results, selectedFlight: flight })
    navigateTo('checkout')
    setNotice('')
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
    if (!selectedFlight) return
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
      passenger: travelerName.trim(),
      email: travelerEmail.trim(),
      flight: selectedFlight,
      date: departDate,
      travelers,
      total,
      currency,
      paymentMethod,
      status: 'Confirmed',
    }
    const nextBookings = [booking, ...bookings]
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextBookings))
      setBookings(nextBookings)
      setSelectedFlight(null)
      setCardName('')
      setCardNumber('')
      setCardExpiry('')
      setCardCvc('')
      setUpiId('')
      setBank('')
      setQrAcknowledged(false)
      persistFlow({ from, to, departDate, returnDate, travelers, tripType, results, selectedFlight })
      navigateTo('confirmation')
    } catch (error) {
      setNotice(`We couldn't save your reservation. Please check your browser storage and try again. (${error.message})`)
    }
  }

  function openBookings() {
    navigateTo('bookings')
    setNotice('')
  }

  function goHome() {
    navigateTo('home')
    setNotice('')
  }

  function setDestination(code) {
    setFrom(code === 'DEL' ? 'BOM' : 'DEL')
    setTo(code)
    setDepartDate('')
    navigateTo('home')
    document.getElementById('flight-search')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const cityGroups = ['India', 'International'].map((group) => ({
    name: group,
    cities: Object.entries(AIRPORTS).filter(([, airport]) => airport.group === group),
  }))

  return (
    <div className="app-shell container-fluid">
      {storageError && <div className="storage-alert" role="alert">{storageError}</div>}
      <header className="site-header">
        <a className="brand" href={ROUTES.home} onClick={(event) => { event.preventDefault(); goHome() }} aria-label="Skybound home">
          <span className="brand-mark"><Icon name="plane" size={19} /></span>
          <span>skybound<span className="brand-period">.</span></span>
        </a>
        <button className="mobile-menu-toggle" type="button" aria-label="Toggle navigation" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          <Icon name={mobileMenuOpen ? 'close' : 'menu'} size={21} />
        </button>
        <nav className={`main-nav ${mobileMenuOpen ? 'is-open' : ''}`} aria-label="Main navigation">
          <a className={`nav-link ${page === 'home' ? 'active' : ''}`} href={ROUTES.home} onClick={(event) => { event.preventDefault(); goHome() }}>Explore</a>
          <a className={`nav-link ${page === 'bookings' ? 'active' : ''}`} href={ROUTES.bookings} onClick={(event) => { event.preventDefault(); openBookings() }}>My bookings</a>
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
                <div className="eyebrow"><span className="eyebrow-line" />INDIA, THEN EVERYWHERE</div>
                <h1>Your next story<br />starts <span>at takeoff.</span></h1>
                <p>From a quick getaway close to home to the far side of the world, find a fare that takes you there.</p>
                <div className="hero-proof"><div className="avatar-stack"><span>J</span><span>M</span><span>A</span><span>+</span></div><div><strong>Loved by 24k+ travelers</strong><small>and counting, across the globe</small></div></div>
                <div className="hero-currency-note"><span>₹</span> India domestic fares in INR <i /> International fares in USD <span>$</span></div>
              </div>
              <div className="hero-art" aria-label="Airplane flying above a mountain landscape">
                <div className="aceternity-spotlight" aria-hidden="true" />
                <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
                <div className="sun-disc" />
                <div className="hero-plane"><Icon name="plane" size={42} /></div>
                <div className="hero-route-label"><span className="route-dot" />DELHI TO WHEREVER YOU DREAM</div>
                <div className="mountain mountain-back" /><div className="mountain mountain-front" />
                <div className="hero-art-note"><span>01 / 04</span><span>CHASE THE HORIZON</span></div>
              </div>
              <div className="hero-index"><span>01</span><span className="index-rule" /><span>04</span></div>
            </section>

            <section className="search-wrap" id="flight-search">
              <div className="search-tabs">
                <button className={`trip-tab ${tripType === 'round-trip' ? 'selected' : ''}`} onClick={() => setTripType('round-trip')} type="button"><span className="radio-dot" />Round trip</button>
                <button className={`trip-tab ${tripType === 'one-way' ? 'selected' : ''}`} onClick={() => setTripType('one-way')} type="button"><span className="radio-dot" />One way</button>
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
                  <span className="field-control"><Icon name="calendar" size={18} /><input aria-label="Return date" type="date" min={departDate || today} value={returnDate} onChange={(event) => setReturnDate(event.target.value)} /></span>
                  <span className="field-sub">{formatDate(returnDate)}</span>
                </label>}
                <label className="search-field traveler-field">
                  <span className="field-label">TRAVELERS</span>
                  <span className="field-control"><Icon name="users" size={19} /><select aria-label="Number of travelers" value={travelers} onChange={(event) => setTravelers(Number(event.target.value))}>{[1, 2, 3, 4, 5, 6].map((count) => <option key={count} value={count}>{count} {count === 1 ? 'traveler' : 'travelers'}</option>)}</select></span>
                  <span className="field-sub">Economy · personal item included</span>
                </label>
                <button className="search-button" type="submit"><span>Search flights</span><Icon name="arrow" size={18} /></button>
              </form>
              {notice && <p className="inline-notice" role="alert">{notice}</p>}
            </section>

            <section className="destinations-section">
              <div className="section-heading">
                <div><span className="eyebrow"><span className="eyebrow-line" />DOMESTIC GETAWAYS & GLOBAL DREAMS</span><h2>Pick a place. <span>Feel the pull.</span></h2></div>
                <button className="text-link" onClick={() => document.getElementById('flight-search')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>Build your own trip <Icon name="arrow" size={17} /></button>
              </div>
              <div className="destination-grid">
                {DESTINATIONS.map((destination) => {
                  const airport = AIRPORTS[destination.code]
                  const priceCurrency = getCurrency('DEL', destination.code)
                  return <button className="destination-card" key={destination.code} onClick={() => setDestination(destination.code)}>
                    <span className={`destination-image destination-${destination.art}`}><span className="destination-tag">{destination.tag}</span><span className="destination-arrow"><Icon name="arrow" size={17} /></span><span className="destination-image-city">{airport.city}</span><span className="destination-image-code">{destination.code} · {airport.country}</span></span>
                    <span className="destination-info"><span><strong>{airport.city}</strong><small>{destination.country} · {destination.code}</small></span><span className="destination-price">from <b>{formatMoney(destination.price, priceCurrency)}</b><small className="currency-hint">{priceCurrency}</small></span></span>
                  </button>
                })}
              </div>
            </section>
            <section className="bottom-promise"><div className="promise-icon"><Icon name="sparkle" size={20} /></div><p>Less planning, more <span>being there.</span></p><span>Great journeys start with a little curiosity.</span></section>
          </>
        )}

        {page === 'results' && (
          <section className="inner-page results-page">
            <button className="back-link" onClick={goHome}>← Back to search</button>
            <div className="results-heading"><div><span className="eyebrow"><span className="eyebrow-line" />YOUR NEXT ADVENTURE</span><h1>{AIRPORTS[from]?.city} <span className="heading-arrow">→</span> {AIRPORTS[to]?.city} <span className="currency-chip">{getCurrency(from, to)} fares</span></h1><p>{formatDate(departDate)} <span>·</span> {travelers} {travelers === 1 ? 'traveler' : 'travelers'} <span>·</span> {tripType === 'round-trip' ? 'Round trip' : 'One way'} <span>·</span> {AIRPORTS[from]?.country} → {AIRPORTS[to]?.country}</p></div><button className="edit-search" onClick={goHome}>Edit search <Icon name="arrow" size={16} /></button></div>
            <div className="results-layout"><div className="flight-list">
              <div className="results-toolbar"><span><strong>{visibleResults.length} flights</strong> found for your trip</span><label>Sort by <select aria-label="Sort flights" value={filter} onChange={(event) => setFilter(event.target.value)}><option>Recommended</option><option>Lowest price</option><option>Earliest departure</option></select></label></div>
              {visibleResults.map((flight, index) => <article className={`flight-card ${index === 0 && filter === 'Recommended' ? 'recommended' : ''}`} key={flight.id}>
                {index === 0 && filter === 'Recommended' && <span className="best-badge"><Icon name="sparkle" size={13} /> BEST VALUE</span>}
                <div className={`airline-mark ${flight.color}`}>{flight.initials}</div>
                <div className="flight-airline"><strong>{flight.airline}</strong><span>{flight.cabin} · {flight.id.split('-')[1]}</span></div>
                <div className="flight-times"><strong>{flight.depart}</strong><div className="flight-duration"><span>{flight.duration}</span><span className="duration-rule"><i /></span><span>{flight.stops}</span></div><strong>{flight.arrive}</strong></div>
                <div className="flight-price"><strong>{formatMoney(flight.price, flight.currency)}</strong><span>per traveler · {flight.currency}</span></div>
                <button className="select-flight" onClick={() => chooseFlight(flight)}>Select <Icon name="arrow" size={16} /></button>
              </article>)}
              <p className="demo-disclaimer">Sample fares shown for demo purposes. Prices may vary.</p>
            </div>
            <aside className="results-aside"><div className="aside-sparkle"><Icon name="sparkle" size={20} /></div><span className="eyebrow">A LITTLE EXTRA</span><h3>Travel your way.</h3><p>Every fare includes a personal item, flexible changes, and support when you need it.</p><div className="aside-feature"><Icon name="bag" size={17} /><span>Personal item included</span></div><div className="aside-feature"><Icon name="shield" size={17} /><span>Protected booking</span></div></aside></div>
          </section>
        )}

        {page === 'checkout' && !selectedFlight && (
          <section className="inner-page empty-bookings"><span className="empty-icon"><Icon name="plane" size={25} /></span><h2>Choose a flight first</h2><p>Your checkout is ready when you select a flight from the results.</p><button className="pay-button" onClick={goHome}>Search flights <Icon name="arrow" size={18} /></button></section>
        )}

        {page === 'checkout' && selectedFlight && (
          <section className="inner-page checkout-page">
            <button className="back-link" onClick={() => navigateTo('results')}>← Back to flights</button>
            <div className="checkout-heading"><span className="eyebrow"><span className="eyebrow-line" />ALMOST THERE</span><h1>Make it <span>official.</span></h1><p>Your next favorite story is just a few details away.</p></div>
            <div className="checkout-layout">
              <form className="checkout-form" onSubmit={completeBooking}>
                <section className="checkout-section"><div className="checkout-section-title"><span className="step-number">01</span><div><h2>Traveler details</h2><p>Make sure it matches your travel ID.</p></div></div>
                  <div className="form-row"><label className="form-field">Full name<input className="form-control" required autoComplete="name" value={travelerName} onChange={(event) => setTravelerName(event.target.value)} placeholder="e.g. Jordan Lee" /></label><label className="form-field">Email address<input className="form-control" required type="email" autoComplete="email" value={travelerEmail} onChange={(event) => setTravelerEmail(event.target.value)} placeholder="you@example.com" /></label></div>
                </section>
                <section className="checkout-section payment-section"><div className="checkout-section-title"><span className="step-number">02</span><div><h2>Payment</h2><p>Choose an option for the demo checkout.</p></div></div>
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
                <p className="checkout-terms">By continuing, you agree to our <a href="mailto:hello@skybound.example">booking terms</a>.</p>
              </form>
              <aside className="booking-summary"><span className="eyebrow">YOUR FLIGHT</span><div className="summary-route"><div><strong>{selectedFlight.depart}</strong><b>{selectedFlight.from}</b><span>{AIRPORTS[selectedFlight.from]?.city}</span></div><div className="summary-route-line"><Icon name="plane" size={16} /><span>{selectedFlight.duration}</span></div><div><strong>{selectedFlight.arrive}</strong><b>{selectedFlight.to}</b><span>{AIRPORTS[selectedFlight.to]?.city}</span></div></div><div className="summary-airline"><span className={`airline-mark ${selectedFlight.color}`}>{selectedFlight.initials}</span><span><strong>{selectedFlight.airline}</strong><small>{formatDate(departDate)} · {selectedFlight.cabin}</small></span></div><div className="summary-divider" /><div className="price-line"><span>Flight · {travelers} {travelers === 1 ? 'traveler' : 'travelers'}</span><span>{formatMoney(selectedFlight.price * travelers, currency)}</span></div><div className="price-line"><span>Taxes & fees</span><span>{formatMoney(serviceFee * travelers, currency)}</span></div><div className="summary-divider" /><div className="price-line total-line"><strong>Total</strong><strong>{formatMoney(total, currency)}</strong></div><p className="summary-footnote"><Icon name="shield" size={15} /> No hidden fees. Ever.</p></aside>
            </div>
          </section>
        )}

        {page === 'confirmation' && (
          <section className="inner-page confirmation-page"><div className="confirmation-card"><span className="confirmation-check"><Icon name="check" size={28} /></span><span className="eyebrow">IT'S REALLY HAPPENING</span><h1>You're going <span>places.</span></h1><p>Your reservation is saved on this device. The world is waiting.</p>{bookings[0] && <div className="confirmation-ticket"><div className="ticket-top"><span>SKYBOUND <Icon name="plane" size={14} /></span><span>BOOKING REFERENCE</span></div><div className="ticket-route"><div><b>{bookings[0].flight.from}</b><small>{AIRPORTS[bookings[0].flight.from]?.city}</small></div><span className="ticket-line"><Icon name="plane" size={16} /></span><div><b>{bookings[0].flight.to}</b><small>{AIRPORTS[bookings[0].flight.to]?.city}</small></div></div><div className="ticket-bottom"><span>{formatDate(bookings[0].date)} · {bookings[0].passenger}</span><b>{bookings[0].id}</b></div></div>}<button className="pay-button confirmation-button" onClick={openBookings}>View my bookings <Icon name="arrow" size={18} /></button><button className="text-link confirmation-home" onClick={goHome}>Back to explore</button></div></section>
        )}

        {page === 'bookings' && (
          <section className="inner-page bookings-page"><span className="eyebrow"><span className="eyebrow-line" />YOUR TRAVEL JOURNAL</span><h1>My <span>bookings.</span></h1><p className="bookings-intro">All your next chapters, in one place.</p>{bookings.length ? <div className="saved-bookings">{bookings.map((booking) => <article className="saved-booking" key={booking.id}><div className="saved-booking-top"><span className="booking-status"><i />{booking.status}</span><span>REF · {booking.id}</span></div><div className="saved-route"><div><strong>{booking.flight.from}</strong><span>{AIRPORTS[booking.flight.from]?.city}</span></div><div className="saved-route-line"><span>{booking.flight.airline}</span><i /><span>{booking.flight.duration}</span></div><div><strong>{booking.flight.to}</strong><span>{AIRPORTS[booking.flight.to]?.city}</span></div></div><div className="saved-booking-bottom"><span>{formatDate(booking.date)} · {booking.passenger} · {booking.travelers} {booking.travelers === 1 ? 'traveler' : 'travelers'}</span><strong>{formatMoney(booking.total, booking.currency || booking.flight.currency || 'USD')}</strong></div></article>)}</div> : <div className="empty-bookings"><span className="empty-icon"><Icon name="plane" size={25} /></span><h2>No trips on the horizon. Yet.</h2><p>Your booked flights will find a home here. Where will you go first?</p><button className="pay-button" onClick={goHome}>Find your next flight <Icon name="arrow" size={18} /></button></div>}</section>
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
                  <p>Yes. On the Explore page, select <strong>One way</strong> before searching. For a round trip, choose <strong>Round trip</strong> and add a return date if needed.</p>
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

      <footer className="site-footer"><a className="brand footer-brand" href={ROUTES.home} onClick={(event) => { event.preventDefault(); goHome() }}><span className="brand-mark"><Icon name="plane" size={17} /></span><span>skybound<span className="brand-period">.</span></span></a><span>Made for the miles that matter.</span><span className="footer-right">© 2026 Skybound · Thanks for flying with us </span></footer>
    </div>
  )
}

export default App
