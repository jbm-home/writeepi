CREATE TABLE IF NOT EXISTS user_content_history (
  id UUID PRIMARY KEY,
  user_content_id UUID NOT NULL,
  user_id UUID NOT NULL,
  lang VARCHAR(10) NOT NULL,
  title VARCHAR(512) NOT NULL,
  description TEXT NOT NULL,
  author VARCHAR(512) NOT NULL,
  settings JSONB NOT NULL,
  content JSONB NOT NULL,
  wordstats JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(uuid),
  CONSTRAINT fk_user_content FOREIGN KEY (user_content_id) REFERENCES user_content(id)
);

CREATE INDEX IF NOT EXISTS idx_uch_content_created_at
  ON user_content_history (user_content_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_uch_user_created_at
  ON user_content_history (user_id, created_at DESC);