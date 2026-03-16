import { EXTERNAL_API_BASE } from '../config/constants';
import { debugLog, errorLog } from '../utils/debug';

interface TrackingResponse<T = any> {
  ok: boolean;
  status: number;
  data: T | null;
}

async function apiRequest<T = any>(path: string, init: RequestInit): Promise<TrackingResponse<T>> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({
      type: 'API_TRACKING_FETCH',
      payload: {
        url: `${EXTERNAL_API_BASE}${path}`,
        options: {
          ...init,
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            ...(init.headers || {}),
          }
        }
      }
    }, (response) => {
      if (chrome.runtime.lastError || !response) {
        errorLog('Tracking API proxy request failed', path, chrome.runtime.lastError);
        resolve({ ok: false, status: 0, data: null });
      } else {
        resolve(response as TrackingResponse<T>);
      }
    });
  });
}

export async function trackSection(sectionId: string, termCode: string): Promise<boolean> {
  debugLog('Tracking section from extension', sectionId, termCode);
  const res = await apiRequest('/users/tracking', {
    method: 'POST',
    body: JSON.stringify({ section_id: sectionId, term_code: termCode }),
  });

  if (!res.ok) {
    if (res.status === 401) {
      errorLog('User not authenticated with AggieSB+ when tracking section');
    } else {
      errorLog('Failed to track section', sectionId, res.status);
    }
  }

  return res.ok;
}

export async function untrackSection(sectionId: string): Promise<boolean> {
  debugLog('Untracking section from extension', sectionId);
  const res = await apiRequest(`/users/tracking/${encodeURIComponent(sectionId)}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    errorLog('Failed to untrack section', sectionId, res.status);
  }

  return res.ok;
}

export interface TrackedSection {
  section_id: string;
  term_code: string;
}

export async function getTrackedSections(): Promise<TrackedSection[]> {
  const res = await apiRequest<TrackedSection[]>('/users/tracking', {
    method: 'GET',
  });

  if (!res.ok || !Array.isArray(res.data)) {
    errorLog('Failed to get tracked sections', res.status);
    return [];
  }

  return res.data;
}

