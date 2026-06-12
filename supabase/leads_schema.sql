-- RawFans — Leads Tabelle für Supabase
-- Im Supabase SQL Editor ausführen (Dashboard → SQL → New query)

-- Tabelle
CREATE TABLE IF NOT EXISTS public.leads (
  id            TEXT PRIMARY KEY,
  date          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  platform      TEXT NOT NULL DEFAULT 'Instagram',
  username      TEXT NOT NULL,
  profile_link  TEXT DEFAULT '',
  followers     INTEGER NOT NULL DEFAULT 0,
  authenticity  TEXT NOT NULL DEFAULT 'uncertain',
  attractiveness INTEGER NOT NULL DEFAULT 5 CHECK (attractiveness >= 1 AND attractiveness <= 10),
  status        TEXT NOT NULL DEFAULT 'new',
  notes         TEXT DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ
);

-- Index für Sortierung & Filter
CREATE INDEX IF NOT EXISTS leads_date_idx ON public.leads (date DESC);
CREATE INDEX IF NOT EXISTS leads_status_idx ON public.leads (status);

-- Row Level Security (internes Tool — offene Policies für anon Key)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "leads_select_anon" ON public.leads;
DROP POLICY IF EXISTS "leads_insert_anon" ON public.leads;
DROP POLICY IF EXISTS "leads_update_anon" ON public.leads;
DROP POLICY IF EXISTS "leads_delete_anon" ON public.leads;

CREATE POLICY "leads_select_anon" ON public.leads FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "leads_insert_anon" ON public.leads FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "leads_update_anon" ON public.leads FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "leads_delete_anon" ON public.leads FOR DELETE TO anon, authenticated USING (true);

-- Realtime aktivieren (Dashboard → Database → Replication → leads aktivieren)
-- Oder per SQL:
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;