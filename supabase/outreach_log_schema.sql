-- RawFans — Outreach Log Tabelle für Supabase
-- Im Supabase SQL Editor ausführen (Dashboard → SQL → New query)
-- Nach leads_schema.sql ausführen (lead_id referenziert leads.id)

CREATE TABLE IF NOT EXISTS public.outreach_log (
  id              TEXT PRIMARY KEY,
  date            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  lead_id         TEXT NOT NULL,
  template_id     TEXT,
  message_type    TEXT NOT NULL DEFAULT 'other',
  status          TEXT NOT NULL DEFAULT 'sent',
  sentiment       TEXT DEFAULT '',
  next_action     TEXT DEFAULT '',
  follow_up_date  TIMESTAMPTZ,
  call_planned    BOOLEAN NOT NULL DEFAULT FALSE,
  call_date       TIMESTAMPTZ,
  call_time       TEXT DEFAULT '',
  notes           TEXT DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ
);

-- Indizes für Filter, Sortierung & Lead-Threads
CREATE INDEX IF NOT EXISTS outreach_log_date_idx ON public.outreach_log (date DESC);
CREATE INDEX IF NOT EXISTS outreach_log_lead_id_idx ON public.outreach_log (lead_id);
CREATE INDEX IF NOT EXISTS outreach_log_status_idx ON public.outreach_log (status);
CREATE INDEX IF NOT EXISTS outreach_log_follow_up_date_idx ON public.outreach_log (follow_up_date);

-- Row Level Security (internes Tool — offene Policy für anon Key)
ALTER TABLE public.outreach_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for now" ON public.outreach_log;
DROP POLICY IF EXISTS "outreach_log_select_anon" ON public.outreach_log;
DROP POLICY IF EXISTS "outreach_log_insert_anon" ON public.outreach_log;
DROP POLICY IF EXISTS "outreach_log_update_anon" ON public.outreach_log;
DROP POLICY IF EXISTS "outreach_log_delete_anon" ON public.outreach_log;

CREATE POLICY "Allow all for now"
ON public.outreach_log
FOR ALL
USING (true)
WITH CHECK (true);

-- Realtime aktivieren (Dashboard → Database → Replication → outreach_log aktivieren)
-- Oder per SQL:
ALTER PUBLICATION supabase_realtime ADD TABLE public.outreach_log;