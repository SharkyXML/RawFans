/**
 * RawFans — Supabase Leads API (ES Module)
 * Entspricht dem offiziellen Supabase-Muster (createClient + from/select).
 * Statisches Hosting: URL/Key statt process.env.
 */
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://wyandwrbzrlxvjvxvjds.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5YW5kd3JienJseHZqdnh2amRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNjg5NzYsImV4cCI6MjA5Njg0NDk3Nn0.2mHu4S4YTT5xS_ZhH5tlE2c5jq8OUaxfweg-rse-Wic';

const LEADS_TABLE = 'leads';
const OUTREACH_LOG_TABLE = 'outreach_log';
const FINANCE_TABLE = 'finance_entries';
const LOCAL_STORAGE_KEY = 'rawfans_leads';
const MIGRATION_FLAG_KEY = 'rawfans_leads_supabase_migrated';
const OUTREACH_LOG_STORAGE_KEY = 'rawfans_outreach_log';
const OUTREACH_LOG_MIGRATION_FLAG_KEY = 'rawfans_outreach_log_supabase_migrated';
const OUTREACH_TEMPLATES_STORAGE_KEY = 'rawfans_outreach_templates';
const FINANCE_STORAGE_KEY = 'rawfans_finance';
const FINANCE_MIGRATION_FLAG_KEY = 'rawfans_finance_supabase_migrated';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let leadsRealtimeChannel = null;
let onLeadsRealtimeChange = null;
let outreachLogRealtimeChannel = null;
let onOutreachLogRealtimeChange = null;
let financeRealtimeChannel = null;
let onFinanceRealtimeChange = null;

console.info('[Supabase] Client initialisiert:', SUPABASE_URL);

// Verbindungstest (Supabase-Empfehlung)
supabase.from(LEADS_TABLE).select('id').limit(1).then(({ data, error }) => {
  if (error) console.error('[Supabase] Verbindungstest fehlgeschlagen:', error.message);
  else console.info('[Supabase] Verbindung OK —', data?.length ?? 0, 'Zeile(n) erreichbar');
});

function handleError(error, context) {
  const message = error?.message || 'Unbekannter Fehler';
  console.error(`[Supabase] ${context}:`, error);
  throw new Error(`${context}: ${message}`);
}

function parseFollowers(value) {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (!value) return 0;
  const str = String(value).trim().toLowerCase().replace(/\./g, '').replace(',', '.');
  const match = str.match(/^([\d.]+)\s*([km])?$/);
  if (!match) return parseInt(str, 10) || 0;
  let num = parseFloat(match[1]);
  if (match[2] === 'k') num *= 1000;
  if (match[2] === 'm') num *= 1000000;
  return Math.round(num);
}

function normalizeLead(lead) {
  const statusMap = {
    contacted: 'messaged',
    new: 'new',
    interested: 'interested',
    signed: 'signed',
    rejected: 'rejected',
    messaged: 'messaged',
    replied: 'replied',
  };

  return {
    id: lead.id,
    date: lead.date || lead.createdAt || new Date().toISOString(),
    platform: lead.platform === 'Twitter' ? 'X' : lead.platform || 'Instagram',
    username: lead.username || lead.handle || lead.name || '',
    profileLink: lead.profileLink || lead.profile_link || '',
    followers: parseFollowers(lead.followers),
    authenticity: lead.authenticity || 'uncertain',
    attractiveness: Math.min(10, Math.max(1, parseInt(lead.attractiveness, 10) || 5)),
    status: statusMap[lead.status] || lead.status || 'new',
    notes: lead.notes || '',
    createdAt: lead.createdAt || lead.created_at || lead.date || new Date().toISOString(),
  };
}

function rowToLead(row) {
  return normalizeLead({
    id: row.id,
    date: row.date,
    platform: row.platform,
    username: row.username,
    profileLink: row.profile_link,
    followers: row.followers,
    authenticity: row.authenticity,
    attractiveness: row.attractiveness,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
  });
}

