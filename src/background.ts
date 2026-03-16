chrome.runtime.onInstalled.addListener(() => {
  console.log('Chrome extension installed');
});

// Helper to get SuperTokens cookies from the web app domains
async function getAuthHeader() {
  const domains = [
    'https://aggieschedulebuilderplus.vercel.app',
    'https://aggieschedulebuilderplus-dev.vercel.app'
  ];

  for (const domain of domains) {
    try {
      const cookie = await chrome.cookies.get({ url: domain, name: 'st-access-token' });
      if (cookie && cookie.value) {
        return `Bearer ${cookie.value}`;
      }
    } catch (e) {
      console.log('No cookie for', domain);
    }
  }
  return null;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'API_TRACKING_FETCH') {
    const { url, options } = message.payload;
    
    getAuthHeader().then(async (authHeader) => {
        // Initialize headers if not present
        const init = options || {};
        init.headers = init.headers || {};
        
        if (authHeader) {
            init.headers['Authorization'] = authHeader;
        }

        try {
            const response = await fetch(url, init);
            const contentType = response.headers.get('content-type') || '';
            const data = contentType.includes('application/json') ? await response.json() : null;
            
            sendResponse({
                ok: response.ok,
                status: response.status,
                data: data
            });
        } catch (error) {
            console.error('Fetch error in background:', error);
            sendResponse({ ok: false, status: 0, data: null });
        }
    });

    return true; // Keep message channel open for async response
  }
});