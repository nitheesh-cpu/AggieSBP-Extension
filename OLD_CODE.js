// ========================================
// AGGIE REGISTRATION BEAUTIFIER
// ========================================

// Debug flag - set to false for production
const DEBUG_MODE = true;

// Debug logging function
function debugLog(...args) {
  if (DEBUG_MODE) {
    console.log(...args);
  }
}

// Loading screen functions
function showLoadingScreen() {
  // Check if loading screen already exists
  if (document.getElementById('aggie-beautifier-loading')) {
    return;
  }

  const loadingOverlay = document.createElement('div');
  loadingOverlay.id = 'aggie-beautifier-loading';
  loadingOverlay.innerHTML = `
    <div class="loading-container">
      <div class="loading-logo">
        <div class="maroon-circle">
          <svg xmlns="http://www.w3.org/2000/svg" id="Layer_1" data-name="Layer 1" viewBox="0 0 216 216" style="
            margin-top: 5px;"><defs><style>.cls-1{fill:#fff;display:block}</style></defs><title>A&M Logo</title>
            <polygon class="cls-1" points="190.36 84.32 173.7 84.32 172.73 84.32 172.31 85.19 160.22 110.34 148.1 85.19 147.69 84.32 146.72 84.32 130.63 84.32 129.09 84.32 129.09 85.85 129.09 94.43 129.09 95.96 130.63 95.96 133.38 95.96 133.38 131.97 130.4 131.97 128.86 131.97 128.86 133.51 128.86 142.08 128.86 143.62 130.4 143.62 148.48 143.62 150.02 143.62 150.02 142.08 150.02 133.51 150.02 131.97 148.48 131.97 145.35 131.97 145.35 106.42 158.86 134.28 160.23 137.12 161.62 134.28 175.27 106.36 175.27 131.97 172.28 131.97 170.74 131.97 170.74 133.51 170.74 142.08 170.74 143.62 172.28 143.62 190.36 143.62 191.9 143.62 191.9 142.08 191.9 133.51 191.9 131.97 190.36 131.97 187.25 131.97 187.25 95.96 190.36 95.96 191.9 95.96 191.9 94.43 191.9 85.85 191.9 84.32 190.36 84.32"></polygon>
            <path class="cls-1" d="M85.37,131.94h-4.8L64.91,95.77h3V84.11H42.78V95.77h3.46L30.6,131.94H24.1v11.64H46.91V131.94H43.58l2.6-6H65l2.6,6H64.08v11.64H86.91V131.94ZM60,114.27H51.21l4.37-10.11Z"></path>
            <path class="cls-1" d="M171.23,39.11H42.6v37.4H68V62.16H95.08v89.33H80.74v25.4h54.1v-25.4H120.51V62.16h26.9V76.35H173V39.11h-1.75ZM124.15,162l5.36-5.51v15.15l-5.36-5.13Zm-8.95-5.12-5.36,5.29V51.63L115.2,57Zm-62-107.21-5.53-5.37H165l-6.94,5.37Zm114.7,21.78-5.36-5.12V52.68l5.36-5.52Z"></path>
          </svg>
        </div>
      </div>
      <div class="loading-spinner"></div>
      <div class="loading-message">
        <h3>Beautifying Schedule Builder</h3>
        <p>Making your course selection experience better...</p>
      </div>
    </div>
  `;

  // Add loading screen styles
  const loadingStyles = document.createElement('style');
  loadingStyles.textContent = `
    #aggie-beautifier-loading {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }

    .loading-container {
      text-align: center;
      animation: fadeInUp 0.8s ease-out;
    }

    .loading-logo {
      margin-bottom: 30px;
    }

    .maroon-circle {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #500000 0%, #700000 100%);
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 32px rgba(80, 0, 0, 0.3);
      margin-bottom: 20px;
    }

    .loading-text {
      color: white;
      font-size: 24px;
      font-weight: bold;
      letter-spacing: 1px;
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #e9ecef;
      border-top: 4px solid #500000;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 30px;
    }

    .loading-message h3 {
      color: #333;
      font-size: 24px;
      font-weight: 600;
      margin: 0 0 10px 0;
    }

    .loading-message p {
      color: #666;
      font-size: 16px;
      margin: 0;
      opacity: 0.8;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Fade out animation */
    .loading-fade-out {
      animation: fadeOut 0.5s ease-out forwards;
    }

    @keyframes fadeOut {
      from {
        opacity: 1;
        transform: scale(1);
      }
      to {
        opacity: 0;
        transform: scale(0.95);
      }
    }
  `;

  document.head.appendChild(loadingStyles);
  document.body.appendChild(loadingOverlay);

  debugLog('Loading screen displayed');
}

function hideLoadingScreen() {
  const loadingOverlay = document.getElementById('aggie-beautifier-loading');
  if (loadingOverlay) {
    loadingOverlay.classList.add('loading-fade-out');
    setTimeout(() => {
      loadingOverlay.remove();
      debugLog('Loading screen removed');
    }, 500);
  }
}

// Store the identifier for the target node
let sectionsPageIdentifier = "#enabled_panel";

// Store original page content
let originalContent = null;
let isBeautifierActive = false;
let currentCourse = null;
let currentFilterRules = [];
let allSectionsData = []; // Store all sections data for filtering
let selectedCRNs = new Set(); // Track currently selected CRNs
let enrolledCoursesData = []; // Store enrolled courses data for schedule details
let cartCoursesData = []; // Store cart courses data for schedule details
let currentSettings = {
  colorScheme: "default",
  compactMode: false,
};

const CacheUtils = {
  getCachedDataSync(key) {
    // This is only safe to use when we know chrome.storage is ready
    // Used for optimization in specific cases
    try {
      const result = localStorage.getItem(`aggie_cache_${key}`);
      if (result) {
        const item = JSON.parse(result);
        const now = Date.now();
        if (item.expiry && now <= item.expiry) {
          return item.value;
        } else {
          localStorage.removeItem(`aggie_cache_${key}`);
        }
      }
    } catch (error) {
      debugLog("Sync cache lookup error:", error);
    }
    return null;
  },

  async get(key) {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (result) => {
        if (chrome.runtime.lastError) {
          debugLog("Cache lookup error:", chrome.runtime.lastError);
          resolve(null);
          return;
        }

        const item = result[key];
        if (!item || !item.timestamp || !item.expiry) {
          resolve(null);
          return;
        }

        const now = Date.now();
        if (now > item.expiry) {
          // Remove expired item asynchronously (non-blocking)
          chrome.storage.local.remove(key, () => {
            debugLog(`Removed expired cache key: ${key}`);
          });
          resolve(null);
        } else {
          resolve(item.value);
        }
      });
    });
  },

  // Enhanced cache data function that also uses localStorage for speed
  store(key, data, ttlMinutes = 30) {
    const now = Date.now();
    const item = {
      value: data,
      timestamp: now,
      expiry: now + ttlMinutes * 60 * 1000,
    };

    // Also cache in localStorage for faster synchronous access
    try {
      localStorage.setItem(`aggie_cache_${key}`, JSON.stringify(item));
    } catch (error) {
      debugLog("localStorage cache error:", error);
    }

    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [key]: item }, () => {
        if (chrome.runtime.lastError) {
          debugLog("Cache storage error:", chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          debugLog(`Cached data for key: ${key}`);
          resolve();
        }
      });
    });
  },
  // Add cache cleanup function
  cleanupExpired() {
    return new Promise((resolve) => {
      chrome.storage.local.get(null, (items) => {
        const now = Date.now();
        const keysToRemove = [];

        for (const key in items) {
          const item = items[key];
          if (item && item.expiry && now > item.expiry) {
            keysToRemove.push(key);
          }
        }

        if (keysToRemove.length > 0) {
          chrome.storage.local.remove(keysToRemove, () => {
            console.log("Cleaned up expired cache keys:", keysToRemove);
            resolve(keysToRemove.length);
          });
        } else {
          resolve(0);
        }
      });
    });
  },
  // Clear cache for specific course
  clearCourse(courseId) {
    const keys = [`course_${courseId}`, `sections_${courseId}`];

    // Clear localStorage cache too
    try {
      localStorage.removeItem(`aggie_cache_course_${courseId}`);
      localStorage.removeItem(`aggie_cache_sections_${courseId}`);
    } catch (error) {
      debugLog("Error clearing localStorage cache:", error);
    }

    return new Promise((resolve) => {
      chrome.storage.local.remove(keys, () => {
        debugLog("Cleared cache for course:", courseId);
        resolve();
      });
    });
  },
  // Force refresh cache and reload beautifier (useful for development)
  async forceRefresh() {
    if (!currentCourse) {
      debugLog("No current course to refresh cache for");
      return;
    }

    try {
      await CacheUtils.clearCourse(currentCourse.id);
      debugLog("Force refreshed cache for course:", currentCourse.id);

      // Optionally reload the beautifier with fresh data
      if (isBeautifierActive) {
        await SectionsPage.enableBeautifier();
      }
    } catch (error) {
      console.error("Error force refreshing cache:", error);
    }
  },
};

// Make cache functions available globally for debugging when in debug mode
if (DEBUG_MODE) {
  window.aggieExtension = {
    CacheUtils,
    currentCourse: () => currentCourse,
    selectedCRNs: () => Array.from(selectedCRNs),
    currentFilterRules: () => currentFilterRules,
    allSectionsData: () => allSectionsData,
  };
  debugLog("Debug functions available at window.aggieExtension");
}

function isRegistrationPage() {
  const regex = /courses\/\d+/;
  return regex.test(location.href);
}

// Get XSRF token from page
function getXSRFToken() {
  const tokenInput = document.querySelector(
    'input[name="__RequestVerificationToken"]'
  );
  if (tokenInput) {
    return tokenInput.value;
  }
  debugLog("XSRF token not found");
  return null;
}

