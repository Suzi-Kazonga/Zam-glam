# Zamglam Changes Made

## Frontend design

- Replaced the older serif font with the modern Manrope font and added readable fallback fonts.
- Kept the neutral stone and slate visual theme across the application.
- Added smoother font rendering and consistent typography spacing.
- Added cleaner button styling with rounded corners, layered shadows, hover lift, pressed states, and keyboard focus outlines.

## Zamglam branding

- Refreshed the Zamglam header wordmark.
- Added a cute multiple-shopper-bag logo made from layered pink and red bags.
- Added a white Z detail to the front bag.
- Added a gentle swinging animation for the shopper-bag mark.
- The animation respects users who prefer reduced motion.

## Navigation

- Added reusable back navigation for login and signup flows.
- Replaced text-only arrows with a clean arrow icon.
- Added hover, focus, and accessible labels to the reusable back button.
- Seller login now redirects sellers to `/seller/dashboard`.

## Authentication and profiles

- Added optional profile initials and profile-photo support using browser localStorage.
- Updated account, customer signup, seller signup, and courier signup flows to support the optional profile details.
- Kept the profile metadata client-side so no database migration was needed.
- Added a focused test for profile metadata storage.

## Backend and startup fixes

- Corrected the backend startup command and entry-point usage.
- Cleared the stale Node process that was blocking port `5000`.
- Confirmed the backend can connect to MySQL and start on `http://localhost:5000`.
- Confirmed the frontend runs on `http://localhost:3001` when port `3000` is occupied.

## Validation completed

- Frontend production build passed successfully.
- Profile storage test passed successfully.
- Latest successful build transformed 177 modules.

## Git status

- Earlier frontend changes were committed and pushed to GitHub in commit `d4f6fe2`.
- The most recent shared-button shadow update was made after that commit and should be committed separately:

```powershell
cd C:\Users\malwa\Downloads\Zam-glam-master\frontend
git add src/components/Button.jsx src/index.css CHANGES_MADE.md
git commit -m "Polish frontend buttons and document changes"
git push origin main
```

- The unrelated untracked file named `frontend index.html` was intentionally left out of the earlier commit.
