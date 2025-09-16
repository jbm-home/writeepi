-- Table versions
CREATE TABLE IF NOT EXISTS versions (
  version INTEGER PRIMARY KEY,
  description VARCHAR(1024),
  date TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table users
CREATE TABLE IF NOT EXISTS users (
  uuid UUID PRIMARY KEY,
  firstname VARCHAR(255) NOT NULL,
  lastname VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(512) UNIQUE NOT NULL,
  phone VARCHAR(255) NOT NULL,
  creation TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resetkey VARCHAR(255) NOT NULL,
  resetdate TIMESTAMPTZ NOT NULL DEFAULT now(),
  active BOOLEAN NOT NULL DEFAULT true,
  level SMALLINT NOT NULL DEFAULT 0
);

CREATE INDEX idx_users_resetkey ON users(resetkey);
CREATE INDEX idx_users_active ON users(active);

-- Table sessions
CREATE TABLE IF NOT EXISTS sessions (
  sid VARCHAR(100) PRIMARY KEY,
  session JSONB NOT NULL DEFAULT '{}',
  expires TIMESTAMPTZ,
  lastseen TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_expires ON sessions (expires);
CREATE INDEX IF NOT EXISTS idx_lastseen ON sessions (lastseen);

-- Table user_content
CREATE TABLE IF NOT EXISTS user_content (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  lang VARCHAR(10) NOT NULL,
  title VARCHAR(512) NOT NULL,
  description TEXT NOT NULL,
  author VARCHAR(512) NOT NULL,
  settings JSONB NOT NULL,
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(uuid)
);
CREATE INDEX idx_user_content_user_id ON user_content(user_id);

-- Trigger function to auto-update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach triggers
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_user_content_updated_at
BEFORE UPDATE ON user_content
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