const SectionsPage = {
  async setupObserver() {
    const targetNode = document.querySelector("#enabled_panel");

    if (targetNode) {
      // Show loading screen immediately if we're going to beautify
      showLoadingScreen();
      SectionsPage.enableBeautifier();
    } else {
      const observer = new MutationObserver((mutations, obs) => {
        const targetNode = document.querySelector("#enabled_panel");
        if (targetNode) {
          // Show loading screen when target appears
          showLoadingScreen();
          SectionsPage.enableBeautifier();
          obs.disconnect();
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }
  },

  async enableBeautifier() {
    if (!originalContent) {
      originalContent = document.body.cloneNode(true);
    }

    // Get course ID from URL
    const courseId = location.href.split("/").pop();
    const courseKey = `course_${courseId}`;
    const sectionsKey = `sections_${courseId}`;

    // Fast path: Check localStorage first for immediate rendering
    const fastCourse = CacheUtils.getCachedDataSync(courseKey);
    const fastSections = CacheUtils.getCachedDataSync(sectionsKey);

    if (fastCourse && fastSections) {
      debugLog("Using fast localStorage cache - immediate render");
      await createSectionCards(fastCourse, fastSections);
      applySettings();
      hideLoadingScreen();
      return;
    }

    let course = fastCourse;
    let formattedData = fastSections;

    // Otherwise, fetch what we need
    if (!course) {
      try {
        course = await getSelectedCourseData(courseId);
        if (course) {
          // Cache asynchronously (non-blocking)
          CacheUtils.store(courseKey, course).catch((error) => {
            console.error("Error caching course data:", error);
          });
          debugLog("Fetched course data:", course);
        } else {
          console.error("Failed to fetch course data");
          hideLoadingScreen();
          return;
        }
      } catch (error) {
        console.error("Error fetching course data:", error);
        hideLoadingScreen();
        return;
      }
    } else {
      debugLog("Using cached course data");
    }

    if (!formattedData) {
      try {
        let sections = await getSections(course.subjectId, course.number);
        if (sections) {
          formattedData = extractAndSortSections(sections);
          // Cache asynchronously (non-blocking)
          CacheUtils.store(sectionsKey, formattedData).catch((error) => {
            console.error("Error caching sections data:", error);
          });
          debugLog("Fetched and processed sections data");
        } else {
          console.error("Failed to fetch sections data");
          hideLoadingScreen();
          return;
        }
      } catch (error) {
        console.error("Error fetching sections data:", error);
        hideLoadingScreen();
        return;
      }
    } else {
      debugLog("Using cached sections data");
    }

    await createSectionCards(course, formattedData);
    applySettings();
    hideLoadingScreen();
  },

  disableBeautifier() {
    if (originalContent) {
      document.body.innerHTML = originalContent.innerHTML;
    }
  },
};

(async function init() {
  debugLog("DOM fully loaded and parsed");

  // Show loading screen immediately for supported pages to prevent flash
  // if (isRegistrationPage() || isMainCoursesPage()) {
  //   // Check if beautifier might be enabled (optimistic loading)
  //   chrome.storage.sync.get({ beautifierEnabled: false }, function (result) {
  //     if (result.beautifierEnabled) {
  //       showLoadingScreen();
  //     }
  //   });
  // }

  // Load stylesheets first for proper priority
  await loadStylesheets();

  // Set up page refresh prevention
  preventPageRefresh();

  // Run cache cleanup in background (non-blocking)
  CacheUtils.cleanupExpired().catch((error) => {
    console.error("Error during cache cleanup:", error);
  });

  chrome.storage.sync.get(
    {
      beautifierEnabled: false,
      colorScheme: "default",
      compactMode: false,
    },
    async function (items) {
      currentSettings = {
        colorScheme: items.colorScheme,
        compactMode: items.compactMode,
      };

      debugLog("Beautifier initialized with settings:", currentSettings);
      debugLog("Beautifier enabled:", items.beautifierEnabled);

      // Only run beautifier if it's enabled and we're on a registration page
      if (items.beautifierEnabled && isRegistrationPage()) {
        await SectionsPage.setupObserver();
      }
      if (items.beautifierEnabled && isMainCoursesPage()) {
        debugLog("Beautifying main schedule");
        await setupMainScheduleObserver();
      }

      // If beautifier is not enabled or page doesn't match, make sure no loading screen is shown
      if (!items.beautifierEnabled || (!isRegistrationPage() && !isMainCoursesPage())) {
        hideLoadingScreen();
      }
    }
  );

  // Set up periodic cache cleanup (every 10 minutes) - runs in background
  setInterval(() => {
    CacheUtils.cleanupExpired().catch((error) => {
      console.error("Error during periodic cache cleanup:", error);
    });
  }, 10 * 60 * 1000);
})();

chrome.runtime.onMessage.addListener(async function (
  message,
  sender,
  sendResponse
) {
  if (message.action === "toggleBeautifier") {
    isBeautifierActive = message.enabled;
    if (message.enabled) {
      // Show loading screen when enabling beautifier
      showLoadingScreen();
      await SectionsPage.setupObserver();
      await setupMainScheduleObserver();
    } else {
      SectionsPage.disableBeautifier();
      disableBeautifyMainSchedule();
      hideLoadingScreen();
    }
  } else if (message.action === "updateSettings") {
    currentSettings = message.settings;
    if (isBeautifierActive) {
      applySettings();
    }
  }

  if (message.action === "check page") {
    if (isRegistrationPage() && isBeautifierActive) {
      showLoadingScreen();
      await SectionsPage.setupObserver();
    }
    if (isMainCoursesPage() && isBeautifierActive) {
      showLoadingScreen();
      await setupMainScheduleObserver();
    }
  }

  sendResponse({ success: true });
  return true;
});

async function getSelectedCourseData(id) {
  // Extract term from current URL
  let url = location.href.split("/");
  url.pop(); // remove course id
  url.pop(); // remove "courses"
  const term = url.pop(); // get term

  // Get XSRF token from page
  const xsrfToken = getXSRFToken();

  const requestUrl = `https://tamu.collegescheduler.com/api/terms/${term}/desiredcourses/`;

  const response = await fetch(requestUrl, {
    headers: {
      accept: "application/json",
      "accept-language": "en-US,en;q=0.9",
      "content-type": "application/json",
      priority: "u=1, i",
      "sec-ch-ua":
        '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "x-requested-with": "XMLHttpRequest",
      ...(xsrfToken && { "x-xsrf-token": xsrfToken }),
    },
    referrer: location.href,
    referrerPolicy: "strict-origin-when-cross-origin",
    method: "GET",
    mode: "cors",
    credentials: "include",
  });
  const data = await response.json();
  // search for id equal to the id passed in
  const course = data.find((course) => course.id === id);
  debugLog("Course data:", course);
  return course;
}

async function getSections(subjectId, number) {
  let url = location.href.split("/");
  url.pop();
  url.pop();
  const term = url.pop();
  const request_url =
    "https://tamu.collegescheduler.com/api/terms/" +
    term +
    "/subjects/" +
    subjectId +
    "/courses/" +
    number +
    "/regblocks";

  try {
    const response = await fetch(request_url, {
      headers: {
        accept: "*/*",
        "accept-language": "en-US,en;q=0.9",
        priority: "u=1, i",
        "sec-ch-ua":
          '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
      },
      referrer: location.href,
      referrerPolicy: "strict-origin-when-cross-origin",
      body: null,
      method: "GET",
      mode: "cors",
      credentials: "include",
    });

    const data = await response.json();
    console.log("Registration data:", data);
    return data;
  } catch (error) {
    console.error("Error fetching data:", error);
    return null;
  }
}

function extractAndSortSections(response) {
  const registrationMap = new Map();
  const enabledMap = new Map();
  const disabledReasonsMap = new Map();

  for (const reg of response.registrationBlocks) {
    for (const sectionId of reg.sectionIds) {
      registrationMap.set(sectionId, reg.selected);
      enabledMap.set(sectionId, reg.enabled);
      disabledReasonsMap.set(sectionId, reg.disabledReasons || []);
    }
  }

  const extractInstructorLastName = (fullName) => {
    const parts = fullName.split(",");
    return parts.length > 1 ? parts[0].trim() : fullName.trim();
  };

  const extractCustomDataLinks = (html) => {
    const courseEval =
      (html.match(/href="([^"]*AefisCourseSection[^"]*)"/) || [])[1] || null;
    const instructorInfo =
      (html.match(/fetch\('([^']*instructor-cv-pdf[^']*)'/) || [])[1] || null;
    const textbookLink =
      (html.match(/form name="bookStore"[^>]*action="([^"]*)"/) || [])[1] ||
      null;
    const syllabusLink =
      courseEval && courseEval.includes("No syllabus") ? null : null; // Customize if syllabus is provided in data
    const prerequisites =
      (html.match(/<b>Prerequisites:<\/b>(.*?)<br>/) || [])[1]?.trim() || null;
    return {
      courseEval,
      syllabusLink,
      instructorInfo,
      textbookLink,
      prerequisites,
    };
  };

  // Helper function to clean up malformed HTML
  const cleanupSectionFeesHtml = (html) => {
    if (!html) return null;

    // Fix common malformed HTML issues
    let cleaned = html
      .replace(/<th>([^<]*)<th>/g, "<th>$1</th><th>") // Fix missing closing tags like <th>Amount<th>
      .replace(/<td>([^<]*)<td>/g, "<td>$1</td><td>") // Fix missing closing tags for td
      .replace(/<th>([^<]*)<\/th><th>/g, "<th>$1</th><th>") // Clean up consecutive th tags
      .replace(/<td>([^<]*)<\/td><td>/g, "<td>$1</td><td>") // Clean up consecutive td tags
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim();

    return cleaned;
  };

  const formatted = response.sections.map((section) => {
    const isSelected = registrationMap.get(section.id) || false;
    const isEnabled = enabledMap.get(section.id) !== false; // Default to true if not found
    const disabledReasons = disabledReasonsMap.get(section.id) || [];

    const meetingTimes = section.meetings.map((m) => ({
      days: m.days,
      startTime: m.startTime,
      endTime: m.endTime,
      location: m.location,
      type: m.meetingTypeDescription,
      startDate: m.startDate,
      endDate: m.endDate,
    }));

    const instructor =
      section.instructor.length > 0 ? section.instructor[0].name : "Unknown";
    const instructorLastName = extractInstructorLastName(instructor);

    const {
      courseEval,
      syllabusLink,
      instructorInfo,
      textbookLink,
      prerequisites,
    } = extractCustomDataLinks(section.customData || "");

    return {
      subject: section.subject,
      number: section.course,
      section: section.sectionNumber,
      crn: section.registrationNumber,
      title: section.title,
      credits: section.credits,
      seatsOpen: section.openSeats,
      meetingTimes,
      instructor,
      isHonors: section.isHonors,
      isRestricted: section.hasRestrictions,
      hasPrerequisites: section.hasPrerequisites,
      isSelected,
      isEnabled,
      disabledReasons,
      instructionMode: section.instructionMode,
      component: section.component,
      courseEval,
      syllabusLink,
      instructorInfo,
      textbookLink,
      description: section.description,
      campus: section.campus,
      sectionRestrictions: section.sectionRestrictions.map(
        (r) => r.displayDescription
      ),
      prerequisites: prerequisites,
      sectionFees: cleanupSectionFeesHtml(
        (section.customData.match(/<b>Section Fees:<\/b>(.*?)<br>/) ||
          [])[1]?.trim()
      ),
      instructorLastName,
      sectionAttributes: section.sectionAttributes,
    };
  });

  formatted.sort((a, b) => {
    if (a.isHonors !== b.isHonors) return b.isHonors - a.isHonors;
    if (a.campus !== b.campus) return a.campus === "College Station" ? -1 : 1;
    return a.instructorLastName.localeCompare(b.instructorLastName);
  });

  return formatted;
}

async function createSectionCards(course, sections) {
  // Store course data and sections globally for filter functions
  currentCourse = course;
  currentFilterRules = course.filterRules || [];
  allSectionsData = sections.slice(); // Store copy of all sections

  // Initialize selectedCRNs with currently selected sections
  selectedCRNs.clear();
  sections.forEach((section) => {
    if (section.isSelected) {
      selectedCRNs.add(section.crn);
    }
  });
  debugLog("Initial selected CRNs:", Array.from(selectedCRNs));

  // Create a container for our beautified content
  const beautifiedContainer = document.createElement("div");
  beautifiedContainer.id = "beautified-registration-container";
  beautifiedContainer.className = "course-cards-container";

  const courseName = document.createElement("h1");
  courseName.textContent = course.subjectLong + " " + course.number;
  const courseNameContainer = document.createElement("div");
  courseNameContainer.className = "course-name-container";
  courseNameContainer.appendChild(courseName);

  // Add a title to the container with course details button
  const titleContainer = document.createElement("div");
  titleContainer.className = "course-title-header-container";

  const title = document.createElement("h2");
  title.textContent = course.title;
  title.className = "course-list-title";

  // Create course ID for course details button
  const courseId = `${course.subjectLong.split(' - ')[0]}${course.number}`;
  const courseDetailsUrl = `https://aggieschedulebuilderplus.vercel.app/course/${courseId}`;

  const courseDetailsBtn = document.createElement("a");
  courseDetailsBtn.href = courseDetailsUrl;
  courseDetailsBtn.target = "_blank";
  courseDetailsBtn.className = "course-details-btn-header";
  courseDetailsBtn.title = "View Course Details";
  courseDetailsBtn.innerHTML = "📚 View Course Details";

  titleContainer.appendChild(title);
  titleContainer.appendChild(courseDetailsBtn);

  // Initially, separate sections into enabled and disabled based on isEnabled property
  const enabledSections = sections.filter((section) => section.isEnabled);
  const disabledSections = sections.filter((section) => !section.isEnabled);

  // Create tab navigation
  const tabContainer = document.createElement("div");
  tabContainer.className = "tab-container";

  const tabNav = document.createElement("div");
  tabNav.className = "tab-nav";

  const enabledTab = document.createElement("button");
  enabledTab.className = "tab-button active";
  enabledTab.id = "enabled-tab";
  enabledTab.textContent = `Available Sections (${enabledSections.length})`;
  enabledTab.dataset.tab = "enabled";

  const disabledTab = document.createElement("button");
  disabledTab.className = "tab-button";
  disabledTab.id = "disabled-tab";
  disabledTab.textContent = `Unavailable Sections (${disabledSections.length})`;
  disabledTab.dataset.tab = "disabled";

  tabNav.appendChild(enabledTab);
  tabNav.appendChild(disabledTab);
  tabContainer.appendChild(tabNav);

  // Create content containers for each tab
  const enabledContent = document.createElement("div");
  enabledContent.className = "tab-content active";
  enabledContent.id = "enabled-sections";

  const disabledContent = document.createElement("div");
  disabledContent.className = "tab-content";
  disabledContent.id = "disabled-sections";

  // Process enabled sections
  for (let index = 0; index < enabledSections.length; index++) {
    const section = enabledSections[index];
    const courseCard = await createCourseCard(section, index);
    enabledContent.appendChild(courseCard);
  }

  // Process disabled sections
  for (let index = 0; index < disabledSections.length; index++) {
    const section = disabledSections[index];
    const courseCard = await createCourseCard(section, index);
    courseCard.classList.add("disabled-section");
    disabledContent.appendChild(courseCard);
  }

  // If no sections in a tab, add a message
  if (enabledSections.length === 0) {
    const noSectionsMsg = document.createElement("div");
    noSectionsMsg.className = "no-sections-message";
    noSectionsMsg.textContent = "No available sections found.";
    enabledContent.appendChild(noSectionsMsg);
  }

  if (disabledSections.length === 0) {
    const noSectionsMsg = document.createElement("div");
    noSectionsMsg.className = "no-sections-message";
    noSectionsMsg.textContent = "No unavailable sections.";
    disabledContent.appendChild(noSectionsMsg);
  }

  tabContainer.appendChild(enabledContent);
  tabContainer.appendChild(disabledContent);

  // Create main content area for sections
  const sectionsContainer = document.createElement("div");
  sectionsContainer.className = "sections-container";
  sectionsContainer.appendChild(tabContainer);

  // Fetch course data and create professors section
  const apiCourseId = `${course.subjectLong.split(' - ')[0]}${course.number}`;
  let professorsSection = null;

  try {
    const courseApiData = await fetchCourseData(apiCourseId);
    if (courseApiData) {
      professorsSection = createProfessorsSection(courseApiData);
      debugLog("Created professors section for course:", apiCourseId);
    } else {
      debugLog("No course API data found for:", apiCourseId);
    }
  } catch (error) {
    console.error("Error fetching course data for professors section:", error);
  }

  // Add sections to the main container
  beautifiedContainer.appendChild(sectionsContainer);

  // Create floating professors panel if we have professor data
  if (professorsSection) {
    createFloatingProfessorsPanel(professorsSection);
  }

  // Find the table container and replace it
  const tableContainer = findTableContainer(document.querySelector("tbody"));
  if (tableContainer) {
    tableContainer.innerHTML = "";
    tableContainer.appendChild(beautifiedContainer);
  } else {
    // Fallback: replace the first section's parent
    const parent = document.querySelector("tbody").parentElement;
    if (parent) {
      parent.innerHTML = "";
      parent.appendChild(beautifiedContainer);
    } else {
      // Last resort: append to body
      document.body.appendChild(beautifiedContainer);
    }
  }

  setupCardEventHandlers();
  setupTabEventHandlers();
  await addFilterControls(beautifiedContainer);
  await addSaveAndCloseButton(beautifiedContainer);
  beautifiedContainer.prepend(titleContainer);
  beautifiedContainer.prepend(courseNameContainer);
}

// Function to find the table container
function findTableContainer(element) {
  // Try to find the main table container
  let current = element;
  for (let i = 0; i < 5; i++) {
    // Limit depth to avoid infinite loop
    if (!current.parentElement) break;
    current = current.parentElement;
    // Look for common table container classes or ids
    if (
      current.classList.contains("table-container") ||
      current.classList.contains("course-listing") ||
      current.id === "course-results" ||
      current.id === "registration-table"
    ) {
      return current;
    }
  }
  // Return the closest div container as fallback
  return current;
}

async function createCourseCard(courseData, index) {
  const card = document.createElement("div");
  card.className = "course-card";
  card.dataset.crn = courseData.crn;

  // Add selection checkbox
  const checkboxId = `beautified-checkbox-${courseData.crn}`;

  // Create class indicator based on seats available
  let availabilityClass = "seats-available";
  if (courseData.seatsOpen === "0") {
    availabilityClass = "seats-full";
  } else if (parseInt(courseData.seatsOpen) < 5) {
    availabilityClass = "seats-limited";
  }

  // Create badge HTML for special course attributes
  let badgesHtml = "";
  if (courseData.isHonors) {
    badgesHtml += '<span class="course-badge honors-badge">Honors</span>';
  }
  if (courseData.isRestricted) {
    badgesHtml +=
      '<span class="course-badge restricted-badge">Restricted</span>';
  }
  if (courseData.hasPrerequisites) {
    badgesHtml +=
      '<span class="course-badge prereq-badge">Prerequisites</span>';
  }

  // Add disabled reasons as badges
  if (
    !courseData.isEnabled &&
    courseData.disabledReasons &&
    courseData.disabledReasons.length > 0
  ) {
    courseData.disabledReasons.forEach((reason) => {
      badgesHtml += `<span class="course-badge disabled-badge">${reason}</span>`;
    });
  } else if (!courseData.isEnabled) {
    badgesHtml +=
      '<span class="course-badge disabled-badge">Unavailable</span>';
  }

  // Fetch professor ID if instructor is available
  let professorButtonHtml = "";
  if (courseData.instructor && courseData.instructor !== "Unknown" && courseData.instructor !== "Not Assigned") {
    try {
      const professorId = await fetchProfessorId(courseData.instructor);
      if (professorId) {
        const professorDetailsUrl = `https://aggieschedulebuilderplus.vercel.app/professor/${professorId}`;
        professorButtonHtml = `<a href="${professorDetailsUrl}" target="_blank" class="professor-details-btn" title="Compare Professor Reviews">🎓 Compare Reviews</a>`;
      }
    } catch (error) {
      debugLog(`Error fetching professor ID for ${courseData.instructor}:`, error);
    }
  }

  const meetingTimes = courseData.meetingTimes
    .map((meeting) => {
      const formatTime = (time) => {
        const hours = Math.floor(time / 100);
        const minutes = time % 100;
        const period = hours >= 12 ? "pm" : "am";
        const formattedHours =
          hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
        return `${formattedHours}:${minutes
          .toString()
          .padStart(2, "0")}${period}`;
      };

      // Format dates in MM/DD/YYYY format
      const formatDate = (dateStr) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        return `${(date.getMonth() + 1).toString().padStart(2, "0")}/${date
          .getDate()
          .toString()
          .padStart(2, "0")}/${date.getFullYear()}`;
      };

      // Create the single string format for each meeting
      const formattedMeeting = `<div class="meeting-time">
    ${meeting.days} ${formatTime(meeting.startTime)} - ${formatTime(
        meeting.endTime
      )} ${formatDate(meeting.startDate)} - ${formatDate(meeting.endDate)} ${meeting.location
        } \(${meeting.type}\)</div>`;

      return formattedMeeting;
    })
    .join("");

  // Create extended details section (initially hidden)
  const extendedDetails = createExtendedDetails(courseData);

  // Build the card HTML
  card.innerHTML = `
      <div class="card-header ${availabilityClass}">
        <div class="course-select">
          <input type="checkbox" id="${checkboxId}" ${courseData.isSelected ? "checked" : ""
    }>
          <label for="${checkboxId}"></label>
        </div>
        <div class="course-code">${courseData.subject} ${courseData.number}-${courseData.section
    }</div>
        <div class="course-crn">CRN: ${courseData.crn}</div>
      </div>
      <div class="card-body">
      <div class="details-row">
            <div class="detail-item">
                <h3 class="course-title">${courseData.title}</h3>
                <div class="course-badges">
                ${badgesHtml}
                </div>
            </div>
            <div class="detail-item">
                <div class="details-row">
                    <div class="detail-item">
                        <span class="detail-label">Seats:</span>
                        <span class="detail-value seats-available-text">${courseData.seatsOpen
    }</span>
                    </div>
                </div>
                <div class="details-row">
                    <div class="detail-item full-width">
                        <span class="detail-label">Instructor:</span>
                        <div class="instructor-container">
                          <span class="detail-value">${courseData.instructor
    }</span>
                          ${professorButtonHtml}
                        </div>
                    </div>
                </div>
            </div>
            
        </div>
        <div class="meeting-times">
          ${meetingTimes}
        </div>
        
        <!-- Extended details section (initially hidden) -->
        <div class="extended-details" id="extended-details-${courseData.crn
    }" style="display: none;">
          ${extendedDetails}
        </div>
      </div>
      <div class="card-footer">
        <button class="details-button" data-crn="${courseData.crn
    }">Show Details</button>
      </div>
    `;
  return card;
}

// Function to create floating professors panel
function createFloatingProfessorsPanel(professorsHTML) {
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
  let hoverTimeout;
  let isHoveringPanel = false;

  // Track mouse movement on the document
  document.addEventListener('mousemove', (e) => {
    const screenWidth = window.innerWidth;
    const mouseX = e.clientX;
    // Use smaller trigger zones on mobile
    const isMobile = screenWidth <= 768;
    const triggerZone = isMobile ? 30 : 50; // pixels from right edge
    const indicatorZone = isMobile ? 60 : 100; // pixels from right edge to show indicator
    const panelWidth = isMobile ? 320 : 400;

    // Clear any existing timeout
    clearTimeout(hoverTimeout);

    // Show/hide hover indicator
    if (mouseX >= screenWidth - indicatorZone && !isHoveringPanel) {
      hoverIndicator.classList.add('visible');
    } else {
      hoverIndicator.classList.remove('visible');
    }

    // Check if mouse is in the right trigger zone
    if (mouseX >= screenWidth - triggerZone) {
      // Add small delay to prevent flickering
      hoverTimeout = setTimeout(() => {
        if (!isHoveringPanel) {
          floatingPanel.classList.remove('collapsed');
          hoverIndicator.classList.remove('visible'); // Hide indicator when panel opens
        }
      }, 100);
    } else if (!isHoveringPanel && mouseX < screenWidth - panelWidth) {
      // Auto-collapse when mouse moves away from panel area
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
    hoverIndicator.classList.remove('visible'); // Hide indicator when hovering panel
  });

  floatingPanel.addEventListener('mouseleave', () => {
    isHoveringPanel = false;
    // Auto-collapse after leaving the panel (with delay)
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

// Function to create professors section HTML
function createProfessorsSection(courseData) {
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

  const professorsHTML = courseData.professors.map(professor => {
    // Format grade distribution
    let gradeDistHTML = '';
    if (professor.gradeDistribution) {
      const grades = professor.gradeDistribution;
      const total = Object.values(grades).reduce((sum, count) => sum + count, 0);

      if (total > 0) {
        gradeDistHTML = `
          <div class="grade-distribution">
            <h5>Grade Distribution</h5>
            <div class="grade-bars">
              ${Object.entries(grades).map(([grade, count]) => {
          const percentage = Math.round((count / total) * 100);
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
    const professorDetailsUrl = `https://aggieschedulebuilderplus.vercel.app/professor/${professor.id}`;

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

// Function to generate star rating HTML
function generateStarRating(rating) {
  if (!rating) return '<span class="no-rating">No rating</span>';

  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push('★');
    } else if (i === fullStars && hasHalfStar) {
      stars.push('☆');
    } else {
      stars.push('☆');
    }
  }

  return `<span class="stars">${stars.join('')}</span>`;
}

// Function to create extended details content
function createExtendedDetails(courseData) {
  // Create HTML for extended details based on course data
  const meetingTimes = courseData.meetingTimes
    .map((meeting) => {
      const formatTime = (time) => {
        const hours = Math.floor(time / 100);
        const minutes = time % 100;
        const period = hours >= 12 ? "pm" : "am";
        const formattedHours =
          hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
        return `${formattedHours}:${minutes
          .toString()
          .padStart(2, "0")}${period}`;
      };

      // Format dates in MM/DD/YYYY format
      const formatDate = (dateStr) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        return `${(date.getMonth() + 1).toString().padStart(2, "0")}/${date
          .getDate()
          .toString()
          .padStart(2, "0")}/${date.getFullYear()}`;
      };

      // Create the single string format for each meeting
      const formattedMeeting = `<div class="meeting-time">
    ${meeting.days} ${formatTime(meeting.startTime)} - ${formatTime(
        meeting.endTime
      )} ${formatDate(meeting.startDate)} - ${formatDate(meeting.endDate)} ${meeting.location
        } \(${meeting.type}\)</div>`;

      return formattedMeeting;
    })
    .join("");

  return `
      <div class="extended-details-container">
        <h4>Course Description</h4>
        <p>${courseData.description || "No description available."}</p>
        
        <div class="detail-section">
          <h4>Course Information</h4>
          <div class="detail-grid">
            <div class="detail-row">
              <b class="extended-label">Department:</b>
              <span class="extended-value">${courseData.subject}</span>
              </div>
              <div class="detail-row">
                <b class="extended-label">Credits:</b>
                <span class="extended-value">${courseData.credits}</span>
              </div>
            <div class="detail-row">
              <b class="extended-label">Instruction Mode:</b>
              <span class="extended-value">${courseData.instructionMode}</span>
            </div>
            <div class="detail-row">
              <b class="extended-label">Component:</b>
              <span class="extended-value">${courseData.component}</span>
            </div>
            <div class="detail-row">
              <a class="extended-label" href=${courseData.courseEvalLink
    }>Course Eval</a>
               | 
              <a class="extended-label" href=${courseData.syllabusLink ? courseData.syllabusLink : "#"
    }>${courseData.syllabusLink ? "Syllabus" : "No Syllabus"}</a>
               | 
              <a class="extended-label" href=${courseData.instructorInfo}>${courseData.instructor
    }</a>
            </div>
            
            <div class="detail-row">
              <b class="extended-label">Campus:</b>
              <span class="extended-value">${courseData.campus}</span>
            </div>
            <div class="detail-row">
              <b class="extended-label">Section Restrictions:</b>
              <span class="extended-value">${courseData.sectionRestrictions
      ? courseData.sectionRestrictions
        .map(
          (restriction) =>
            `<span class="section-restriction">${restriction.displayDescription}</span>`
        )
        .join(", ")
      : "None"
    }</span>
            </div>
            <div class="detail-row">
              <b class="extended-label">Section Attributes:</b>
              <span class="extended-value">${courseData.sectionAttributes
      ? courseData.sectionAttributes
        .map(
          (attr) =>
            `<span class="section-attribute">${attr.valueTitle}</span>`
        )
        .join(", ")
      : "None"
    }</span>
            </div>
            <div class="detail-row">
              <b class="extended-label">Section Fees:</b>
              
              <div class="extended-value">
                ${courseData.sectionFees && courseData.sectionFees.trim() !== ""
      ? `<div class="section-fees-container">${courseData.sectionFees}</div>`
      : "No section fees"
    }
              </div>
            </div>
          </div>
        </div>
        
        ${courseData.prerequisites
      ? `
        <div class="detail-section">
          <h4>Prerequisites</h4>
          <p>${courseData.prerequisites}</p>
        </div>
        `
      : ""
    }
        
        ${courseData.restrictions
      ? `
        <div class="detail-section">
          <h4>Restrictions</h4>
          <p>${courseData.restrictions}</p>
        </div>
        `
      : ""
    }
        
        <div class="detail-section">
          <h4>Schedule Details</h4>
          <div class="schedule-details">
            ${meetingTimes}
          </div>
        </div>
      </div>
    `;
}

// Function to apply user settings
function applySettings() {
  // Remove any existing dynamic theme styles
  const existingDynamicStyles = document.querySelector(
    "style[data-dynamic-theme]"
  );
  if (existingDynamicStyles) {
    existingDynamicStyles.remove();
  }

  // Add custom CSS based on user settings
  const dynamicCSS = document.createElement("style");
  dynamicCSS.setAttribute("data-dynamic-theme", "true");

  // Define color schemes
  const colorSchemes = {
    default: {
      primary: "#4285f4",
      secondary: "#f5f5f5",
      accent: "#fbbc05",
      text: "#333333",
      background: "#ffffff",
    },
    maroon: {
      // School colors theme (e.g., Texas A&M)
      primary: "#500000",
      secondary: "#f5f5f5",
      accent: "#8d847d",
      text: "#333333",
      background: "#ffffff",
    },
  };

  // Get selected color scheme
  const colors =
    colorSchemes[currentSettings.colorScheme] || colorSchemes.default;

  // Define dynamic CSS that depends on color scheme
  dynamicCSS.textContent = `
    /* Dynamic Color Scheme Styles */
    .course-card {
      background-color: ${colors.background};
    }
    
    .card-header,
    .card-header.seats-available {
      background-color: ${colors.primary};
    }
    
    .card-body {
      color: ${colors.text};
    }
    
    .detail-value {
      color: ${colors.text};
    }
    
    .meeting-times {
      background-color: ${colors.secondary};
    }
    
    .meeting-times h4 {
      color: ${colors.text};
    }
    
    .meeting-time {
      background-color: ${colors.background};
      border-left: 3px solid ${colors.accent};
    }
    
    .card-footer {
      background-color: ${colors.secondary};
    }
    
    .details-button {
      background-color: ${colors.primary};
    }
    
    .details-button:hover {
      background-color: ${colors.primary}dd;
    }
    
    .tab-button:hover {
      color: ${colors.primary};
    }
    
    .tab-button.active {
      color: ${colors.primary};
      border-bottom-color: ${colors.primary};
    }
  `;

  // Add compact mode class to container if enabled
  const container = document.querySelector(".course-cards-container");
  if (container) {
    if (currentSettings.compactMode) {
      container.classList.add("compact-mode");
    } else {
      container.classList.remove("compact-mode");
    }
  }

  document.head.appendChild(dynamicCSS);
}

// Set up event handlers for course cards
function setupCardEventHandlers() {
  // Handle details button clicks
  document.querySelectorAll(".details-button").forEach((button) => {
    button.addEventListener("click", function () {
      const crn = this.dataset.crn;
      const detailsElement = document.getElementById(`extended-details-${crn}`);

      if (detailsElement) {
        // Toggle visibility
        const isVisible = detailsElement.style.display !== "none";
        detailsElement.style.display = isVisible ? "none" : "block";

        // Update button text
        this.textContent = isVisible ? "Show Details" : "Hide Details";
      }
    });
  });

  // Handle course selection checkboxes
  document
    .querySelectorAll('.course-select input[type="checkbox"]')
    .forEach((checkbox) => {
      checkbox.addEventListener("change", function (event) {
        // 1) ignore synthetic events
        if (!event.isTrusted) return;

        const card = this.closest(".course-card");
        const crn = card.dataset.crn;

        // 2) update your UI
        card.classList.toggle("selected-course", this.checked);

        // 3) Track the selection state for filter rules
        if (this.checked) {
          selectedCRNs.add(crn);
        } else {
          selectedCRNs.delete(crn);
        }
        debugLog("Selected CRNs:", Array.from(selectedCRNs));

        // 4) Update filter rules with current selections
        const selectedInstructors = window.instructorMultiSelect
          ? window.instructorMultiSelect.getSelectedValues()
          : [];
        const selectedAttributes = window.sectionAttributeMultiSelect
          ? window.sectionAttributeMultiSelect.getSelectedValues()
          : [];
        updateFilterRules(selectedInstructors, selectedAttributes);
      });
    });
}

// Set up event handlers for tabs
function setupTabEventHandlers() {
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.addEventListener("click", function () {
      const targetTab = this.dataset.tab;

      // Update tab buttons
      document.querySelectorAll(".tab-button").forEach((btn) => {
        btn.classList.remove("active");
      });
      this.classList.add("active");

      // Update tab content
      document.querySelectorAll(".tab-content").forEach((content) => {
        content.classList.remove("active");
      });

      const targetContent = document.getElementById(`${targetTab}-sections`);
      if (targetContent) {
        targetContent.classList.add("active");
      }
    });
  });
}

// Function to toggle course details
function toggleCourseDetails(crn) {
  const card = document.querySelector(`[data-crn="${crn}"]`);
  const existingDetails = card.querySelector(".expanded-details");

  if (existingDetails) {
    // If details are already shown, hide them and update button
    existingDetails.remove();
    card.querySelector(".details-button").textContent = "Show Details";
    return;
  }

  // Create details section
  const detailsSection = document.createElement("div");
  detailsSection.className = "expanded-details";

  // Get section data
  const sectionData = allSectionsData.find((section) => section.crn === crn);
  let detailsContent = "";

  if (sectionData) {
    detailsContent = createExtendedDetails(sectionData);
  } else {
    detailsContent = `
          <div class="details-message">
            <p>Detailed information for this course (CRN: ${crn}) is not available in the beautified view.</p>
            <p>To view all details, you may need to disable the beautifier.</p>
          </div>
        `;
  }

  detailsSection.innerHTML = detailsContent;

  // Add to card, before footer
  card.querySelector(".card-footer").before(detailsSection);

  // Update button text
  card.querySelector(".details-button").textContent = "Hide Details";
}

// Function to toggle schedule course details (adapted from toggleCourseDetails)
function toggleScheduleDetails(crn, courseData) {
  const scheduleItem = document.querySelector(`.schedule-item [data-crn="${crn}"]`).closest('.schedule-item');
  const existingDetails = scheduleItem.querySelector(".expanded-details");

  if (existingDetails) {
    // If details are already shown, hide them and update button
    existingDetails.remove();
    scheduleItem.querySelector(".details-button").textContent = "Details";
    return;
  }

  // Create details section
  const detailsSection = document.createElement("div");
  detailsSection.className = "expanded-details";

  let detailsContent = "";

  if (courseData) {
    // Transform schedule format data to match the format expected by createExtendedDetails
    const transformedData = {
      subject: courseData.subject,
      number: courseData.number || courseData.courseNumber,
      section: courseData.section || courseData.sectionNumber,
      crn: courseData.crn,
      title: courseData.title || `${courseData.subject} ${courseData.number}`,
      credits: courseData.credits,
      instructor: courseData.instructor,
      instructionMode: courseData.instructionMode,
      meetingTimes: courseData.meetingTimes ? courseData.meetingTimes.map(meeting => ({
        days: meeting.timeDisplay ? meeting.timeDisplay.split(' ')[0] : 'TBA',
        startTime: 0,
        endTime: 0,
        location: meeting.location || 'TBA',
        type: 'Lecture',
        startDate: '',
        endDate: ''
      })) : [],
      hasPrerequisites: courseData.hasPrerequisites,
      hasRestrictions: courseData.hasRestrictions,
      description: courseData.description || "Course description not available.",
      campus: courseData.campus || "College Station",
      sectionRestrictions: courseData.sectionRestrictions || [],
      sectionAttributes: courseData.sectionAttributes || [],
      sectionFees: courseData.sectionFees || null,
      prerequisites: courseData.prerequisites || null,
      courseEvalLink: courseData.courseEvalLink || "#",
      syllabusLink: courseData.syllabusLink || null,
      instructorInfo: courseData.instructorInfo || "#"
    };

    detailsContent = createExtendedDetails(transformedData);
  } else {
    detailsContent = `
      <div class="details-message">
        <p>Detailed information for this course (CRN: ${crn}) is not available.</p>
      </div>
    `;
  }

  detailsSection.innerHTML = detailsContent;

  // Add to schedule item, after the schedule-times section
  const scheduleTimes = scheduleItem.querySelector(".schedule-times");
  scheduleTimes.after(detailsSection);

  // Update button text
  scheduleItem.querySelector(".details-button").textContent = "Hide Details";
}

// Add this to your transformRegistrationPage function

// Add filter controls to the page
async function addFilterControls(container) {
  // Create filter container
  const filterContainer = document.createElement("div");
  filterContainer.className = "course-filter-container";

  try {
    // Load the filter controls template
    const response = await fetch(
      chrome.runtime.getURL("/templates/filter-controls.html")
    );
    const templateHtml = await response.text();
    filterContainer.innerHTML = templateHtml;

    // Add filter container to the page
    container.prepend(filterContainer);

    // Initialize multi-select dropdowns
    initializeMultiSelectFilters();

    // Add event listeners for other filters
    document
      .getElementById("searchFilter")
      .addEventListener("input", onFilterChange);
    document
      .getElementById("honorsFilter")
      .addEventListener("change", onFilterChange);
    document
      .getElementById("prereqFilter")
      .addEventListener("change", onFilterChange);
    document
      .getElementById("openSeatsFilter")
      .addEventListener("change", onFilterChange);
  } catch (error) {
    console.error("Error loading filter controls template:", error);
    // Fallback to basic filter controls if template fails to load
    filterContainer.innerHTML = `
      <div class="filter-header">
        <h3>Filter Sections</h3>
      </div>
      <div class="filter-options">
        <div class="filter-group filter-search">
          <label for="searchFilter">Search:</label>
          <input type="text" id="searchFilter" placeholder="Search titles, CRN...">
        </div>
      </div>
    `;
  }
}

// Initialize multi-select dropdowns
function initializeMultiSelectFilters() {
  // Initialize instructor filter
  const instructorOptions = getInstructorOptions();
  window.instructorMultiSelect = new MultiSelect(
    document.getElementById("instructorFilter"),
    {
      options: instructorOptions,
      placeholder: "Select instructors...",
      onChange: (values) => onFilterChange(),
    }
  );

  // Initialize section attribute filter
  const attributeOptions = getSectionAttributeOptions();
  window.sectionAttributeMultiSelect = new MultiSelect(
    document.getElementById("sectionAttributeFilter"),
    {
      options: attributeOptions,
      placeholder: "Select attributes...",
      onChange: (values) => onFilterChange(),
    }
  );

  // Initialize day filter
  const dayOptions = [
    { value: "M", label: "Monday" },
    { value: "T", label: "Tuesday" },
    { value: "W", label: "Wednesday" },
    { value: "R", label: "Thursday" },
    { value: "F", label: "Friday" },
    { value: "S", label: "Saturday" },
    { value: "U", label: "Sunday" },
  ];
  window.dayMultiSelect = new MultiSelect(
    document.getElementById("dayFilter"),
    {
      options: dayOptions,
      placeholder: "Select days...",
      onChange: (values) => onFilterChange(),
    }
  );

  // Apply initial filters based on filterRules
  applyInitialFilters();
}

// Get instructor options from all sections data
function getInstructorOptions() {
  const instructors = new Set();

  allSectionsData.forEach((section) => {
    if (section.instructor && section.instructor !== "Unknown") {
      instructors.add(section.instructor);
    }
  });

  return Array.from(instructors)
    .sort()
    .map((instructor) => ({
      value: instructor,
      label: instructor,
    }));
}

// Get section attribute options
function getSectionAttributeOptions() {
  const attributes = new Set();

  // Add attributes from filterRules
  if (currentFilterRules) {
    currentFilterRules.forEach((rule) => {
      if (rule.type === "sectionAttributes" && rule.values) {
        rule.values.forEach((valueString) => {
          try {
            const parsed = JSON.parse(valueString);
            if (parsed.value) {
              attributes.add(parsed.value);
            }
          } catch (e) {
            if (
              typeof valueString === "string" &&
              valueString.includes("DIST")
            ) {
              attributes.add("DIST");
            }
          }
        });
      }
    });
  }

  // Add attributes from sections data
  allSectionsData.forEach((section) => {
    if (section.sectionAttributes) {
      section.sectionAttributes.forEach((attr) => {
        if (attr.value) {
          attributes.add(attr.value);
        }
      });
    }
  });

  // Add common section attributes
  const commonAttributes = ["DIST", "ACST", "ONLINE", "HYBRID"];
  commonAttributes.forEach((attr) => attributes.add(attr));

  // Convert to options with descriptive names
  const attributeNames = {
    DIST: "Distance Education",
    ACST: "College Station",
    ONLINE: "Online",
    HYBRID: "Hybrid",
  };

  return Array.from(attributes)
    .sort()
    .map((attribute) => ({
      value: attribute,
      label: attributeNames[attribute] || attribute,
    }));
}

// Function to apply initial filters based on course filterRules
function applyInitialFilters() {
  if (!currentFilterRules || currentFilterRules.length === 0) return;

  currentFilterRules.forEach((rule) => {
    if (rule.type === "sectionAttributes" && rule.values) {
      const selectedAttributes = [];
      rule.values.forEach((valueString) => {
        try {
          const parsed = JSON.parse(valueString);
          if (parsed.value) {
            selectedAttributes.push(parsed.value);
          }
        } catch (e) {
          console.warn("Could not parse filter rule value:", valueString);
        }
      });

      if (selectedAttributes.length > 0 && window.sectionAttributeMultiSelect) {
        window.sectionAttributeMultiSelect.setSelectedValues(
          selectedAttributes
        );
      }
    }
  });

  // Apply the filters after setting initial values
  setTimeout(() => onFilterChange(), 100);
}

// Function to handle filter changes and move sections between tabs
async function onFilterChange() {
  const selectedInstructors = window.instructorMultiSelect
    ? window.instructorMultiSelect.getSelectedValues()
    : [];
  const selectedAttributes = window.sectionAttributeMultiSelect
    ? window.sectionAttributeMultiSelect.getSelectedValues()
    : [];
  const selectedDays = window.dayMultiSelect
    ? window.dayMultiSelect.getSelectedValues()
    : [];
  const searchValue = document
    .getElementById("searchFilter")
    .value.toLowerCase();
  const honorsChecked = document.getElementById("honorsFilter").checked;
  const noPrereqChecked = document.getElementById("prereqFilter").checked;
  const openSeatsChecked = document.getElementById("openSeatsFilter").checked;

  // Update filterRules based on current selections
  updateFilterRules(selectedInstructors, selectedAttributes);

  // Filter sections based on criteria
  const filteredSections = allSectionsData.filter((section) => {
    let passesFilter = true;

    // Instructor filter
    if (selectedInstructors.length > 0 && passesFilter) {
      passesFilter = selectedInstructors.includes(section.instructor);
    }

    // Section attribute filter
    if (selectedAttributes.length > 0 && passesFilter) {
      let hasAttribute = false;

      // Check section attributes
      if (section.sectionAttributes) {
        section.sectionAttributes.forEach((attr) => {
          if (selectedAttributes.includes(attr.value)) {
            hasAttribute = true;
          }
        });
      }

      // Special check for distance education
      if (!hasAttribute && selectedAttributes.includes("DIST")) {
        if (
          section.instructionMode &&
          section.instructionMode.includes("Web Based")
        ) {
          hasAttribute = true;
        }
        // Check meeting location
        if (section.meetingTimes) {
          section.meetingTimes.forEach((meeting) => {
            if (meeting.location && meeting.location.includes("ONLINE")) {
              hasAttribute = true;
            }
          });
        }
      }

      passesFilter = hasAttribute;
    }

    // Day filter
    if (selectedDays.length > 0 && passesFilter) {
      let hasDay = false;
      if (section.meetingTimes) {
        section.meetingTimes.forEach((meeting) => {
          if (meeting.days) {
            selectedDays.forEach((day) => {
              if (meeting.days.includes(day)) {
                hasDay = true;
              }
            });
          }
        });
      }
      passesFilter = hasDay;
    }

    // Search filter
    if (searchValue && passesFilter) {
      const searchableText = [
        section.title,
        section.crn,
        section.instructor,
        section.subject,
        section.number,
        section.section,
      ]
        .join(" ")
        .toLowerCase();
      passesFilter = searchableText.includes(searchValue);
    }

    // Honors filter
    if (honorsChecked && passesFilter) {
      passesFilter = section.isHonors;
    }

    // No prerequisites filter
    if (noPrereqChecked && passesFilter) {
      passesFilter = !section.hasPrerequisites;
    }

    // Open seats filter
    if (openSeatsChecked && passesFilter) {
      const seatsCount = parseInt(section.seatsOpen) || 0;
      passesFilter = seatsCount > 0;
    }

    return passesFilter;
  });

  // Redistribute sections between tabs
  await redistributeSections(filteredSections);
}

// Function to redistribute sections between enabled and disabled tabs
async function redistributeSections(filteredSections) {
  const enabledContent = document.getElementById("enabled-sections");
  const disabledContent = document.getElementById("disabled-sections");

  // Clear existing content
  enabledContent.innerHTML = "";
  disabledContent.innerHTML = "";

  // Separate filtered sections into enabled and those that don't pass filters
  const enabledSections = [];
  const disabledSections = [];

  allSectionsData.forEach((section) => {
    if (filteredSections.includes(section) && section.isEnabled) {
      enabledSections.push(section);
    } else {
      disabledSections.push(section);
    }
  });

  // Create cards for enabled sections
  for (let index = 0; index < enabledSections.length; index++) {
    const section = enabledSections[index];
    const courseCard = await createCourseCard(section, index);
    enabledContent.appendChild(courseCard);
  }

  // Create cards for disabled sections
  for (let index = 0; index < disabledSections.length; index++) {
    const section = disabledSections[index];
    const courseCard = await createCourseCard(section, index);
    courseCard.classList.add("disabled-section");
    disabledContent.appendChild(courseCard);
  }

  // Add no sections messages if needed
  if (enabledSections.length === 0) {
    const noSectionsMsg = document.createElement("div");
    noSectionsMsg.className = "no-sections-message";
    noSectionsMsg.textContent =
      "No available sections match the current filters.";
    enabledContent.appendChild(noSectionsMsg);
  }

  if (disabledSections.length === 0) {
    const noSectionsMsg = document.createElement("div");
    noSectionsMsg.className = "no-sections-message";
    noSectionsMsg.textContent = "No unavailable sections.";
    disabledContent.appendChild(noSectionsMsg);
  }

  // Update tab counts
  updateTabCounts(enabledSections.length, disabledSections.length);

  // Re-setup event handlers for new cards
  setupCardEventHandlers();
}

// Function to update tab counts
function updateTabCounts(enabledCount, disabledCount) {
  const enabledTab = document.getElementById("enabled-tab");
  const disabledTab = document.getElementById("disabled-tab");

  if (enabledTab) {
    enabledTab.textContent = `Available Sections (${enabledCount})`;
  }

  if (disabledTab) {
    disabledTab.textContent = `Unavailable Sections (${disabledCount})`;
  }
}

// Function to update filterRules based on current selections
function updateFilterRules(selectedInstructors, selectedAttributes) {
  // Ensure we have valid data before proceeding
  if (!allSectionsData || allSectionsData.length === 0) {
    debugLog("No sections data available for filter rules update");
    return;
  }

  // Clear existing sectionAttributes and registrationNumber rules
  currentFilterRules = currentFilterRules.filter(
    (rule) =>
      rule.type !== "sectionAttributes" && rule.type !== "registrationNumber"
  );

  // Add new sectionAttributes rules based on selected attributes
  if (selectedAttributes && selectedAttributes.length > 0) {
    selectedAttributes.forEach((attribute) => {
      const newRule = {
        type: "sectionAttributes",
        values: [JSON.stringify({ attr: null, value: attribute })],
        value: null,
        excluded: false,
      };
      currentFilterRules.push(newRule);
    });
  }

  // Add excluded registration numbers for unselected courses
  const allAvailableCRNs = allSectionsData
    .filter((section) => section.isEnabled) // Only consider enabled sections
    .map((section) => section.crn);

  const unselectedCRNs = allAvailableCRNs.filter(
    (crn) => !selectedCRNs.has(crn)
  );

  if (unselectedCRNs.length > 0) {
    const excludedRule = {
      type: "registrationNumber",
      excluded: true,
      values: unselectedCRNs,
    };
    currentFilterRules.push(excludedRule);
    debugLog("Adding excluded registration numbers:", unselectedCRNs);
  }

  debugLog("Updated filterRules:", currentFilterRules);
  debugLog("Selected CRNs:", Array.from(selectedCRNs));
  debugLog("All available CRNs:", allAvailableCRNs);

  // Here you could send the updated filterRules to the server if needed
  // updateCourseFilterRules(currentCourse.id, currentFilterRules);
}

// Function to add multi-select CSS styles
function addMultiSelectStyles() {
  // This function is no longer needed as styles are loaded from multi-select.css
  debugLog("MultiSelect styles are now loaded from external CSS file");
}

// Placeholder function to update course filter rules on the server
// This would be implemented to sync filter changes back to the course data
async function updateCourseFilterRules(courseId, filterRules) {
  try {
    // This would make an API call to update the course filter rules
    // const response = await fetch(`/api/courses/${courseId}/filterRules`, {
    //   method: 'PUT',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ filterRules })
    // });

    console.log(
      "Filter rules would be updated on server for course:",
      courseId,
      filterRules
    );
  } catch (error) {
    console.error("Error updating filter rules:", error);
  }
}

// Add save and close button
async function addSaveAndCloseButton(container) {
  const saveButtonContainer = document.createElement("div");
  saveButtonContainer.className = "save-button-container";

  try {
    // Load the save button template
    const response = await fetch(
      chrome.runtime.getURL("/templates/save-button.html")
    );
    const templateHtml = await response.text();
    saveButtonContainer.innerHTML = templateHtml;

    // Add to container after filter controls
    container.appendChild(saveButtonContainer);

    // Add event listeners
    document
      .getElementById("saveAndCloseBtn")
      .addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        saveAndClose();
      });
    document.getElementById("backBtn").addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      // Redirect back without saving
      redirectToCourseList();
    });

    // Add styles
    addSaveButtonStyles();
  } catch (error) {
    console.error("Error loading save button template:", error);
    // Fallback to basic save button if template fails to load
    saveButtonContainer.innerHTML = `
    <div class="save-actions">
      <button id="backBtn" class="back-button">
        <span class="button-text">Back</span>
      </button>
      <button id="saveAndCloseBtn" class="save-close-button">
        <span class="button-text">Save & Close</span>
      </button>
      <div id="saveMessage" class="save-message" style="display: none;"></div>
    </div>
  `;

    // Add to container and set up basic event listeners
    container.appendChild(saveButtonContainer);

    document
      .getElementById("saveAndCloseBtn")
      .addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        saveAndClose();
      });
    document.getElementById("backBtn").addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      redirectToCourseList();
    });
  }
}

