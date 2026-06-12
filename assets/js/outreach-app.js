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
  fetchOutreachLog,
  addOutreachLog,
  updateOutreachLog,
  deleteOutreachLog,
  importOutreachLogFromLocalStorage,
  getLocalStorageOutreachLogCount,
  subscribeToOutreachLog,
  unsubscribeFromOutreachLog,
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

window.RawFansOutreachLogDB = {
  fetchOutreachLog,
  addOutreachLog,
  updateOutreachLog,
  deleteOutreachLog,
  importOutreachLogFromLocalStorage,
  getLocalStorageOutreachLogCount,
  subscribeToOutreachLog,
  unsubscribeFromOutreachLog,
};

initOutreach().catch((err) => {
  console.error('[Outreach] Initialisierung fehlgeschlagen:', err);
});