function leadToRow(lead) {
  const normalized = normalizeLead(lead);
  return {
    date: normalized.date,
    platform: normalized.platform,
    username: normalized.username,
    profile_link: normalized.profileLink,
    followers: normalized.followers,
    authenticity: normalized.authenticity,
    attractiveness: normalized.attractiveness,
    status: normalized.status,
    notes: normalized.notes,
  };
}

/** Alle Leads laden (neueste zuerst nach created_at) */
export async function fetchLeads() {
  console.info('[Supabase] fetchLeads()…');

  const { data, error } = await supabase
    .from(LEADS_TABLE)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) handleError(error, 'Leads laden fehlgeschlagen');

  const leads = (data || []).map(rowToLead);
  console.info(`[Supabase] ${leads.length} Lead(s) geladen`);
  return leads;
}

/** Neuen Lead anlegen */
export async function addLead(leadData, options = {}) {
  const { preserveId = false, preserveCreatedAt = false } = options;
  const normalized = normalizeLead(leadData);

  const id =
    preserveId && normalized.id
      ? normalized.id
      : typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  const row = {
    ...leadToRow(normalized),
    id,
    created_at: preserveCreatedAt ? normalized.createdAt : new Date().toISOString(),
  };

  console.info('[Supabase] addLead():', row.username);

  const { data, error } = await supabase.from(LEADS_TABLE).insert(row).select().single();

  if (error) handleError(error, 'Lead anlegen fehlgeschlagen');
  return rowToLead(data);
}

/** Lead aktualisieren */
export async function updateLead(id, leadData) {
  const row = {
    ...leadToRow(leadData),
    updated_at: new Date().toISOString(),
  };

  console.info('[Supabase] updateLead():', id);

  const { data, error } = await supabase
    .from(LEADS_TABLE)
    .update(row)
    .eq('id', id)
    .select()
    .single();

  if (error) handleError(error, 'Lead aktualisieren fehlgeschlagen');
  return rowToLead(data);
}

/** Lead löschen */
export async function deleteLead(id) {
  console.info('[Supabase] deleteLead():', id);

  const { error } = await supabase.from(LEADS_TABLE).delete().eq('id', id);

  if (error) handleError(error, 'Lead löschen fehlgeschlagen');
  return true;
}

export function getLocalStorageLeadCount() {
  if (localStorage.getItem(MIGRATION_FLAG_KEY) === 'true') return 0;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return 0;
    const leads = JSON.parse(raw);
    return Array.isArray(leads) ? leads.length : 0;
  } catch (err) {
    console.warn('[Supabase] localStorage lesen fehlgeschlagen:', err);
    return 0;
  }
}

export async function importFromLocalStorage() {
  if (localStorage.getItem(MIGRATION_FLAG_KEY) === 'true') {
    console.info('[Supabase] Migration bereits abgeschlossen');
    return { imported: 0, skipped: 0, alreadyMigrated: true };
  }

  let raw;
  try {
    raw = localStorage.getItem(LOCAL_STORAGE_KEY);
  } catch (err) {
    handleError(err, 'localStorage nicht lesbar');
  }

  if (!raw) return { imported: 0, skipped: 0 };

  let leads;
  try {
    leads = JSON.parse(raw);
  } catch {
    throw new Error('Lokale Lead-Daten sind beschädigt und konnten nicht gelesen werden.');
  }

  if (!Array.isArray(leads) || leads.length === 0) {
    localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
    return { imported: 0, skipped: 0 };
  }

  console.info(`[Supabase] Importiere ${leads.length} Lead(s) aus localStorage…`);

  let imported = 0;
  let skipped = 0;

  for (const lead of leads) {
    try {
      await addLead(normalizeLead(lead), { preserveId: true, preserveCreatedAt: true });
      imported++;
    } catch (err) {
      console.warn('[Supabase] Import übersprungen:', lead?.id, err.message);
      skipped++;
    }
  }

  localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
  localStorage.removeItem(LOCAL_STORAGE_KEY);

  console.info(`[Supabase] Import abgeschlossen: ${imported} importiert, ${skipped} übersprungen`);
  return { imported, skipped };
}