// Function to save filter rules and close
async function saveAndClose() {
  const saveBtn = document.getElementById("saveAndCloseBtn");
  const buttonText = saveBtn.querySelector(".button-text");
  const buttonSpinner = saveBtn.querySelector(".button-spinner");
  const saveMessage = document.getElementById("saveMessage");

  try {
    // Show loading state
    saveBtn.disabled = true;
    buttonText.style.display = "none";
    buttonSpinner.style.display = "inline-flex";
    saveMessage.style.display = "none";

    // Update filter rules with current selections before saving
    const selectedInstructors = window.instructorMultiSelect
      ? window.instructorMultiSelect.getSelectedValues()
      : [];
    const selectedAttributes = window.sectionAttributeMultiSelect
      ? window.sectionAttributeMultiSelect.getSelectedValues()
      : [];
    updateFilterRules(selectedInstructors, selectedAttributes);

    // Get XSRF token
    const xsrfToken = getXSRFToken();
    if (!xsrfToken) {
      throw new Error("XSRF token not found");
    }

    // Build the course data with updated filter rules
    const courseData = buildCourseDataForSave();

    // Make the PUT request
    const url = buildSaveUrl();
    console.log("Course data:", courseData);
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        accept: "application/json",
        "accept-language": "en-US,en;q=0.9",
        "content-type": "application/json",
        priority: "u=1, i",
        "sec-ch-ua":
          '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "x-requested-with": "XMLHttpRequest",
        "x-xsrf-token": xsrfToken,
      },
      referrer: window.location.href,
      referrerPolicy: "strict-origin-when-cross-origin",
      body: JSON.stringify(courseData),
      mode: "cors",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Clear cache since filter rules have changed - fresh data will be fetched on next load
    try {
      await CacheUtils.clearCourse(currentCourse.id);
      debugLog("Cleared cache for course after saving filter rules");
    } catch (error) {
      console.error("Error clearing cache:", error);
      // Don't fail the save operation if cache clearing fails
    }

    // Show success message
    showSaveMessage("Filters saved successfully!", "success");

    window.location.href =
      "https://tamu.collegescheduler.com/terms/Fall%202025%20-%20College%20Station/courses";
  } catch (error) {
    console.error("Error saving filter rules:", error);
    showSaveMessage("Error saving filters. Please try again.", "error");

    // Reset button state
    resetSaveButtonState();
  }
}

