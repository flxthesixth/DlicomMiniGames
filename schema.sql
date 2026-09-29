-- DILI RUN leaderboard
CREATE TABLE IF NOT EXISTS scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  x_id TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL,
  name TEXT,
  score INTEGER NOT NULL DEFAULT 0,
  combo INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_scores_score ON scores(score DESC);

CREATE TABLE IF NOT EXISTS daily_scores (
  day TEXT NOT NULL,
  x_id TEXT NOT NULL,
  username TEXT NOT NULL,
  name TEXT,
  score INTEGER NOT NULL DEFAULT 0,
  combo INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (day, x_id)
);
CREATE INDEX IF NOT EXISTS idx_daily_scores_rank ON daily_scores(day, score DESC);

CREATE TABLE IF NOT EXISTS referrals (
  invitee_x_id TEXT PRIMARY KEY,
  inviter_x_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  CHECK (invitee_x_id <> inviter_x_id)
);
CREATE INDEX IF NOT EXISTS idx_referrals_inviter ON referrals(inviter_x_id);

CREATE TABLE IF NOT EXISTS run_tickets (
  token TEXT PRIMARY KEY,
  x_id TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  used_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_run_tickets_expiry ON run_tickets(expires_at);

CREATE TABLE IF NOT EXISTS x_users (
  x_id TEXT PRIMARY KEY,
  username TEXT NOT NULL COLLATE NOCASE UNIQUE,
  updated_at INTEGER NOT NULL
);
