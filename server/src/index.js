import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase, getDatabase } from './config/database.js';
import { loadInitialData } from './services/dataLoader.js';
import { calculateMatch } from './services/matcher.js';
import { parseDeadline } from './utils/deadlines.js';
import { 
  requestOpportunities, 
  syncScoutOpportunities, 
  getSyncLogs, 
  getRoomHistory,
  getAvailableShortlists
} from './services/switchService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// Middleware
app.use(cors({
  origin: CLIENT_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());

// Initialize database & load files
initDatabase();
const initialLoadSummary = loadInitialData();

// --- Health & Telemetry Endpoints (Preserved) ---
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'OpportunityBridge Backend',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/status', (req, res) => {
  try {
    const db = getDatabase();
    const oppCount = db.countOpportunities();
    const profile = db.getProfile();
    const savedCount = db.countSavedApplications();

    res.json({
      status: 'ready',
      database: {
        connected: true,
        type: 'Persistent JSON Store (Schema-Indexed)',
        totalOpportunities: oppCount,
        hasProfile: !!profile,
        profileSummary: profile ? {
          name: profile.name,
          degree: profile.degree,
          branch: profile.branch,
          year_of_study: profile.year_of_study
        } : null,
        savedApplicationsCount: savedCount
      },
      fileLoader: initialLoadSummary,
      switchIntegration: {
        configured: true,
        status: 'modular_ready',
        agents: ['bridge-coordinator', 'opportunity-scout'],
        room: 'OpportunityBridge',
        lastScouted: '2026-11-04',
        message: 'Verified opportunities loaded from Switch Scout workflow'
      }
    });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

app.post('/api/reload-data', (req, res) => {
  try {
    const result = loadInitialData();
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Switch Multi-Agent Integration Endpoints ---
app.post('/api/switch/request', async (req, res) => {
  try {
    const db = getDatabase();
    const profile = db.getProfile();
    const criteria = req.body || {};
    const result = await requestOpportunities(profile, criteria);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/switch/sync', async (req, res) => {
  try {
    const filename = req.body?.filename || req.query?.filename || null;
    const result = await syncScoutOpportunities(filename);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/switch/available-shortlists', (req, res) => {
  try {
    const files = getAvailableShortlists();
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/switch/logs', (req, res) => {
  try {
    const logs = getSyncLogs();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/switch/history', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 15;
    const history = await getRoomHistory(limit);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Real Statistics Endpoint ---
app.get('/api/stats', (req, res) => {
  try {
    const db = getDatabase();
    const opportunities = db.getOpportunities();
    const profile = db.getProfile();
    const saved = db.getSavedApplications();

    let strongMatches = 0;
    let upcomingDeadlines = 0;
    let urgentDeadlines = 0;

    opportunities.forEach(opp => {
      const match = calculateMatch(opp, profile);
      if (match.score >= 60) strongMatches++;

      const dl = parseDeadline(opp.deadline, opp.deadline_type);
      if (dl.isUrgent) urgentDeadlines++;
      if (dl.status === 'upcoming' || dl.status === 'urgent') upcomingDeadlines++;
    });

    res.json({
      totalOpportunities: opportunities.length,
      matchedOpportunities: strongMatches,
      savedOpportunities: saved.length,
      upcomingDeadlines: upcomingDeadlines,
      urgentDeadlines: urgentDeadlines
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Profile Endpoints ---
app.get('/api/profile', (req, res) => {
  try {
    const db = getDatabase();
    const profile = db.getProfile();
    if (!profile) {
      return res.json({
        id: 'default_student',
        name: 'Student',
        degree: 'Bachelor of Technology',
        branch: 'Computer Science & Engineering',
        year_of_study: 3,
        skills: ['Python', 'JavaScript', 'React', 'Git'],
        interests: ['Software Development', 'Artificial Intelligence', 'Open Source'],
        location: 'India'
      });
    }
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/profile', (req, res) => {
  try {
    const db = getDatabase();
    const updated = db.upsertProfile(req.body);
    res.json({ success: true, profile: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Opportunities Endpoints ---
app.get('/api/opportunities', (req, res) => {
  try {
    const db = getDatabase();
    const { category, search, location, remote } = req.query;
    const profile = db.getProfile();
    const savedMap = new Map(db.getSavedApplications().map(s => [s.opportunity_id, s]));

    let list = db.getOpportunities();

    if (category && category !== 'all') {
      const catLower = category.toLowerCase();
      list = list.filter(o => (o.category || '').toLowerCase() === catLower || (o.type || '').toLowerCase() === catLower);
    }

    if (location && location !== 'all') {
      const locLower = location.toLowerCase();
      list = list.filter(o => (o.location || '').toLowerCase().includes(locLower));
    }

    if (remote === 'true') {
      list = list.filter(o => o.remote === true || (o.location || '').toLowerCase().includes('remote'));
    }

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(o =>
        (o.title || '').toLowerCase().includes(q) ||
        (o.organization || '').toLowerCase().includes(q) ||
        (o.description || '').toLowerCase().includes(q) ||
        (o.skills_required || []).some(s => s.toLowerCase().includes(q))
      );
    }

    // Attach parsed deadline, match score, saved state, and checklist progress
    const enriched = list.map(opp => {
      const deadlineInfo = parseDeadline(opp.deadline, opp.deadline_type);
      const matchInfo = calculateMatch(opp, profile);
      const savedApp = savedMap.get(opp.id);

      return {
        ...opp,
        deadlineInfo,
        matchInfo,
        isSaved: !!savedApp,
        savedDetails: savedApp || null,
        checklist_progress: savedApp?.checklist_progress || {
          resume: false,
          sop: false,
          portfolio: false,
          transcripts: false
        }
      };
    });

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/opportunities/:id', (req, res) => {
  try {
    const db = getDatabase();
    const opp = db.getOpportunityById(req.params.id);
    if (!opp) return res.status(404).json({ error: 'Opportunity not found' });

    const profile = db.getProfile();
    const saved = db.getSavedApplication(opp.id);

    res.json({
      ...opp,
      deadlineInfo: parseDeadline(opp.deadline, opp.deadline_type),
      matchInfo: calculateMatch(opp, profile),
      savedDetails: saved || null,
      checklist_progress: saved?.checklist_progress || {
        resume: false,
        sop: false,
        portfolio: false,
        transcripts: false
      },
      isSaved: !!saved
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Saved Applications & Bookmarks Endpoints ---
app.get('/api/saved', (req, res) => {
  try {
    const db = getDatabase();
    const saved = db.getSavedApplications();
    const profile = db.getProfile();

    const enriched = saved.map(item => {
      const opp = db.getOpportunityById(item.opportunity_id) || item.opportunity || {};
      return {
        ...item,
        opportunity: {
          ...opp,
          deadlineInfo: parseDeadline(opp.deadline, opp.deadline_type),
          matchInfo: calculateMatch(opp, profile)
        }
      };
    });

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/saved/:id', (req, res) => {
  try {
    const db = getDatabase();
    const saved = db.saveApplication(req.params.id, req.body);
    res.json({ success: true, saved });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/saved/:id', (req, res) => {
  try {
    const db = getDatabase();
    const updated = db.saveApplication(req.params.id, req.body);
    res.json({ success: true, saved: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/saved/:id', (req, res) => {
  try {
    const db = getDatabase();
    const removed = db.removeSavedApplication(req.params.id);
    res.json({ success: true, removed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Match Explanation Endpoint ---
app.get('/api/matches', (req, res) => {
  try {
    const db = getDatabase();
    const profile = db.getProfile();
    const opportunities = db.getOpportunities();
    const savedMap = new Map(db.getSavedApplications().map(s => [s.opportunity_id, s]));

    const scored = opportunities.map(opp => {
      const matchInfo = calculateMatch(opp, profile);
      const deadlineInfo = parseDeadline(opp.deadline, opp.deadline_type);
      const savedApp = savedMap.get(opp.id);
      return {
        ...opp,
        matchInfo,
        deadlineInfo,
        isSaved: !!savedApp,
        savedDetails: savedApp || null,
        checklist_progress: savedApp?.checklist_progress || {
          resume: false,
          sop: false,
          portfolio: false,
          transcripts: false
        }
      };
    }).sort((a, b) => b.matchInfo.score - a.matchInfo.score);

    res.json(scored);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Deadlines Timeline Endpoint ---
app.get('/api/deadlines', (req, res) => {
  try {
    const db = getDatabase();
    const opportunities = db.getOpportunities();
    const savedMap = new Map(db.getSavedApplications().map(s => [s.opportunity_id, s]));

    const items = opportunities.map(opp => {
      const savedApp = savedMap.get(opp.id);
      return {
        ...opp,
        deadlineInfo: parseDeadline(opp.deadline, opp.deadline_type),
        isSaved: !!savedApp,
        savedDetails: savedApp || null,
        checklist_progress: savedApp?.checklist_progress || {
          resume: false,
          sop: false,
          portfolio: false,
          transcripts: false
        }
      };
    });

    // Grouping
    const urgent = items.filter(i => i.deadlineInfo.isUrgent).sort((a, b) => a.deadlineInfo.daysRemaining - b.deadlineInfo.daysRemaining);
    const upcoming = items.filter(i => i.deadlineInfo.status === 'upcoming').sort((a, b) => a.deadlineInfo.daysRemaining - b.deadlineInfo.daysRemaining);
    const rolling = items.filter(i => i.deadlineInfo.status === 'rolling');
    const expired = items.filter(i => i.deadlineInfo.isExpired).sort((a, b) => b.deadlineInfo.daysRemaining - a.deadlineInfo.daysRemaining);

    res.json({ urgent, upcoming, rolling, expired });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`  OpportunityBridge API listening on port ${PORT}`);
  console.log(`  Health Check: http://localhost:${PORT}/api/health`);
  console.log(`  Status Check: http://localhost:${PORT}/api/status`);
  console.log(`===============================================`);
});
