# SMV ASTRO V95 — V94 corrective fix

Fixes based on V94 test results:

1. Approved astrologer question inbox
   - Query now includes both `status == paid` and `allocationStatus == available_to_astrologers`, matching Firestore rules.
   - Added the required Firestore composite index.

2. Razorpay payment IDs
   - Fixed a critical nested Firestore transaction bug in V94.
   - Customer and astrologer `SMV-PAY` IDs are generated inside the same transaction safely.

3. Payment success page
   - Added an explicit success panel showing Question ID and both payment IDs.
   - User manually continues to Dashboard instead of the success panel disappearing after 500ms.

4. Shop product image
   - Uploaded image is compressed client-side and persisted as the product image data URL.
   - Home shop displays the persisted image.
   - Product image display box increased to 220px height.

Deploy frontend from repository root and `render-backend/server.js` to Render. Deploy Firestore rules/indexes from the included Firebase config.
