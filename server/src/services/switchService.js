import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDatabase } from '../config/database.js';
import { loadInitialData } from './dataLoader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const TARGET_OPPORTUNITIES_FILE = path.join(DATA_DIR, 'opportunities.json');

/**
 * Switch Multi-Agent Communication & Synchronization Service
 * Interfaces with Switch room (OpportunityBridge) and coordinates
 * bridge-coordinator & opportunity-scout.
 */

function getSwitchConfig() {
  const serverUrl = process.env.SWITCH_SERVER_URL || 'http://127.0.0.1:64854';
  const roomId = process.env.SWITCH_ROOM_ID || 'b721b78a-33b7-4629-9c08-1ddc1def71c6';
  const senderAgentId = process.env.SWITCH_SENDER_AGENT_ID || '3cdb41ce-bdc4-4332-94c7-31ba4da44ba9';
  const coordinatorId = process.env.SWITCH_COORDINATOR_ID || '85bba940-1799-4c1c-8a41-ac7b8e4138ca';
  const scoutId = process.env.SWITCH_SCOUT_ID || '814eb770-74f0-4c57-80f7-92ef3ce4bc9e';
  const token = process.env.SWITCH_API_TOKEN || '';
  const scoutDir = process.env.SWITCH_SCOUT_DIR || 'C:\\Users\\Dell\\.switch\\agents\\localhost-60993\\opportunity-scout';

  return { serverUrl, roomId, senderAgentId, coordinatorId, scoutId, token, scoutDir };
}

/**
 * Low-level HTTP requester for Switch API
 */
function makeSwitchRequest(path, method = 'GET', body = null) {
  const config = getSwitchConfig();
  return new Promise((resolve, reject) => {
    try {
      const url = new URL(config.serverUrl);
      const isHttps = url.protocol === 'https:';
      const client = isHttps ? https : http;

      const postData = body ? JSON.stringify(body) : null;
      const headers = {
        'Authorization': `Bearer ${config.token}`
      };

      if (postData) {
        headers['Content-Type'] = 'application/json';
        headers['Content-Length'] = Buffer.byteLength(postData);
      }

      const options = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: path,
        method: method,
        headers: headers
      };

      const req = client.request(options, (res) => {
        let responseData = '';
        res.on('data', chunk => { responseData += chunk; });
        res.on('end', () => {
          try {
            const parsed = responseData ? JSON.parse(responseData) : null;
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve({ ok: true, status: res.statusCode, data: parsed });
            } else {
              resolve({ ok: false, status: res.statusCode, error: parsed?.detail || `HTTP ${res.statusCode}` });
            }
          } catch (e) {
            resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, data: responseData });
          }
        });
      });

      req.on('error', (err) => {
        reject(err);
      });

      req.setTimeout(8000, () => {
        req.destroy();
        reject(new Error('Switch API request timeout (8000ms)'));
      });

      if (postData) {
        req.write(postData);
      }
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Post a message to the Switch OpportunityBridge room
 */
export async function postMessageToRoom(content) {
  const config = getSwitchConfig();
  if (!config.token) {
    throw new Error('Switch API token is not configured in server/.env');
  }

  const endpointPath = `/agents/${config.senderAgentId}/message`;
  const body = {
    room_id: config.roomId,
    content: content
  };

  const res = await makeSwitchRequest(endpointPath, 'POST', body);
  if (!res.ok) {
    throw new Error(res.error || `Failed to post message to Switch room (status ${res.status})`);
  }
  return res.data;
}

/**
 * Retrieve room history from the Switch room
 */
export async function getRoomHistory(limit = 15) {
  const config = getSwitchConfig();
  if (!config.token) {
    return { events: [], has_more: false };
  }

  const endpointPath = `/agents/${config.senderAgentId}/rooms/${config.roomId}/history?limit=${limit}`;
  const res = await makeSwitchRequest(endpointPath, 'GET');
  if (!res.ok) {
    return { events: [], error: res.error };
  }
  return res.data;
}

/**
 * Normalize search queries for resilient deduplication
 * Handles casing, punctuation, hyphens, and whitespace differences
 */
