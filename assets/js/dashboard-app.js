/**
 * RawFans — Dashboard (ES Module Entry)
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

initDashboard().catch((err) => {
  console.error('[Dashboard] Initialisierung fehlgeschlagen:', err);
});