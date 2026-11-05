import React, { useState, useMemo } from 'react';
import FilterBar from '../components/FilterBar';
import OpportunityCard from '../components/OpportunityCard';
import { SearchX, Sparkles, Bot, CheckCircle2 } from 'lucide-react';
import { requestSwitchOpportunities } from '../services/api';

export default function DiscoveryPage({ 
  opportunities, 
  onSelectOpportunity, 
  onToggleSave, 
  savedMap,
  initialCategory = 'all',
  profile,
  onOpenSwitchModal,
  onDataReloaded
}) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [isRemoteOnly, setIsRemoteOnly] = useState(false);
  const [sortBy, setSortBy] = useState('deadline');

  const [isRequesting, setIsRequesting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState(null);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts = { total: opportunities.length, internship: 0, scholarship: 0, hackathon: 0, competition: 0 };
    opportunities.forEach(o => {
      const cat = (o.category || o.type || '').toLowerCase();
      if (counts[cat] !== undefined) counts[cat]++;
    });
    return counts;
  }, [opportunities]);

  // Filtered & Sorted opportunities
  const filteredList = useMemo(() => {
    let result = [...opportunities];

    // Category filter
    if (selectedCategory !== 'all') {
      result = result.filter(o => 
        (o.category || o.type || '').toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Remote filter
    if (isRemoteOnly) {
      result = result.filter(o => o.remote === true || (o.location || '').toLowerCase().includes('remote'));
    }

    // Search query filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(o => 
        (o.title || '').toLowerCase().includes(q) ||
        (o.organization || '').toLowerCase().includes(q) ||
        (o.description || '').toLowerCase().includes(q) ||
        (o.skills_required || []).some(s => s.toLowerCase().includes(q))
      );
    }

    // Sorting
    if (sortBy === 'deadline') {
      result.sort((a, b) => {
        const da = a.deadlineInfo?.daysRemaining ?? 999;
        const db = b.deadlineInfo?.daysRemaining ?? 999;
        return da - db;
      });
    } else if (sortBy === 'match') {
      result.sort((a, b) => (b.matchInfo?.score || 0) - (a.matchInfo?.score || 0));
    } else if (sortBy === 'title') {
      result.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    }

    return result;
  }, [opportunities, selectedCategory, isRemoteOnly, search, sortBy]);

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('all');
    setIsRemoteOnly(false);
  };

  // Dispatch student search to bridge-coordinator in the Switch room
  const handleRequestFresh = async (overrideQuery = null) => {
    setIsRequesting(true);
    setFeedbackMessage(null);
    try {
      const q = overrideQuery || search.trim() || undefined;
      const res = await requestSwitchOpportunities({
        query: q,
        category: selectedCategory !== 'all' ? selectedCategory : undefined
      });
      if (res.success) {
        setFeedbackMessage('Request dispatched to @bridge-coordinator! Switch agents are scouting matching opportunities.');
        setTimeout(() => setFeedbackMessage(null), 8000);
      } else {
        setFeedbackMessage(`Request failed: ${res.error || 'Could not reach Switch'}`);
      }
    } catch (err) {
      setFeedbackMessage(`Error: ${err.message}`);
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header with Title and Request Fresh Opportunities Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Explore Opportunities</h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse verified student internships, scholarships, hackathons, and competitions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => handleRequestFresh()}
            disabled={isRequesting}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all hover:scale-[1.02] shrink-0"
          >
            <Sparkles className={`w-4 h-4 ${isRequesting ? 'animate-spin' : ''}`} />
            <span>{isRequesting ? 'Dispatching to Agents...' : 'Request Fresh Opportunities'}</span>
          </button>

          {onOpenSwitchModal && (
            <button
              onClick={onOpenSwitchModal}
              className="inline-flex items-center space-x-1.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shrink-0"
              title="Open Switch Multi-Agent Hub"
            >
              <Bot className="w-4 h-4 text-indigo-600" />
              <span className="hidden md:inline">Agent Hub</span>
            </button>
          )}
        </div>
      </div>

      {/* Real-time Workflow Dispatch Feedback Banner */}
      {feedbackMessage && (
        <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-medium flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>{feedbackMessage}</span>
          </div>
          {onOpenSwitchModal && (
            <button
              onClick={onOpenSwitchModal}
              className="underline font-bold text-indigo-700 hover:text-indigo-900 text-xs shrink-0"
            >
              View Room Messages &rarr;
            </button>
          )}
        </div>
      )}

      {/* Filter Bar */}
      <FilterBar
        search={search}
        setSearch={setSearch}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        isRemoteOnly={isRemoteOnly}
        setIsRemoteOnly={setIsRemoteOnly}
        sortBy={sortBy}
        setSortBy={setSortBy}
        categoryCounts={categoryCounts}
      />

      {/* Results Header Count */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
        <span>Showing <strong className="text-slate-800">{filteredList.length}</strong> of {opportunities.length} opportunities</span>
        {(search || selectedCategory !== 'all' || isRemoteOnly) && (
          <button 
            onClick={clearFilters}
            className="text-indigo-600 hover:text-indigo-800 font-semibold"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Grid */}
      {filteredList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredList.map((opp) => (
            <OpportunityCard
              key={opp.id}
              opportunity={opp}
              onSelect={onSelectOpportunity}
              onToggleSave={onToggleSave}
              isSaved={savedMap.has(opp.id)}
            />
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs max-w-md mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <SearchX className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No matching opportunities</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            {search ? `No current opportunities match "${search}".` : 'Try clearing your selected category filters.'}
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              Reset Filters
            </button>
            <button
              onClick={() => handleRequestFresh(search)}
              disabled={isRequesting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors inline-flex items-center space-x-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask Scout to Find Matches</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