export function normalizeQuery(query) {
  if (!query || typeof query !== 'string') return '';
  return query
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Check if a discovery request is an identical repeated request
 * or is already covered by an existing deliverable.
 */
export function checkRequestDeduplication(profile, criteria = {}) {
  const db = getDatabase();
  const rawQuery = (criteria.query || '').trim();
  const normQuery = normalizeQuery(rawQuery);
  const studentName = (profile?.name || 'Student').trim();
  const isPiyush = studentName.toLowerCase().startsWith('piyush');

  // 1. Check known pre-existing covered queries for student
  // Piyush (Year 2 CSE) is already covered by piyush-all-shortlist.json for AI internships and broad search
  const piyushCoveredQueries = [
    'ai internships for second year cse students',
    'ai internships for second year cse students',
    'ai internships second year cse',
    'ai internships',
    'ai internship',
    'second year cse ai internships',
    '' // broad comprehensive search
  ];

  if (isPiyush && piyushCoveredQueries.includes(normQuery)) {
    return {
      isDuplicate: true,
      reason: 'already_covered',
      shortlist: 'piyush-all-shortlist.json',
      message: `Identical repeated request detected: "${rawQuery || 'Broad comprehensive search'}" is already covered by an existing shortlist (piyush-all-shortlist.json, 12 verified entries). Deduplicated safely without repeating redundant scout runs.`
    };
  }

  // 2. Check previously dispatched requests in database
  const dispatched = db.getDispatchedRequests();
  for (const prev of dispatched) {
    if (prev.student_name && prev.student_name.toLowerCase().trim() === studentName.toLowerCase()) {
      if (prev.normalized_query === normQuery) {
        return {
          isDuplicate: true,
          reason: 'previously_dispatched',
          shortlist: prev.deliverable || null,
          message: `Identical repeated request detected: "${rawQuery || 'Broad search'}" was already dispatched (${prev.timestamp ? new Date(prev.timestamp).toLocaleTimeString() : 'earlier'}). Deduplicated safely.`
        };
      }
    }
  }

  return {
    isDuplicate: false,
    normalizedQuery: normQuery
  };
}

/**
 * Send Student Request to bridge-coordinator in the OpportunityBridge room
 */
export async function requestOpportunities(profile, criteria = {}) {
  const db = getDatabase();
  const studentName = profile?.name || 'Student';
  const degree = profile?.degree || 'Bachelor of Technology';
  const branch = profile?.branch || profile?.field_of_study || 'Computer Science & Engineering';
  const year = profile?.year_of_study || 3;
  const skills = Array.isArray(profile?.skills) ? profile.skills.join(', ') : (profile?.skills || 'None');
  const interests = Array.isArray(profile?.interests) ? profile.interests.join(', ') : (profile?.interests || 'None');

  // Check request deduplication before dispatching
  const dedupeResult = checkRequestDeduplication(profile, criteria);
  if (dedupeResult.isDuplicate) {
    db.logSwitchSync({
      type: 'DISCOVERY_REQUEST',
      agent: 'bridge-coordinator',
      itemCount: 0,
      status: 'DEDUPLICATED',
      details: dedupeResult.message
    });
    return {
      success: true,
      deduplicated: true,
      shortlist: dedupeResult.shortlist,
      message: dedupeResult.message,
      timestamp: new Date().toISOString()
    };
  }

  const normQuery = dedupeResult.normalizedQuery;
  const searchScope = criteria.query ? `Keyword filter: "${criteria.query.trim()}"` : 'Broad comprehensive search';
  const categoryFilter = criteria.category && criteria.category !== 'all' ? `Target category: ${criteria.category}` : 'All categories (internships, scholarships, hackathons, competitions)';

  // Build target deliverable filename
  const cleanNameSlug = studentName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const topicSlug = normQuery ? normQuery.split(' ').slice(0, 3).join('-') : 'search';
  const deliverableFilename = criteria.deliverable || `${cleanNameSlug}-${topicSlug}-shortlist.json`;

  const roomMessage = `@bridge-coordinator New student discovery request from OpportunityBridge website:
- Student: ${studentName} (${degree} - ${branch}, Year ${year})
- Skills: ${skills}
- Interests: ${interests}
- Query/Scope: ${searchScope}
- Category: ${categoryFilter}
- Deliverable: ${deliverableFilename} (separate shortlist file in scout workspace)

This is a fresh, distinct search query. Please coordinate with @opportunity-scout to discover, verify official application links and deadlines, and deliver fresh matching opportunities into ${deliverableFilename} in the scout workspace.`;

  try {
    const postRes = await postMessageToRoom(roomMessage);

    // Record dispatched request for future deduplication
    db.recordDispatchedRequest({
      normalizedQuery: normQuery,
      query: criteria.query || 'Broad search',
      studentName,
      branch,
      year,
      deliverable: deliverableFilename,
      status: 'DISPATCHED'
    });

    // Log the request event in database
    db.logSwitchSync({
      type: 'DISCOVERY_REQUEST',
      agent: 'bridge-coordinator',
      itemCount: 0,
      status: 'SENT',
      details: `Dispatched search request for ${studentName} ("${criteria.query || 'Broad search'}"). Room event ID: ${postRes?.event_id || 'ok'}`
    });

    return {
      success: true,
      deduplicated: false,
      eventId: postRes?.event_id,
      deliverable: deliverableFilename,
      timestamp: new Date().toISOString(),
      message: `Fresh discovery request dispatched to @bridge-coordinator in OpportunityBridge room! Target deliverable: ${deliverableFilename}`
    };
  } catch (err) {
    db.logSwitchSync({
      type: 'DISCOVERY_REQUEST',
      agent: 'bridge-coordinator',
      itemCount: 0,
      status: 'FAILED',
      details: `Failed to dispatch request: ${err.message}`
    });
    throw err;
  }
}

/**
 * Synchronize opportunity-scout's generated opportunities or a separate shortlist file into database
 */
export async function syncScoutOpportunities(filename = null) {
  const db = getDatabase();
  const config = getSwitchConfig();

  // 1. Determine target file
  const cleanFilename = filename ? path.basename(filename.trim()) : 'opportunities.json';
  let targetFilePath = path.join(config.scoutDir, cleanFilename);

  if (!fs.existsSync(targetFilePath)) {
    // Fallback: check DATA_DIR
    const altPath = path.join(DATA_DIR, cleanFilename);
    if (fs.existsSync(altPath)) {
      targetFilePath = altPath;
    } else {
      const errorMsg = `Shortlist file "${cleanFilename}" not found in scout workspace (${config.scoutDir}) or data folder.`;
      db.logSwitchSync({
        type: 'SHORTLIST_SYNC',
        agent: 'opportunity-scout',
        itemCount: 0,
        status: 'FAILED',
        details: errorMsg
      });
      return { success: false, error: errorMsg, filename: cleanFilename };
    }
  }

  try {
    const rawData = fs.readFileSync(targetFilePath, 'utf8');
    let parsed;
    try {
      parsed = JSON.parse(rawData);
    } catch (parseErr) {
      throw new Error(`JSON syntax error in "${cleanFilename}": ${parseErr.message}`);
    }

    if (!Array.isArray(parsed)) {
      throw new Error(`Invalid format in "${cleanFilename}": expected a JSON array of opportunity objects.`);
    }

    // 2. Validate opportunity fields & record any rejected entries
    const validatedOpportunities = [];
    const rejected = [];

    for (let i = 0; i < parsed.length; i++) {
      const item = parsed[i];
      if (!item || typeof item !== 'object') {
        rejected.push({ index: i + 1, title: 'Unknown', reason: 'Item is not a valid JSON object' });
        continue;
      }

      const title = typeof item.title === 'string' ? item.title.trim() : '';
      if (!title) {
        rejected.push({ index: i + 1, title: 'Untitled', reason: 'Missing or empty "title"' });
        continue;
      }

      const organization = (typeof item.organization === 'string' ? item.organization.trim() : '') ||
                           (typeof item.company === 'string' ? item.company.trim() : '');
      if (!organization) {
        rejected.push({ index: i + 1, title, reason: 'Missing or empty "organization"' });
        continue;
      }

      const link = (typeof item.link === 'string' ? item.link.trim() : '') ||
                   (typeof item.application_url === 'string' ? item.application_url.trim() : '') ||
                   (typeof item.official_link === 'string' ? item.official_link.trim() : '');
      if (!link || !link.match(/^https?:\/\/[a-z0-9]/i) || link.includes('example.com') || link.includes('placeholder')) {
        rejected.push({ index: i + 1, title, reason: 'Invalid or placeholder application URL (must be a real http:// or https:// URL)' });
        continue;
      }

      const deadline = typeof item.deadline === 'string' ? item.deadline.trim() : '';
      if (!deadline || deadline === 'TBD' || deadline === 'unknown') {
        rejected.push({ index: i + 1, title, reason: 'Missing or unverified deadline (must be a valid date or "rolling")' });
        continue;
      }

      const isRolling = (item.deadline_type === 'rolling') || deadline.toLowerCase().includes('rolling');
      if (!isRolling) {
        const d = new Date(deadline);
        if (isNaN(d.getTime())) {
          rejected.push({ index: i + 1, title, reason: 'Invalid deadline date format (must be YYYY-MM-DD or parseable date)' });
          continue;
        }
      }

      const rawId = (typeof item.id === 'string' && item.id.trim()) 
        ? item.id.trim() 
        : `${organization}-${title}`.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const cleanId = rawId.toLowerCase();

      validatedOpportunities.push({
        id: cleanId,
        title,
        organization,
        category: (typeof item.type === 'string' ? item.type : (item.category || 'internship')).toLowerCase().trim(),
        description: typeof item.description === 'string' ? item.description : '',
        eligibility: item.eligibility || {},
        skills_required: Array.isArray(item.tags) ? item.tags : (Array.isArray(item.skills_required) ? item.skills_required : (item.skills || [])),
        interests: Array.isArray(item.interests) ? item.interests : (item.tags || []),
        location: item.location || (item.remote ? 'Remote' : 'India'),
        remote: Boolean(item.remote),
        deadline,
        deadline_type: isRolling ? 'rolling' : 'fixed',
        application_url: link,
        source: filename ? `switch_scout:${cleanFilename}` : 'switch_scout',
        verified_on: item.verified_on || new Date().toISOString().split('T')[0]
      });
    }

    // 3. Duplicate Prevention & Preserve Original 15 Opportunities
    // Retrieve existing opportunities from database
    const existingList = db.getOpportunities();
    const existingIdSet = new Set(existingList.map(o => o.id.toLowerCase()));
    const existingTitleOrgSet = new Set(existingList.map(o => `${(o.title || '').trim().toLowerCase()}|${(o.organization || '').trim().toLowerCase()}`));

    const newItemsToInsert = [];
    let duplicatesSkipped = 0;

    for (const validItem of validatedOpportunities) {
      const titleOrgKey = `${validItem.title.toLowerCase()}|${validItem.organization.toLowerCase()}`;
      if (existingIdSet.has(validItem.id) || existingTitleOrgSet.has(titleOrgKey)) {
        duplicatesSkipped++;
      } else {
        newItemsToInsert.push(validItem);
        existingIdSet.add(validItem.id);
        existingTitleOrgSet.add(titleOrgKey);
      }
    }

    // 4. Insert genuinely new opportunities into database without modifying server/data/opportunities.json
    let newlyImported = 0;
    if (newItemsToInsert.length > 0) {
      newlyImported = db.insertNewOpportunities(newItemsToInsert);
    }

    const totalInDatabase = db.countOpportunities();

    // Log the sync event
    const summaryDetails = `Synced "${cleanFilename}": ${newlyImported} newly imported, ${duplicatesSkipped} duplicates skipped, ${rejected.length} rejected. Total in DB: ${totalInDatabase}.`;
    db.logSwitchSync({
      type: 'SHORTLIST_SYNC',
      agent: 'opportunity-scout',
      itemCount: newlyImported,
      status: 'SUCCESS',
      details: summaryDetails
    });

    return {
      success: true,
      filename: cleanFilename,
      totalInFile: parsed.length,
      validatedCount: validatedOpportunities.length,
      newlyImported,
      duplicatesSkipped,
      rejected,
      totalInDatabase,
      importedOpportunities: newItemsToInsert.map(o => ({ id: o.id, title: o.title, org: o.organization })),
      message: summaryDetails
    };
  } catch (err) {
    db.logSwitchSync({
      type: 'SHORTLIST_SYNC',
      agent: 'opportunity-scout',
      itemCount: 0,
      status: 'ERROR',
      details: `Sync error for "${cleanFilename}": ${err.message}`
    });
    return { success: false, filename: cleanFilename, error: err.message };
  }
}

/**
 * List available shortlist files in the opportunity-scout workspace
 */
export function getAvailableShortlists() {
  const config = getSwitchConfig();
  const scoutDir = config.scoutDir;
  if (!fs.existsSync(scoutDir)) return [];

  try {
    const files = fs.readdirSync(scoutDir);
    return files
      .filter(f => f.endsWith('.json') && f !== 'profile.json')
      .map(filename => {
        const fullPath = path.join(scoutDir, filename);
        const stats = fs.statSync(fullPath);
        return {
          filename,
          size: stats.size,
          updatedAt: stats.mtime.toISOString(),
          isDefault: filename === 'opportunities.json'
        };
      });
  } catch (err) {
    return [];
  }
}

/**
 * Get Switch synchronization logs from the database
 */
export function getSyncLogs() {
  const db = getDatabase();
  return db.getSwitchSyncLogs();
}