// Build the course data object for saving
function buildCourseDataForSave() {
  if (!currentCourse) {
    throw new Error("No current course data available");
  }

  // Build the complete course object based on the example
  const courseData = {
    id: currentCourse.id,
    subjectShort: currentCourse.subjectId,
    subjectLong: currentCourse.subjectLong + " - " + currentCourse.subjectLong,
    subjectId: currentCourse.subjectId,
    number: currentCourse.number,
    topic: currentCourse.topic || null,
    title: currentCourse.title,
    topicTitle: currentCourse.topicTitle || null,
    description: currentCourse.description || "",
    enrollmentRequirements: currentCourse.enrollmentRequirements || [],
    notes: currentCourse.notes || null,
    component: currentCourse.component || null,
    courseAttributes: currentCourse.courseAttributes || "",
    credits: currentCourse.credits || "3",
    corequisites: currentCourse.corequisites || "",
    prerequisites: currentCourse.prerequisites || "",
    lockedRegistrationBlockId: currentCourse.lockedRegistrationBlockId || "",
    isRequired: currentCourse.isRequired || false,
    isLocked: currentCourse.isLocked || false,
    isLearningCommunity: currentCourse.isLearningCommunity || false,
    hasHonors: currentCourse.hasHonors || false,
    hasCorequisites: currentCourse.hasCorequisites || false,
    hasPrerequisites: currentCourse.hasPrerequisites || false,
    hasRequisites: currentCourse.hasRequisites || false,
    hasRestrictions: currentCourse.hasRestrictions || false,
    hasReserveCaps: currentCourse.hasReserveCaps || false,
    hasWritingEnhanced: currentCourse.hasWritingEnhanced || false,
    hasOptional: currentCourse.hasOptional || false,
    hasSectionNotes: currentCourse.hasSectionNotes || false,
    hasFreeTextbook: currentCourse.hasFreeTextbook || false,
    hasLowCostTextbook: currentCourse.hasLowCostTextbook || false,
    courseKey: `${currentCourse.subjectId} ${currentCourse.number}`,
    filteredRegBlockIds: currentCourse.filteredRegBlockIds || [],
    selectedOptionalSectionIds: currentCourse.selectedOptionalSectionIds || [],
    filterRules: currentFilterRules,
    flags: currentCourse.flags || [],
    optionMessages: currentCourse.optionMessages || [],
    addedMessage: currentCourse.addedMessage || null,
    selected:
      currentCourse.selected !== undefined ? currentCourse.selected : true,
  };

  return courseData;
}

// Build the save URL
function buildSaveUrl() {
  if (!currentCourse || !currentCourse.id) {
    throw new Error("Course ID not available");
  }

  // Extract term from current URL
  const urlParts = window.location.href.split("/");
  const termIndex = urlParts.findIndex((part) => part === "terms");
  if (termIndex === -1 || termIndex + 1 >= urlParts.length) {
    throw new Error("Could not extract term from URL");
  }

  const term = urlParts[termIndex + 1];
  const baseUrl = `${window.location.protocol}//${window.location.host}`;

  return `${baseUrl}/api/terms/${term}/desiredcourses/${currentCourse.id}`;
}

// Show save message
function showSaveMessage(message, type) {
  const saveMessage = document.getElementById("saveMessage");
  saveMessage.textContent = message;
  saveMessage.className = `save-message ${type}`;
  saveMessage.style.display = "block";
}

// Reset save button state
function resetSaveButtonState() {
  const saveBtn = document.getElementById("saveAndCloseBtn");
  const buttonText = saveBtn.querySelector(".button-text");
  const buttonSpinner = saveBtn.querySelector(".button-spinner");

  saveBtn.disabled = false;
  buttonText.style.display = "inline";
  buttonSpinner.style.display = "none";
}

// Redirect back to course list
function redirectToCourseList() {
  try {
    // Prevent any pending form submissions
    const forms = document.querySelectorAll("form");
    forms.forEach((form) => {
      if (form.onsubmit) {
        form.onsubmit = null;
      }
      // Remove any submit event listeners
      const newForm = form.cloneNode(true);
      form.parentNode.replaceChild(newForm, form);
    });

    // Extract the course list URL from the current URL
    const currentUrl = window.location.href;
    let newUrl;

    // Try multiple methods to build the correct URL
    if (currentUrl.includes("/courses/")) {
      // Method 1: Remove the course ID from the end
      const urlParts = currentUrl.split("/").slice(0, -1);
      newUrl = urlParts.join("/");
    } else {
      // Method 2: Navigate up one level
      newUrl = currentUrl.substring(0, currentUrl.lastIndexOf("/"));
    }

    debugLog("Current URL:", currentUrl);
    debugLog("Redirecting to:", newUrl);

    // Validate the URL before redirecting
    if (!newUrl || newUrl === currentUrl) {
      throw new Error("Could not determine target URL");
    }

    // Use window.location.replace to avoid adding to browser history
    // This prevents the back button from returning to this page in a broken state
    window.location.replace(newUrl);
  } catch (error) {
    console.error("Error during redirect:", error);

    // Fallback 1: Try to go back in history
    try {
      if (window.history.length > 1) {
        debugLog("Using history.back() fallback");
        window.history.back();
        return;
      }
    } catch (historyError) {
      console.error("History fallback failed:", historyError);
    }

    // Fallback 2: Try to redirect to the base term page
    try {
      const termMatch = window.location.href.match(/\/terms\/([^\/]+)/);
      if (termMatch) {
        const termUrl = `${window.location.origin}/terms/${termMatch[1]}/courses`;
        debugLog("Using term page fallback:", termUrl);
        window.location.replace(termUrl);
        return;
      }
    } catch (termError) {
      console.error("Term page fallback failed:", termError);
    }

    // Final fallback: Show an error message
    showSaveMessage(
      "Please manually navigate back to the course list.",
      "error"
    );
  }
}

// Add styles for save button
function addSaveButtonStyles() {
  // This function is no longer needed as styles are loaded from save-button.css
  debugLog("Save button styles are now loaded from external CSS file");
}

// Custom MultiSelect component
class MultiSelect {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options.options || [];
    this.placeholder = options.placeholder || "Select options...";
    this.label = options.label || "";
    this.selectedValues = [];
    this.onChangeCallback = options.onChange || (() => { });

    this.init();
  }

  init() {
    this.container.innerHTML = `
      <div class="multi-select">
        <div class="multi-select__control">
          <div class="multi-select__value-container">
            <div class="multi-select__selected-values"></div>
            <div class="multi-select__input-container">
              <input type="text" class="multi-select__input" placeholder="${this.placeholder}" readonly>
            </div>
          </div>
          <div class="multi-select__indicators">
            <div class="multi-select__clear" title="Clear All">
              <svg width="14" height="14" viewBox="0 0 20 20">
                <path d="M14.348 14.849c-0.469 0.469-1.229 0.469-1.697 0l-2.651-3.030-2.651 3.029c-0.469 0.469-1.229 0.469-1.697 0-0.469-0.469-0.469-1.229 0-1.697l2.758-3.15-2.759-3.152c-0.469-0.469-0.469-1.228 0-1.697s1.228-0.469 1.697 0l2.652 3.031 2.651-3.031c0.469-0.469 1.228-0.469 1.697 0s0.469 1.229 0 1.697l-2.758 3.152 2.758 3.15c0.469 0.469 0.469 1.229 0 1.698z"></path>
              </svg>
            </div>
            <div class="multi-select__separator"></div>
            <div class="multi-select__dropdown-indicator">
              <svg width="14" height="14" viewBox="0 0 20 20">
                <path d="M4.516 7.548c0.436-0.446 1.043-0.481 1.576 0l3.908 3.747 3.908-3.747c0.533-0.481 1.141-0.446 1.574 0 0.436 0.445 0.408 1.197 0 1.615-0.406 0.418-4.695 4.502-4.695 4.502-0.217 0.223-0.502 0.335-0.787 0.335s-0.57-0.112-0.789-0.335c0 0-4.287-4.084-4.695-4.502s-0.436-1.17 0-1.615z"></path>
              </svg>
            </div>
          </div>
        </div>
        <div class="multi-select__menu" style="display: none;">
          <div class="multi-select__options"></div>
        </div>
      </div>
    `;

    this.setupEventListeners();
    this.renderOptions();
  }

  setupEventListeners() {
    const control = this.container.querySelector(".multi-select__control");
    const menu = this.container.querySelector(".multi-select__menu");
    const clearBtn = this.container.querySelector(".multi-select__clear");

    // Toggle dropdown
    control.addEventListener("click", (e) => {
      if (
        !e.target.closest(".multi-select__clear") &&
        !e.target.closest(".multi-select__value-remove")
      ) {
        this.toggleDropdown();
      }
    });

    // Clear all selections
    clearBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.clearAll();
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (!this.container.contains(e.target)) {
        this.closeDropdown();
      }
    });
  }

  renderOptions() {
    const optionsContainer = this.container.querySelector(
      ".multi-select__options"
    );
    optionsContainer.innerHTML = "";

    this.options.forEach((option) => {
      const optionEl = document.createElement("div");
      optionEl.className = "multi-select__option";
      optionEl.textContent = option.label;
      optionEl.dataset.value = option.value;

      if (this.selectedValues.includes(option.value)) {
        optionEl.classList.add("multi-select__option--selected");
      }

      optionEl.addEventListener("click", () => {
        this.toggleOption(option.value);
      });

      optionsContainer.appendChild(optionEl);
    });
  }

  renderSelectedValues() {
    const container = this.container.querySelector(
      ".multi-select__selected-values"
    );
    container.innerHTML = "";

    this.selectedValues.forEach((value) => {
      const option = this.options.find((opt) => opt.value === value);
      if (option) {
        const valueEl = document.createElement("div");
        valueEl.className = "multi-select__value";
        valueEl.innerHTML = `
          <div class="multi-select__value-label">${option.label}</div>
          <div class="multi-select__value-remove" data-value="${value}">
            <svg width="14" height="14" viewBox="0 0 20 20">
              <path d="M14.348 14.849c-0.469 0.469-1.229 0.469-1.697 0l-2.651-3.030-2.651 3.029c-0.469 0.469-1.229 0.469-1.697 0-0.469-0.469-0.469-1.229 0-1.697l2.758-3.15-2.759-3.152c-0.469-0.469-0.469-1.228 0-1.697s1.228-0.469 1.697 0l2.652 3.031 2.651-3.031c0.469-0.469 1.228-0.469 1.697 0s0.469 1.229 0 1.697l-2.758 3.152 2.758 3.15c0.469 0.469 0.469 1.229 0 1.698z"></path>
            </svg>
          </div>
        `;

        const removeBtn = valueEl.querySelector(".multi-select__value-remove");
        removeBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          this.removeValue(value);
        });

        container.appendChild(valueEl);
      }
    });

    // Update placeholder visibility
    const input = this.container.querySelector(".multi-select__input");
    if (this.selectedValues.length > 0) {
      input.placeholder = "";
    } else {
      input.placeholder = this.placeholder;
    }
  }

  toggleDropdown() {
    const menu = this.container.querySelector(".multi-select__menu");
    const isOpen = menu.style.display !== "none";

    if (isOpen) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }

  openDropdown() {
    const menu = this.container.querySelector(".multi-select__menu");
    menu.style.display = "block";
    this.container
      .querySelector(".multi-select__control")
      .classList.add("multi-select__control--menu-is-open");
  }

  closeDropdown() {
    const menu = this.container.querySelector(".multi-select__menu");
    menu.style.display = "none";
    this.container
      .querySelector(".multi-select__control")
      .classList.remove("multi-select__control--menu-is-open");
  }

  toggleOption(value) {
    const index = this.selectedValues.indexOf(value);
    if (index > -1) {
      this.selectedValues.splice(index, 1);
    } else {
      this.selectedValues.push(value);
    }

    this.renderOptions();
    this.renderSelectedValues();
    this.onChangeCallback(this.selectedValues);
  }

  removeValue(value) {
    const index = this.selectedValues.indexOf(value);
    if (index > -1) {
      this.selectedValues.splice(index, 1);
      this.renderOptions();
      this.renderSelectedValues();
      this.onChangeCallback(this.selectedValues);
    }
  }

  clearAll() {
    this.selectedValues = [];
    this.renderOptions();
    this.renderSelectedValues();
    this.onChangeCallback(this.selectedValues);
  }

  setOptions(options) {
    this.options = options;
    this.renderOptions();
  }

  setSelectedValues(values) {
    this.selectedValues = values.slice();
    this.renderOptions();
    this.renderSelectedValues();
  }

  getSelectedValues() {
    return this.selectedValues.slice();
  }
}

