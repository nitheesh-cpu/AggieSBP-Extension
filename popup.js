document.addEventListener('DOMContentLoaded', function () {
    const beautifierCheckbox = document.getElementById('beautifierEnabled');

    // Load saved settings
    chrome.storage.sync.get(
        {
            beautifierEnabled: false,
            colorScheme: 'maroon',
            compactMode: true
        },
        function (items) {
            // Update UI to reflect current settings
            beautifierCheckbox.checked = items.beautifierEnabled;

            // Always ensure maroon theme and compact mode are enabled
            chrome.storage.sync.set({
                colorScheme: 'maroon',
                compactMode: true
            });
        }
    );

    // Toggle beautifier
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
});