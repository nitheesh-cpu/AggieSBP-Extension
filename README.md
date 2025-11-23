# Aggie Registration Beautifier - Refactored Structure

This Chrome extension has been refactored from a monolithic single-file structure to a modern, modular architecture using Vite.

## Project Structure

```
src/
├── config/
│   └── constants.js          # Configuration constants (API URLs, cache TTL, etc.)
├── utils/
│   ├── debug.js              # Debug logging utilities
│   ├── page-detector.js      # Page type detection
│   ├── formatters.js         # Data formatting functions
│   └── dom.js                # DOM manipulation utilities
├── services/
│   ├── cache.js              # Cache management (localStorage + chrome.storage)
│   ├── api.js                # API request functions
│   ├── course-service.js     # Course data processing
│   └── professor-service.js  # Professor data fetching
├── state/
│   └── store.js              # Global state management
├── components/
│   ├── loading-screen.js     # Loading screen component
│   ├── multi-select.js       # Multi-select dropdown component
│   ├── course-card.js        # Course card component (to be created)
│   ├── filter-controls.js    # Filter controls component (to be created)
│   ├── professors-panel.js   # Professors panel component (to be created)
│   └── schedule-item.js      # Schedule item component (to be created)
├── pages/
│   ├── sections-page.js      # Sections page handler (to be created)
│   └── schedule-page.js      # Schedule page handler (to be created)
├── handlers/
│   ├── card-handlers.js      # Course card event handlers (to be created)
│   ├── filter-handlers.js    # Filter event handlers (to be created)
│   ├── checkbox-sync.js      # Checkbox synchronization (to be created)
│   └── schedule-handlers.js  # Schedule event handlers (to be created)
├── content/
│   └── main.js               # Main entry point (to be created)
├── background/
│   └── background.js         # Background script (to be created)
└── popup/
    ├── popup.html            # Popup HTML (to be created)
    └── popup.js              # Popup script (to be created)
```

## Key Improvements

1. **Separation of Concerns**: Code is organized by functionality (utils, services, components, handlers)
2. **Modularity**: Each module has a single responsibility
3. **Maintainability**: Easier to find, understand, and modify code
4. **Testability**: Modules can be tested independently
5. **Scalability**: Easy to add new features without cluttering existing code

## Development

### Setup
```bash
npm install
```

### Development Mode
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

## Migration Notes

The original `OLD_CODE.js` file has been broken down into:

- **Utilities**: Debug, formatting, DOM helpers
- **Services**: API calls, caching, data processing
- **Components**: Reusable UI components
- **Handlers**: Event handling logic
- **Pages**: Page-specific orchestration

## Next Steps

To complete the refactoring, you need to:

1. Create remaining component files (course-card, filter-controls, etc.)
2. Create page handlers (sections-page, schedule-page)
3. Create event handlers
4. Create main entry point that orchestrates everything
5. Move CSS files to appropriate locations
6. Create background script and popup if needed

Each file should import from the utilities and services as needed, following the established patterns.
