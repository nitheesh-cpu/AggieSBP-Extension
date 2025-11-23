import { debugLog, errorLog } from './debug';

/**
 * Load and inject CSS files as style tags
 */
export async function loadStylesheets(): Promise<void> {
  const cssFiles = [
    '/css/course-cards.css',
    '/css/filter-controls.css',
    '/css/multi-select.css',
    '/css/course-details.css',
    '/css/save-button.css',
    '/css/badges.css',
    '/css/schedule.css',
    '/css/sections-table.css',
  ];

  for (const cssFile of cssFiles) {
    try {
      const response = await fetch(chrome.runtime.getURL(cssFile));
      const cssText = await response.text();

      const styleElement = document.createElement('style');
      styleElement.textContent = cssText;
      styleElement.setAttribute('data-extension-css', cssFile);
      document.head.appendChild(styleElement);

      debugLog(`Loaded stylesheet: ${cssFile}`);
    } catch (error) {
      errorLog(`Error loading stylesheet ${cssFile}:`, error);
    }
  }

  // Add additional styles for professors panel and details buttons
  // This would ideally be in a separate CSS file, but keeping it here for now
  // to match the original structure
  addAdditionalStyles();
}

/**
 * Add additional dynamic styles
 */
function addAdditionalStyles(): void {
  // Check if styles already added
  if (document.querySelector('style[data-extension-css="details-buttons"]')) {
    return;
  }

  const additionalStyles = document.createElement('style');
  additionalStyles.textContent = `
    /* Floating Professors Panel Styles */
    .floating-professors-panel {
      position: fixed;
      top: 50%;
      right: 0;
      transform: translateY(-50%);
      z-index: 10000;
      transition: all 0.3s ease;
      max-height: 80vh;
      display: flex;
      align-items: center;
    }

    .floating-professors-panel.collapsed {
      right: -400px;
    }

    /* Hover zone indicator */
    .hover-zone-indicator {
      position: fixed;
      top: 0;
      right: 0;
      width: 3px;
      height: 100vh;
      background: linear-gradient(to bottom, transparent 0%, #500000 20%, #500000 80%, transparent 100%);
      z-index: 9999;
      opacity: 0;
      transition: opacity 0.2s ease;
      pointer-events: none;
    }

    .hover-zone-indicator.visible {
      opacity: 0.6;
    }

    .professors-toggle-btn {
      background: linear-gradient(135deg, #500000 0%, #700000 100%);
      color: white;
      border: none;
      padding: 12px 8px;
      border-radius: 8px 0 0 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      box-shadow: -2px 0 8px rgba(0, 0, 0, 0.2);
      transition: all 0.3s ease;
      writing-mode: vertical-rl;
      text-orientation: mixed;
      min-height: 120px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .professors-toggle-btn:hover {
      background: linear-gradient(135deg, #600000 0%, #800000 100%);
      transform: scale(1.05);
    }

    .toggle-text {
      font-size: 12px;
      letter-spacing: 1px;
    }

    .professors-panel-content {
      width: 400px;
      height: 80vh;
      background: white;
      border-radius: 8px 0 0 8px;
      box-shadow: -4px 0 16px rgba(0, 0, 0, 0.15);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      position: relative;
    }

    .professors-close-btn {
      position: absolute;
      top: 12px;
      right: 12px;
      background: #dc3545;
      color: white;
      border: none;
      border-radius: 50%;
      width: 28px;
      height: 28px;
      cursor: pointer;
      font-size: 16px;
      font-weight: bold;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10001;
      transition: all 0.2s ease;
    }

    .professors-close-btn:hover {
      background: #c82333;
      transform: scale(1.1);
    }

    /* Professors Section Styles */
    .professors-section {
      background: white;
      height: 100%;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .professors-header {
      background: linear-gradient(135deg, #500000 0%, #700000 100%);
      color: white;
      padding: 16px 20px;
      text-align: center;
    }

    .professors-header h3 {
      margin: 0 0 4px 0;
      font-size: 1.2em;
      font-weight: 600;
    }

    .professors-subtitle {
      margin: 0;
      font-size: 0.9em;
      opacity: 0.9;
    }

    .professors-list {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      margin-top: 40px;
    }

    .professor-card {
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 6px;
      padding: 16px;
      margin-bottom: 16px;
      transition: all 0.3s ease;
    }

    .professor-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      border-color: #500000;
    }

    .professor-card:last-child {
      margin-bottom: 0;
    }

    .professor-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }

    .professor-name {
      margin: 0;
      font-size: 1.1em;
      font-weight: 600;
      color: #333;
      flex: 1;
    }

    .professor-rating {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 2px;
    }

    .rating-value {
      font-size: 1.2em;
      font-weight: 700;
      color: #500000;
    }

    .rating-stars {
      font-size: 1em;
    }

    .stars {
      color: #ffc107;
    }

    .no-rating {
      font-size: 0.8em;
      color: #6c757d;
      font-style: italic;
    }

    .professor-stats {
      display: flex;
      gap: 16px;
      margin-bottom: 12px;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .stat-label {
      font-size: 0.85em;
      color: #666;
      font-weight: 500;
    }

    .stat-value {
      font-size: 0.9em;
      font-weight: 600;
      color: #333;
    }

    .professor-description {
      margin-bottom: 16px;
    }

    .professor-description h5 {
      margin: 0 0 8px 0;
      font-size: 0.9em;
      font-weight: 600;
      color: #495057;
    }

    .professor-description p {
      margin: 0;
      font-size: 0.85em;
      line-height: 1.4;
      color: #666;
      background: white;
      padding: 8px;
      border-radius: 4px;
      border-left: 3px solid #500000;
    }

    .grade-distribution {
      margin-bottom: 16px;
    }

    .grade-distribution h5 {
      margin: 0 0 8px 0;
      font-size: 0.9em;
      font-weight: 600;
      color: #495057;
    }

    .grade-bars {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .grade-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.8em;
    }

    .grade-label {
      width: 20px;
      font-weight: 600;
      color: #333;
    }

    .grade-bar-container {
      flex: 1;
      height: 16px;
      background: #e9ecef;
      border-radius: 8px;
      overflow: hidden;
    }

    .grade-bar-fill {
      height: 100%;
      border-radius: 8px;
      transition: width 0.3s ease;
    }

    .grade-a { background: #28a745; }
    .grade-b { background: #17a2b8; }
    .grade-c { background: #ffc107; }
    .grade-d { background: #fd7e14; }
    .grade-f { background: #dc3545; }

    .grade-percentage {
      width: 35px;
      text-align: right;
      font-weight: 600;
      color: #495057;
    }

    .professor-actions {
      text-align: center;
    }

    .professor-details-link {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 8px 16px;
      background: linear-gradient(135deg, #500000 0%, #700000 100%);
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-size: 0.85em;
      font-weight: 600;
      transition: all 0.3s ease;
      box-shadow: 0 2px 6px rgba(80, 0, 0, 0.2);
    }

    .professor-details-link:hover {
      background: linear-gradient(135deg, #600000 0%, #800000 100%);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(80, 0, 0, 0.3);
      color: white;
      text-decoration: none;
    }

    .no-professors-message {
      padding: 20px;
      text-align: center;
      color: #6c757d;
    }

    .no-professors-message p {
      margin: 0;
      font-style: italic;
    }

    /* Course and Professor Details Button Styles */
    .course-title-header-container {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }

    .course-title-header-container h2 {
      margin: 0;
      flex: 1;
    }

    .course-details-btn-header {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 8px 16px;
      background: linear-gradient(135deg, #500000 0%, #700000 100%);
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.3s ease;
      flex-shrink: 0;
      box-shadow: 0 2px 6px rgba(80, 0, 0, 0.2);
      white-space: nowrap;
    }

    .course-details-btn-header:hover {
      background: linear-gradient(135deg, #600000 0%, #800000 100%);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(80, 0, 0, 0.3);
      color: white;
      text-decoration: none;
    }

    .course-details-btn-header:active {
      transform: translateY(0px);
      box-shadow: 0 1px 3px rgba(80, 0, 0, 0.2);
    }

    .course-title-container {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .course-title-container h3 {
      margin: 0;
      flex: 1;
    }

    .instructor-container {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .professor-details-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      padding: 4px 8px;
      background: linear-gradient(135deg, #500000 0%, #700000 100%);
      color: white;
      text-decoration: none;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      transition: all 0.3s ease;
      flex-shrink: 0;
      box-shadow: 0 2px 4px rgba(80, 0, 0, 0.2);
      white-space: nowrap;
    }

    .professor-details-btn:hover {
      background: linear-gradient(135deg, #600000 0%, #800000 100%);
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(80, 0, 0, 0.3);
      color: white;
      text-decoration: none;
    }

    .professor-details-btn:active {
      transform: translateY(0px);
      box-shadow: 0 1px 2px rgba(80, 0, 0, 0.2);
    }

    /* Course details links in add courses table */
    .course-details-link {
      color: #500000 !important;
      text-decoration: none;
      font-weight: 600;
      border-bottom: 1px dotted #500000;
      transition: all 0.3s ease;
    }

    .course-details-link:hover {
      color: #700000 !important;
      text-decoration: none;
      border-bottom: 1px solid #700000;
    }

    /* Instructor container in schedule */
    .instructor-container {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .instructor-name {
      margin: 0;
    }

    /* Responsive adjustments */
    @media (max-width: 768px) {
      .course-title-header-container {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }

      .course-details-btn-header {
        padding: 6px 12px;
        font-size: 12px;
      }

      .instructor-container {
        flex-wrap: wrap;
        gap: 4px;
      }

      .professor-details-btn {
        padding: 3px 6px;
        font-size: 11px;
      }

      /* Mobile floating panel adjustments */
      .floating-professors-panel.collapsed {
        right: -320px;
      }

      .professors-panel-content {
        width: 320px;
        height: 90vh;
      }

      .professors-toggle-btn {
        padding: 8px 6px;
        font-size: 12px;
        min-height: 100px;
      }

      .toggle-text {
        font-size: 10px;
      }

      .professors-list {
        padding: 12px;
      }

      .professor-card {
        padding: 12px;
        margin-bottom: 12px;
      }

      .hover-zone-indicator {
        width: 2px;
      }
    }
  `;
  additionalStyles.setAttribute('data-extension-css', 'details-buttons');
  document.head.appendChild(additionalStyles);
}

