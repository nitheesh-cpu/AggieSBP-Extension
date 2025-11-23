import { debugLog } from '../utils/debug';

/**
 * Show loading screen
 */
export function showLoadingScreen(): void {
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
          <svg xmlns="http://www.w3.org/2000/svg" id="Layer_1" data-name="Layer 1" viewBox="0 0 216 216" style="margin-top: 5px;">
            <defs><style>.cls-1{fill:#fff;display:block}</style></defs>
            <title>A&M Logo</title>
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

/**
 * Hide loading screen
 */
export function hideLoadingScreen(): void {
  const loadingOverlay = document.getElementById('aggie-beautifier-loading');
  if (loadingOverlay) {
    loadingOverlay.classList.add('loading-fade-out');
    setTimeout(() => {
      loadingOverlay.remove();
      debugLog('Loading screen removed');
    }, 500);
  }
}

