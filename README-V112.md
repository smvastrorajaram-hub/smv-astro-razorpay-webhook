SMV ASTRO V112

Fixes:
- Removed Tamil/English language toggle feature completely from the visible UI and startup binding.
- Stabilized logout state so Auth button returns to Login after sign-out.
- Fixed approved astrologer homepage fallback to query status == approved (Firestore rules are not filters).
- Preserved per-astrologer verified review loading; no common review section is added.

Deploy:
- Replace root index.html.
- No Firebase Rules change required for these fixes.
- No Render backend change required.
