CREATE TABLE IF NOT EXISTS user_content_cover (
  user_content_id UUID PRIMARY KEY,
  mime_type VARCHAR(128) NOT NULL,
  data BYTEA NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_cover_user_content FOREIGN KEY (user_content_id) REFERENCES user_content(id)
);
