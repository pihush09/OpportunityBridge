import React from 'react';
import { 
  Building2, 
  MapPin, 
  Calendar, 
  Bookmark, 
  ExternalLink, 
  CheckCircle2, 
  Flame, 
  AlertTriangle,
  GraduationCap
} from 'lucide-react';

export default function OpportunityCard({ opportunity, onSelect, onToggleSave, isSaved }) {
  const {
    title,
    organization,
    category,
    description,
    location,
    remote,
    deadline,
    deadlineInfo,
    matchInfo,
    skills_required,
    application_url,
    verified_on
  } = opportunity;

  // Category Theme
  const getCategoryTheme = (cat) => {
    switch ((cat || '').toLowerCase()) {
      case 'internship':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'scholarship':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'hackathon':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'competition':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
  };

  // Match Level Badge styling
  const renderMatchBadge = () => {
    if (!matchInfo) return null;

    if (!matchInfo.isEligible) {
      return (
        <span className="inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
          <AlertTriangle className="w-3 h-3 mr-1 text-amber-600" />
          {matchInfo.matchLevel || 'Criteria Unmet'} ({matchInfo.percentage})
        </span>
      );
    }

    if (matchInfo.score >= 70) {
      return (
        <span className="inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
          ★ {matchInfo.matchLevel} ({matchInfo.percentage})
        </span>
      );
    }

    if (matchInfo.score >= 50) {
      return (
        <span className="inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
          {matchInfo.matchLevel} ({matchInfo.percentage})
        </span>
      );
    }

    return (
      <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
        {matchInfo.percentage} Match
      </span>
    );
  };

  // Deadline styling
  const renderDeadlineBadge = () => {
    if (!deadlineInfo) return null;
    if (deadlineInfo.status === 'rolling') {
      return (
        <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          <Calendar className="w-3.5 h-3.5 mr-1" />
          Rolling
        </span>
      );
    }
    if (deadlineInfo.isUrgent) {
      return (
        <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
          <Flame className="w-3.5 h-3.5 mr-1 text-rose-500" />
          {deadlineInfo.label}
        </span>
      );
    }
    if (deadlineInfo.isExpired) {
      return (
        <span className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
          Expired
        </span>
      );
    }
    return (
      <span className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
        <Calendar className="w-3.5 h-3.5 mr-1 text-slate-500" />
        Due {deadline} ({deadlineInfo.label})
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 hover:border-indigo-300 p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
      <div>
        {/* Card Header: Category & Save Bookmark */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${getCategoryTheme(category)}`}>
              {category || 'Opportunity'}
            </span>
            {remote && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                Remote
              </span>
            )}
            {verified_on && (
              <span className="inline-flex items-center text-[10px] text-slate-400 font-medium" title="Verified by Switch Scout">
                <CheckCircle2 className="w-3 h-3 text-emerald-500 mr-0.5" /> Verified
              </span>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSave(opportunity.id);
            }}
            title={isSaved ? 'Remove from Saved' : 'Save Opportunity'}
            className={`p-2 rounded-xl transition-colors ${
              isSaved
                ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-indigo-600' : ''}`} />
          </button>
        </div>

        {/* Title & Organization */}
        <h3 
          onClick={() => onSelect(opportunity)}
          className="font-bold text-base text-slate-900 group-hover:text-indigo-600 transition-colors cursor-pointer line-clamp-2"
        >
          {title}
        </h3>
        
        <div className="flex items-center text-xs font-medium text-slate-500 mt-1.5 space-x-1">
          <Building2 className="w-3.5 h-3.5 shrink-0 text-slate-400" />
          <span className="truncate">{organization}</span>
          <span className="text-slate-300">•</span>
          <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
          <span>{location || 'India'}</span>
        </div>

        {/* Description snippet */}
        <p className="mt-3 text-xs text-slate-600 line-clamp-2 leading-relaxed">
          {description}
        </p>

        {/* Tags / Skills Preview */}
        {skills_required && skills_required.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {skills_required.slice(0, 3).map((tag, idx) => (
              <span key={idx} className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-50 text-slate-600 border border-slate-100">
                {tag}
              </span>
            ))}
            {skills_required.length > 3 && (
              <span className="text-[10px] text-slate-400 self-center">
                +{skills_required.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Card Footer: Match Pill, Deadline & Action CTA */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
        {/* Match Pill */}
        <div>{renderMatchBadge()}</div>

        {/* Deadline Badge */}
        <div>{renderDeadlineBadge()}</div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => onSelect(opportunity)}
            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold transition-colors flex items-center space-x-1"
          >
            <span>Details</span>
          </button>
          {application_url && (
            <a
              href={application_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              title="Open Official Website"
              className="p-1.5 rounded-xl border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-300 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
