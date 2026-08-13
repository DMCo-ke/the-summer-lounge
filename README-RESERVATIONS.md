# The Summer Lounge — Real Reservations System

This version adds a production reservation backend to the existing premium website.

## What it does
- Live table availability checks.
- Automatic table assignment based on capacity.
- 90-minute default reservation duration (editable in the database).
- PostgreSQL-backed reservation records.
- Unique confirmation codes.
- Collision protection with a PostgreSQL exclusion constraint.
- Customer confirmation screen and WhatsApp follow-up.
- Waitlist when no table is available.
- Staff dashboard at `/admin/`.
- Reservation status management.
- Editable table capacities in the admin dashboard.
- Netlify Functions API endpoints.

## One-time Netlify setup

1. Deploy this project to Netlify.
2. In the Netlify project, create a **Database**. Netlify Database is managed Postgres and automatically applies migrations in `netlify/database/migrations/` during deploys.
3. Add these environment variables under Project configuration → Environment variables:

   - `ADMIN_PASSWORD` — a strong password for `/admin/`.
   - `ADMIN_SECRET` — a long random secret used to sign staff sessions. Do not reuse the password.

4. Redeploy after the database and environment variables are configured.
5. Open `https://YOUR-DOMAIN/admin/` and sign in.
6. **Important:** replace the starter Table 1–10 capacities with the restaurant's real table/floor-plan capacities before accepting live bookings.

## API
- `GET /api/health`
- `GET /api/availability?date=YYYY-MM-DD&time=HH:MM&guests=4`
- `POST /api/reservations`
- `POST /api/admin/login`
- `GET /api/admin/reservations`
- `PATCH /api/admin/reservation`
- `GET/PATCH /api/admin/tables`

## Optional email notifications
The core system does not require a third-party email provider. Customer confirmation is shown immediately and the site opens WhatsApp for the guest. If you later want automatic email notifications to staff and guests, add a transactional email provider (e.g. Resend) and wire it into the reservation function using server-side environment variables.

## Important operational note
The database is real, but the seeded table capacities are placeholders. Do not turn on public reservations until the restaurant confirms its actual table inventory, booking duration, opening hours and preferred cancellation/no-show policy.
