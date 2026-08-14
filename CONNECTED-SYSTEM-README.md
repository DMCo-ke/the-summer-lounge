# The Summer Lounge — Connected Production Package

This package combines the public restaurant website, live reservation backend, and premium restaurant manager.

## Architecture
Public website → `/api/reservations` → Netlify Database ← `/api/admin/*` ← `/admin` manager

## Already connected
- Live reservation creation and availability
- Manager authentication
- Reservation search/filtering
- Confirm/cancel/complete/no-show status updates
- Automatic reservation email flow through the existing Resend function
- Live table capacity management
- Customer list derived from live reservations
- Live analytics derived from reservations
- Restaurant settings stored in the database
- Events stored in the database
- Google Analytics tag already present on the public site

## Netlify environment variables
Keep the existing production variables: `ADMIN_PASSWORD`, `ADMIN_SECRET`, `RESEND_API_KEY`, `RESEND_FROM`, `PUBLIC_SITE_URL`. Netlify Database supplies the database connection used by `@netlify/database`.

## Deploy
1. Push this folder to the same GitHub repository connected to Netlify, or replace the current repository contents with this package.
2. Netlify will build from the root because `netlify.toml` publishes `.` and uses `netlify/functions`.
3. Run/apply the new database migration `20260814190000_create_events.sql` in the Netlify Database migration workflow.
4. Open `/admin` and sign in with the existing `ADMIN_PASSWORD`.
5. Test a booking on the public site. It should appear in the manager under Reservations.

## Important
Do not put `ADMIN_PASSWORD`, `ADMIN_SECRET`, database credentials, or `RESEND_API_KEY` into frontend files. They belong only in Netlify environment variables.
