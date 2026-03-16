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

    // We use the background script proxy to bypass CORS as usual.
    chrome.runtime.sendMessage({
        type: 'API_TRACKING_FETCH',
        payload: {
            url: 'https://api-aggiesbp.servehttp.com/users/tracking',
            options: {
                method: 'GET',
                credentials: 'include'
            }
        }
    }, function(response) {
        // Clear loading state
        container.innerHTML = '';
        container.classList.remove('loading-state');

        if (response && response.ok) {
            // Logged in
            container.innerHTML = `
                <div class="auth-info-card">
                  <div class="auth-info-icon">👋</div>
                  <div class="auth-info-text">
                    <span class="auth-info-title">Connected Successfully</span>
                    <span class="auth-info-desc">Alerts will sync to your account</span>
                  </div>
                </div>
                <a href="https://aggieschedulebuilderplus.vercel.app/profile/alerts" target="_blank" class="btn btn-primary" style="grid-column: 1 / -1;">
                  <svg class="btn-icon" style="color: white; margin-bottom: 2px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                  Manage My Alerts
                </a>
            `;
        } else {
            // Not logged in or error
            container.innerHTML = `
                <div class="auth-info-card logged-out">
                  <div class="auth-info-icon">⚠️</div>
                  <div class="auth-info-text">
                    <span class="auth-info-title">Not Logged In</span>
                    <span class="auth-info-desc">Seat alerts require an account</span>
                  </div>
                </div>
                <a href="https://aggieschedulebuilderplus.vercel.app" target="_blank" class="btn btn-primary">
                  <svg class="btn-icon" style="color: #fca5a5;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>
                  Log In / Sign Up
                </a>
                <a href="https://aggieschedulebuilderplus.vercel.app/profile/alerts" target="_blank" class="btn btn-secondary">
                  <svg class="btn-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                  Demo Alerts
                </a>
            `;
        }
    });
}