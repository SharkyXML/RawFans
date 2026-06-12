/**
 * RawFans — Supabase Client & Leads API
 *
 * Benötigt: @supabase/supabase-js (CDN) vor diesem Script
 * Wird von leads.html eingebunden.
 */
(function () {
  const SUPABASE_URL = 'https://wyandwrbzrlxjvxvjds.supabase.co';
  const SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5YW5kd3JienJseHZqdnh2amRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNjg5NzYsImV4cCI6MjA5Njg0NDk3Nn0.2mHu4S4YTT5xS_ZhH5tlE2c5jq8OUaxfweg-rse-Wic';
  const LEADS_TABLE = 'leads';
  const LOCAL_STORAGE_KEY = 'rawfans_leads';
  const MIGRATION_FLAG_KEY = 'rawfans_leads_supabase_migrated';

  let client = null;
  let realtimeChannel = null;
  let onRealtimeChange = null;

  function getClient() {
    if (client) return client;

    if (typeof supabase === 'undefined' || !supabase.createClient) {
      const err = new Error(
        'Supabase Library nicht geladen. Bitte @supabase/supabase-js CDN in leads.html prüfen.'
      );
      console.error('[Supabase]', err.message);
      throw err;
    }

    client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.info('[Supabase] Client initialisiert:', SUPABASE_URL);
    return client;
  }

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

  /** Normalisiert einen Lead aus der App oder aus localStorage */
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

  /** DB-Zeile (snake_case) → App-Lead (camelCase) */
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

  /** App-Lead → DB-Zeile */
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
  async function fetchLeads() {
    console.info('[Supabase] fetchLeads()…');
    const { data, error } = await getClient()
      .from(LEADS_TABLE)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) handleError(error, 'Leads laden fehlgeschlagen');

    const leads = (data || []).map(rowToLead);
    console.info(`[Supabase] ${leads.length} Lead(s) geladen`);
    return leads;
  }

  /** Neuen Lead anlegen */
  async function addLead(leadData, options = {}) {
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

    const { data, error } = await getClient()
      .from(LEADS_TABLE)
      .insert(row)
      .select()
      .single();

    if (error) handleError(error, 'Lead anlegen fehlgeschlagen');
    return rowToLead(data);
  }

  /** Lead aktualisieren */
  async function updateLead(id, leadData) {
    const row = {
      ...leadToRow(leadData),
      updated_at: new Date().toISOString(),
    };

    console.info('[Supabase] updateLead():', id);

    const { data, error } = await getClient()
      .from(LEADS_TABLE)
      .update(row)
      .eq('id', id)
      .select()
      .single();

    if (error) handleError(error, 'Lead aktualisieren fehlgeschlagen');
    return rowToLead(data);
  }

  /** Lead löschen */
  async function deleteLead(id) {
    console.info('[Supabase] deleteLead():', id);

    const { error } = await getClient().from(LEADS_TABLE).delete().eq('id', id);

    if (error) handleError(error, 'Lead löschen fehlgeschlagen');
    return true;
  }

  /** Anzahl noch nicht migrierter localStorage-Leads */
  function getLocalStorageLeadCount() {
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

  /** localStorage-Leads einmalig nach Supabase importieren */
  async function importFromLocalStorage() {
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

  /** Echtzeit-Sync: Änderungen von anderen Nutzern */
  function subscribeToLeads(callback) {
    onRealtimeChange = callback;

    realtimeChannel = getClient()
      .channel('rawfans-leads-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: LEADS_TABLE }, () => {
        console.info('[Supabase] Realtime-Update empfangen');
        if (typeof onRealtimeChange === 'function') onRealtimeChange();
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.info('[Supabase] Realtime verbunden');
        }
        if (status === 'CHANNEL_ERROR') {
          console.warn('[Supabase] Realtime-Verbindung fehlgeschlagen');
        }
      });
  }

  function unsubscribeFromLeads() {
    if (realtimeChannel && client) {
      client.removeChannel(realtimeChannel);
      realtimeChannel = null;
    }
    onRealtimeChange = null;
  }

  // Client beim Laden vorbereiten
  try {
    getClient();
  } catch (err) {
    console.error('[Supabase] Initialisierung fehlgeschlagen:', err.message);
  }

  /** Öffentliche API — von main.js / leads.html genutzt */
  window.RawFansLeadsDB = {
    fetchLeads,
    addLead,
    updateLead,
    deleteLead,
    importFromLocalStorage,
    getLocalStorageLeadCount,
    subscribeToLeads,
    unsubscribeFromLeads,
  };
})();