export function subscribeToLeads(callback) {
  onLeadsRealtimeChange = callback;

  leadsRealtimeChannel = supabase
    .channel('rawfans-leads-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: LEADS_TABLE }, () => {
      console.info('[Supabase] Leads Realtime-Update empfangen');
      if (typeof onLeadsRealtimeChange === 'function') onLeadsRealtimeChange();
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') console.info('[Supabase] Leads Realtime verbunden');
      if (status === 'CHANNEL_ERROR') console.warn('[Supabase] Leads Realtime-Verbindung fehlgeschlagen');
    });
}

export function unsubscribeFromLeads() {
  if (leadsRealtimeChannel) {
    supabase.removeChannel(leadsRealtimeChannel);
    leadsRealtimeChannel = null;
  }
  onLeadsRealtimeChange = null;
}

function readLocalOutreachTemplates() {
  try {
    const raw = localStorage.getItem(OUTREACH_TEMPLATES_STORAGE_KEY);
    if (!raw) return [];
    const templates = JSON.parse(raw);
    return Array.isArray(templates) ? templates : [];
  } catch (err) {
    console.warn('[Supabase] Outreach-Templates aus localStorage lesen fehlgeschlagen:', err);
    return [];
  }
}

function normalizeOutreachEntry(entry, templates = readLocalOutreachTemplates()) {
  const statusMap = { interested: 'positive_reply' };
  const tpl = templates.find((t) => t.id === entry.templateId || t.id === entry.template_id);
  const migrated = { ...entry };
  delete migrated.followUpNeeded;

  return {
    id: entry.id,
    date: entry.date || entry.createdAt || entry.created_at || new Date().toISOString(),
    leadId: entry.leadId || entry.lead_id || '',
    templateId: entry.templateId || entry.template_id || null,
    messageType: entry.messageType || entry.message_type || tpl?.category || 'other',
    status: statusMap[entry.status] || entry.status || 'sent',
    sentiment: entry.sentiment || '',
    nextAction: entry.nextAction || entry.next_action || (entry.followUpNeeded ? 'followup2' : ''),
    followUpDate: entry.followUpDate || entry.follow_up_date || null,
    callPlanned:
      entry.callPlanned ??
      entry.call_planned ??
      ['call_planned', 'call_done'].includes(entry.status),
    callDate: entry.callDate || entry.call_date || null,
    callTime: entry.callTime || entry.call_time || '',
    notes: entry.notes || '',
    createdAt: entry.createdAt || entry.created_at || entry.date || new Date().toISOString(),
  };
}

function rowToOutreachEntry(row) {
  return normalizeOutreachEntry({
    id: row.id,
    date: row.date,
    leadId: row.lead_id,
    templateId: row.template_id,
    messageType: row.message_type,
    status: row.status,
    sentiment: row.sentiment,
    nextAction: row.next_action,
    followUpDate: row.follow_up_date,
    callPlanned: row.call_planned,
    callDate: row.call_date,
    callTime: row.call_time,
    notes: row.notes,
    createdAt: row.created_at,
  });
}

function outreachEntryToRow(entry) {
  const normalized = normalizeOutreachEntry(entry);
  return {
    date: normalized.date,
    lead_id: normalized.leadId,
    template_id: normalized.templateId || null,
    message_type: normalized.messageType,
    status: normalized.status,
    sentiment: normalized.sentiment,
    next_action: normalized.nextAction,
    follow_up_date: normalized.followUpDate,
    call_planned: normalized.callPlanned,
    call_date: normalized.callDate,
    call_time: normalized.callTime,
    notes: normalized.notes,
  };
}

/** Alle Outreach-Log-Einträge laden (neueste zuerst nach date) */
export async function fetchOutreachLog() {
  console.info('[Supabase] fetchOutreachLog()…');

  const { data, error } = await supabase
    .from(OUTREACH_LOG_TABLE)
    .select('*')
    .order('date', { ascending: false });

  if (error) handleError(error, 'Outreach Log laden fehlgeschlagen');

  const entries = (data || []).map(rowToOutreachEntry);
  console.info(`[Supabase] ${entries.length} Outreach-Log-Eintrag/Einträge geladen`);
  return entries;
}

