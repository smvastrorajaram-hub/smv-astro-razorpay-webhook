# SMV ASTRO V91 — Booking Backend

- Appointment/consultation booking is created by Render backend.
- Customer Firebase ID token is required.
- Backend generates daily unique Booking IDs: `SMV-BKG-DDMMYYYY-01`, `-02`, ...
- Records are stored in `smv_appointments` with customer identity, consultation type, preferred date/time, payment status and booking status.
- Admin email notification is best-effort and cannot make an already-created booking fail.
- Existing Customer/Astrologer IDs, login, Ask Now and Razorpay flow are not intentionally changed.
- `SMV-PAY` is not implemented yet.

## Deploy
Update frontend `index.html` and Render `render-backend/server.js`.
Firebase Rules do not need to change for the backend booking write because Firebase Admin SDK performs it.
