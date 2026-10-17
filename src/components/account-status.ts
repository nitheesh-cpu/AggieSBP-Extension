const ACCOUNT_URL = 'https://aggieschedulebuilderplus.vercel.app/profile/alerts';
const LOGIN_URL = 'https://aggieschedulebuilderplus.vercel.app/auth?redirectToPath=%2Fprofile%2Falerts';

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
    if (!link.hasAttribute('href')) { event.preventDefault(); refresh(); }
  });
  const onFocus = (): void => {
    if (row.isConnected) refresh();
    else window.removeEventListener('focus', onFocus);
  };
  window.addEventListener('focus', onFocus);
  refresh();
  return row;
}
