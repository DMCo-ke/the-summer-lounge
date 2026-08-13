CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE IF NOT EXISTS restaurant_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS restaurant_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  capacity INTEGER NOT NULL CHECK (capacity > 0 AND capacity <= 30),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  confirmation_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  guests INTEGER NOT NULL CHECK (guests > 0 AND guests <= 30),
  reservation_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  table_id UUID REFERENCES restaurant_tables(id),
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending','confirmed','cancelled','completed','no_show','waitlist')),
  notes TEXT,
  source TEXT NOT NULL DEFAULT 'website',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_time > start_time)
);

ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS slot_range TSRANGE GENERATED ALWAYS AS (
    tsrange(
      (reservation_date + start_time)::timestamp,
      (reservation_date + end_time)::timestamp,
      '[)'
    )
  ) STORED;

CREATE INDEX IF NOT EXISTS reservations_date_idx ON reservations (reservation_date, start_time);
CREATE INDEX IF NOT EXISTS reservations_status_idx ON reservations (status);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'reservations_table_no_overlap'
  ) THEN
    ALTER TABLE reservations ADD CONSTRAINT reservations_table_no_overlap
      EXCLUDE USING gist (table_id WITH =, slot_range WITH &&)
      WHERE (table_id IS NOT NULL AND status IN ('pending','confirmed'));
  END IF;
END $$;

INSERT INTO restaurant_settings(key,value) VALUES
  ('reservation_duration_minutes','90'),
  ('opening_time','07:30'),
  ('closing_time','23:00'),
  ('auto_confirm','true'),
  ('restaurant_name','The Summer Lounge'),
  ('timezone','Africa/Nairobi')
ON CONFLICT (key) DO NOTHING;

-- Starter capacities are intentionally easy to edit from /admin.html.
INSERT INTO restaurant_tables(name,capacity) VALUES
  ('Table 1',2),('Table 2',2),('Table 3',2),('Table 4',4),('Table 5',4),('Table 6',4),
  ('Table 7',6),('Table 8',6),('Table 9',8),('Table 10',8)
ON CONFLICT (name) DO NOTHING;