// Cache for professor IDs to avoid repeated API calls
const professorIdCache = new Map();

// Cache for course data to avoid repeated API calls
const courseDataCache = new Map();

// Function to fetch course data from the API
async function fetchCourseData(courseId) {
  // Check cache first
  if (courseDataCache.has(courseId)) {
    return courseDataCache.get(courseId);
  }

  try {
    const apiUrl = `https://api-aggiesbp.servehttp.com/course/${courseId}`;
    debugLog(`Fetching course data for: ${courseId}`);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      debugLog(`Failed to fetch course data for ${courseId}: ${response.status}`);
      courseDataCache.set(courseId, null);
      return null;
    }

    const data = await response.json();
    debugLog(`Found course data for ${courseId}:`, data);
    courseDataCache.set(courseId, data);
    return data;
  } catch (error) {
    console.error(`Error fetching course data for ${courseId}:`, error);
    courseDataCache.set(courseId, null);
    return null;
  }
}

// Function to fetch professor ID from the API
async function fetchProfessorId(professorName) {
  // Check cache first
  if (professorIdCache.has(professorName)) {
    return professorIdCache.get(professorName);
  }

  try {
    // Skip if instructor is "Unknown" or similar
    if (!professorName || professorName === "Unknown" || professorName === "Not Assigned") {
      professorIdCache.set(professorName, null);
      return null;
    }

    const encodedName = encodeURIComponent(professorName);
    const apiUrl = `https://api-aggiesbp.servehttp.com/professor/find?name=${encodedName}`;

    debugLog(`Fetching professor ID for: ${professorName}`);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      debugLog(`Failed to fetch professor ID for ${professorName}: ${response.status}`);
      professorIdCache.set(professorName, null);
      return null;
    }

    const data = await response.json();

    // Get the first match if available
    if (data.matches && data.matches.length > 0) {
      const professorId = data.matches[0].id;
      debugLog(`Found professor ID for ${professorName}: ${professorId}`);
      professorIdCache.set(professorName, professorId);
      return professorId;
    } else {
      debugLog(`No professor ID found for ${professorName}`);
      professorIdCache.set(professorName, null);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching professor ID for ${professorName}:`, error);
    professorIdCache.set(professorName, null);
    return null;
  }
}

// Function to prevent unintended page refreshes
function preventPageRefresh() {
  // Prevent form submissions that might cause page refresh
  document.addEventListener(
    "submit",
    (e) => {
      if (isBeautifierActive) {
        e.preventDefault();
        e.stopPropagation();
        debugLog("Prevented form submission while beautifier is active");
      }
    },
    true
  );

  // Override window.location.reload if needed
  const originalReload = window.location.reload;
  window.location.reload = function (...args) {
    if (isBeautifierActive) {
      debugLog("Prevented window.location.reload while beautifier is active");
      return;
    }
    return originalReload.apply(this, args);
  };
}

// Function to load and inject CSS files as style tags
async function loadStylesheets() {
  const cssFiles = [
    "/css/course-cards.css",
    "/css/filter-controls.css",
    "/css/multi-select.css",
    "/css/course-details.css",
    "/css/save-button.css",
  ];

  for (const cssFile of cssFiles) {
    try {
      const response = await fetch(chrome.runtime.getURL(cssFile));
      const cssText = await response.text();

      const styleElement = document.createElement("style");
      styleElement.textContent = cssText;
      styleElement.setAttribute("data-extension-css", cssFile);
      document.head.appendChild(styleElement);

      debugLog(`Loaded stylesheet: ${cssFile}`);
    } catch (error) {
      console.error(`Error loading stylesheet ${cssFile}:`, error);
    }
  }

  // Add styles for course and professor details buttons, professors section, and layout
  const additionalStyles = document.createElement("style");
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
      margin-top: 40px; /* Account for close button */
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
  additionalStyles.setAttribute("data-extension-css", "details-buttons");
  document.head.appendChild(additionalStyles);
}

// Make cache functions available globally for debugging when in debug mode
if (DEBUG_MODE) {
  window.aggieExtension = {
    CacheUtils,
    currentCourse: () => currentCourse,
    selectedCRNs: () => Array.from(selectedCRNs),
    currentFilterRules: () => currentFilterRules,
    allSectionsData: () => allSectionsData,
  };
  debugLog("Debug functions available at window.aggieExtension");
}

function isMainCoursesPage() {
  const regex = /\/terms\/[^\/]+\/courses$/;
  const regex2 = /\/terms\/[^\/]+\/options$/;
  const regex3 = /\/terms\/[^\/]+\/schedules$/;
  const regex4 = /\/terms\/[^\/]+\/breaks$/;
  return regex.test(location.href) || regex2.test(location.href) || regex3.test(location.href) || regex4.test(location.href);
}

// Fetch term data to get enrolled courses
async function getTermData() {
  try {
    // Extract term from current URL
    const urlParts = location.pathname.split("/");
    const termIndex = urlParts.findIndex((part) => part === "terms");
    if (termIndex === -1 || termIndex + 1 >= urlParts.length) {
      throw new Error("Could not extract term from URL");
    }

    const term = urlParts[termIndex + 1];
    const termDataUrl = `https://tamu.collegescheduler.com/api/term-data/${term}`;

    debugLog("Fetching term data from:", termDataUrl);

    const response = await fetch(termDataUrl, {
      headers: {
        accept: "*/*",
        "accept-language": "en-US,en;q=0.9",
        priority: "u=1, i",
        "sec-ch-ua":
          '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
      },
      referrer: location.href,
      referrerPolicy: "strict-origin-when-cross-origin",
      method: "GET",
      mode: "cors",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    debugLog("Term data fetched successfully:", data);
    return data;
  } catch (error) {
    console.error("Error fetching term data:", error);
    return null;
  }
}

// Transform meeting time from API format to display format
function formatMeetingTime(meeting) {
  const formatTime = (time) => {
    const hours = Math.floor(time / 100);
    const minutes = time % 100;
    const period = hours >= 12 ? "pm" : "am";
    const formattedHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${formattedHours}:${minutes.toString().padStart(2, "0")}${period}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return `${(date.getMonth() + 1).toString().padStart(2, "0")}/${date
      .getDate()
      .toString()
      .padStart(2, "0")}/${date.getFullYear()}`;
  };

  const timeStr = `${formatTime(meeting.startTime)}-${formatTime(
    meeting.endTime
  )}`;
  const dateStr = `${formatDate(meeting.startDate)}-${formatDate(
    meeting.endDate
  )}`;
  const location = meeting.location || "";

  return {
    timeDisplay: `${meeting.days} ${timeStr} ${dateStr}`,
    location: location,
    isOnline: location.includes("ONLINE"),
  };
}

// Transform API section data to schedule format
function transformSectionToScheduleFormat(section) {
  // Transform meetings
  const meetingTimes = section.meetings.map((meeting) =>
    formatMeetingTime(meeting)
  );

  // Determine if has restrictions/prerequisites
  const hasRestrictions =
    section.hasRestrictions ||
    (section.sectionRestrictions && section.sectionRestrictions.length > 0);
  const hasPrerequisites = section.hasPrerequisites;

  // Get instructor name
  const instructor =
    section.instructor && section.instructor.length > 0
      ? section.instructor[0].name
      : "Not Assigned";

  // Determine instruction mode
  let instructionMode = section.instructionMode;
  if (instructionMode === "Traditional Face-to-Face (F2F)") {
    instructionMode = "Traditional F2F";
  } else if (instructionMode === "Web Based") {
    instructionMode = "Web Based";
  }

  let html = section.customData || "";
  const courseEval =
    (html.match(/href="([^"]*AefisCourseSection[^"]*)"/) || [])[1] || null;
  const instructorInfo =
    (html.match(/fetch\('([^']*instructor-cv-pdf[^']*)'/) || [])[1] || null;
  const syllabusLink =
    courseEval && courseEval.includes("No syllabus") ? null : null; // Customize if syllabus is provided in data


  const cleanupSectionFeesHtml = (html) => {
    if (!html) return null;

    let cleaned = html
      .replace(/<th>([^<]*)<th>/g, "<th>$1</th><th>") // Fix missing closing tags like <th>Amount<th>
      .replace(/<td>([^<]*)<td>/g, "<td>$1</td><td>") // Fix missing closing tags for td
      .replace(/<th>([^<]*)<\/th><th>/g, "<th>$1</th><th>") // Clean up consecutive th tags
      .replace(/<td>([^<]*)<\/td><td>/g, "<td>$1</td><td>") // Clean up consecutive td tags
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim();

    return cleaned;
  };
  const sectionFees = cleanupSectionFeesHtml((section.customData.match(/<b>Section Fees:<\/b>(.*?)<br>/) ||
    [])[1]?.trim());




  return {
    isExternal: section.isExternal,
    registrationNumber: section.registrationNumber,
    subjectId: section.subjectId,
    topicId: section.topicId,
    id: section.id,
    description: section.description,
    title: section.title,
    credits: section.credits,
    instructionMode: instructionMode,
    instructor: instructor,
    meetingTimes: meetingTimes,
    hasPrerequisites: hasPrerequisites,
    hasRestrictions: hasRestrictions,
    component: section.components,
    courseEval,
    syllabusLink,
    instructorInfo,
    crn: section.registrationNumber,
    subject: section.subject,
    courseNumber: section.course,
    sectionNumber: section.sectionNumber,
    title: section.title,
    credits: section.credits,
    instructionMode: instructionMode,
    instructor: instructor,
    meetingTimes: meetingTimes,
    hasPrerequisites: hasPrerequisites,
    hasRestrictions: hasRestrictions,
    enrollmentStatus: section.enrollmentStatus ? section.enrollmentStatus : "Not Enrolled",
    openSeats: section.openSeats,
    sectionRestrictions: section.sectionRestrictions,
    sectionAttributes: section.sectionAttributes,
    sectionFees: sectionFees,
  };
}

// Create schedule HTML from enrolled courses
async function createScheduleHTML(enrolledCourses, containerType = 'default') {
  if (!enrolledCourses || enrolledCourses.length === 0) {
    return `<div class="schedule-container">
      <div class="schedule-header">
        <div class="select-all-container">
          <input type="checkbox" id="select-all-checkbox-${containerType}" class="select-all-checkbox">
          <label for="select-all-checkbox-${containerType}" class="select-all-label">Select All</label>
        </div>
      </div>
      <div class="schedule-header">No enrolled courses found</div>
    </div>`;
  }

  // Process courses with professor buttons
  const scheduleItems = [];
  for (const course of enrolledCourses) {
    // Fetch professor button HTML if instructor is available
    let professorButtonHtml = "";
    if (course.instructor && course.instructor !== "Unknown" && course.instructor !== "Not Assigned") {
      try {
        const professorId = await fetchProfessorId(course.instructor);
        if (professorId) {
          const professorDetailsUrl = `https://aggieschedulebuilderplus.vercel.app/professor/${professorId}`;
          professorButtonHtml = `<a href="${professorDetailsUrl}" target="_blank" class="professor-details-btn" title="Compare Professor Reviews">View Reviews 🔗</a>`;
        }
      } catch (error) {
        debugLog(`Error fetching professor ID for ${course.instructor}:`, error);
      }
    }

    const meetingTimesHTML = course.meetingTimes
      .map((meeting) => {
        const locationHTML = meeting.location
          ? `<a href="#" class="location-link">${meeting.location}</a>`
          : "";

        return `
      <div class="schedule-meeting-time">
        ${meeting.timeDisplay}${meeting.isOnline ? " - ONLINE" : ""}
        ${locationHTML}
      </div>
    `;
      })
      .join("");

    // Create badges
    const badges = [];
    if (course.hasPrerequisites)
      badges.push(
        '<span class="add-course-badge badge-prerequisites">Prerequisites</span>'
      );
    if (course.hasRestrictions)
      badges.push(
        '<span class="add-course-badge badge-restrictions">Restrictions</span>'
      );
    const badgesHTML =
      badges.length > 0
        ? `<div class="add-course-badges">${badges.join("")}</div>`
        : "";

    // Handle cases where there are many meeting times
    const displayMeetings = course.meetingTimes; // Show first 3

    const displayMeetingTimesHTML = displayMeetings
      .map((meeting) => {
        const locationHTML = meeting.location
          ? ` <a href="#" class="location-link">${meeting.location}</a>`
          : "";

        return `
      <div class="schedule-meeting-time">
        ${meeting.timeDisplay}${meeting.isOnline ? " - ONLINE" : ""
          }${locationHTML}
      </div>
    `;
      })
      .join("");

    // Conditionally include enrolled status only if enrollmentStatus is not null
    const enrolledStatusHTML = course.enrollmentStatus === "Enrolled"
      ? `<span class="status-enrolled">
          <span class="status-icon">ℹ</span>
          ${course.enrollmentStatus}
        </span>`
      : "";

    // Create seats availability indicator for cart courses
    let seatsAvailableHTML = "";
    if (course.enrollmentStatus !== "Enrolled" && course.openSeats !== undefined) {
      const seatsCount = parseInt(course.openSeats) || 0;
      let seatsClass = "seats-available";
      let seatsIcon = "✓";

      if (seatsCount === 0) {
        seatsClass = "seats-full";
        seatsIcon = "✗";
      } else if (seatsCount < 5) {
        seatsClass = "seats-limited";
        seatsIcon = "!";
      }

      seatsAvailableHTML = `<div class="seats-indicator ${seatsClass}">
        <span class="seats-icon">${seatsIcon}</span>
        <span class="seats-text">${seatsCount} seats</span>
      </div>`;
    }

    const scheduleItemHTML = `
    <div class="schedule-item">
      <div class="schedule-item-header">
        <div class="schedule-item-main">
          <input type="checkbox" id="beautified_checkbox_${course.crn}" style="margin: 0px 0px 0px 0px;" class="schedule-checkbox" data-crn="${course.crn}" data-id="${course.id}" ${course.enrollmentStatus === "Enrolled" ? "checked" : ""}>
          <div class="course-identifier">
            ${course.subject} ${course.courseNumber}-${course.sectionNumber}
            <span class="course-crn-schedule">CRN: ${course.crn}</span>
          </div>
          <div class="course-credits">${course.credits} Credits</div>
          <div class="instruction-mode">${course.instructionMode}</div>
          ${seatsAvailableHTML}
          ${enrolledStatusHTML}
        </div>
        <div class="schedule-actions">
          <button class="details-button" data-crn="${course.crn}">Details</button>
        </div>
      </div>
      <div class="schedule-times">
        <div class="schedule-meeting-times">
          ${displayMeetingTimesHTML}
        </div>
      </div>
      <div class="instructor-info">
        <div class="instructor-container">
          <div class="instructor-name">Instructor: ${course.instructor}</div>
          ${professorButtonHtml}
        </div>
        ${badgesHTML}
      </div>
    </div>
  `;

    scheduleItems.push(scheduleItemHTML);
  }

  return `
    <div class="schedule-container">
      <div class="schedule-header">
        <div class="select-all-container">
          <input style="margin: 0;" type="checkbox" id="select-all-checkbox-${containerType}" class="select-all-checkbox">
          <label for="select-all-checkbox-${containerType}" class="select-all-label">Select All</label>
        </div>
      </div>
      ${scheduleItems.join("")}
    </div>
  `;
}

async function setupMainScheduleObserver() {
  const targetNode = document.querySelector('div[class*="tableCss"]');

  if (targetNode) {
    showLoadingScreen();
    beautifyMainSchedule();
    beautifyExistingTables();
    if (document.getElementById('schedules_panel').querySelector('div[class*="comparePanelCss"]')) {
      beautifySchedules(document.getElementById('schedules_panel').querySelector('div[class*="comparePanelCss"]'));
      enhancePaginationButtons();
    }
  } else {
    const observer = new MutationObserver((mutations, obs) => {
      const targetNode = document.querySelector('div[class*="tableCss"]');
      if (targetNode) {
        showLoadingScreen();
        beautifyMainSchedule();
        beautifyExistingTables();
        if (document.getElementById('schedules_panel').querySelector('div[class*="comparePanelCss"]')) {
          beautifySchedules(document.getElementById('schedules_panel').querySelector('div[class*="comparePanelCss"]'));
          enhancePaginationButtons();
        }
        obs.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }
}

// Function to beautify the main courses page schedule
async function beautifyMainSchedule() {
  if (!originalContent) {
    originalContent = document.body.cloneNode(true);
  }

  try {
    debugLog("Starting main schedule beautification...");

    // Get term ID from URL for caching
    const urlParts = location.href.split("/");
    const termIndex = urlParts.findIndex((part) => part === "terms");
    if (termIndex === -1 || termIndex + 1 >= urlParts.length) {
      debugLog("Could not extract term from URL");
      return;
    }

    const term = urlParts[termIndex + 1];
    const scheduleKey = `main_schedule_${term}`;
    const cartKey = `cart_schedule_${term}`;

    // Fast path: Check localStorage first for immediate rendering
    const fastScheduleData = CacheUtils.getCachedDataSync(scheduleKey);
    const fastCartScheduleData = CacheUtils.getCachedDataSync(cartKey);
    if (fastScheduleData && fastCartScheduleData) {
      debugLog(
        "Using fast localStorage cache for main schedule - immediate render"
      );
      await createMainSchedule(fastScheduleData, fastCartScheduleData);
      applySettings();
      return;
    }

    let scheduleData = fastScheduleData;
    let cartData = fastCartScheduleData;

    // Otherwise, fetch what we need
    if (!scheduleData || !cartData) {
      try {
        const termData = await getTermData();
        if (!termData.currentSections || !termData.cartSections) {
          debugLog("No term data or current sections found");
          return;
        }

        const currentSections = termData.currentSections;
        const cartSections = termData.cartSections;

        debugLog("Cart sections:", cartSections);

        scheduleData = currentSections
          .filter((section) => section.enrollmentStatus === "Enrolled")
          .map((section) => transformSectionToScheduleFormat(section));
        cartData = cartSections
          .map((section) => transformSectionToScheduleFormat(section));

        debugLog("Schedule data:", scheduleData);
        debugLog("Cart data:", cartData);

        if (scheduleData.length === 0) {
          debugLog("No enrolled courses found");
        }

        if (cartData.length === 0) {
          debugLog("No cart courses found");
        }

        // Cache asynchronously (non-blocking)
        CacheUtils.store(scheduleKey, scheduleData).catch((error) => {
          console.error("Error caching main schedule data:", error);
        });
        CacheUtils.store(cartKey, cartData).catch((error) => {
          console.error("Error caching cart data:", error);
        });
        debugLog("Fetched and processed main schedule data");
      } catch (error) {
        console.error("Error fetching main schedule data:", error);
        return;
      }
    } else {
      debugLog("Using cached main schedule data");
    }

    await createMainSchedule(scheduleData, cartData);
    applySettings();
    debugLog("Main schedule beautification completed successfully");
  } catch (error) {
    console.error("Error beautifying main schedule:", error);
  }

  // Always hide the loading screen when main schedule beautification completes
  hideLoadingScreen();
}

// Function to create the main schedule UI
async function createMainSchedule(enrolledCourses, cartCourses) {
  debugLog("Creating main schedule with courses:", enrolledCourses);
  debugLog("Creating cart with courses:", cartCourses);

  // Store course data globally for details function
  enrolledCoursesData = enrolledCourses;
  cartCoursesData = cartCourses;

  // Find the target table elements specifically
  // Debug: Log all containers to see what we're working with
  const allContainers = document.querySelectorAll('div[class*="containerCss"], div[class*="constainerCss"]');
  debugLog("All containers found:", allContainers);
  allContainers.forEach((container, index) => {
    debugLog(`Container ${index}:`, container.className, container.textContent.substring(0, 50));
  });

  // Current schedule table is in container with "Current Schedule" header
  const currentScheduleContainer = Array.from(allContainers).find(container => {
    return container.textContent.includes('Current Schedule');
  });

  let scheduleTable = null;
  let cartTable = null;

  if (currentScheduleContainer) {
    scheduleTable = currentScheduleContainer.querySelector('div[class*="tableCss"]');
    debugLog("Found current schedule container:", currentScheduleContainer);
    debugLog("Found current schedule table:", scheduleTable);
  } else {
    debugLog("Current schedule container not found");
  }

  // Find cart table by looking for "Shopping Cart" container specifically
  // Note: There's a typo in the class name - it's "constainerCss" not "containerCss" 
  const shoppingCartContainer = Array.from(allContainers).find(container => {
    return container.textContent.includes('Shopping Cart');
  });

  if (shoppingCartContainer) {
    cartTable = shoppingCartContainer.querySelector('div[class*="tableCss"]');
    debugLog("Found shopping cart container:", shoppingCartContainer);
    debugLog("Found shopping cart table:", cartTable);
  } else {
    debugLog("Shopping cart container not found");
  }

  if (!scheduleTable) {
    debugLog("Current schedule table not found");
    return;
  }

  if (!cartTable) {
    debugLog("Cart table not found, will only beautify schedule");
  }

  debugLog("Found schedule table:", scheduleTable);
  debugLog("Found cart table:", cartTable);

  // Validate that scheduleTable has a parent node
  if (!scheduleTable.parentNode) {
    debugLog("Schedule table has no parent node");
    return;
  }

  // Hide the original tables instead of replacing them
  scheduleTable.style.display = 'none';
  if (cartTable) {
    cartTable.style.display = 'none';
  }

  // Create beautified schedule HTML
  const scheduleHTML = await createScheduleHTML(enrolledCourses, 'enrolled');
  const cartHTML = await createScheduleHTML(cartCourses, 'cart');

  // Load schedule CSS
  await loadScheduleCSS();

  // Create containers for the beautified UI
  const scheduleContainer = document.createElement("div");
  scheduleContainer.innerHTML = scheduleHTML;
  scheduleContainer.className = "beautified-schedule-container";

  const cartContainer = document.createElement("div");
  cartContainer.innerHTML = cartHTML;
  cartContainer.className = "beautified-cart-container";

  // Insert the beautified schedule container after the hidden schedule table
  if (scheduleTable && scheduleTable.parentNode) {
    scheduleTable.parentNode.insertBefore(scheduleContainer.firstElementChild, scheduleTable.nextSibling);
  }

  // Insert the beautified cart container after the hidden cart table (if it exists)
  if (cartTable && cartTable.parentNode) {
    debugLog("Inserting cart container after cart table");
    cartTable.parentNode.insertBefore(cartContainer.firstElementChild, cartTable.nextSibling);
  } else if (shoppingCartContainer) {
    // If we found the shopping cart container but no table, insert the cart container inside it
    debugLog("Inserting cart container inside shopping cart container");
    shoppingCartContainer.appendChild(cartContainer.firstElementChild);
  } else {
    // If no cart table or container found, append cart container to the page
    debugLog("No cart table or container found, using fallback placement");
    const pageContainer = document.querySelector('div[class*="containerCss"], div[class*="constainerCss"]');
    if (pageContainer && pageContainer.parentNode) {
      pageContainer.parentNode.insertBefore(cartContainer.firstElementChild, pageContainer.nextSibling);
    }
  }

  // Set up event listeners with checkbox synchronization
  setupScheduleEventListeners();
  setupCheckboxSynchronization();
}

// Function to set up checkbox synchronization between beautified UI and original tables
function setupCheckboxSynchronization() {
  // Handle individual checkbox changes
  document.querySelectorAll('.schedule-checkbox').forEach(checkbox => {
    // Skip if this is an original checkbox (not our beautified one)
    if (checkbox.closest('[style*="display: none"]') || checkbox.closest('table')) {
      return;
    }

    checkbox.addEventListener('change', function () {
      const crn = this.dataset.crn;
      const isChecked = this.checked;

      debugLog('Beautified checkbox changed:', crn, isChecked);

      // Find and update the corresponding original checkbox
      const originalCheckbox = document.querySelector(`#checkbox_${crn}`);
      debugLog('Original checkbox:', originalCheckbox);
      if (originalCheckbox && originalCheckbox.checked !== isChecked) {
        originalCheckbox.click();

        // Trigger change event on original checkbox to maintain page functionality
        const changeEvent = new Event('change', { bubbles: true });
        originalCheckbox.dispatchEvent(changeEvent);

        debugLog('Updated original checkbox:', crn, isChecked);
      }

      // Update select all checkbox states
      updateAllSelectAllCheckboxes();

      checkForCourseModificationAlert();
    });
  });

  // Handle select all checkboxes
  document.querySelectorAll('.select-all-checkbox').forEach(selectAllCheckbox => {
    selectAllCheckbox.addEventListener('change', function () {
      const isChecked = this.checked;
      const container = this.closest('.schedule-container');

      if (!container) return;

      debugLog('Select all checkbox changed:', isChecked, this.id);

      // Update beautified checkboxes in this container
      const beautifiedCheckboxes = container.querySelectorAll('.schedule-checkbox');
      beautifiedCheckboxes.forEach(checkbox => {
        if (checkbox.checked !== isChecked) {
          checkbox.checked = isChecked;

          // Also update the corresponding original checkbox
          const crn = checkbox.dataset.crn;
          const originalCheckbox = document.querySelector(`#checkbox_${crn}`);
          if (originalCheckbox && originalCheckbox.checked !== isChecked) {
            originalCheckbox.click();

            // Trigger change event on original checkbox
            const changeEvent = new Event('change', { bubbles: true });
            originalCheckbox.dispatchEvent(changeEvent);
          }
        }
      });

      // Update the original select all checkbox if it exists
      if (this.id.includes('enrolled')) {
        const originalSelectAll = document.querySelector('#checkbox_select_all_Registered');
        if (originalSelectAll && originalSelectAll.checked !== isChecked) {
          originalSelectAll.checked = isChecked;

          // Trigger change event on original select all
          const changeEvent = new Event('change', { bubbles: true });
          originalSelectAll.dispatchEvent(changeEvent);
        }
      }

      // Check for course modification alert
      checkForCourseModificationAlert();
    });
  });

  // Sync initial states - ensure beautified checkboxes match original ones
  syncInitialCheckboxStates();
}

// Function to sync initial checkbox states from original to beautified
function syncInitialCheckboxStates() {
  // Find all original checkboxes in hidden tables
  const hiddenTables = document.querySelectorAll('div[style*="display: none"] table, table');

  hiddenTables.forEach(table => {
    const originalCheckboxes = table.querySelectorAll('input[type="checkbox"][id^="checkbox_"]:not(.select-all-checkbox)');

    originalCheckboxes.forEach(originalCheckbox => {
      const crn = originalCheckbox.id.replace('checkbox_', '');
      const beautifiedCheckbox = document.querySelector(`.schedule-checkbox[data-crn="${crn}"]:not(table .schedule-checkbox)`);

      if (beautifiedCheckbox && beautifiedCheckbox.checked !== originalCheckbox.checked) {
        beautifiedCheckbox.checked = originalCheckbox.checked;
        debugLog('Synced initial state for CRN:', crn, originalCheckbox.checked);
      }
    });
  });

  // Update all select all checkbox states
  updateAllSelectAllCheckboxes();
}

// Function to update all select all checkboxes to reflect current state
function updateAllSelectAllCheckboxes() {
  document.querySelectorAll('.select-all-checkbox').forEach(selectAllCheckbox => {
    updateSelectAllCheckboxState(selectAllCheckbox);
  });

  // Also update original select all if it exists
  const originalSelectAll = document.querySelector('#checkbox_select_all_Registered');
  if (originalSelectAll) {
    const allOriginalCheckboxes = document.querySelectorAll('input[type="checkbox"][id^="checkbox_"]:not([id*="select_all"])');
    const checkedOriginalCheckboxes = document.querySelectorAll('input[type="checkbox"][id^="checkbox_"]:not([id*="select_all"]):checked');

    if (checkedOriginalCheckboxes.length === 0) {
      originalSelectAll.checked = false;
      originalSelectAll.indeterminate = false;
    } else if (checkedOriginalCheckboxes.length === allOriginalCheckboxes.length) {
      originalSelectAll.checked = true;
      originalSelectAll.indeterminate = false;
    } else {
      originalSelectAll.checked = false;
      originalSelectAll.indeterminate = true;
    }
  }
}

// Function to disable main schedule beautification
function disableBeautifyMainSchedule() {
  if (originalContent) {
    // Only restore if we're on a page that was beautified
    const beautifiedSchedule = document.querySelector(".schedule-container");
    if (beautifiedSchedule) {
      document.body.innerHTML = originalContent.innerHTML;
    }
  }
}

// Set up event listeners for schedule elements
function setupScheduleEventListeners() {
  // Handle location links
  document.querySelectorAll(".location-link").forEach((element) => {
    element.addEventListener("click", function (e) {
      e.preventDefault();
      // Could open building map or show location details
      debugLog("Location clicked:", this.textContent);
    });
  });

  // Handle more times links
  document.querySelectorAll(".more-times").forEach((element) => {
    element.addEventListener("click", function () {
      // Could expand to show all meeting times
      debugLog("More times clicked");
    });
  });

  // Handle details buttons
  document.querySelectorAll(".details-button").forEach((button) => {
    button.addEventListener("click", function () {
      const crn = this.dataset.crn;
      debugLog("Show details for CRN:", crn);

      // Find the course data for this CRN
      const courseData = [...enrolledCoursesData, ...cartCoursesData].find(course => course.crn === crn);

      toggleScheduleDetails(crn, courseData);
    });
  });

  // Note: Checkbox handling is now managed by setupCheckboxSynchronization()
  // to maintain synchronization with original hidden tables

  // Set up MutationObserver to watch for generate buttons in target panels
  setupGenerateButtonObserver();
}


function beautifyExistingTables() {
  document.querySelectorAll('.css-1deu6zk-flagCss').forEach(badge => {
    badge.classList.add('add-course-badge');
    badge.classList.add('badge-prerequisites');
    badge.classList.remove('css-1deu6zk-flagCss');
  });
  document.querySelectorAll('.css-1p12iun-checkboxCss').forEach(checkbox => {
    checkbox.classList.add('schedule-checkbox');
  });
  document.querySelectorAll('.css-o4eziu-hoverStyles-hoverStyles-defaultStyle-hoverStyles-btnCss-editBtnCss').forEach(button => {
    // add inline-flex to the element
    button.style.display = 'inline-flex';
    button.style.alignItems = 'center';
    button.style.justifyContent = 'center';
  });
  // replace <span class="glyphicons cogwheel  css-1834z1j-iconCss"></span> with svg icon
  document.querySelectorAll('.cogwheel').forEach(icon => {
    // Create a temporary container to parse the SVG
    const svgContainer = document.createElement('div');
    svgContainer.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="#500000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-settings">
  <circle cx="12" cy="12" r="3"></circle>
  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09c.7 0 1.3-.4 1.51-1a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09c0 .7.4 1.3 1 1.51a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09c0 .7.4 1.3 1 1.51h.09a2 2 0 1 1 0 4h-.09c-.7 0-1.3.4-1.51 1z"></path>
</svg>`;

    // Get the SVG element
    const svgElement = svgContainer.firstElementChild;

    // Replace the entire span with the SVG
    icon.parentNode.replaceChild(svgElement, icon);
  });

  document.querySelectorAll('.fa-info-circle').forEach(icon => {
    icon.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" style="display: block;" width="24" height="24" fill="none" stroke="#4a90e2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-info">
  <circle cx="12" cy="12" r="10"></circle>
  <line x1="12" y1="16" x2="12" y2="12"></line>
  <line x1="12" y1="8" x2="12" y2="8"></line>
</svg>
`
    // remove all the classes from the element
    icon.classList.remove('fa');
    icon.classList.remove('fa-info-circle');
  });

  document.querySelectorAll('.remove').forEach(icon => {
    icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" style="display: block;" width="24" height="24" fill="none" stroke="#d33" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-x-circle">
  <circle cx="12" cy="12" r="10"></circle>
  <line x1="15" y1="9" x2="9" y2="15"></line>
  <line x1="9" y1="9" x2="15" y2="15"></line>
</svg>
`
    // remove all the classes from the element
    icon.classList.remove('glyphicon');
    icon.classList.remove('remove');
  });

  const containerElement = document.querySelector('.css-t9zfzt-containerCss');
  if (containerElement) {
    containerElement.classList.add('modern-table-container');
    containerElement.classList.add('add-course-table');
  }

  const tableElement = document.querySelector('.css-1hcgu1m-tableCss');
  if (tableElement) {
    tableElement.classList.add('modern-table-container');
    tableElement.classList.add('add-break-table');
  }

  // Convert course names to links in add courses table
  convertCourseNamesToLinks();

  hideLoadingScreen();

}

// Function to convert course names to links in add courses table
function convertCourseNamesToLinks() {
  // Find the add courses table
  const addCoursesTable = document.querySelector('.add-course-table table');

  if (!addCoursesTable) {
    debugLog('Add courses table not found');
    return;
  }

  // Find all table rows in the add courses table
  const tableRows = addCoursesTable.querySelectorAll('tbody tr');

  tableRows.forEach(row => {
    // Look for course title elements with the specific class
    const courseTitleElements = row.querySelectorAll('.css-wcutoi-titleCss');

    courseTitleElements.forEach(titleElement => {
      // Skip if this element is already wrapped in a link
      if (titleElement.closest('a')) return;

      const courseText = titleElement.textContent.trim();

      // Parse course text to extract subject and number
      // Course names are typically in format like "AGEC 105"
      const courseMatch = courseText.match(/^([A-Z]{2,4})[\s-]?(\d{3,4})/);

      if (courseMatch) {
        const subject = courseMatch[1];
        const number = courseMatch[2];
        const courseId = `${subject}${number}`;

        // Create course details URL
        const courseDetailsUrl = `https://aggieschedulebuilderplus.vercel.app/course/${courseId}`;

        // Create new link element that wraps the entire strong element
        const linkWrapper = document.createElement('a');
        linkWrapper.href = courseDetailsUrl;
        linkWrapper.target = '_blank';
        linkWrapper.className = 'course-details-link';
        linkWrapper.title = 'View Course Details';

        // Clone the original element to preserve its styling and classes
        const clonedElement = titleElement.cloneNode(true);
        linkWrapper.appendChild(clonedElement);

        // Replace the original element with the link wrapper
        titleElement.parentNode.replaceChild(linkWrapper, titleElement);

        debugLog(`Converted course title: ${courseText} -> ${courseDetailsUrl}`);
      }
    });
  });
}


// Function to collect all selected courses from checkboxes
function collectSelectedCourses() {
  const selectedData = {
    "breaks": [],
    "cartSections": [],
    "courses": [],
    "currentSections": [],
    "padding": 0
  };

  try {

    // Also check our beautified checkboxes
    const beautifiedCheckboxes = document.querySelectorAll('.schedule-checkbox:checked');
    beautifiedCheckboxes.forEach(checkbox => {
      const id = findIDForCheckbox(checkbox);

      if (id) {
        // Find the course data for this ID
        const courseData = [...enrolledCoursesData, ...cartCoursesData].find(course => course.id === id);

        if (courseData) {
          const courseInfo = {
            "course": courseData.courseNumber || courseData.number,
            "id": id,
            "isExternal": false,
            "registrationNumber": courseData.crn,
            "subject": courseData.subject,
            "subjectId": courseData.subject,
            "topicId": null
          };

          if (courseData.enrollmentStatus === 'Enrolled') {
            courseInfo.enrollmentStatus = "Enrolled";
            selectedData.currentSections.push(courseInfo);
          } else {
            selectedData.cartSections.push(courseInfo);
          }
        } else if (checkbox.id.includes('break_checkbox')) {
          selectedData.breaks.push(id);
        } else {
          selectedData.courses.push(id);
        }

        debugLog(`Found beautified selected ID: ${id}`);
      }
    });

    // Remove duplicates from courses array
    selectedData.courses = [...new Set(selectedData.courses)];

    // Remove duplicates from sections arrays based on ID
    selectedData.cartSections = selectedData.cartSections.filter((section, index, self) =>
      index === self.findIndex(s => s.id === section.id)
    );
    selectedData.currentSections = selectedData.currentSections.filter((section, index, self) =>
      index === self.findIndex(s => s.id === section.id)
    );

    debugLog('Final selected data:', selectedData);
    return selectedData;

  } catch (error) {
    console.error('Error collecting selected courses:', error);
    return selectedData;
  }
}


// Helper function to find ID for a checkbox
function findIDForCheckbox(checkbox) {
  try {
    // If there is a tr parent with the a class that contains rowCss, check the a tag in it for a href that contains crn
    const tr = checkbox.closest('tr');
    if (tr) {
      const a = tr.querySelector('a');
      if (a) {
        const href = a.href; //https://tamu.collegescheduler.com/terms/Fall%202025%20-%20College%20Station/courses/6982217
        const id = href.split('/').pop();
        return id;
      }
    }

    // Method 1: Check if ID is in a data-id attribute
    if (checkbox.dataset.id) {
      return checkbox.dataset.id;
    }

    return null;
  } catch (error) {
    console.error('Error finding ID for checkbox:', error);
    return null;
  }
}

// Helper function to update the select all checkbox state
function updateSelectAllCheckboxState(selectAllCheckbox) {
  // If no checkbox provided, try to find one (for backward compatibility)
  if (!selectAllCheckbox) {
    selectAllCheckbox = document.querySelector('.select-all-checkbox');
  }

  if (!selectAllCheckbox) return;

  // Find the parent schedule container for this select all checkbox
  const scheduleContainer = selectAllCheckbox.closest('.schedule-container');
  if (!scheduleContainer) {
    debugLog('Could not find parent schedule container for select all checkbox');
    return;
  }

  // Only consider checkboxes within this container
  const scheduleCheckboxes = scheduleContainer.querySelectorAll('.schedule-checkbox');
  const checkedCheckboxes = scheduleContainer.querySelectorAll('.schedule-checkbox:checked');

  if (checkedCheckboxes.length === 0) {
    // No checkboxes checked
    selectAllCheckbox.checked = false;
    selectAllCheckbox.indeterminate = false;
  } else if (checkedCheckboxes.length === scheduleCheckboxes.length) {
    // All checkboxes checked
    selectAllCheckbox.checked = true;
    selectAllCheckbox.indeterminate = false;
  } else {
    // Some checkboxes checked (indeterminate state)
    selectAllCheckbox.checked = false;
    selectAllCheckbox.indeterminate = true;
  }
}


// Function to set up MutationObserver for generate buttons
function setupGenerateButtonObserver() {
  // Function to replace generate buttons in a given panel
  function replaceGenerateButtonsInPanel(panel) {
    if (!panel) return;

    const buttons = panel.querySelectorAll('button[type="button"]:not(.modern-generate-button)');
    let buttonsReplaced = false;

    buttons.forEach(button => {
      const parent = button.parentNode;
      const buttonText = button.textContent || button.value || '';
      if (buttonText.includes('Generate Schedules') || buttonText.includes('Generate Schedule')) {
        button.classList.add('modern-generate-button');
        button.textContent = '🚀 Generate Schedules';

        // Copy click functionality with course collection
        button.addEventListener('click', function (e) {
          e.preventDefault();

          // Collect all selected courses
          const selectedCourses = collectSelectedCourses();

          debugLog('Selected courses for schedule generation:', selectedCourses);

          button.classList.add('loading');
          button.textContent = 'Generating...';
          // stop the animation after 1 second
          // setTimeout(() => {
          //   button.classList.remove('loading');
          //   button.textContent = 'Generate Schedules';
          // }, 1000);

          watchScheduleGeneration(button);

        });
      }

      buttonsReplaced = true;
    });

    return buttonsReplaced;
  }

  // Initial check for existing panels and buttons
  const favoritesPanel = document.getElementById('favorites_panel');
  const schedulesPanel = document.getElementById('schedules_panel');

  if (favoritesPanel) {
    replaceGenerateButtonsInPanel(favoritesPanel);
  }
  if (schedulesPanel) {
    replaceGenerateButtonsInPanel(schedulesPanel);
  }

  // Set up MutationObserver to watch for changes
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      // Check if nodes were added
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          // Skip if not an element
          if (node.nodeType !== Node.ELEMENT_NODE) return;

          // Check if the added node is one of our target panels
          if (node.id === 'favorites_panel' || node.id === 'schedules_panel') {
            debugLog('Target panel appeared:', node.id);
            replaceGenerateButtonsInPanel(node);
            if (node.id === "schedules_panel") {
              beautifySchedules(node.querySelector('div[class*="comparePanelCss"]'));
            }
          }

          // Check if the added node contains buttons in our target panels
          const targetPanels = [
            document.getElementById('favorites_panel'),
            document.getElementById('schedules_panel')
          ].filter(panel => panel !== null);

          targetPanels.forEach(panel => {
            // Check if the mutation happened within this panel
            if (panel.contains(node) || node.contains && node.contains(panel)) {
              replaceGenerateButtonsInPanel(panel);
            }
          });
        });
      }

      // Also check for attribute changes that might indicate content loaded
      if (mutation.type === 'attributes') {
        const target = mutation.target;
        if (target.id === 'favorites_panel' || target.id === 'schedules_panel') {
          // Delay slightly to let content load
          setTimeout(() => {
            replaceGenerateButtonsInPanel(target);
          }, 100);
        }
      }
    });
  });

  // Start observing the document body for changes
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'style'] // Watch for class and style changes that might indicate content loading
  });

  debugLog('Generate button observer set up successfully');
}

