import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDatabase } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');

const OPPORTUNITIES_FILE = path.join(DATA_DIR, 'opportunities.json');
const PROFILE_FILE = path.join(DATA_DIR, 'profile.json');

/**
 * Safely loads profile.json and opportunities.json from server/data/
 */
export function loadInitialData() {
  const db = getDatabase();
  const summary = {
    opportunitiesCount: 0,
    profileLoaded: false,
    opportunitiesFileExists: fs.existsSync(OPPORTUNITIES_FILE),
    profileFileExists: fs.existsSync(PROFILE_FILE),
    message: ''
  };

  // 1. Check & Load Profile
  const existingProfile = db.getProfile();

  if (existingProfile) {
    summary.profileLoaded = true;
    console.log(`[DataLoader] Preserving existing student profile from database: ${existingProfile.name} (${existingProfile.degree} - ${existingProfile.branch || 'No branch'})`);
  } else if (summary.profileFileExists) {
    try {
      const rawProfile = fs.readFileSync(PROFILE_FILE, 'utf-8');
      const profileData = JSON.parse(rawProfile);

      const parsedProfile = {
        id: profileData.id || 'default_student',
        name: profileData.name || 'Student',
        degree: profileData.degree || 'Bachelor of Technology',
        branch: profileData.field_of_study || profileData.branch || 'Computer Science & Engineering',
        year_of_study: profileData.year ? (parseInt(profileData.year, 10) || profileData.year) : 3,
        skills: Array.isArray(profileData.skills) && profileData.skills.length > 0
          ? profileData.skills
          : ['Python', 'JavaScript', 'React', 'Git', 'Software Development'],
        interests: Array.isArray(profileData.interests) && profileData.interests.length > 0
          ? profileData.interests
          : ['Artificial Intelligence', 'Open Source', 'Hackathons', 'Research'],
        location: profileData.location || 'India'
      };

      db.upsertProfile(parsedProfile);
      summary.profileLoaded = true;
      console.log(`[DataLoader] Initialized default student profile: ${parsedProfile.name} (${parsedProfile.branch})`);
    } catch (err) {
      console.error('[DataLoader] Error loading profile.json:', err.message);
    }
  } else {
    console.log('[DataLoader] profile.json not found in server/data.');
  }

  // 2. Check & Load Opportunities
  if (summary.opportunitiesFileExists) {
    try {
      const rawOpportunities = fs.readFileSync(OPPORTUNITIES_FILE, 'utf-8');
      const opportunitiesList = JSON.parse(rawOpportunities);

      if (Array.isArray(opportunitiesList)) {
        const cleanedList = opportunitiesList.map((item) => {
          const deadline = item.deadline || '';
          const isRolling = (item.deadline_type === 'rolling') || (typeof deadline === 'string' && deadline.toLowerCase().includes('rolling'));
          
          return {
            id: item.id || `${item.organization || 'org'}-${item.title || 'opp'}`.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            title: item.title || 'Untitled Opportunity',
            organization: item.organization || item.company || 'Unknown Organization',
            category: item.type || item.category || 'general',
            description: item.description || '',
            eligibility: item.eligibility || {},
            skills_required: Array.isArray(item.tags) 
              ? item.tags 
              : (Array.isArray(item.skills_required) ? item.skills_required : (item.skills || [])),
            interests: Array.isArray(item.interests) ? item.interests : (item.tags || []),
            location: item.location || (item.remote ? 'Remote' : 'India'),
            remote: Boolean(item.remote),
            deadline: deadline,
            deadline_type: isRolling ? 'rolling' : 'fixed',
            application_url: item.link || item.application_url || item.official_link || '',
            source: 'switch_scout',
            verified_on: item.verified_on || '2026-11-04'
          };
        });

        summary.opportunitiesCount = db.upsertOpportunities(cleanedList);
        console.log(`[DataLoader] Loaded ${summary.opportunitiesCount} verified opportunities from opportunities.json`);
      }
    } catch (err) {
      console.error('[DataLoader] Error loading opportunities.json:', err.message);
    }
  } else {
    console.log('[DataLoader] opportunities.json not found in server/data.');
  }

  summary.totalInDatabase = db.countOpportunities();
  summary.message = `Successfully loaded ${summary.totalInDatabase} verified opportunities from Switch Scout.`;

  return summary;
}
