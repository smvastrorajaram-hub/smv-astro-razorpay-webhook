# SMV ASTRO V113

Targeted fixes:
- Approved astrologers on homepage now use Render public API with Firestore approved-status fallback and bounded timeouts.
- Common homepage/public review feed is disabled; reviews remain per astrologer in PROFILE & REVIEWS.
- Admin keeps allocated questions visible until answered.
- Admin allocated-question controls: KEEP ALLOCATED (by leaving it assigned), RE-ALLOCATE to another approved astrologer, and ADMIN ANSWER.
- Re-allocation keeps the same Question ID and recalculates the selected astrologer's commission.
- Admin answer retains the full customer amount and does not create astrologer commission/payment.
- Question ID is shown in Astrologer public question cards and Admin answer approval cards.
- No Firebase Rules changes are required for these V113 frontend/backend changes.

Upload index.html and script files from this package to the GitHub frontend, and render-backend/server.js to the Render backend. Render can auto-deploy.
