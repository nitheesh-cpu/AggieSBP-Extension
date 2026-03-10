document.addEventListener('DOMContentLoaded', function () {
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
});