-- RawFans — Finanzen Tabelle für Supabase
-- Im Supabase SQL Editor ausführen (Dashboard → SQL → New query)

CREATE TABLE IF NOT EXISTS public.finance_entries (
  id                TEXT PRIMARY KEY,
  date              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  type              TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category          TEXT NOT NULL,
  description       TEXT NOT NULL DEFAULT '',
  amount            NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (amount >= 0),
  recurring         BOOLEAN NOT NULL DEFAULT FALSE,
  recurring_interval TEXT,
  status            TEXT NOT NULL DEFAULT 'pending',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ
);

-- Indizes für Filter, Sortierung & Monatsauswertung
CREATE INDEX IF NOT EXISTS finance_entries_date_idx ON public.finance_entries (date DESC);
CREATE INDEX IF NOT EXISTS finance_entries_type_idx ON public.finance_entries (type);
CREATE INDEX IF NOT EXISTS finance_entries_category_idx ON public.finance_entries (category);
CREATE INDEX IF NOT EXISTS finance_entries_recurring_idx ON public.finance_entries (recurring);

-- Row Level Security (internes Tool — offene Policy für anon Key)
ALTER TABLE public.finance_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for now" ON public.finance_entries;
DROP POLICY IF EXISTS "finance_select_anon" ON public.finance_entries;
DROP POLICY IF EXISTS "finance_insert_anon" ON public.finance_entries;
DROP POLICY IF EXISTS "finance_update_anon" ON public.finance_entries;
DROP POLICY IF EXISTS "finance_delete_anon" ON public.finance_entries;

CREATE POLICY "Allow all for now"
ON public.finance_entries
FOR ALL
USING (true)
WITH CHECK (true);

-- Realtime aktivieren (Dashboard → Database → Replication → finance_entries aktivieren)
-- Oder per SQL:
ALTER PUBLICATION supabase_realtime ADD TABLE public.finance_entries;