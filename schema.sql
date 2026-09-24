-- DLICOM RUNNER leaderboard
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

CREATE TABLE IF NOT EXISTS referrals (
  invitee_x_id TEXT PRIMARY KEY,
  inviter_x_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  CHECK (invitee_x_id <> inviter_x_id)
);
CREATE INDEX IF NOT EXISTS idx_referrals_inviter ON referrals(inviter_x_id);
