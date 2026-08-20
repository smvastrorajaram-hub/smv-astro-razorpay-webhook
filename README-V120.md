# SMV ASTRO V120

Targeted fixes only:
- Header Logout now uses the real logout handler even with the public-button capture bridge.
- Auth state explicitly synchronizes the header back to Login after sign-out.
- Approved astrologer PROFILE & REVIEWS button now crosses the module boundary correctly.
- Public astrologer profile/review modal is self-contained and no longer depends on an out-of-scope modal() function.

Preserved: Admin Question Board persistence, KEEP ALLOCATED, RE-ALLOCATE, ADMIN ANSWER, SMV-PAY / SMV-PAT, withdrawal, payment, question flow, approved astrologer loading, contact, and other working features.