/** Neuen Outreach-Log-Eintrag anlegen */
export async function addOutreachLog(entryData, options = {}) {
  const { preserveId = false, preserveCreatedAt = false } = options;
  const normalized = normalizeOutreachEntry(entryData);

  const id =
    preserveId && normalized.id
      ? normalized.id
      : typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  const row = {
    ...outreachEntryToRow(normalized),
    id,
    created_at: preserveCreatedAt ? normalized.createdAt : new Date().toISOString(),
  };

  console.info('[Supabase] addOutreachLog():', id, normalized.leadId);

  const { data, error } = await supabase.from(OUTREACH_LOG_TABLE).insert(row).select().single();

  if (error) handleError(error, 'Outreach Log anlegen fehlgeschlagen');
  return rowToOutreachEntry(data);
}

/** Outreach-Log-Eintrag aktualisieren */
export async function updateOutreachLog(id, entryData) {
  const row = {
    ...outreachEntryToRow(entryData),
    updated_at: new Date().toISOString(),
  };

  console.info('[Supabase] updateOutreachLog():', id);

  const { data, error } = await supabase
    .from(OUTREACH_LOG_TABLE)
    .update(row)
    .eq('id', id)
    .select()
    .single();

  if (error) handleError(error, 'Outreach Log aktualisieren fehlgeschlagen');
  return rowToOutreachEntry(data);
}

/** Outreach-Log-Eintrag löschen */
export async function deleteOutreachLog(id) {
  console.info('[Supabase] deleteOutreachLog():', id);

  const { error } = await supabase.from(OUTREACH_LOG_TABLE).delete().eq('id', id);

  if (error) handleError(error, 'Outreach Log löschen fehlgeschlagen');
  return true;
}

export function getLocalStorageOutreachLogCount() {
  if (localStorage.getItem(OUTREACH_LOG_MIGRATION_FLAG_KEY) === 'true') return 0;
  try {
    const raw = localStorage.getItem(OUTREACH_LOG_STORAGE_KEY);
    if (!raw) return 0;
    const entries = JSON.parse(raw);
    return Array.isArray(entries) ? entries.length : 0;
  } catch (err) {
    console.warn('[Supabase] Outreach Log localStorage lesen fehlgeschlagen:', err);
    return 0;
  }
}

export async function importOutreachLogFromLocalStorage() {
  if (localStorage.getItem(OUTREACH_LOG_MIGRATION_FLAG_KEY) === 'true') {
    console.info('[Supabase] Outreach Log Migration bereits abgeschlossen');
    return { imported: 0, skipped: 0, alreadyMigrated: true };
  }

  let raw;
  try {
    raw = localStorage.getItem(OUTREACH_LOG_STORAGE_KEY);
  } catch (err) {
    handleError(err, 'Outreach Log localStorage nicht lesbar');
  }

  if (!raw) return { imported: 0, skipped: 0 };

  let entries;
  try {
    entries = JSON.parse(raw);
  } catch {
    throw new Error('Lokale Outreach-Log-Daten sind beschädigt und konnten nicht gelesen werden.');
  }

  if (!Array.isArray(entries) || entries.length === 0) {
    localStorage.setItem(OUTREACH_LOG_MIGRATION_FLAG_KEY, 'true');
    return { imported: 0, skipped: 0 };
  }

  const templates = readLocalOutreachTemplates();
  console.info(`[Supabase] Importiere ${entries.length} Outreach-Log-Eintrag/Einträge aus localStorage…`);

  let imported = 0;
  let skipped = 0;

  for (const entry of entries) {
    try {
      await addOutreachLog(normalizeOutreachEntry(entry, templates), {
        preserveId: true,
        preserveCreatedAt: true,
      });
      imported++;
    } catch (err) {
      console.warn('[Supabase] Outreach Log Import übersprungen:', entry?.id, err.message);
      skipped++;
    }
  }

  localStorage.setItem(OUTREACH_LOG_MIGRATION_FLAG_KEY, 'true');
  localStorage.removeItem(OUTREACH_LOG_STORAGE_KEY);

  console.info(
    `[Supabase] Outreach Log Import abgeschlossen: ${imported} importiert, ${skipped} übersprungen`
  );
  return { imported, skipped };
}

