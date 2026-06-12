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
} from './supabase-client.js?v=20260612c';

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