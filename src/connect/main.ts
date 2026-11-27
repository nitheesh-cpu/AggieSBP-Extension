import { SITE_ORIGIN, withUtm } from '../config/constants';
import { reportUsage } from '../utils/usage';

/**
 * Connect page (connect.html), opened by every "Sign in" link in the extension.
 *
 * The website moved to aggiesbp.com. The background reads the site's SuperTokens
 * cookies to call the API as the user, which needs host access to the site.
 * aggiesbp.com is an optional host permission so the update installs without
 * Chrome disabling the extension; this page asks for it on a click, which is the
 * only way browsers allow (D-020). If access is already granted it goes straight
 * on to the sign-in page.
 */

const PERMISSION: chrome.permissions.Permissions = { origins: [`${SITE_ORIGIN}/*`] };
const MEDIUMS = ['popup', 'account-status', 'onboarding'] as const;

const from = new URLSearchParams(location.search).get('from') ?? '';
const medium = (MEDIUMS as readonly string[]).includes(from) ? from : 'connect';
const LOGIN_URL = withUtm(`${SITE_ORIGIN}/auth?redirectToPath=%2Fprofile%2Falerts`, medium);

const checking = document.getElementById('checking')!;
const ask = document.getElementById('ask')!;
const allow = document.getElementById('allow') as HTMLButtonElement;
const skip = document.getElementById('skip') as HTMLAnchorElement;
const status = document.getElementById('status')!;

skip.href = LOGIN_URL;

function goToSignIn(): void {
  location.replace(LOGIN_URL);
}

allow.addEventListener('click', () => {
  // Call request() straight from the click: Firefox refuses it after an await.
  chrome.permissions.request(PERMISSION).then(granted => {
    reportUsage('ext-access-prompt', { result: granted ? 'granted' : 'denied' });
    if (granted) { goToSignIn(); return; }
    status.textContent = 'Not connected. You can still sign in, but the extension will show you as signed out until you allow access here.';
  }).catch(() => {
    reportUsage('ext-access-prompt', { result: 'denied' });
    status.textContent = 'Your browser could not ask for access. Update it, or sign in without connecting.';
  });
});

chrome.permissions.contains(PERMISSION).then(has => {
  if (has) { goToSignIn(); return; }
  checking.hidden = true;
  ask.hidden = false;
  reportUsage('ext-access-prompt', { result: 'shown' }, { oncePerLoad: true });
}).catch(() => {
  checking.hidden = true;
  ask.hidden = false;
  reportUsage('ext-access-prompt', { result: 'shown' }, { oncePerLoad: true });
});
