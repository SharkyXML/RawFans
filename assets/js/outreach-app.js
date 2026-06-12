/**
 * RawFans — Outreach (ES Module Entry)
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
} from './supabase-client.js';

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

initOutreach().catch((err) => {
  console.error('[Outreach] Initialisierung fehlgeschlagen:', err);
});