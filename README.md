# Skybound Flight Reservations

A responsive, frontend-only flight reservation demo built with React, JavaScript, HTML, CSS, Bootstrap, and Vite.

## Run locally

From the repository root:

```sh
npm ci
npm run dev
```

Create a production build with `npm run build`, or run the project linter with `npm run lint`.

## Features

- Search sample one-way or round-trip flights by origin, destination, dates, cabin, and traveler count.
- Choose Indian domestic or international airports; domestic India fares display in INR and routes involving other countries display in USD.
- Filter and sort results, then customize seats, meals, and baggage before demo checkout.
- View a confirmation with a printable demo ticket and QR code, and manage bookings through **My bookings**.
- Open **Help** for answers about searching, demo checkout, and locally saved bookings.
- Keep booking data in this browser under `localStorage` key `skyvoyage-bookings`.
- Navigate Explore, flight results, checkout, confirmation, bookings, and Help with browser-addressable hash routes. The current search can be refreshed in the same tab.
- Apply seasonal demo promo codes to the sample flight fare at checkout.

Flight schedules, fares, cabin multipliers, age-based fares, and promo discounts are sample data, not live availability, airline policy, or exchange-rate conversions. This frontend demo has no backend, real email/WhatsApp notifications, or payment processing. The QR code is a demo reference only, not a payment or boarding code. Payment details are not saved; do not enter real payment details. The Admin page and Contact details are illustrative and local to this demo.
