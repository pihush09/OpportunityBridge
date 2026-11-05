import React from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Clock, 
  Bookmark, 
  Compass, 
  GraduationCap, 
  Code, 
  Trophy, 
  Flame, 
  Calendar 
} from 'lucide-react';
import StatCard from '../components/StatCard';
import OpportunityCard from '../components/OpportunityCard';

export default function DashboardPage({ 
  profile, 
  stats, 
  topMatches, 
  urgentDeadlines, 
  onNavigate, 
  onSelectOpportunity,
  onToggleSave,
  savedMap
}) {
  const studentName = profile?.name || 'Student';
  const degree = profile?.degree || 'Bachelor of Technology';
  const branch = profile?.branch || profile?.field_of_study || 'Computer Science & Engineering';
  const year = profile?.year_of_study || 3;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* SaaS-Style Welcome Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-blue-900 text-white p-8 md:p-10 shadow-xl shadow-indigo-950/10">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-medium text-indigo-100 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
            <span>AI-Assisted Student Assistant</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Welcome back, {studentName} 👋
          </h1>
          <p className="mt-2 text-sm sm:text-base text-indigo-100/90 leading-relaxed font-normal">
            Discover verified scholarships, internships, hackathons, and competitions tailored for your background in <span className="font-semibold text-white">{branch}</span> (Year {year}).
          </p>

          {/* Quick Primary Actions */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('discovery')}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-white text-indigo-900 hover:bg-indigo-50 shadow-sm transition-all hover:scale-[1.02]"
            >
              <Compass className="w-4 h-4" />
              <span>Discover Opportunities</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigate('matches')}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-700/60 hover:bg-indigo-700/90 text-white border border-indigo-500/40 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span>View Matched ({stats.matchedOpportunities || 0})</span>
            </button>

            <button
              onClick={() => onNavigate('deadlines')}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-colors"
            >
              <Clock className="w-4 h-4" />
              <span>Check Deadlines</span>
            </button>
          </div>
        </div>

        {/* Ambient Glow */}
        <div className="absolute right-0 top-0 -mt-12 -mr-12 w-96 h-96 rounded-full bg-gradient-to-br from-indigo-500/30 to-blue-500/10 blur-3xl pointer-events-none"></div>
      </div>

      {/* Real Statistics Metric Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Total Opportunities"
          value={stats.totalOpportunities || 0}
          subtitle="Verified by Switch Scout"
          icon={Compass}
          color="indigo"
          onClick={() => onNavigate('discovery')}
        />
        <StatCard
          title="Matched For You"
          value={stats.matchedOpportunities || 0}
          subtitle="Based on your skills & year"
          icon={Sparkles}
          color="emerald"
          onClick={() => onNavigate('matches')}
        />
        <StatCard
          title="Saved / Tracked"
          value={stats.savedOpportunities || 0}
          subtitle="Bookmarked for preparation"
          icon={Bookmark}
          color="amber"
          onClick={() => onNavigate('saved')}
        />
        <StatCard
          title="Upcoming Deadlines"
          value={stats.upcomingDeadlines || 0}
          subtitle={stats.urgentDeadlines > 0 ? `${stats.urgentDeadlines} closing within 7 days` : 'Active closing dates'}
          icon={stats.urgentDeadlines > 0 ? Flame : Clock}
          color={stats.urgentDeadlines > 0 ? 'rose' : 'indigo'}
          onClick={() => onNavigate('deadlines')}
        />
      </div>

      {/* Two-Column Section: Top Matches & Upcoming Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (2 Cols): Top Recommended Matches */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Top Recommended Matches</h2>
              <p className="text-xs text-slate-500">Highest alignment with your education and skill tags</p>
            </div>
            <button
              onClick={() => onNavigate('matches')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
            >
              <span>See all {stats.totalOpportunities} matches</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topMatches && topMatches.length > 0 ? (
              topMatches.slice(0, 4).map((opp) => (
                <OpportunityCard
                  key={opp.id}
                  opportunity={opp}
                  onSelect={onSelectOpportunity}
                  onToggleSave={onToggleSave}
                  isSaved={savedMap.has(opp.id)}
                />
              ))
            ) : (
              <div className="col-span-2 p-8 text-center bg-white rounded-2xl border border-slate-200">
                <p className="text-sm text-slate-500">Loading top matches...</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Deadlines Radar */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Upcoming Deadlines</h2>
              <p className="text-xs text-slate-500">Prioritize your applications</p>
            </div>
            <button
              onClick={() => onNavigate('deadlines')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
            >
              <span>Tracker</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 divide-y divide-slate-100 shadow-xs">
            {urgentDeadlines && urgentDeadlines.length > 0 ? (
              urgentDeadlines.slice(0, 5).map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => onSelectOpportunity(item)}
                  className="py-3 first:pt-0 last:pb-0 cursor-pointer hover:bg-slate-50/80 -mx-2 px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-xs text-slate-900 line-clamp-1">
                      {item.title}
                    </span>
                    <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.deadlineInfo?.isUrgent 
                        ? 'bg-rose-100 text-rose-700 animate-pulse'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {item.deadlineInfo?.label}
                    </span>
                  </div>
                  <div className="flex items-center text-[11px] text-slate-500 mt-1 space-x-2">
                    <span className="capitalize font-medium text-indigo-600">{item.category}</span>
                    <span>•</span>
                    <span className="truncate">{item.organization}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 py-4 text-center">No immediate deadlines closing soon.</p>
            )}
          </div>

          {/* Quick Category Jump Card */}
          <div className="p-5 rounded-2xl bg-indigo-50/60 border border-indigo-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900 mb-3">Browse Categories</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button 
                onClick={() => onNavigate('discovery', 'internship')}
                className="p-2.5 rounded-xl bg-white border border-indigo-100 text-slate-700 font-semibold hover:border-indigo-300 text-left transition-colors flex items-center space-x-2"
              >
                <GraduationCap className="w-4 h-4 text-blue-600" />
                <span>Internships</span>
              </button>
              <button 
                onClick={() => onNavigate('discovery', 'scholarship')}
                className="p-2.5 rounded-xl bg-white border border-indigo-100 text-slate-700 font-semibold hover:border-indigo-300 text-left transition-colors flex items-center space-x-2"
              >
                <Trophy className="w-4 h-4 text-emerald-600" />
                <span>Scholarships</span>
              </button>
              <button 
                onClick={() => onNavigate('discovery', 'hackathon')}
                className="p-2.5 rounded-xl bg-white border border-indigo-100 text-slate-700 font-semibold hover:border-indigo-300 text-left transition-colors flex items-center space-x-2"
              >
                <Code className="w-4 h-4 text-purple-600" />
                <span>Hackathons</span>
              </button>
              <button 
                onClick={() => onNavigate('discovery', 'competition')}
                className="p-2.5 rounded-xl bg-white border border-indigo-100 text-slate-700 font-semibold hover:border-indigo-300 text-left transition-colors flex items-center space-x-2"
              >
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Competitions</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
