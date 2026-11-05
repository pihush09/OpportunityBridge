/**
 * OpportunityBridge Centralized API Service
 */

const BASE_URL = '/api';

export async function checkHealth() {
  try {
    const res = await fetch(`${BASE_URL}/health`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    return { status: 'error', error: err.message };
  }
}

export async function getSystemStatus() {
  try {
    const res = await fetch(`${BASE_URL}/status`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    return { status: 'error', error: err.message };
  }
}

export async function reloadData() {
  try {
    const res = await fetch(`${BASE_URL}/reload-data`, { method: 'POST' });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function getStats() {
  try {
    const res = await fetch(`${BASE_URL}/stats`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    return {
      totalOpportunities: 0,
      matchedOpportunities: 0,
      savedOpportunities: 0,
      upcomingDeadlines: 0,
      urgentDeadlines: 0
    };
  }
}

export async function getProfile() {
  try {
    const res = await fetch(`${BASE_URL}/profile`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function updateProfile(profileData) {
  try {
    const res = await fetch(`${BASE_URL}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData)
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function getOpportunities(filters = {}) {
  try {
    const query = new URLSearchParams();
    if (filters.category && filters.category !== 'all') query.append('category', filters.category);
    if (filters.search) query.append('search', filters.search);
    if (filters.location && filters.location !== 'all') query.append('location', filters.location);
    if (filters.remote) query.append('remote', 'true');

    const res = await fetch(`${BASE_URL}/opportunities?${query.toString()}`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    return [];
  }
}

export async function getOpportunityById(id) {
  try {
    const res = await fetch(`${BASE_URL}/opportunities/${id}`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function getSavedOpportunities() {
  try {
    const res = await fetch(`${BASE_URL}/saved`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    return [];
  }
}

export async function saveOpportunity(id, payload = {}) {
  try {
    const res = await fetch(`${BASE_URL}/saved/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function removeSavedOpportunity(id) {
  try {
    const res = await fetch(`${BASE_URL}/saved/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function getMatches() {
  try {
    const res = await fetch(`${BASE_URL}/matches`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    return [];
  }
}

export async function getDeadlines() {
  try {
    const res = await fetch(`${BASE_URL}/deadlines`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    return { urgent: [], upcoming: [], rolling: [], expired: [] };
  }
}

// --- Switch Multi-Agent Workflows ---
export async function requestSwitchOpportunities(criteria = {}) {
  try {
    const res = await fetch(`${BASE_URL}/switch/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(criteria)
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function syncSwitchOpportunities(filename = null) {
  try {
    const res = await fetch(`${BASE_URL}/switch/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(filename ? { filename } : {})
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function getAvailableShortlists() {
  try {
    const res = await fetch(`${BASE_URL}/switch/available-shortlists`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    return [];
  }
}

export async function getSwitchLogs() {
  try {
    const res = await fetch(`${BASE_URL}/switch/logs`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    return [];
  }
}

export async function getSwitchHistory(limit = 15) {
  try {
    const res = await fetch(`${BASE_URL}/switch/history?limit=${limit}`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    return { events: [], error: err.message };
  }
}
