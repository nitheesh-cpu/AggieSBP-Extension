# AggieSB+ Chrome Extension

**Enhance your Texas A&M registration experience with real-time insights and seat alerts.**

AggieSB+ (formerly Professor Compare) integrates professor ratings, AI summaries, and historical grade distributions directly into the TAMU College Scheduler. It also provides real-time monitoring for full course sections, sending you instant push notifications when seats open up.

## 🚀 Changelog

### v3.1.0 (Current)
- Added **Seat Alerts**: Real-time push notifications when a course section opens up.
- Expanded Support: Now appears on **Build Schedule** and **Shopping Cart** pages.
- Redesigned **Extension Popup**: 3-tab layout (Home, Help, Settings) with help guides and dark mode.
- Optimized performance for background monitoring.

### v3.0.1
- Added ability to check overall summaries when specific course data is limited.

### v3.0
- Rebranded as purely functional (removed "beautification" focus).
- Added Professor Comparison on sections pages.

---

## 🛠️ Project Structure

The project is built with **Vite** and **TypeScript** for speed and reliability.

```
extension/
├── src/
│   ├── components/      # UI: Support for Professor Panels and Alerts
│   ├── services/        # Logic: API, Tracking, and Cache management
│   ├── utils/           # Helpers: Page detection and text formatting
│   ├── content/         # Content scripts for page injection
│   └── background.ts    # Service worker for push notifications
├── popup.js            # Main logic for the extension popup
├── styles.css          # Shared styles (Modern, Dark Mode support)
└── index.html          # Extension popup structure
```

## 📦 Development

### Setup
```bash
npm install
```

### Build & Run
- **Development**: `npm run dev`
- **Build**: `npm run build`
- **Load**: Go to `chrome://extensions`, enable Developer Mode, and **Load unpacked** from the `dist` or `build` folder.

---

**Built by Aggies, for Aggies. Gig 'em! 👍**

*Works exclusively with tamu.collegescheduler.com*
*Data provided by AggieSBP (aggieschedulebuilderplus.vercel.app)*