export function subscribeToOutreachLog(callback) {
  onOutreachLogRealtimeChange = callback;

  outreachLogRealtimeChannel = supabase
    .channel('rawfans-outreach-log-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: OUTREACH_LOG_TABLE }, () => {
      console.info('[Supabase] Outreach Log Realtime-Update empfangen');
      if (typeof onOutreachLogRealtimeChange === 'function') onOutreachLogRealtimeChange();
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') console.info('[Supabase] Outreach Log Realtime verbunden');
      if (status === 'CHANNEL_ERROR') {
        console.warn('[Supabase] Outreach Log Realtime-Verbindung fehlgeschlagen');
      }
    });
}

export function unsubscribeFromOutreachLog() {
  if (outreachLogRealtimeChannel) {
    supabase.removeChannel(outreachLogRealtimeChannel);
    outreachLogRealtimeChannel = null;
  }
  onOutreachLogRealtimeChange = null;
}

function normalizeFinanceEntry(entry) {
  const amount = parseFloat(entry.amount);
  return {
    id: entry.id,
    date: entry.date || entry.createdAt || entry.created_at || new Date().toISOString(),
    type: entry.type === 'expense' ? 'expense' : 'income',
    category: entry.category || '',
    description: entry.description || '',
    amount: Number.isFinite(amount) ? amount : 0,
    recurring: Boolean(entry.recurring),
    recurringInterval: entry.recurring
      ? entry.recurringInterval || entry.recurring_interval || 'monthly'
      : null,
    status: entry.status || (entry.type === 'expense' ? 'paid' : 'received'),
    createdAt: entry.createdAt || entry.created_at || entry.date || new Date().toISOString(),
  };
}

function rowToFinanceEntry(row) {
  return normalizeFinanceEntry({
    id: row.id,
    date: row.date,
    type: row.type,
    category: row.category,
    description: row.description,
    amount: row.amount,
    recurring: row.recurring,
    recurringInterval: row.recurring_interval,
    status: row.status,
    createdAt: row.created_at,
  });
}

function financeEntryToRow(entry) {
  const normalized = normalizeFinanceEntry(entry);
  return {
    date: normalized.date,
    type: normalized.type,
    category: normalized.category,
    description: normalized.description,
    amount: normalized.amount,
    recurring: normalized.recurring,
    recurring_interval: normalized.recurringInterval,
    status: normalized.status,
  };
}

/** Alle Finanz-Einträge laden (neueste zuerst nach date) */
export async function fetchFinance() {
  console.info('[Supabase] fetchFinance()…');

  const { data, error } = await supabase
    .from(FINANCE_TABLE)
    .select('*')
    .order('date', { ascending: false });

  if (error) handleError(error, 'Finanzen laden fehlgeschlagen');

  const entries = (data || []).map(rowToFinanceEntry);
  console.info(`[Supabase] ${entries.length} Finanz-Eintrag/Einträge geladen`);
  return entries;
}

/** Neuen Finanz-Eintrag anlegen */
export async function addFinance(entryData, options = {}) {
  const { preserveId = false, preserveCreatedAt = false } = options;
  const normalized = normalizeFinanceEntry(entryData);

  const id =
    preserveId && normalized.id
      ? normalized.id
      : typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  const row = {
    ...financeEntryToRow(normalized),
    id,
    created_at: preserveCreatedAt ? normalized.createdAt : new Date().toISOString(),
  };

  console.info('[Supabase] addFinance():', id, normalized.description);

  const { data, error } = await supabase.from(FINANCE_TABLE).insert(row).select().single();

  if (error) handleError(error, 'Finanz-Eintrag anlegen fehlgeschlagen');
  return rowToFinanceEntry(data);
}