function watchScheduleGeneration(button) {
  // watch schedule panel for a third child
  const schedulePanel = document.getElementById('schedules_panel');

  if (!schedulePanel) {
    debugLog('Schedules panel not found');
    return;
  }

  debugLog('Starting to watch for schedule generation results...');

  // Create a new MutationObserver specifically for schedule generation results
  const scheduleObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        // Check if a third child (or more) has been added
        const childCount = schedulePanel.children.length;
        debugLog('Schedule panel child count:', childCount);

        if (childCount >= 3) {
          // A third div has been added - this likely contains the schedule generation results
          const thirdChild = schedulePanel.children[2];
          debugLog('Third child detected:', thirdChild);

          button.classList.remove('loading');
          button.textContent = '🚀 Generate Schedules';

          // Handle the schedule generation response
          handleScheduleGenerationComplete(thirdChild);

          // Stop observing once we've found the results
          scheduleObserver.disconnect();
        }
      }
    });
  });

  // Start observing the schedules panel for child additions
  scheduleObserver.observe(schedulePanel, {
    childList: true,
    subtree: false, // Only watch direct children, not nested elements
  });
}

// Function to handle when schedule generation is complete
function handleScheduleGenerationComplete(resultElement) {
  debugLog('Schedule generation complete, processing results:', resultElement);

  // Add a small delay to ensure DOM is fully updated
  setTimeout(() => {
    // Check what type of content was added
    if (resultElement.textContent.includes('warning') || resultElement.textContent.includes('alert')) {
      debugLog('Schedule generation returned warnings/errors');
      // The existing displayWarnings function can handle this
    } else if (resultElement.textContent.includes('schedule') || resultElement.querySelector('table')) {
      debugLog('Schedule generation returned schedules');
      beautifySchedules(resultElement);
      enhancePaginationButtons();
      // The existing displaySchedules function can handle this
    } else {
      debugLog('Unknown schedule generation result type');
    }
  }, 100);

  // You can add additional processing here if needed
  // For example, trigger your existing schedule display functions:
  // displaySchedules() or displayWarnings() based on the content
}

