import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'opportunitybridge_db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const defaultSchema = {
  profiles: {},
  opportunities: {},
  saved_applications: {},
  switch_sync_logs: [],
  dispatched_requests: []
};

class LocalDatabase {
  constructor(filePath) {
    this.filePath = filePath;
    this.data = this._load();
  }

  _load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        return { ...defaultSchema, ...JSON.parse(raw) };
      }
    } catch (err) {
      console.error('[Database] Warning: Could not parse database file. Initializing default.', err.message);
    }
    return JSON.parse(JSON.stringify(defaultSchema));
  }

  _save() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[Database] Error saving database to file:', err.message);
    }
  }

  // --- Profiles Table ---
  getProfile() {
    this.data = this._load();
    const keys = Object.keys(this.data.profiles);
    if (keys.length === 0) return null;
    return this.data.profiles[keys[0]];
  }

  upsertProfile(profile) {
    this.data = this._load();
    const id = profile.id || 'default_student';
    const existing = this.data.profiles[id] || {};
    this.data.profiles[id] = {
      ...existing,
      ...profile,
      id,
      updated_at: new Date().toISOString()
    };
    this._save();
    return this.data.profiles[id];
  }

  // --- Opportunities Table ---
  getOpportunities(filterFn = null) {
    this.data = this._load();
    const list = Object.values(this.data.opportunities);
    if (!filterFn) return list;
    return list.filter(filterFn);
  }

  getOpportunityById(id) {
    this.data = this._load();
    return this.data.opportunities[id] || null;
  }

  upsertOpportunities(items) {
    this.data = this._load();
    let count = 0;
    for (const item of items) {
      const id = item.id || `${item.organization || 'org'}-${item.title || 'opp'}`
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-');

      const existing = this.data.opportunities[id] || {};
      this.data.opportunities[id] = {
        ...existing,
        ...item,
        id,
        created_at: existing.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      count++;
    }
    this._save();
    return count;
  }

  insertNewOpportunities(items) {
    this.data = this._load();
    let inserted = 0;
    for (const item of items) {
      const id = item.id || `${item.organization || 'org'}-${item.title || 'opp'}`
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-');

      if (!this.data.opportunities[id]) {
        this.data.opportunities[id] = {
          ...item,
          id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        inserted++;
      }
    }
    this._save();
    return inserted;
  }

  countOpportunities() {
    this.data = this._load();
    return Object.keys(this.data.opportunities).length;
  }

  // --- Saved Applications Table ---
  getSavedApplications() {
    this.data = this._load();
    return Object.values(this.data.saved_applications);
  }

  getSavedApplication(opportunityId) {
    this.data = this._load();
    return this.data.saved_applications[opportunityId] || null;
  }

  saveApplication(opportunityId, payload = {}) {
    this.data = this._load();
    const opp = this.data.opportunities[opportunityId];
    if (!opp) {
      throw new Error(`Opportunity ${opportunityId} not found`);
    }

    const existing = this.data.saved_applications[opportunityId] || {};
    const defaultChecklist = {
      resume: false,
      sop: false,
      portfolio: false,
      transcripts: false
    };

    const updatedChecklist = payload.checklist_progress !== undefined
      ? { ...(existing.checklist_progress || defaultChecklist), ...payload.checklist_progress }
      : (existing.checklist_progress || defaultChecklist);

    this.data.saved_applications[opportunityId] = {
      id: opportunityId,
      opportunity_id: opportunityId,
      profile_id: 'default_student',
      status: payload.status || existing.status || 'saved',
      notes: payload.notes !== undefined ? payload.notes : (existing.notes || ''),
      checklist_progress: updatedChecklist,
      saved_at: existing.saved_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      opportunity: opp
    };
    this._save();
    return this.data.saved_applications[opportunityId];
  }

  removeSavedApplication(opportunityId) {
    this.data = this._load();
    if (this.data.saved_applications[opportunityId]) {
      delete this.data.saved_applications[opportunityId];
      this._save();
      return true;
    }
    return false;
  }

  countSavedApplications() {
    this.data = this._load();
    return Object.keys(this.data.saved_applications).length;
  }

  // --- Switch Sync Logs Table ---
  logSwitchSync(event) {
    this.data = this._load();
    const entry = {
      id: `sync-${Date.now()}`,
      event_type: event.type || 'SYNC',
      agent_name: event.agent || 'bridge-coordinator',
      item_count: event.itemCount || 0,
      status: event.status || 'SUCCESS',
      details: event.details || '',
      created_at: new Date().toISOString()
    };
    this.data.switch_sync_logs.unshift(entry);
    // Keep last 50 logs
    if (this.data.switch_sync_logs.length > 50) {
      this.data.switch_sync_logs = this.data.switch_sync_logs.slice(0, 50);
    }
    this._save();
    return entry;
  }

  getSwitchSyncLogs() {
    this.data = this._load();
    return this.data.switch_sync_logs;
  }

  // --- Dispatched Discovery Requests Table ---
  getDispatchedRequests() {
    this.data = this._load();
    return this.data.dispatched_requests || [];
  }

  recordDispatchedRequest(requestData) {
    this.data = this._load();
    if (!Array.isArray(this.data.dispatched_requests)) {
      this.data.dispatched_requests = [];
    }
    const entry = {
      id: `req-${Date.now()}`,
      normalized_query: requestData.normalizedQuery,
      query: requestData.query || '',
      student_name: requestData.studentName || '',
      branch: requestData.branch || '',
      year: requestData.year || 0,
      deliverable: requestData.deliverable || '',
      status: requestData.status || 'DISPATCHED',
      timestamp: new Date().toISOString()
    };
    this.data.dispatched_requests.unshift(entry);
    if (this.data.dispatched_requests.length > 50) {
      this.data.dispatched_requests = this.data.dispatched_requests.slice(0, 50);
    }
    this._save();
    return entry;
  }
}

let dbInstance = null;

export function getDatabase() {
  if (!dbInstance) {
    dbInstance = new LocalDatabase(DB_FILE);
  }
  return dbInstance;
}

export function initDatabase() {
  const db = getDatabase();
  console.log(`[Database] File-backed relational database initialized at: ${DB_FILE}`);
  return db;
}
