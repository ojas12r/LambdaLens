-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS anomalies (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  function_name TEXT NOT NULL,
  arn           TEXT NOT NULL,
  cost_increase_pct NUMERIC NOT NULL,
  current_cost  NUMERIC NOT NULL,
  previous_cost NUMERIC NOT NULL,
  status        TEXT NOT NULL DEFAULT 'detected'
                CHECK (status IN ('detected','investigating','resolved','dismissed')),
  root_cause    TEXT,
  agent_explanation TEXT,
  suggested_fix TEXT,
  confidence    NUMERIC,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at   TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS cost_snapshots (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  function_name TEXT NOT NULL,
  cost          NUMERIC NOT NULL,
  period_start  TIMESTAMPTZ NOT NULL,
  period_end    TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Index for dashboard queries
CREATE INDEX idx_anomalies_status ON anomalies(status);
CREATE INDEX idx_anomalies_created ON anomalies(created_at DESC);
CREATE INDEX idx_cost_snapshots_period ON cost_snapshots(period_start DESC);

-- Row Level Security
ALTER TABLE anomalies ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_snapshots ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (used by our API)
CREATE POLICY "Service role full access on anomalies"
  ON anomalies FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access on cost_snapshots"
  ON cost_snapshots FOR ALL
  USING (true)
  WITH CHECK (true);