// Function to check for and handle course modification alert
function checkForCourseModificationAlert() {
  // debugLog('Checking for course modification alert');
  const schedulesPanel = document.getElementById('schedules_panel');
  if (!schedulesPanel) return;

  // Look for the alert with role="alert" and warning class
  const alert = schedulesPanel.querySelector('div[class*="dismissableCss-alertCss"]');

  if (alert) {
    debugLog('Course modification alert detected:', alert);

    // Check if the alert contains a Generate Schedules button
    const generateButton = alert.querySelector('div[class*="messageCss"]');
    // debugLog('Generate button:', generateButton);
    if (generateButton) {
      generateButton.textContent = 'You have modified your course settings or filters. Click Generate Schedules for your changes to take effect.';
      // debugLog('Generate button text:', generateButton.textContent);
    }

  }
}

// Function to beautify schedule results
function beautifySchedules(resultElement) {
  if (!resultElement) {
    debugLog('No result element found');
    return;
  }

  checkForCourseModificationAlert();

  resultElement = resultElement.nextElementSibling;
  if (!resultElement) {
    debugLog('No next sibling found');
    return;

  }
  debugLog('Beautifying schedule results:', resultElement);

  // Find all schedule rows in the result element
  const scheduleRows = resultElement.querySelectorAll('div[class*="rowCss"]');

  if (scheduleRows.length === 0) {
    debugLog('No schedule rows found to beautify');
    return;
  }

  debugLog(`Found ${scheduleRows.length} schedule rows to beautify`);

  // Enhance each schedule row in place
  scheduleRows.forEach((row, index) => {
    // Check if this row has already been enhanced
    if (!row.hasAttribute('data-enhanced')) {
      debugLog(`Enhancing schedule row ${index + 1}`);
      enhanceScheduleRow(row, index + 1);
      row.setAttribute('data-enhanced', 'true');
    }
  });

  // Look for and enhance the shuffle button
  enhanceShuffleButton(resultElement);

  debugLog('Schedule beautification complete');
}

// Function to enhance a single schedule row
function enhanceScheduleRow(row, scheduleNumber) {
  // Modernize the view button/link
  const viewLink = row.querySelector('a[aria-label*="View Schedule"]');
  if (viewLink) {
    enhanceViewButton(viewLink, scheduleNumber);
  }

  // Convert course string to badges
  const courseSpan = row.querySelector('span[class*="ScheduleColumn"]:last-child');
  if (courseSpan) {
    convertCoursesToBadges(courseSpan);
  }

  // Add hover effect to the entire row
  row.classList.add('beautified-schedule-row');
}

// Function to enhance the view button
function enhanceViewButton(viewLink, scheduleNumber) {
  // Add modern styling classes
  viewLink.classList.add('modern-view-button');

  // Update the text content and add an icon
  viewLink.textContent = 'View';

  // Ensure same-tab navigation
  viewLink.target = '_self';

  // Add click handler to prevent new tab opens
  viewLink.addEventListener('click', (e) => {
    if (e.ctrlKey || e.metaKey || e.button === 1) {
      e.preventDefault();
      alert('Please click normally to view the schedule. Opening in a new tab may cause session issues.');
      return false;
    }
  });
}

// Function to convert course string to individual badges
function convertCoursesToBadges(courseSpan) {
  const coursesText = courseSpan.textContent.trim();
  debugLog('Courses text:', coursesText);

  // return;
  if (!coursesText) return;

  // Split courses and create badges
  const courses = coursesText.split(', ');

  // Create container for badges
  const badgesContainer = document.createElement('div');
  badgesContainer.className = 'schedule-course-badges-container';

  courses.forEach(courseStr => {
    // Parse course string like "105-AGEC-504" to "AGEC 105-504"
    const parts = courseStr.split('-');
    const courseNumber = parts[0];
    const subject = parts[1];
    const section = parts[2];

    const badge = document.createElement('span');
    badge.className = 'schedule-course-badge';
    badge.textContent = `${subject} ${courseNumber}-${section}`;
    if (section) {
      badge.textContent = `${subject} ${courseNumber}-${section}`;
    } else {
      badge.textContent = `${courseNumber}`;
    }

    badgesContainer.appendChild(badge);
  });
  debugLog('Badges container:', badgesContainer);

  // Replace the original text with badges
  courseSpan.innerHTML = '';
  courseSpan.appendChild(badgesContainer);
}

// Function to enhance the shuffle button
function enhanceShuffleButton(container) {
  // Look for the shuffle button in the container and its parent elements
  const shuffleButton = container.querySelector('button[class*="shuffleCss"]') ||
    container.parentElement?.querySelector('button[class*="shuffleCss"]') ||
    document.querySelector('#schedules_panel button[class*="shuffleCss"]');

  if (shuffleButton && !shuffleButton.hasAttribute('data-shuffle-enhanced')) {
    debugLog('Found shuffle button, enhancing:', shuffleButton);

    // Add modern styling class
    shuffleButton.classList.add('modern-shuffle-button');

    // Mark as enhanced to prevent duplicate processing
    shuffleButton.setAttribute('data-shuffle-enhanced', 'true');

    // Add click event listener to re-beautify schedules after shuffle
    shuffleButton.addEventListener('click', () => {
      debugLog('Shuffle button clicked, setting up re-beautification');
      // Use a short delay to allow the shuffle to complete and DOM to update
      setTimeout(() => {
        reBeautifyScheduleResults();
      }, 50);
    });


    debugLog('Shuffle button enhanced successfully');
  } else if (!shuffleButton) {
    debugLog('No shuffle button found in container');
  } else {
    debugLog('Shuffle button already enhanced, skipping');
  }
}

// Flag to prevent recursive re-beautification
let isReBeautifying = false;

// Function to re-beautify schedule results after shuffle or pagination
function reBeautifyScheduleResults() {
  if (isReBeautifying) {
    debugLog('Re-beautification already in progress, skipping');
    return;
  }

  isReBeautifying = true;
  debugLog('Re-beautifying schedule results');

  const schedulesPanel = document.getElementById('schedules_panel');
  if (!schedulesPanel) {
    debugLog('Schedules panel not found for re-beautification');
    isReBeautifying = false;
    return;
  }

  // Find the results container (usually the third child)
  const resultElements = schedulesPanel.children;
  if (resultElements.length >= 3) {
    const resultElement = resultElements[2];

    // Remove previous beautification markers to allow re-processing
    removeBeautificationMarkers(resultElement);

    // Re-beautify the schedules immediately for faster visual updates
    beautifySchedules(resultElement);

    // Set up pagination click listeners without styling
    setupPaginationClickListeners();

    isReBeautifying = false;
  } else {
    debugLog('No schedule results found to re-beautify');
    isReBeautifying = false;
  }
}

// Function to remove beautification markers for re-processing
function removeBeautificationMarkers(container) {
  // Remove data-beautified attribute from the main container
  container.removeAttribute('data-beautified');

  // Remove data-enhanced attributes from schedule rows
  const scheduleRows = container.querySelectorAll('div[data-enhanced="true"]');
  scheduleRows.forEach(row => {
    row.removeAttribute('data-enhanced');
  });

  // Remove modern classes to allow re-styling
  const modernButtons = container.querySelectorAll('.modern-view-button');
  modernButtons.forEach(button => {
    button.classList.remove('modern-view-button');
  });

  // Remove beautified row classes
  const beautifiedRows = container.querySelectorAll('.beautified-schedule-row');
  beautifiedRows.forEach(row => {
    row.classList.remove('beautified-schedule-row');
  });

  // Reset shuffle button enhancement marker to allow re-processing
  const shuffleButtons = container.querySelectorAll('button[data-shuffle-enhanced]');
  shuffleButtons.forEach(button => {
    button.removeAttribute('data-shuffle-enhanced');
  });

  // DON'T remove pagination button markers - they should persist across re-beautifications

  debugLog('Removed beautification markers for re-processing (preserved pagination enhancements)');
}

// Function to enhance pagination buttons
function enhancePaginationButtons() {
  const paginationContainer = document.querySelector('ul[class*="pagerCss"]');

  if (!paginationContainer) {
    debugLog('No pagination container found');
    return;
  }

  if (!paginationContainer.classList.contains('modern-pagination-container')) {
    paginationContainer.classList.add('modern-pagination-container');
  }

  setupPaginationClickListeners();
}

// Function to setup pagination click listeners without styling
function setupPaginationClickListeners() {
  const paginationContainer = document.querySelector('ul[class*="pagerCss"]');

  if (!paginationContainer) {
    debugLog('No pagination container found');
    return;
  }

  // Only add listeners to buttons that don't have them yet
  const paginationButtons = paginationContainer.querySelectorAll('button:not([data-pagination-listener])');

  debugLog(`Found ${paginationButtons.length} pagination buttons for click listeners`);

  paginationButtons.forEach(button => {
    // Mark as having a listener to prevent duplicates
    button.setAttribute('data-pagination-listener', 'true');

    // Add click event listener to ALL buttons (disabled ones will become enabled)
    button.addEventListener('click', () => {
      // Only process if button is not disabled at click time
      if (!button.disabled) {
        debugLog('Pagination button clicked, setting up re-beautification');
        // Immediate re-beautification for faster response
        setTimeout(() => {
          reBeautifyScheduleResults();
        }, 1);
      }
    });
  });

  debugLog('Set up pagination click listeners');
}

