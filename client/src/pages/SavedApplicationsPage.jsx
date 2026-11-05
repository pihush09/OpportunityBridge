import React from 'react';
import OpportunityCard from '../components/OpportunityCard';
import { Bookmark, ListChecks, ArrowRight, Sparkles } from 'lucide-react';

export default function SavedApplicationsPage({ 
  savedList, 
  onSelectOpportunity, 
  onToggleSave, 
  savedMap,
  onNavigate 
}) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Saved Applications</h1>
        <p className="text-sm text-slate-500 mt-1">
          Track opportunities you have bookmarked, manage preparation checklists, and monitor status.
        </p>
      </div>

      {savedList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {savedList.map((item) => {
            const opp = item.opportunity || item;
            const progress = item.checklist_progress || {};
            const completedCount = Object.values(progress).filter(Boolean).length;

            return (
              <div key={item.id} className="relative flex flex-col">
                <OpportunityCard
                  opportunity={opp}
                  onSelect={onSelectOpportunity}
                  onToggleSave={onToggleSave}
                  isSaved={true}
                />

                {/* Preparation progress pill */}
                <div className="mt-1 px-3 py-1.5 rounded-b-xl bg-slate-100 border-x border-b border-slate-200 text-[11px] text-slate-700 flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <ListChecks className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Prep Checklist: <strong>{completedCount}/4</strong> ready</span>
                  </div>
                  <button
                    onClick={() => onSelectOpportunity(opp)}
                    className="text-indigo-600 hover:text-indigo-800 font-semibold"
                  >
                    Open Checklist
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs max-w-md mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
            <Bookmark className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No saved opportunities yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            Bookmark scholarships, internships, or hackathons to track their preparation checklists.
          </p>
          <button
            onClick={() => onNavigate('discovery')}
            className="mt-4 inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            <span>Explore Opportunities</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
