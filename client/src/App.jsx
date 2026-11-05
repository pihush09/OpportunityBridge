import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import DashboardPage from './pages/DashboardPage';
import DiscoveryPage from './pages/DiscoveryPage';
import MatchesPage from './pages/MatchesPage';
import DeadlinesPage from './pages/DeadlinesPage';
import SavedApplicationsPage from './pages/SavedApplicationsPage';
import ProfilePage from './pages/ProfilePage';
import OpportunityModal from './components/OpportunityModal';
import SwitchStatusModal from './components/SwitchStatusModal';
import { 
  getProfile, 
  getStats, 
  getOpportunities, 
  getMatches, 
  getDeadlines, 
  getSavedOpportunities, 
  saveOpportunity, 
  removeSavedOpportunity, 
  updateProfile, 
  getSystemStatus 
} from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [discoveryCategory, setDiscoveryCategory] = useState('all');
  
  // Data State
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({
    totalOpportunities: 0,
    matchedOpportunities: 0,
    savedOpportunities: 0,
    upcomingDeadlines: 0,
    urgentDeadlines: 0
  });
  const [opportunities, setOpportunities] = useState([]);
  const [matches, setMatches] = useState([]);
  const [deadlinesData, setDeadlinesData] = useState({ urgent: [], upcoming: [], rolling: [], expired: [] });
  const [savedList, setSavedList] = useState([]);
  const [savedMap, setSavedMap] = useState(new Set());
  const [systemStatus, setSystemStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);

  // Fetch all live data
  const loadAllData = useCallback(async () => {
    try {
      const [
        profileRes,
        statsRes,
        oppsRes,
        matchesRes,
        deadlinesRes,
        savedRes,
        statusRes
      ] = await Promise.all([
        getProfile(),
        getStats(),
        getOpportunities(),
        getMatches(),
        getDeadlines(),
        getSavedOpportunities(),
        getSystemStatus()
      ]);

      setProfile(profileRes);
      setStats(statsRes);
      setOpportunities(oppsRes);
      setMatches(matchesRes);
      setDeadlinesData(deadlinesRes);
      setSavedList(savedRes);
      setSavedMap(new Set(savedRes.map(s => s.opportunity_id)));
      setSystemStatus(statusRes);
    } catch (err) {
      console.error('Error loading OpportunityBridge data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Handle Opportunity Selection with guaranteed saved details
  const handleSelectOpportunity = (opp) => {
    const savedEntry = savedList.find(s => s.opportunity_id === opp.id || s.id === opp.id);
    const checklistProgress = savedEntry?.checklist_progress || opp.checklist_progress || opp.savedDetails?.checklist_progress || {
      resume: false,
      sop: false,
      portfolio: false,
      transcripts: false
    };

    setSelectedOpportunity({
      ...opp,
      isSaved: !!savedEntry || opp.isSaved,
      savedDetails: savedEntry || opp.savedDetails || null,
      checklist_progress: checklistProgress
    });
  };

  // Handle Bookmark / Save Toggle
  const handleToggleSave = async (id) => {
    const isCurrentlySaved = savedMap.has(id);
    if (isCurrentlySaved) {
      await removeSavedOpportunity(id);
    } else {
      await saveOpportunity(id);
    }
    // Refresh saved and stats
    const [updatedSaved, updatedStats] = await Promise.all([
      getSavedOpportunities(),
      getStats()
    ]);
    setSavedList(updatedSaved);
    setSavedMap(new Set(updatedSaved.map(s => s.opportunity_id)));
    setStats(updatedStats);

    // Update selected opportunity if modal is open
    if (selectedOpportunity && selectedOpportunity.id === id) {
      setSelectedOpportunity(prev => ({
        ...prev,
        isSaved: !isCurrentlySaved
      }));
    }
  };

  // Handle Checklist item update in Modal
  const handleUpdateChecklist = async (opportunityId, checklist) => {
    const res = await saveOpportunity(opportunityId, { checklist_progress: checklist });
    const [updatedSaved, updatedStats] = await Promise.all([
      getSavedOpportunities(),
      getStats()
    ]);
    setSavedList(updatedSaved);
    setSavedMap(new Set(updatedSaved.map(s => s.opportunity_id)));
    setStats(updatedStats);

    // Keep active selectedOpportunity in sync so the open modal reflects the new checklist immediately
    setSelectedOpportunity(prev => {
      if (prev && prev.id === opportunityId) {
        return {
          ...prev,
          isSaved: true,
          savedDetails: res?.saved || { ...(prev.savedDetails || {}), checklist_progress: checklist },
          checklist_progress: checklist
        };
      }
      return prev;
    });
  };

  // Handle Profile Update
  const handleSaveProfile = async (formData) => {
    const res = await updateProfile(formData);
    if (res?.success) {
      setProfile(res.profile);
      // Reload opportunities, matches, and stats to reflect new profile
      const [newStats, newOpps, newMatches] = await Promise.all([
        getStats(),
        getOpportunities(),
        getMatches()
      ]);
      setStats(newStats);
      setOpportunities(newOpps);
      setMatches(newMatches);
    }
    return res;
  };

  // Navigation Helper
  const handleNavigate = (tab, category = null) => {
    setActiveTab(tab);
    if (category) {
      setDiscoveryCategory(category);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 antialiased font-sans selection:bg-indigo-500 selection:text-white">
      {/* SaaS Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSwitchModal={() => setIsSwitchModalOpen(true)}
        switchStatus={systemStatus?.switchIntegration}
        savedCount={savedList.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-semibold text-slate-600">Loading OpportunityBridge...</p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardPage
                profile={profile}
                stats={stats}
                topMatches={matches}
                urgentDeadlines={[...(deadlinesData.urgent || []), ...(deadlinesData.upcoming || [])]}
                onNavigate={handleNavigate}
                onSelectOpportunity={handleSelectOpportunity}
                onToggleSave={handleToggleSave}
                savedMap={savedMap}
              />
            )}

            {activeTab === 'discovery' && (
              <DiscoveryPage
                opportunities={opportunities}
                onSelectOpportunity={handleSelectOpportunity}
                onToggleSave={handleToggleSave}
                savedMap={savedMap}
                initialCategory={discoveryCategory}
                profile={profile}
                onOpenSwitchModal={() => setIsSwitchModalOpen(true)}
                onDataReloaded={loadAllData}
              />
            )}

            {activeTab === 'matches' && (
              <MatchesPage
                profile={profile}
                matches={matches}
                onSelectOpportunity={handleSelectOpportunity}
                onToggleSave={handleToggleSave}
                savedMap={savedMap}
                onNavigate={handleNavigate}
              />
            )}

            {activeTab === 'deadlines' && (
              <DeadlinesPage
                deadlinesData={deadlinesData}
                onSelectOpportunity={handleSelectOpportunity}
                onToggleSave={handleToggleSave}
                savedMap={savedMap}
              />
            )}

            {activeTab === 'saved' && (
              <SavedApplicationsPage
                savedList={savedList}
                onSelectOpportunity={handleSelectOpportunity}
                onToggleSave={handleToggleSave}
                savedMap={savedMap}
                onNavigate={handleNavigate}
              />
            )}

            {activeTab === 'profile' && (
              <ProfilePage
                profile={profile}
                onSaveProfile={handleSaveProfile}
                onProfileUpdated={loadAllData}
              />
            )}
          </>
        )}
      </main>

      {/* Opportunity Details & Application Guidance Modal */}
      {selectedOpportunity && (
        <OpportunityModal
          opportunity={selectedOpportunity}
          onClose={() => setSelectedOpportunity(null)}
          onToggleSave={handleToggleSave}
          isSaved={savedMap.has(selectedOpportunity.id)}
          onUpdateChecklist={handleUpdateChecklist}
        />
      )}

      {/* Switch Telemetry & Data Ingestion Modal */}
      <SwitchStatusModal
        isOpen={isSwitchModalOpen}
        onClose={() => setIsSwitchModalOpen(false)}
        systemStatus={systemStatus}
        onDataReloaded={loadAllData}
        profile={profile}
      />

      {/* Modern SaaS Footer */}
      <footer className="mt-auto border-t border-slate-200/80 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-800">OpportunityBridge</span>
            <span>•</span>
            <span>AI-Powered Student Opportunity Assistant</span>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsSwitchModalOpen(true)}
              className="hover:text-indigo-600 transition-colors"
            >
              Switch Multi-Agent Telemetry
            </button>
            <span>•</span>
            <span>Local SQLite Persistence</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
