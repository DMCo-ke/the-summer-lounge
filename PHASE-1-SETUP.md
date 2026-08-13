# The Summer Lounge — Phase 1 setup

## Netlify environment variables

Required:

`ADMIN_PASSWORD` — strong dashboard password.

`ADMIN_SECRET` — long random secret.

`PUBLIC_SITE_URL` — production URL with no trailing slash.

`RESERVATION_SECRET` — long random secret for guest management links. Keep different from `ADMIN_SECRET`.

Optional email:

`RESEND_API_KEY` — Resend API key.

`RESEND_FROM` — a verified sender, e.g. `The Summer Lounge <reservations@thesummerlounge.co.ke>`.

## What Phase 1 adds

- Email confirmation/status delivery when a guest provides an email and Resend is configured.
- Signed private reservation-management links.
- Guest cancellation.
- Guest rescheduling with live table availability checks.
- Admin confirmation/cancellation emails.
- WhatsApp click-to-chat actions in the public confirmation and staff dashboard.
- Noindex management page.

## Deploy

Connect the repository to Netlify and push to the production branch. Netlify Functions are deployed with the site. After changing environment variables, deploy again so Functions receive the new values.
