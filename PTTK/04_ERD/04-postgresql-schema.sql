-- MED-06 - PostgreSQL physical schema baseline
-- Mục tiêu: hiện thực hóa ERD cho giữa kỳ, chưa phụ thuộc ORM/migration tool.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE user_role AS ENUM ('ATTENDEE', 'ORGANIZER', 'STAFF', 'ADMIN');
CREATE TYPE account_status AS ENUM ('ACTIVE', 'LOCKED');
CREATE TYPE event_status AS ENUM ('DRAFT', 'PUBLISHED', 'COMPLETED', 'CANCELLED');
CREATE TYPE session_status AS ENUM (
  'DRAFT',
  'REGISTRATION_OPEN',
  'REGISTRATION_CLOSED',
  'ONGOING',
  'COMPLETED',
  'CANCELLED'
);
CREATE TYPE allocation_policy AS ENUM ('FCFS', 'LOTTERY');
CREATE TYPE registration_status AS ENUM ('PENDING', 'CONFIRMED', 'WAITLISTED', 'CANCELLED');
CREATE TYPE waitlist_status AS ENUM ('ACTIVE', 'PROMOTED', 'CANCELLED');
CREATE TYPE ticket_status AS ENUM ('VALID', 'USED', 'CANCELLED', 'EXPIRED');
CREATE TYPE check_in_method AS ENUM ('QR', 'MANUAL_CODE');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role user_role NOT NULL,
  status account_status NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  address TEXT NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE RESTRICT,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  status event_status NOT NULL DEFAULT 'DRAFT',
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_events_date_range CHECK (start_date < end_date)
);

CREATE TABLE event_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE RESTRICT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  registration_open_at TIMESTAMPTZ NOT NULL,
  registration_close_at TIMESTAMPTZ NOT NULL,
  allocation_policy allocation_policy NOT NULL,
  status session_status NOT NULL DEFAULT 'DRAFT',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_sessions_time_range CHECK (start_time < end_time),
  CONSTRAINT chk_sessions_registration_window CHECK (registration_open_at < registration_close_at),
  CONSTRAINT chk_sessions_registration_before_start CHECK (registration_close_at <= start_time)
);

CREATE TABLE registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attendee_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  session_id UUID NOT NULL REFERENCES event_sessions(id) ON DELETE RESTRICT,
  status registration_status NOT NULL DEFAULT 'PENDING',
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_registration_attendee_session UNIQUE (attendee_id, session_id)
);

CREATE TABLE waitlist_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL UNIQUE REFERENCES registrations(id) ON DELETE RESTRICT,
  position BIGINT NOT NULL CHECK (position > 0),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status waitlist_status NOT NULL DEFAULT 'ACTIVE',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL UNIQUE REFERENCES registrations(id) ON DELETE RESTRICT,
  ticket_code VARCHAR(100) NOT NULL UNIQUE,
  qr_code TEXT NOT NULL,
  status ticket_status NOT NULL DEFAULT 'VALID',
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL UNIQUE REFERENCES tickets(id) ON DELETE RESTRICT,
  staff_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  method check_in_method NOT NULL
);

CREATE TABLE accessibility_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL UNIQUE,
  description TEXT
);

CREATE TABLE event_accessibility (
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  accessibility_feature_id UUID NOT NULL REFERENCES accessibility_features(id) ON DELETE RESTRICT,
  PRIMARY KEY (event_id, accessibility_feature_id)
);

CREATE TABLE allocation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL UNIQUE REFERENCES event_sessions(id) ON DELETE RESTRICT,
  executed_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  policy allocation_policy NOT NULL,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  candidate_count INTEGER NOT NULL CHECK (candidate_count >= 0),
  confirmed_count INTEGER NOT NULL CHECK (confirmed_count >= 0),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT chk_allocation_run_counts CHECK (confirmed_count <= candidate_count)
);

-- ===== Indexes phục vụ truy vấn nghiệp vụ =====
CREATE INDEX idx_events_organizer_id ON events(organizer_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_start_date ON events(start_date);

CREATE INDEX idx_sessions_event_id ON event_sessions(event_id);
CREATE INDEX idx_sessions_status ON event_sessions(status);
CREATE INDEX idx_sessions_registration_window
  ON event_sessions(registration_open_at, registration_close_at);

CREATE INDEX idx_registrations_session_status
  ON registrations(session_id, status);
CREATE INDEX idx_registrations_attendee
  ON registrations(attendee_id);

CREATE INDEX idx_waitlist_active_position
  ON waitlist_entries(position)
  WHERE status = 'ACTIVE';

CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_checkins_staff ON check_ins(staff_id);
CREATE INDEX idx_allocation_runs_executor ON allocation_runs(executed_by_user_id);

-- Search MVP: PostgreSQL Full Text Search cho Event.
CREATE INDEX idx_events_fts
  ON events
  USING GIN (to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(description, '')));

-- ===== Business rules phải bảo vệ ở service/transaction =====
-- 1) event_sessions.capacity <= Venue.capacity (rule liên bảng).
-- 2) COUNT(registrations WHERE status='CONFIRMED') <= event_sessions.capacity.
-- 3) Ticket chỉ tạo khi Registration = CONFIRMED.
-- 4) WaitlistEntry ACTIVE chỉ tồn tại cho Registration = WAITLISTED.
-- 5) AllocationRun trong MVP chỉ chạy cho Session policy = LOTTERY và sau khi đóng đăng ký.
-- 6) Publish Event yêu cầu >= 1 EventSession hợp lệ.
-- 7) Hủy confirmed + cancel ticket + promote waitlist phải cùng transaction.
-- 8) Check-in phải lock/validate Ticket để request đồng thời chỉ một lần thành công.
