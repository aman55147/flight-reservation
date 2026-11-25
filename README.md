# Skybound Flight Reservations

A responsive, frontend-only flight reservation demo built with React, JavaScript, HTML, CSS, Bootstrap, and Vite.

## Run locally

From the repository root, run:

```sh
cd flight
npm install
npm run dev
```

Create a production build with `npm run build`, or run the project linter with `npm run lint` from the `flight` directory.

## Features

- Search sample one-way or round-trip flights by origin, destination, dates, cabin, and traveler count.
- Choose Indian domestic or international airports; domestic India fares display in INR and routes involving other countries display in USD.
- Filter and sort flight results, then select seats, meals, and baggage options before demo checkout.
- View a confirmation with a printable demo ticket and QR code, and manage saved reservations from **My bookings**.
- Open **Help** for answers about searching, demo checkout, and locally saved bookings.
- Keep booking data in browser `localStorage` under `skyvoyage-bookings` for compatibility with earlier demo data.
- Navigate Explore, flight results, checkout, confirmation, bookings, and Help with browser-addressable hash routes. The current search can be refreshed in the same tab.
- Copy illustrative seasonal promo codes; these demo offers do not change booking prices.

Flight schedules and fares are sample data and are not live exchange-rate conversions. Checkout is a UI demo only: no payment gateway, UPI app, or bank is connected, no payment is processed, and payment details are not saved. The generated QR code contains a demo order reference only; it cannot be used to transfer money. Do not enter real payment details.
