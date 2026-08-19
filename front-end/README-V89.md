SMV ASTRO V89

Removed from frontend:
- Public Announcement banner and Admin publishing/deleting UI
- Test Email verification UI
- Related frontend handlers and announcement Firestore rule

Removed from Render backend:
- /admin/test-email endpoint
- /email-status endpoint

Kept:
- Other operational email notifications used by consultation/payment flows
- Astrology Blog admin manager and public blog
- Appointment backend
- Customer/Astrologer authentication and dashboard flows

Deploy render-backend/server.js to the existing Render service. Firebase Rules update is not required unless you intentionally deploy the supplied firestore.rules; the announcement rule has been removed because the feature is removed.
