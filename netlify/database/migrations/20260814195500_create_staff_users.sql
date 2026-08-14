CREATE TABLE IF NOT EXISTS staff_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('manager','staff')),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES staff_users(id) ON DELETE SET NULL,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS staff_users_role_idx ON staff_users(role);
CREATE INDEX IF NOT EXISTS staff_users_active_idx ON staff_users(active);