// Load schedule-specific CSS
async function loadScheduleCSS() {
  const css = `
    .schedule-container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      overflow: hidden;
    }

    .schedule-header {
      background-color: #500000;
      color: white;
      padding: 12px 16px;
      font-size: 1.1em;
      font-weight: bold;
      text-align: center;
    }

    .schedule-list {
      padding: 16px;
    }

    .schedule-item {
      background: #fff;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      margin-bottom: 8px;
      padding: 12px;
      transition: all 0.2s ease;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .schedule-item:hover {
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      border-color: #500000;
    }

    .schedule-item-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
      flex-wrap: wrap;
      gap: 8px;
    }

    .schedule-item-main {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
      min-width: 0;
    }

    .schedule-checkbox {
      width: 18px;
      height: 18px;
      cursor: pointer;
      flex-shrink: 0;
    }

    .status-enrolled {
      background-color: #d4edda;
      color: #155724;
      padding: 2px 6px;
      border-radius: 10px;
      font-size: 0.7em;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 3px;
      flex-shrink: 0;
    }

    .status-icon {
      width: 12px;
      height: 12px;
      background-color: #28a745;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 8px;
    }

    .course-identifier {
      font-weight: 600;
      font-size: 1em;
      color: #333;
      white-space: nowrap;
    }

    .course-crn-schedule {
      color: #666;
      font-size: 0.85em;
      margin-left: 8px;
    }

    .course-credits {
      background-color: #e9ecef;
      color: #495057;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.8em;
      font-weight: 600;
      white-space: nowrap;
    }

    .instruction-mode {
      background-color: #f8f9fa;
      color: #495057;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.75em;
      border: 1px solid #dee2e6;
      white-space: nowrap;
    }

    .seats-indicator {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.75em;
      font-weight: 600;
      white-space: nowrap;
      border: 1px solid;
    }

    .seats-indicator.seats-available {
      background-color: #d4edda;
      color: #155724;
      border-color: #c3e6cb;
    }

    .seats-indicator.seats-limited {
      background-color: #fff3cd;
      color: #856404;
      border-color: #ffeaa7;
    }

    .seats-indicator.seats-full {
      background-color: #f8d7da;
      color: #721c24;
      border-color: #f5c6cb;
    }

    .seats-icon {
      font-size: 0.9em;
      font-weight: bold;
    }

    .seats-text {
      font-size: 1em;
    }

    .schedule-actions {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .details-button {
      background-color: #6c757d;
      color: white;
      border: none;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.75em;
      cursor: not-allowed;
      opacity: 0.6;
      transition: all 0.2s ease;
      white-space: nowrap;
    }

    .details-button:disabled {
      background-color: #6c757d;
      cursor: not-allowed;
      opacity: 0.6;
    }

    .details-button:not(:disabled) {
      background-color: #500000;
      cursor: pointer;
      opacity: 1;
    }

    .details-button:not(:disabled):hover {
      background-color: #500000;
    }

    .schedule-times {
      font-size: 0.85em;
      line-height: 1.4;
      margin-bottom: 8px;
      color: #333;
    }

    .schedule-meeting-times {
      display: flex;
      flex-direction: row;
      gap: 8px;
      background-color: #f8f9fa;
      overflow-x: auto;
      padding: 5px;
      border-radius: 4px;
      margin-bottom: 8px;
    }

    .schedule-meeting-time {
      background-color: #ffffff;
      border-left: 3px solid #500000;
      padding: 8px 10px;
      font-size: 0.85em;
      white-space: nowrap;
      flex-shrink: 0;
      border-radius: 4px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      min-width: fit-content;
    }

    .schedule-meeting-times::-webkit-scrollbar {
      height: 6px;
    }

    .schedule-meeting-times::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 3px;
    }

    .schedule-meeting-times::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 3px;
    }

    .schedule-meeting-times::-webkit-scrollbar-thumb:hover {
      background: #a8a8a8;
    }

    .location-link {
      color: #007bff;
      text-decoration: none;
      font-weight: 500;
      margin-left: 4px;
    }

    .location-link:hover {
      text-decoration: underline;
    }

    .more-times {
      color: #500000;
      font-size: 0.8em;
      cursor: pointer;
      font-weight: 500;
    }

    .instructor-info {
      padding-top: 8px;
      border-top: 1px solid #e9ecef;
      font-size: 0.85em;
      color: #666;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
    }

    .instructor-name {
      font-weight: 500;
    }

    .schedule-course-badges {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
    }

    .schedule-course-badge {
      padding: 1px 5px;
      border-radius: 3px;
      font-size: 0.9em;
      font-weight: 600;
      color: white;
    }
    
    .add-course-badge {
      padding: 2px 5px;
      margin-right: 2px;
      border-radius: 3px;
      font-size: 0.85em;
      font-weight: 600;
      color: white;
      margin-bottom: 2px;
    }

    .badge-prerequisites {
      background-color: #28a745;
    }

    .badge-restrictions {
      background-color: #dc3545;
    }

    @media (max-width: 768px) {
      .schedule-item-header {
        flex-direction: column;
        align-items: stretch;
      }
      
      .schedule-item-main {
        justify-content: space-between;
      }
      
      .schedule-actions {
        justify-content: flex-end;
      }
    }

    .expanded-details {
      margin-top: 12px;
      padding: 16px;
      background-color: #f8f9fa;
      border-radius: 6px;
      border: 1px solid #dee2e6;
      font-size: 0.9em;
    }

    .expanded-details .extended-details-container {
      margin: 0;
    }

    .expanded-details h4 {
      color: #333;
      margin-top: 0;
      margin-bottom: 8px;
      font-size: 1em;
      font-weight: 600;
    }

    .expanded-details .detail-section {
      margin-bottom: 16px;
    }

    .expanded-details .detail-grid {
      display: grid;
      gap: 8px;
    }

    .expanded-details .detail-row {
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }

    .expanded-details .extended-label {
      font-weight: 600;
      color: #495057;
      min-width: 120px;
      flex-shrink: 0;
    }

    .expanded-details .extended-value {
      color: #333;
      flex: 1;
    }

    .expanded-details .section-attribute {
      background-color: #e9ecef;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 0.8em;
      margin-right: 4px;
    }

    .expanded-details .section-fees-container {
      background-color: white;
      padding: 8px;
      border-radius: 4px;
      border: 1px solid #dee2e6;
      font-size: 0.85em;
    }

    .expanded-details .meeting-time {
      background-color: white;
      padding: 6px 8px;
      border-radius: 4px;
      border-left: 3px solid #500000;
      margin-bottom: 4px;
      font-size: 0.85em;
    }




    /* Section Fees Table Styles */
    .modern-table-container {
        margin-top: 8px;
    }

    .modern-table-container table {
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        border-radius: 4px;
        overflow: hidden;
    }

    .modern-table-container table thead{
        background-color: #f5f5f5;
    }

    .modern-table-container table th,
    .modern-table-container table tr td:first-child {
        padding: 8px 8px;
        text-align: left;
        font-weight: 600;
        // border-bottom: 2px solid #e0e0e0;
        color: #444;
    }

    .modern-table-container table tbody tr:last-child {
        padding-bottom: 4px;
    }

    .modern-table-container table tr:last-child td:last-child {
        padding: 3px 0px 0px 0px;
        color: #333;
    }

    .modern-table-container table tr:last-child td {
        border-bottom: none;
+        padding-bottom: 12px; /* Add spacing under the last row */
    }

    .add-course-table table tbody:hover {
        background-color: #f9f9f9;
    }
    
    .add-break-table table tbody tr:hover {
        background-color: #f9f9f9;
    }

    /* For responsive tables on smaller screens */
    @media screen and (max-width: 600px) {
        .modern-table-container table {
            display: block;
            overflow-x: auto;
        }
    }

     /* Modern Generate Schedules Button */
     .modern-generate-button {
         background: linear-gradient(135deg, #500000 0%, #700000 100%);
         color: white;
         border: none;
         padding: 8px 16px;
         border-radius: 8px;
         font-size: 14px;
         font-weight: 600;
         cursor: pointer;
         transition: all 0.3s ease;
         box-shadow: 0 4px 12px rgba(80, 0, 0, 0.3);
         display: inline-flex;
         align-items: center;
         gap: 8px;
         text-transform: none;
         letter-spacing: 0.5px;
         min-width: 180px;
         justify-content: center;
     }

     .modern-generate-button:hover {
         background: linear-gradient(135deg, #600000 0%, #800000 100%);
         transform: translateY(-2px);
         box-shadow: 0 6px 20px rgba(80, 0, 0, 0.4);
     }

     .modern-generate-button:active {
         transform: translateY(0px);
         box-shadow: 0 2px 8px rgba(80, 0, 0, 0.3);
     }

     .modern-generate-button:focus {
         outline: none;
         box-shadow: 0 4px 12px rgba(80, 0, 0, 0.3), 0 0 0 3px rgba(80, 0, 0, 0.2);
     }

     /* Loading state for the button */
     .modern-generate-button.loading {
         pointer-events: none;
         opacity: 0.8;
     }

     .modern-generate-button.loading::after {
         content: "";
         width: 16px;
         height: 16px;
         border: 2px solid transparent;
         border-top: 2px solid white;
         border-radius: 50%;
         animation: spin 1s linear infinite;
         margin-left: 8px;
     }

     @keyframes spin {
         0% { transform: rotate(0deg); }
         100% { transform: rotate(360deg); }
     }

     /* Select All Checkbox Styles */
     .schedule-header {
         background-color: #f8f9fa;
         border: 1px solid #dee2e6;
         padding: 12px 16px;
         margin-bottom: 8px;
         border-radius: 6px 6px;
     }

     .select-all-container {
         display: flex;
         align-items: center;
         gap: 8px;
     }

     .select-all-checkbox {
         width: 18px;
         height: 18px;
         cursor: pointer;
     }

     .select-all-label {
         margin: 0;
         font-weight: 600;
         color: #333;
         cursor: pointer;
         font-size: 14px;
         user-select: none;
     }

     .select-all-label:hover {
         color: #500000;
     }

     /* Schedule Generation Response Styles */
     .schedule-warnings-container {
         background-color: #fff3cd;
         border: 1px solid #ffeaa7;
         border-radius: 8px;
         padding: 20px;
         margin: 16px 0;
     }

     .warnings-header {
         color: #856404;
         margin: 0 0 16px 0;
         font-size: 1.2em;
         font-weight: 600;
     }

     .schedule-warning {
         display: flex;
         align-items: flex-start;
         gap: 12px;
         margin-bottom: 12px;
         padding: 12px;
         background-color: white;
         border-radius: 6px;
         border-left: 4px solid #ffc107;
     }

     .warning-icon {
         font-size: 20px;
         flex-shrink: 0;
     }

     .warning-content {
         flex: 1;
     }

     .warning-type {
         font-weight: 600;
         color: #856404;
         margin-bottom: 4px;
     }

     .warning-message {
         color: #664d03;
         line-height: 1.4;
     }

     .try-again-button {
         background-color: #6c757d;
         color: white;
         border: none;
         padding: 8px 16px;
         border-radius: 6px;
         cursor: pointer;
         font-weight: 600;
         margin-top: 16px;
         transition: background-color 0.3s ease;
     }

     .try-again-button:hover {
         background-color: #5a6268;
     }

     /* Schedules Display Styles */
     .schedules-display-container {
         margin: 16px 0;
     }

     .schedules-header {
         color: #333;
         margin: 0 0 20px 0;
         font-size: 1.3em;
         font-weight: 600;
         text-align: center;
     }

     .schedules-list-container {
         margin-bottom: 20px;
     }

     .schedule-option {
         background: white;
         border: 1px solid #dee2e6;
         border-radius: 8px;
         margin-bottom: 16px;
         overflow: hidden;
         transition: all 0.3s ease;
         box-shadow: 0 2px 4px rgba(0,0,0,0.1);
     }

     .schedule-option:hover {
         box-shadow: 0 4px 12px rgba(0,0,0,0.15);
         border-color: #500000;
     }

     .schedule-option .schedule-header {
         background: linear-gradient(135deg, #500000 0%, #700000 100%);
         color: white;
         padding: 16px 20px;
         display: flex;
         justify-content: space-between;
         align-items: center;
         margin-bottom: 0;
         border-radius: 0;
         border: none;
     }

     .schedule-option .schedule-header h4 {
         margin: 0;
         font-size: 1.1em;
         font-weight: 600;
     }

     .schedule-actions {
         display: flex;
         gap: 8px;
     }

     .view-schedule-btn,
     .select-schedule-btn {
         background: rgba(255, 255, 255, 0.2);
         color: white;
         border: 1px solid rgba(255, 255, 255, 0.3);
         padding: 6px 12px;
         border-radius: 4px;
         cursor: pointer;
         font-size: 0.85em;
         font-weight: 500;
         transition: all 0.3s ease;
     }

     .view-schedule-btn:hover,
     .select-schedule-btn:hover {
         background: rgba(255, 255, 255, 0.3);
         border-color: rgba(255, 255, 255, 0.5);
     }

     .select-schedule-btn {
         background: rgba(40, 167, 69, 0.8);
         border-color: rgba(40, 167, 69, 0.9);
     }

     .select-schedule-btn:hover {
         background: rgba(40, 167, 69, 1);
         border-color: rgba(40, 167, 69, 1);
     }

     .schedule-summary {
         padding: 16px 20px;
         display: flex;
         justify-content: space-between;
         align-items: center;
         background-color: #f8f9fa;
         border-bottom: 1px solid #dee2e6;
     }

     .schedule-courses,
     .schedule-credits {
         font-size: 0.9em;
         color: #495057;
     }

     .schedule-details {
         padding: 20px;
         background-color: #f8f9fa;
         border-top: 1px solid #dee2e6;
     }

     .schedule-details-content {
         background-color: white;
         padding: 16px;
         border-radius: 6px;
         border: 1px solid #dee2e6;
     }

     .schedule-details-content h5 {
         margin: 0 0 12px 0;
         color: #333;
         font-weight: 600;
     }

     .schedule-details-content pre {
         background-color: #f8f9fa;
         padding: 12px;
         border-radius: 4px;
         font-size: 0.8em;
         overflow-x: auto;
         margin: 0;
         color: #495057;
     }

     /* Pagination Styles */
     .schedules-pagination {
         display: flex;
         justify-content: center;
         align-items: center;
         gap: 16px;
         margin: 20px 0;
     }

     .pagination-btn {
         background-color: #500000;
         color: white;
         border: none;
         padding: 8px 16px;
         border-radius: 6px;
         cursor: pointer;
         font-weight: 600;
         transition: all 0.3s ease;
         min-width: 100px;
     }

     .pagination-btn:hover:not(:disabled) {
         background-color: #700000;
         transform: translateY(-1px);
     }

     .pagination-btn:disabled {
         background-color: #6c757d;
         cursor: not-allowed;
         opacity: 0.6;
         transform: none;
     }

     .pagination-info {
         font-weight: 600;
         color: #495057;
         padding: 8px 16px;
         background-color: #f8f9fa;
         border-radius: 6px;
         border: 1px solid #dee2e6;
     }

     /* No Schedules Message Styles */
     .no-schedules-container {
         text-align: center;
         padding: 40px 20px;
         background-color: #f8f9fa;
         border-radius: 8px;
         margin: 20px 0;
     }

     .no-schedules-icon {
         font-size: 48px;
         margin-bottom: 16px;
     }

     .no-schedules-container h3 {
         color: #495057;
         margin: 0 0 12px 0;
         font-size: 1.3em;
     }

     .no-schedules-container p {
         color: #6c757d;
         margin: 0 0 20px 0;
         font-size: 1em;
     }

     /* Responsive design for schedule displays */
     @media (max-width: 768px) {
         .schedule-option .schedule-header {
             flex-direction: column;
             gap: 12px;
             align-items: stretch;
         }

         .schedule-actions {
             justify-content: center;
         }

         .schedule-summary {
             flex-direction: column;
             gap: 8px;
             align-items: stretch;
         }

         .schedules-pagination {
             flex-direction: column;
             gap: 12px;
         }

         .pagination-btn {
             min-width: auto;
         }
    }

    /* Additional styles for beautified schedules */
    .schedule-selection {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .schedule-selection label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.9em;
      color: #495057;
      margin: 0;
      cursor: pointer;
    }

    .schedule-select-checkbox {
      width: 16px;
      height: 16px;
      cursor: pointer;
    }

    .schedule-summary {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      background-color: #f8f9fa;
      border-bottom: 1px solid #dee2e6;
      flex-wrap: wrap;
      gap: 12px;
    }

    .schedule-courses {
      flex: 1;
      min-width: 0;
    }

    .schedule-selection {
      flex-shrink: 0;
    }

    /* Improve the schedule option cards */
    .schedule-option {
      background: white;
      border: 1px solid #dee2e6;
      border-radius: 8px;
      margin-bottom: 16px;
      overflow: hidden;
      transition: all 0.3s ease;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .schedule-option:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      border-color: #500000;
    }

    /* Styles for enhanced schedule rows */
    .beautified-schedule-row {
      /* transition: all 0.3s ease; */
      /* padding: 12px; */
      border-radius: 8px;
      margin-bottom: 5px;
      background-color: #fff;
      border: 1px solid #e9ecef;
    }

    #schedules_panel input {
      width: 16px;
      height: 16px;
      cursor: pointer;
      margin: 0px;
    }

    .beautified-schedule-row:hover {
      background-color: #f8f9fa;
      border-color: #500000;
      box-shadow: 0 2px 8px rgba(80, 0, 0, 0.1);
    }

    /* Modern view button styles */
    .modern-view-button {
      background: linear-gradient(135deg, #500000 0%, #700000 100%);
      color: white !important;
      border: none;
      padding: 4px 16px;
      margin-left: 10px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      transition: all 0.3s ease;
      box-shadow: 0 2px 6px rgba(80, 0, 0, 0.2);
    }

    .modern-view-button:hover {
      background: linear-gradient(135deg, #600000 0%, #800000 100%);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(80, 0, 0, 0.3);
      color: white !important;
      text-decoration: none;
    }

    .modern-view-button:active {
      transform: translateY(0px);
      box-shadow: 0 1px 4px rgba(80, 0, 0, 0.2);
    }

    .modern-view-button svg {
      opacity: 0.9;
    }

    /* Course badges container */
    .schedule-course-badges-container {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 4px;
    }

    /* Individual course badge styles */
    .schedule-course-badge {
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      color: #495057;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      border: 1px solid #dee2e6;
      display: inline-block;
      transition: all 0.2s ease;
      white-space: nowrap;
    }

    .schedule-course-badge:hover {
      background: linear-gradient(135deg, #500000 0%, #700000 100%);
      color: white;
      border-color: #500000;
      transform: translateY(-1px);
      box-shadow: 0 2px 6px rgba(80, 0, 0, 0.2);
    }

    /* Responsive adjustments for schedule enhancements */
    @media (max-width: 768px) {
      .schedule-course-badges-container {
        gap: 4px;
      }

      .schedule-course-badge {
        font-size: 11px;
        padding: 3px 8px;
      }

      .modern-view-button {
        padding: 6px 12px;
        font-size: 13px;
      }

              .beautified-schedule-row {
          padding: 8px;
        }
      }

    /* Modern shuffle button styles */
    .modern-shuffle-button {
      background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
      color: white !important;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: all 0.3s ease;
      box-shadow: 0 2px 6px rgba(108, 117, 125, 0.3);
      cursor: pointer;
      // margin: 8px 0;
    }

    .modern-shuffle-button:hover {
      background: linear-gradient(135deg, #5a6268 0%, #343a40 100%);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(108, 117, 125, 0.4);
      color: white !important;
    }

    .modern-shuffle-button:active {
      transform: translateY(0px);
      box-shadow: 0 1px 4px rgba(108, 117, 125, 0.3);
    }

    .modern-shuffle-button svg {
      opacity: 0.9;
      flex-shrink: 0;
    }

    .modern-shuffle-button .css-1q6wcnd-innerStyle {
      margin: 0;
      font-weight: 600;
    }

    /* Focus styles for accessibility */
    .modern-shuffle-button:focus {
      outline: none;
      box-shadow: 0 2px 6px rgba(108, 117, 125, 0.3), 0 0 0 3px rgba(108, 117, 125, 0.2);
    }

    /* Modern pagination button styles */
    .modern-pagination-container button {
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      color: #495057 !important;
      border: 1px solid #dee2e6;
      padding: 6px 12px;
      margin: 0 2px;
      border-radius: 4px;
      font-size: 13px;
      font-weight: 500;
      transition: all 0.3s ease;
      cursor: pointer;
      min-width: 40px;
      height: 32px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .modern-pagination-container button:hover:not(:disabled) {
      background: linear-gradient(135deg, #500000 0%, #700000 100%);
      color: white !important;
      border-color: #500000;
      transform: translateY(-1px);
      box-shadow: 0 2px 6px rgba(80, 0, 0, 0.2);
    }

    .modern-pagination-container button:disabled {
      background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%);
      color: #adb5bd !important;
      cursor: not-allowed;
      opacity: 0.6;
    }

    .modern-pagination-container button:active {
      transform: translateY(0px);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    /* Active pagination button (current page) */
    li.active .modern-pagination-container button {
      background: linear-gradient(135deg, #500000 0%, #700000 100%);
      color: white !important;
      border-color: #500000;
      font-weight: 600;
      cursor: default;
    }

    /* Focus styles for pagination buttons */
    .modern-pagination-container button:focus {
      outline: none;
      box-shadow: 0 0 0 3px rgba(80, 0, 0, 0.2);
    }
  `;

  const styleElement = document.createElement("style");
  styleElement.textContent = css;
  styleElement.setAttribute("data-extension-css", "schedule");
  document.head.appendChild(styleElement);
}

