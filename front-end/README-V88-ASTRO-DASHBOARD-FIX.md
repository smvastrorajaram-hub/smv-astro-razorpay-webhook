V88: Astrologer dashboard refresh/session restoration fix.
Frontend-only change. No Firebase Rules change and no Render server.js change.
If an authenticated user was on the dashboard, a browser refresh now restores the dashboard and reloads role-specific data.
