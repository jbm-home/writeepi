-- Table versions
CREATE TABLE IF NOT EXISTS versions (
  version INTEGER PRIMARY KEY,
  description VARCHAR(1024),
  date TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table users
CREATE TABLE IF NOT EXISTS users (
  uuid UUID NOT NULL,
  firstname VARCHAR(255) NOT NULL,
  lastname VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(512) NOT NULL,
  phone VARCHAR(255) NOT NULL,
  creation TIMESTAMPTZ NOT NULL DEFAULT now(),
  updatedAt TIMESTAMPTZ NOT NULL DEFAULT now(),
  resetkey VARCHAR(255) NOT NULL,
  resetdate TIMESTAMPTZ NOT NULL DEFAULT now(),
  active BOOLEAN NOT NULL DEFAULT true,
  level SMALLINT NOT NULL DEFAULT 0,
  PRIMARY KEY (uuid, email, resetkey)
);

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
  userId UUID NOT NULL,
  lang VARCHAR(10) NOT NULL,
  title VARCHAR(512) NOT NULL,
  description TEXT NOT NULL,
  author VARCHAR(512) NOT NULL,
  settings JSONB NOT NULL,
  content JSONB NOT NULL,
  createdAt TIMESTAMPTZ NOT NULL DEFAULT now(),
  updatedAt TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_user FOREIGN KEY (userId) REFERENCES users(uuid)
);
CREATE INDEX idx_user_content_userId ON user_content(userId);

-- Trigger function to auto-update updatedAt
CREATE OR REPLACE FUNCTION set_updatedAt()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updatedAt = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach triggers
CREATE TRIGGER trg_users_updatedAt
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updatedAt();

CREATE TRIGGER trg_user_content_updatedAt
BEFORE UPDATE ON user_content
FOR EACH ROW
EXECUTE FUNCTION set_updatedAt();
