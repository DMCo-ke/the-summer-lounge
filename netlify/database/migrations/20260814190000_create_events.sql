CREATE TABLE IF NOT EXISTS restaurant_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  event_date DATE NOT NULL,
  start_time TIME NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0 AND capacity <= 5000),
  status TEXT NOT NULL DEFAULT 'upcoming',
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS restaurant_events_date_idx ON restaurant_events(event_date,start_time);
