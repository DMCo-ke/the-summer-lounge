# The Summer Lounge — Staff Accounts

Manager URL: `/manager/`. Owner signs in with identifier `owner` and the existing `ADMIN_PASSWORD`/`ADMIN_SECRET`. Managers and Staff have individual database accounts.

Hierarchy: Owner → Manager → Staff. Owner can create/manage Managers and Staff. Managers can create/manage Staff. Staff can operate reservations, tables and guest views. Passwords use Node scrypt hashes.

Apply migration `netlify/database/migrations/20260814195500_create_staff_users.sql` before creating the first account.
