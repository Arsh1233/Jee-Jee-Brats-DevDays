-- PowerPilot PostgreSQL Schema

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) UNIQUE NOT NULL,
  meter_id      VARCHAR(30) UNIQUE NOT NULL,
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS appliances (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER REFERENCES users(id),
  name          VARCHAR(50) NOT NULL,
  type          VARCHAR(30) NOT NULL,
  wattage       INTEGER NOT NULL,
  is_on         BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS meter_readings (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER REFERENCES users(id),
  kwh           NUMERIC(10,4) NOT NULL,
  watt          NUMERIC(10,2) NOT NULL,
  recorded_at   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tariffs (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(50) NOT NULL,
  rate_per_unit NUMERIC(6,2) NOT NULL,
  start_hour    INTEGER NOT NULL,
  end_hour      INTEGER NOT NULL,
  is_active     BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS schedules (
  id            SERIAL PRIMARY KEY,
  appliance_id  INTEGER REFERENCES appliances(id),
  start_hour    INTEGER NOT NULL,
  end_hour      INTEGER NOT NULL,
  is_auto       BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER REFERENCES users(id),
  title         VARCHAR(150) NOT NULL,
  message       TEXT,
  type          VARCHAR(30) DEFAULT 'info',
  is_read       BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMP DEFAULT NOW()
);
