# SMV ASTRO V104

Fixes:
- Approved astrologers load through a public Render backend endpoint instead of a client Firestore query.
- Admin appointment loader uses the correct BACKEND constant.
- Admin answer approval no longer references the undefined authHeaders function.
- Question ID is explicitly displayed in the Astrologer dashboard.
- Existing Admin question allocation and commission flow retained.

Deploy index.html/script files and render-backend/server.js. Firebase rules do not need a new syntax change for these frontend/backend fixes.
