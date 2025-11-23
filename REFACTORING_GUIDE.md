# Refactoring Guide - Completing the Migration

This guide helps you complete the migration from `OLD_CODE.js` to the new modular structure.

## File Mapping

### Core Utilities (✅ Complete)
- `src/utils/debug.js` - Lines 6-13 from OLD_CODE.js
- `src/utils/page-detector.js` - Lines 335-338, 3490-3496
- `src/utils/formatters.js` - Lines 1032-1062, 1367-1397, 1342-1360
- `src/utils/dom.js` - Lines 341-350, 951-970, 691-704, 669-688

### Services (✅ Complete)
- `src/services/cache.js` - Lines 180-321
- `src/services/api.js` - Lines 565-604, 606-649, 3499-3544
- `src/services/professor-service.js` - Lines 2811-2902, 2817-2850
- `src/services/course-service.js` - Lines 651-777, 3580-3670

### Components (🔄 In Progress)
- `src/components/loading-screen.js` - Lines 15-161 ✅
- `src/components/multi-select.js` - Lines 2599-2809 ✅
- `src/components/course-card.js` - **TODO**: Lines 972-1124
- `src/components/extended-details.js` - **TODO**: Lines 1362-1503
- `src/components/professors-panel.js` - **TODO**: Lines 1126-1245, 1247-1339
- `src/components/filter-controls.js` - **TODO**: Lines 1800-1848
- `src/components/save-button.js` - **TODO**: Lines 2276-2340

### Page Handlers (🔄 To Do)
- `src/pages/sections-page.js` - **TODO**: Lines 352-461, 779-948
- `src/pages/schedule-page.js` - **TODO**: Lines 3829-3954, 3956-4068

### Event Handlers (🔄 To Do)
- `src/handlers/card-handlers.js` - **TODO**: Lines 1610-1661
- `src/handlers/tab-handlers.js` - **TODO**: Lines 1663-1686
- `src/handlers/filter-handlers.js` - **TODO**: Lines 1850-2247
- `src/handlers/checkbox-sync.js` - **TODO**: Lines 4070-4201
- `src/handlers/schedule-handlers.js` - **TODO**: Lines 4214-4251, 4254-4382

### Settings & Styling (🔄 To Do)
- `src/utils/settings.js` - **TODO**: Lines 1505-1608
- CSS files should be moved to `src/css/` directory

### Main Entry Point (🔄 To Do)
- `src/content/main.js` - **TODO**: Lines 463-524, 526-563

## Implementation Pattern

When creating new files, follow this pattern:

```javascript
// Import dependencies
import { debugLog } from '../utils/debug.js';
import { store } from '../state/store.js';
import { someService } from '../services/some-service.js';

// Export functions/classes
export function myFunction() {
  // Implementation
}
```

## Key Functions to Extract

### Course Card Component
- Extract `createCourseCard` (lines 972-1124)
- Use formatters from `utils/formatters.js`
- Use professor service for professor buttons

### Filter Handlers
- Extract filter initialization (lines 1850-1895)
- Extract filter change handler (lines 2003-2120)
- Extract filter rules update (lines 2195-2247)

### Schedule Beautification
- Extract schedule creation (lines 3672-3827)
- Extract schedule handlers (lines 4214-4251)
- Extract checkbox sync (lines 4070-4201)

## Testing Strategy

1. Test each module independently
2. Test integration between modules
3. Test full page flows
4. Verify Chrome extension APIs work correctly

## Common Patterns

### State Management
```javascript
import { store } from '../state/store.js';

// Get state
const currentCourse = store.get('currentCourse');

// Set state
store.set('currentCourse', courseData);

// Update multiple
store.update({ currentCourse, allSectionsData });
```

### API Calls
```javascript
import { getSelectedCourseData } from '../services/api.js';

const course = await getSelectedCourseData(courseId);
```

### Caching
```javascript
import { CacheUtils } from '../services/cache.js';

// Check cache
const cached = CacheUtils.getCachedDataSync('key');

// Store in cache
await CacheUtils.store('key', data);
```

## Notes

- Keep all Chrome extension APIs working
- Maintain backward compatibility with existing functionality
- Preserve all event handlers and their behavior
- Keep CSS styling consistent
- Ensure all async operations are properly handled

