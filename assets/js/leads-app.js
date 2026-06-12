/**
 * RawFans — Leads Seite (ES Module Entry)
 * Bindet Supabase-Funktionen an main.js und startet initLeads().
 */
import {
  fetchLeads,
  addLead,
  updateLead,
  deleteLead,
  importFromLocalStorage,
  getLocalStorageLeadCount,
  subscribeToLeads,
  unsubscribeFromLeads,
} from './supabase-client.js?v=20260612c';

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

initLeads().catch((err) => {
  console.error('[Leads] Initialisierung fehlgeschlagen:', err);
});