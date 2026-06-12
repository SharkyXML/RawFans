/**
 * RawFans — Finanzen (ES Module Entry)
 */
import {
  fetchFinance,
  addFinance,
  updateFinance,
  deleteFinance,
  importFinanceFromLocalStorage,
  getLocalStorageFinanceCount,
  subscribeToFinance,
  unsubscribeFromFinance,
} from './supabase-client.js';

window.RawFansFinanceDB = {
  fetchFinance,
  addFinance,
  updateFinance,
  deleteFinance,
  importFinanceFromLocalStorage,
  getLocalStorageFinanceCount,
  subscribeToFinance,
  unsubscribeFromFinance,
};

initFinanzen().catch((err) => {
  console.error('[Finanzen] Initialisierung fehlgeschlagen:', err);
});