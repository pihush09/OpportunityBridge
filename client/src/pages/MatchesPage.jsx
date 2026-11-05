import React, { useState, useMemo } from 'react';
import OpportunityCard from '../components/OpportunityCard';
import { Sparkles, ShieldCheck, UserCheck, ArrowRight, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

export default function MatchesPage({ 
  profile, 
  matches, 
  onSelectOpportunity, 
  onToggleSave, 
  savedMap,
  onNavigate 
}) {
  const [filterType, setFilterType] = useState('all'); // all, eligible, unmet

  const branch = profile?.branch || profile?.field_of_study || 'Engineering';
  const degree = profile?.degree || 'Degree';
  const year = profile?.year_of_study || 2;
  const skillsCount = profile?.skills?.length || 0;

  const eligibleMatches = useMemo(() => matches.filter(m => m.matchInfo?.isEligible), [matches]);
  const unmetMatches = useMemo(() => matches.filter(m => !m.matchInfo?.isEligible), [matches]);

  const displayedMatches = useMemo(() => {
    if (filterType === 'eligible') return eligibleMatches;
    if (filterType === 'unmet') return unmetMatches;
    return matches;
  }, [matches, filterType, eligibleMatches, unmetMatches]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Opportunity Matching Engine</h1>
        <p className="text-sm text-slate-500 mt-1">
          Transparent rule-based matching based on your degree, academic branch, year of study, and skills.
        </p>
      </div>

      {/* Active Profile Baseline Banner */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <span className="font-bold text-slate-900 text-sm">Active Matching Baseline:</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                {degree} • {branch} (Year {year})
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Rule-based checks against {skillsCount} student skills and verified official eligibility rules.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('profile')}
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors shrink-0"
        >
          <span>Modify Profile & Skills</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-3 overflow-x-auto">
        {[
          { id: 'all', label: 'All Evaluated Opportunities', count: matches.length },
          { id: 'eligible', label: 'Eligible Matches', count: eligibleMatches.length, badgeColor: 'bg-emerald-100 text-emerald-800' },
          { id: 'unmet', label: 'Branch / Year Criteria Unmet', count: unmetMatches.length, badgeColor: 'bg-amber-100 text-amber-800' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id)}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              filterType === tab.id
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              filterType === tab.id 
                ? 'bg-indigo-700 text-white' 
                : (tab.badgeColor || 'bg-slate-100 text-slate-600')
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Matches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {displayedMatches.map((opp) => {
          const mInfo = opp.matchInfo;
          const isEligible = mInfo?.isEligible;
          const fieldBreakdown = mInfo?.breakdown?.field;
          const yearBreakdown = mInfo?.breakdown?.year;

          return (
            <div key={opp.id} className="relative flex flex-col">
              <OpportunityCard
                opportunity={opp}
                onSelect={onSelectOpportunity}
                onToggleSave={onToggleSave}
                isSaved={savedMap.has(opp.id)}
              />

              {/* Transparent Explanation Box */}
              <div className={`mt-1.5 p-3 rounded-2xl border text-xs space-y-1.5 ${
                isEligible 
                  ? 'bg-indigo-50/50 border-indigo-100 text-indigo-950' 
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                {/* Academic Criteria Checks */}
                <div className="space-y-1">
                  {/* Field match check */}
                  <div className="flex items-start space-x-1.5 text-[11px]">
                    {fieldBreakdown?.matched ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                    )}
                    <span className={fieldBreakdown?.matched ? 'text-slate-700' : 'text-rose-700 font-medium'}>
                      {fieldBreakdown?.reason || 'Field evaluation'}
                    </span>
                  </div>

                  {/* Year match check */}
                  <div className="flex items-start space-x-1.5 text-[11px]">
                    {yearBreakdown?.matched ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <span className={yearBreakdown?.matched ? 'text-slate-700' : 'text-amber-800 font-medium'}>
                      {yearBreakdown?.reason || 'Year evaluation'}
                    </span>
                  </div>
                </div>

                {/* Matched skills pill preview */}
                {mInfo?.breakdown?.skills?.matched?.length > 0 && (
                  <div className="pt-1 border-t border-slate-200/60 flex flex-wrap gap-1 items-center">
                    <span className="text-[10px] font-semibold text-slate-500">Skills Matched:</span>
                    {mInfo.breakdown.skills.matched.map((s, idx) => (
                      <span key={idx} className="text-[10px] font-medium px-1.5 py-0.2 rounded-md bg-white border border-slate-200 text-emerald-700">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
