SMV ASTRO V116
- Astrologer earning IDs use SMV-PAT- prefix while customer payments remain SMV-PAY-.
- Astrologer withdrawal dialog shows only one latest eligible Payment ID, not every payment ID.
- Withdrawal request stores that Payment ID and allows the signed-in astrologer to create their own pending withdrawal under Firestore rules.
- Admin can still read/update/delete withdrawals.
- Customer question ID/admin allocation flow from V115 is retained.
IMPORTANT: Publish the included firestore.rules before testing withdrawal requests.
