document.addEventListener('DOMContentLoaded', function () {
    // ── Tab switching ──────────────────────────────────────────────────
    document.querySelectorAll('.popup-tab').forEach(function (tab) {
        tab.addEventListener('click', function () {
            const target = tab.dataset.tab;
            document.querySelectorAll('.popup-tab').forEach(function (t) {
                t.classList.toggle('active', t.dataset.tab === target);
            });
            document.querySelectorAll('.tab-pane').forEach(function (pane) {
                pane.classList.toggle('active', pane.id === 'tab-' + target);
            });
        });
    });
    // ──────────────────────────────────────────────────────────────────
    const beautifierCheckbox = document.getElementById('beautifierEnabled');
    const professorSidebarCheckbox = document.getElementById('professorSidebarEnabled');
    const themeToggle = document.getElementById('theme-toggle');
    const themeLabel = document.getElementById('theme-label');

    // Load saved settings
    chrome.storage.sync.get(
        {
            beautifierEnabled: false,
            professorSidebarEnabled: true,
            colorScheme: 'maroon',
            compactMode: true,
            theme: 'light' // Default to light theme
        },
        function (items) {
            // Update UI to reflect current settings
            if (beautifierCheckbox) {
                beautifierCheckbox.checked = items.beautifierEnabled;
            }
            if (professorSidebarCheckbox) {
                professorSidebarCheckbox.checked = items.professorSidebarEnabled !== false;
            }
            
            // Apply theme
            if (themeToggle) {
                themeToggle.checked = items.theme === 'dark';
                applyTheme(items.theme);
            }

            // Always ensure maroon theme and compact mode are enabled
            chrome.storage.sync.set({
                colorScheme: 'maroon',
                compactMode: true
            });
        }
    );

    // Theme toggle handler
    if (themeToggle) {
        themeToggle.addEventListener('change', function () {
            const newTheme = themeToggle.checked ? 'dark' : 'light';
            applyTheme(newTheme);
            
            chrome.storage.sync.set({ theme: newTheme }, function () {
                // Send message to content script
                chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                    if (tabs[0]?.id) {
                        chrome.tabs.sendMessage(tabs[0].id, {
                            action: 'themeChanged',
                            theme: newTheme
                        }, function (response) {
                            if (chrome.runtime.lastError) {
                                console.log('Content script not ready - theme will apply on page refresh');
                            }
                        });
                    }
                });
            });
        });
    }

    function applyTheme(theme) {
        document.body.classList.toggle('dark-theme', theme === 'dark');
        if (themeLabel) {
            themeLabel.textContent = theme === 'dark' ? 'Dark Mode' : 'Light Mode';
        }
    }

    // Toggle beautifier
    if (beautifierCheckbox) {
        beautifierCheckbox.addEventListener('change', function () {
            const newState = beautifierCheckbox.checked;

            chrome.storage.sync.set({
                beautifierEnabled: newState,
                colorScheme: 'maroon',
                compactMode: true
            }, function () {
                // Send message to content script
                chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        action: 'toggleBeautifier',
                        enabled: newState
                    }, function (response) {
                        // Handle any response if needed
                        if (chrome.runtime.lastError) {
                            console.log('Content script not ready - extension will work on page refresh');
                        }
                    });

                    // Also send updated settings to ensure maroon theme and compact mode
                    chrome.tabs.sendMessage(tabs[0].id, {
                        action: 'updateSettings',
                        settings: {
                            colorScheme: 'maroon',
                            compactMode: true
                        }
                    }, function (response) {
                        if (chrome.runtime.lastError) {
                            console.log('Content script not ready - settings will apply on page refresh');
                        }
                    });
                });
            });
        });
    }

    // Toggle professor sidebar
    if (professorSidebarCheckbox) {
        professorSidebarCheckbox.addEventListener('change', function () {
            const newState = professorSidebarCheckbox.checked;

            chrome.storage.sync.set({
                professorSidebarEnabled: newState
            }, function () {
                // Send message to content script
                chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        action: 'toggleProfessorSidebar',
                        enabled: newState
                    }, function (response) {
                        if (chrome.runtime.lastError) {
                            console.log('Content script not ready - extension will work on page refresh');
                        }
                    });
                });
            });
        });
    }

    // Check auth state
    checkAuthState();
});

function checkAuthState() {
    const container = document.getElementById('auth-state-container');
    if (!container) return;
    chrome.runtime.sendMessage({ type: 'AUTH_STATUS' }, function (response) {
        const state = chrome.runtime.lastError ? 'unavailable' : response?.state;
        container.classList.remove('loading-state');
        const signedIn = state === 'signed_in';
        const signedOut = state === 'signed_out';
        const title = signedIn ? 'Signed in to AggieSB+' : signedOut ? 'Not signed in' : 'Account status unavailable';
        const description = signedIn ? 'Your session refreshes automatically.'
            : signedOut ? 'Sign in once on AggieSB+ to connect this browser.'
            : 'We could not reach your account. Try again.';
        container.innerHTML = `
            <div class="auth-info-card${signedIn ? '' : ' logged-out'}">
                <div class="auth-info-icon">${signedIn ? '✓' : signedOut ? '↗' : '…'}</div>
                <div class="auth-info-text">
                    <span class="auth-info-title">${title}</span>
                    <span class="auth-info-desc" id="account-email"></span>
                    <span class="auth-info-desc">${description}</span>
                </div>
            </div>
            ${signedIn ? '<a href="https://aggieschedulebuilderplus.vercel.app/profile/alerts" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="grid-column: 1 / -1;">Manage my alerts ↗</a>'
                : signedOut ? '<a href="https://aggieschedulebuilderplus.vercel.app/auth?redirectToPath=%2Fprofile%2Falerts" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="grid-column: 1 / -1;">Sign in to AggieSB+ ↗</a>'
                : '<button type="button" id="retry-auth" class="btn btn-secondary">Retry</button>'}
        `;
        const email = document.getElementById('account-email');
        if (signedIn && response.email) email.textContent = response.email;
        else email.remove();
        document.getElementById('retry-auth')?.addEventListener('click', checkAuthState);
    });
}

window.addEventListener('focus', checkAuthState);
let authRecheckTimer;
chrome.cookies.onChanged.addListener(function (change) {
    if (!['st-access-token', 'st-refresh-token'].includes(change.cookie.name)) return;
    if (!['aggieschedulebuilderplus.vercel.app', 'aggieschedulebuilderplus-dev.vercel.app'].includes(change.cookie.domain.replace(/^\./, ''))) return;
    clearTimeout(authRecheckTimer);
    authRecheckTimer = setTimeout(checkAuthState, 250);
});
