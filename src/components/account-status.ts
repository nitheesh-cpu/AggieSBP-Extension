import { SITE_ORIGIN, withUtm } from '../config/constants';

const ACCOUNT_URL = withUtm(`${SITE_ORIGIN}/profile/alerts`, 'account-status');
const LOGIN_URL = withUtm(`${SITE_ORIGIN}/auth?redirectToPath=%2Fprofile%2Falerts`, 'account-status');

export function createAccountStatus(): HTMLElement {
  const row = document.createElement('div');
  row.className = 'prof-account-status';
  row.setAttribute('aria-live', 'polite');
  const label = document.createElement('span');
  label.className = 'prof-account-label';
  label.textContent = 'Checking account…';
  const link = document.createElement('a');
  link.className = 'prof-account-link';
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  row.append(label, link);
  const refresh = (): void => {
    chrome.runtime.sendMessage({ type: 'AUTH_STATUS' }, response => {
      const state = chrome.runtime.lastError ? 'unavailable' : response?.state;
      row.dataset.state = state || 'unavailable';
      if (state === 'signed_in') {
        label.textContent = response.email ? `Signed in · ${response.email}` : 'Signed in to AggieSB+';
        link.textContent = 'Account ↗';
        link.href = ACCOUNT_URL;
      } else if (state === 'signed_out') {
        label.textContent = 'Not signed in';
        link.textContent = 'Sign in ↗';
        link.href = LOGIN_URL;
      } else {
        label.textContent = 'Account status unavailable';
        link.textContent = 'Retry';
        link.removeAttribute('href');
      }
    });
  };
  link.addEventListener('click', event => {
    if (!link.hasAttribute('href')) { event.preventDefault(); refresh(); return; }
    // Sign in goes through connect.html, which asks for access to aggiesbp.com first (D-020).
    // The href stays as a fallback for middle-click and if the message fails.
    if (row.dataset.state === 'signed_out') {
      event.preventDefault();
      chrome.runtime.sendMessage({ type: 'OPEN_CONNECT', from: 'account-status' }, () => {
        if (chrome.runtime.lastError) window.open(LOGIN_URL, '_blank', 'noopener');
      });
    }
  });
  const onFocus = (): void => {
    if (row.isConnected) refresh();
    else window.removeEventListener('focus', onFocus);
  };
  window.addEventListener('focus', onFocus);
  refresh();
  return row;
}
