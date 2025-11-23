import { generateStarRating } from '../utils/formatters';
import { getProfessorDetailsUrl } from '../services/professor-service';
import { debugLog } from '../utils/debug';

/**
 * Create professors section HTML
 * @param {Object} courseData - Course data with professors
 * @returns {string} HTML string
 */
export function createProfessorsSection(courseData: any): string {
  if (!courseData || !courseData.professors || courseData.professors.length === 0) {
    return `
      <div class="professors-section">
        <div class="professors-header">
          <h3>Professors Teaching This Course</h3>
        </div>
        <div class="no-professors-message">
          <p>No professor information available for this course.</p>
        </div>
      </div>
    `;
  }

  const professorsHTML = courseData.professors.map((professor: any) => {
    // Format grade distribution
    let gradeDistHTML = '';
    if (professor.gradeDistribution) {
      const grades = professor.gradeDistribution;
      const total = Object.values(grades).reduce((sum: number, count: unknown) => sum + (typeof count === 'number' ? count : 0), 0) as number;

      if (total > 0) {
        gradeDistHTML = `
          <div class="grade-distribution">
            <h5>Grade Distribution</h5>
            <div class="grade-bars">
              ${Object.entries(grades).map(([grade, count]) => {
          const countNum = typeof count === 'number' ? count : 0;
          const totalNum = typeof total === 'number' ? total : 0;
          const percentage = totalNum > 0 ? Math.round((countNum / totalNum) * 100) : 0;
          return `
                  <div class="grade-bar">
                    <span class="grade-label">${grade}</span>
                    <div class="grade-bar-container">
                      <div class="grade-bar-fill grade-${grade.toLowerCase()}" style="width: ${percentage}%"></div>
                    </div>
                    <span class="grade-percentage">${percentage}%</span>
                  </div>
                `;
        }).join('')}
            </div>
          </div>
        `;
      }
    }

    // Create professor details URL
    const professorDetailsUrl = getProfessorDetailsUrl(professor.id);

    return `
      <div class="professor-card">
        <div class="professor-header">
          <h4 class="professor-name">${professor.name}</h4>
          <div class="professor-rating">
            <span class="rating-value">${professor.rating ? professor.rating.toFixed(1) : 'N/A'}</span>
            <span class="rating-stars">${generateStarRating(professor.rating)}</span>
          </div>
        </div>
        
        <div class="professor-stats">
          <div class="stat-item">
            <span class="stat-label">Reviews:</span>
            <span class="stat-value">${professor.reviews || 0}</span>
          </div>
        </div>

        <div class="professor-description">
          <h5>Student Reviews Summary</h5>
          <p>${professor.description || 'No review summary available.'}</p>
        </div>

        ${gradeDistHTML}

        <div class="professor-actions">
          <a href="${professorDetailsUrl}" target="_blank" class="professor-details-link">
            🎓 View Full Profile & Reviews
          </a>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="professors-section">
      <div class="professors-header">
        <h3>Professors Teaching This Course</h3>
        <p class="professors-subtitle">${courseData.professors.length} professor${courseData.professors.length === 1 ? '' : 's'} found</p>
      </div>
      <div class="professors-list">
        ${professorsHTML}
      </div>
    </div>
  `;
}

/**
 * Create floating professors panel
 * @param {string} professorsHTML - HTML string for professors section
 */
export function createFloatingProfessorsPanel(professorsHTML: string): void {
  // Remove any existing floating panel and hover indicator
  const existingPanel = document.getElementById('floating-professors-panel');
  if (existingPanel) {
    existingPanel.remove();
  }
  const existingIndicator = document.getElementById('hover-zone-indicator');
  if (existingIndicator) {
    existingIndicator.remove();
  }

  // Create hover zone indicator
  const hoverIndicator = document.createElement('div');
  hoverIndicator.id = 'hover-zone-indicator';
  hoverIndicator.className = 'hover-zone-indicator';

  // Create the floating panel container
  const floatingPanel = document.createElement('div');
  floatingPanel.id = 'floating-professors-panel';
  floatingPanel.className = 'floating-professors-panel collapsed';

  // Create the toggle button
  const toggleButton = document.createElement('button');
  toggleButton.className = 'professors-toggle-btn';
  toggleButton.innerHTML = '👥<span class="toggle-text">Professors</span>';
  toggleButton.title = 'Toggle Professors Panel';

  // Create the panel content
  const panelContent = document.createElement('div');
  panelContent.className = 'professors-panel-content';
  panelContent.innerHTML = professorsHTML;

  // Add close button inside the panel
  const closeButton = document.createElement('button');
  closeButton.className = 'professors-close-btn';
  closeButton.innerHTML = '×';
  closeButton.title = 'Close Professors Panel';

  // Add elements to panel
  floatingPanel.appendChild(toggleButton);
  floatingPanel.appendChild(panelContent);
  panelContent.insertBefore(closeButton, panelContent.firstChild);

  // Add toggle functionality
  toggleButton.addEventListener('click', () => {
    floatingPanel.classList.toggle('collapsed');
  });

  closeButton.addEventListener('click', () => {
    floatingPanel.classList.add('collapsed');
  });

  // Add mouse hover functionality for auto-expand
  let hoverTimeout: ReturnType<typeof setTimeout>;
  let isHoveringPanel = false;

  // Track mouse movement on the document
  document.addEventListener('mousemove', (e) => {
    const screenWidth = window.innerWidth;
    const mouseX = e.clientX;
    const isMobile = screenWidth <= 768;
    const triggerZone = isMobile ? 30 : 50;
    const indicatorZone = isMobile ? 60 : 100;
    const panelWidth = isMobile ? 320 : 400;

    clearTimeout(hoverTimeout);

    // Show/hide hover indicator
    if (mouseX >= screenWidth - indicatorZone && !isHoveringPanel) {
      hoverIndicator.classList.add('visible');
    } else {
      hoverIndicator.classList.remove('visible');
    }

    // Check if mouse is in the right trigger zone
    if (mouseX >= screenWidth - triggerZone) {
      hoverTimeout = setTimeout(() => {
        if (!isHoveringPanel) {
          floatingPanel.classList.remove('collapsed');
          hoverIndicator.classList.remove('visible');
        }
      }, 100);
    } else if (!isHoveringPanel && mouseX < screenWidth - panelWidth) {
      hoverTimeout = setTimeout(() => {
        if (!isHoveringPanel) {
          floatingPanel.classList.add('collapsed');
        }
      }, 300);
    }
  });

  // Track when mouse is over the panel itself
  floatingPanel.addEventListener('mouseenter', () => {
    isHoveringPanel = true;
    clearTimeout(hoverTimeout);
    floatingPanel.classList.remove('collapsed');
    hoverIndicator.classList.remove('visible');
  });

  floatingPanel.addEventListener('mouseleave', () => {
    isHoveringPanel = false;
    hoverTimeout = setTimeout(() => {
      if (!isHoveringPanel) {
        floatingPanel.classList.add('collapsed');
      }
    }, 500);
  });

  // Add to body
  document.body.appendChild(hoverIndicator);
  document.body.appendChild(floatingPanel);

  debugLog('Created floating professors panel with auto-expand functionality');
}