/** Finanz-Eintrag aktualisieren */
export async function updateFinance(id, entryData) {
  const row = {
    ...financeEntryToRow(entryData),
    updated_at: new Date().toISOString(),
  };

  console.info('[Supabase] updateFinance():', id);

  const { data, error } = await supabase
    .from(FINANCE_TABLE)
    .update(row)
    .eq('id', id)
    .select()
    .single();

  if (error) handleError(error, 'Finanz-Eintrag aktualisieren fehlgeschlagen');
  return rowToFinanceEntry(data);
}

/** Finanz-Eintrag löschen */
export async function deleteFinance(id) {
  console.info('[Supabase] deleteFinance():', id);

  const { error } = await supabase.from(FINANCE_TABLE).delete().eq('id', id);

  if (error) handleError(error, 'Finanz-Eintrag löschen fehlgeschlagen');
  return true;
}

export function getLocalStorageFinanceCount() {
  if (localStorage.getItem(FINANCE_MIGRATION_FLAG_KEY) === 'true') return 0;
  try {
    const raw = localStorage.getItem(FINANCE_STORAGE_KEY);
    if (!raw) return 0;
    const entries = JSON.parse(raw);
    return Array.isArray(entries) ? entries.length : 0;
  } catch (err) {
    console.warn('[Supabase] Finanzen localStorage lesen fehlgeschlagen:', err);
    return 0;
  }
}

export async function importFinanceFromLocalStorage() {
  if (localStorage.getItem(FINANCE_MIGRATION_FLAG_KEY) === 'true') {
    console.info('[Supabase] Finanzen Migration bereits abgeschlossen');
    return { imported: 0, skipped: 0, alreadyMigrated: true };
  }

  let raw;
  try {
    raw = localStorage.getItem(FINANCE_STORAGE_KEY);
  } catch (err) {
    handleError(err, 'Finanzen localStorage nicht lesbar');
  }

  if (!raw) return { imported: 0, skipped: 0 };

  let entries;
  try {
    entries = JSON.parse(raw);
  } catch {
    throw new Error('Lokale Finanz-Daten sind beschädigt und konnten nicht gelesen werden.');
  }

  if (!Array.isArray(entries) || entries.length === 0) {
    localStorage.setItem(FINANCE_MIGRATION_FLAG_KEY, 'true');
    return { imported: 0, skipped: 0 };
  }

  console.info(`[Supabase] Importiere ${entries.length} Finanz-Eintrag/Einträge aus localStorage…`);

  let imported = 0;
  let skipped = 0;

  for (const entry of entries) {
    try {
      await addFinance(normalizeFinanceEntry(entry), {
        preserveId: true,
        preserveCreatedAt: true,
      });
      imported++;
    } catch (err) {
      console.warn('[Supabase] Finanzen Import übersprungen:', entry?.id, err.message);
      skipped++;
    }
  }

  localStorage.setItem(FINANCE_MIGRATION_FLAG_KEY, 'true');
  localStorage.removeItem(FINANCE_STORAGE_KEY);

  console.info(`[Supabase] Finanzen Import abgeschlossen: ${imported} importiert, ${skipped} übersprungen`);
  return { imported, skipped };
}

export function subscribeToFinance(callback) {
  onFinanceRealtimeChange = callback;

  financeRealtimeChannel = supabase
    .channel('rawfans-finance-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: FINANCE_TABLE }, () => {
      console.info('[Supabase] Finanzen Realtime-Update empfangen');
      if (typeof onFinanceRealtimeChange === 'function') onFinanceRealtimeChange();
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') console.info('[Supabase] Finanzen Realtime verbunden');
      if (status === 'CHANNEL_ERROR') {
        console.warn('[Supabase] Finanzen Realtime-Verbindung fehlgeschlagen');
      }
    });
}

export function unsubscribeFromFinance() {
  if (financeRealtimeChannel) {
    supabase.removeChannel(financeRealtimeChannel);
    financeRealtimeChannel = null;
  }
  onFinanceRealtimeChange = null;
}