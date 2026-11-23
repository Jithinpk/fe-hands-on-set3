# Question PR link

1. [Room Booking](#) — _PR link TBD_
2. Find a Time

---

## How to run

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). Room and date are kept in the query string, for example:

`http://localhost:5173/?room=alpha&date=2026-11-23`

## How to test

```bash
npm test
```

Watch mode:

```bash
npm run test:watch
```

---

## 1. Room Booking

Page to view a room’s day schedule (09:00–18:00), book a meeting, or cancel one.

- Mock API for rooms, bookings, create, and cancel (300–800 ms latency; create/cancel fail ~10% of the time).
- Room + date live in the URL so refresh/share keeps the same view.
- Form: title, start/end (15-minute steps), attendees (add/remove emails).
- Client validation: business hours, start before end, max 4 hours, valid unique emails, no overlap (back-to-back allowed). Errors show next to fields.
- API rejection keeps form input and shows the server reason.
- Cancel asks for confirmation, removes optimistically, and restores the booking with an error if the API fails.
