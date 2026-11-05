import React, { useState } from 'react';
import OpportunityCard from '../components/OpportunityCard';
import { Clock, Flame, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function DeadlinesPage({ 
  deadlinesData, 
  onSelectOpportunity, 
  onToggleSave, 
  savedMap 
}) {
  const [activeGroup, setActiveGroup] = useState('all'); // all, urgent, upcoming, rolling, expired

  const { urgent = [], upcoming = [], rolling = [], expired = [] } = deadlinesData;

  const totalActive = urgent.length + upcoming.length + rolling.length;

  const getDisplayedList = () => {
    switch (activeGroup) {
      case 'urgent':
        return urgent;
      case 'upcoming':
        return upcoming;
      case 'rolling':
        return rolling;
      case 'expired':
        return expired;
      default:
        return [...urgent, ...upcoming, ...rolling, ...expired];
    }
  };

  const list = getDisplayedList();

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Deadline Tracker</h1>
        <p className="text-sm text-slate-500 mt-1">
          Monitor approaching deadlines, rolling programs, and application closing dates.
        </p>
      </div>

      {/* Urgency Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div 
          onClick={() => setActiveGroup('urgent')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            activeGroup === 'urgent' 
              ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-500/20 shadow-xs' 
              : 'bg-white border-slate-200 hover:border-rose-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700 uppercase">Urgent (&lt;7 Days)</span>
            <Flame className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{urgent.length}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Needs immediate attention</p>
        </div>

        <div 
          onClick={() => setActiveGroup('upcoming')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            activeGroup === 'upcoming' 
              ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-500/20 shadow-xs' 
              : 'bg-white border-slate-200 hover:border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase">Upcoming</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{upcoming.length}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Closing within 1-2 months</p>
        </div>

        <div 
          onClick={() => setActiveGroup('rolling')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            activeGroup === 'rolling' 
              ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs' 
              : 'bg-white border-slate-200 hover:border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase">Rolling Basis</span>
            <Calendar className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{rolling.length}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Open throughout the year</p>
        </div>

        <div 
          onClick={() => setActiveGroup('all')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            activeGroup === 'all' 
              ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs' 
              : 'bg-white border-slate-200 hover:border-indigo-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-700 uppercase">All Tracked</span>
            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{totalActive}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">All verified opportunities</p>
        </div>
      </div>

      {/* Grid of opportunities sorted by deadline */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {list.map((opp) => (
          <OpportunityCard
            key={opp.id}
            opportunity={opp}
            onSelect={onSelectOpportunity}
            onToggleSave={onToggleSave}
            isSaved={savedMap.has(opp.id)}
          />
        ))}
      </div>
    </div>
  );
}
