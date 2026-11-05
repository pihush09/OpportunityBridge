import React from 'react';
import { Search, X, SlidersHorizontal, Globe } from 'lucide-react';

export default function FilterBar({ 
  search, 
  setSearch, 
  selectedCategory, 
  setSelectedCategory, 
  isRemoteOnly, 
  setIsRemoteOnly,
  sortBy,
  setSortBy,
  categoryCounts = {}
}) {
  const categories = [
    { id: 'all', label: 'All Opportunities', count: categoryCounts.total || 0 },
    { id: 'internship', label: 'Internships', count: categoryCounts.internship || 0 },
    { id: 'scholarship', label: 'Scholarships', count: categoryCounts.scholarship || 0 },
    { id: 'hackathon', label: 'Hackathons', count: categoryCounts.hackathon || 0 },
    { id: 'competition', label: 'Competitions', count: categoryCounts.competition || 0 }
  ];

  return (
    <div className="space-y-4">
      {/* Search Input & Controls Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, organization, skill, or keyword..."
            className="w-full pl-10 pr-9 py-2.5 rounded-2xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Remote Filter & Sort Dropdown */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsRemoteOnly(!isRemoteOnly)}
            className={`flex items-center space-x-1.5 px-3.5 py-2.5 rounded-2xl text-xs font-semibold border transition-all ${
              isRemoteOnly
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Remote Only</span>
          </button>

          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer shadow-xs"
            >
              <option value="deadline">Closest Deadline</option>
              <option value="match">Highest Match</option>
              <option value="title">Alphabetical (A-Z)</option>
            </select>
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <span>{cat.label}</span>
              {cat.count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {cat.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
