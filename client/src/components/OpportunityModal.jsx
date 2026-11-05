import React, { useState, useEffect } from 'react';
import { 
  X, 
  Building2, 
  MapPin, 
  Calendar, 
  ExternalLink, 
  Bookmark, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ListChecks, 
  GraduationCap, 
  Tag, 
  Check, 
  Copy
} from 'lucide-react';

export default function OpportunityModal({ opportunity, onClose, onToggleSave, isSaved, onUpdateChecklist }) {
  if (!opportunity) return null;

  const {
    id,
    title,
    organization,
    category,
    description,
    location,
    remote,
    deadline,
    deadlineInfo,
    eligibility,
    skills_required,
    interests,
    application_url,
    matchInfo,
    savedDetails,
    verified_on
  } = opportunity;

  // Local state for interactive application checklist
  const [checklist, setChecklist] = useState(
    opportunity.checklist_progress ||
    savedDetails?.checklist_progress || {
      resume: false,
      sop: false,
      portfolio: false,
      transcripts: false
    }
  );
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const activeChecklist = opportunity.checklist_progress || savedDetails?.checklist_progress || {
      resume: false,
      sop: false,
      portfolio: false,
      transcripts: false
    };
    setChecklist(activeChecklist);
  }, [opportunity.id, opportunity.checklist_progress, savedDetails]);

  const toggleChecklistItem = (key) => {
    const updated = { ...checklist, [key]: !checklist[key] };
    setChecklist(updated);
    if (onUpdateChecklist) {
      onUpdateChecklist(id, updated);
    }
  };

  const copyLink = () => {
    if (application_url) {
      navigator.clipboard.writeText(application_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200/80 flex flex-col"
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4 sticky top-0 bg-white/95 backdrop-blur z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                {category || 'Opportunity'}
              </span>
              {remote && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  Remote
                </span>
              )}
              {verified_on && (
                <span className="inline-flex items-center text-xs text-emerald-600 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Switch Verified
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h2>
            <div className="flex items-center text-xs font-medium text-slate-500 mt-1.5 space-x-2">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>{organization}</span>
              <span>•</span>
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{location || 'India'}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 flex-1">
          {/* Key Overview Pill Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Deadline</span>
              <p className="text-sm font-bold text-slate-800 mt-0.5">
                {deadlineInfo?.label || deadline || 'Rolling'}
              </p>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Match Score</span>
              <p className="text-sm font-bold text-indigo-600 mt-0.5">
                {matchInfo?.percentage || 'Profile Match'}
              </p>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Format</span>
              <p className="text-sm font-bold text-slate-800 mt-0.5">
                {remote ? 'Remote Online' : (location || 'On-site')}
              </p>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-2">About this Opportunity</h3>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {description}
            </p>
          </div>

          {/* Eligibility Requirements (Real from scout data) */}
          {eligibility && (
            <div className="p-4 rounded-2xl border border-slate-200/80 bg-white">
              <div className="flex items-center space-x-2 mb-3">
                <GraduationCap className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Eligibility Criteria</h3>
              </div>
              <div className="space-y-2 text-xs">
                {eligibility.years && (
                  <div className="flex items-baseline">
                    <span className="font-semibold text-slate-700 w-28 shrink-0">Eligible Years:</span>
                    <span className="text-slate-600">
                      {Array.isArray(eligibility.years) ? eligibility.years.join(', ') : eligibility.years}
                    </span>
                  </div>
                )}
                {eligibility.fields && (
                  <div className="flex items-baseline">
                    <span className="font-semibold text-slate-700 w-28 shrink-0">Eligible Branches:</span>
                    <span className="text-slate-600">
                      {Array.isArray(eligibility.fields) ? eligibility.fields.join(', ') : eligibility.fields}
                    </span>
                  </div>
                )}
                {eligibility.notes && (
                  <div className="mt-2 pt-2 border-t border-slate-100 text-slate-600 leading-relaxed">
                    <span className="font-semibold text-slate-700">Official Note: </span>
                    {eligibility.notes}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Match Reason Breakdown */}
          {matchInfo && (
            <div className={`p-4 rounded-2xl border ${
              matchInfo.isEligible 
                ? 'bg-indigo-50/50 border-indigo-100 text-indigo-950' 
                : 'bg-amber-50/50 border-amber-200 text-amber-950'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-bold">Why this matches your profile</h3>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  matchInfo.isEligible ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {matchInfo.matchLevel} ({matchInfo.percentage})
                </span>
              </div>

              {/* Academic checks */}
              <div className="mt-2 space-y-1.5 text-xs">
                {matchInfo.breakdown?.field && (
                  <div className="flex items-start space-x-1.5">
                    <span className="font-semibold text-slate-700 w-24 shrink-0">Branch Check:</span>
                    <span className={matchInfo.breakdown.field.matched ? 'text-emerald-700 font-medium' : 'text-rose-700 font-medium'}>
                      {matchInfo.breakdown.field.matched ? '✓ ' : '✗ '}{matchInfo.breakdown.field.reason}
                    </span>
                  </div>
                )}
                {matchInfo.breakdown?.year && (
                  <div className="flex items-start space-x-1.5">
                    <span className="font-semibold text-slate-700 w-24 shrink-0">Year Check:</span>
                    <span className={matchInfo.breakdown.year.matched ? 'text-emerald-700 font-medium' : 'text-amber-800 font-medium'}>
                      {matchInfo.breakdown.year.matched ? '✓ ' : '✗ '}{matchInfo.breakdown.year.reason}
                    </span>
                  </div>
                )}
              </div>

              {matchInfo.breakdown?.skills?.matched?.length > 0 && (
                <div className="mt-3 pt-2 border-t border-indigo-100 flex flex-wrap gap-1.5 items-center">
                  <span className="text-[11px] font-semibold text-slate-600 mr-1">Matching Skills:</span>
                  {matchInfo.breakdown.skills.matched.map((s, i) => (
                    <span key={i} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      ✓ {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Interactive Application Guidance Checklist */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50">
            <div className="flex items-center space-x-2 mb-3">
              <ListChecks className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Application Preparation Checklist</h3>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Check off tasks as you prepare. Progress is automatically saved for you.
            </p>
            <div className="space-y-2">
              {[
                { key: 'resume', label: 'Tailor Resume/CV for this opportunity' },
                { key: 'sop', label: 'Prepare Statement of Purpose or application answers' },
                { key: 'portfolio', label: 'Review GitHub repositories and portfolio links' },
                { key: 'transcripts', label: 'Gather official marksheets and credentials' }
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex items-center space-x-3 p-2.5 rounded-xl bg-white border border-slate-200 cursor-pointer hover:border-indigo-300 transition-colors select-none"
                >
                  <input
                    type="checkbox"
                    checked={checklist[item.key] || false}
                    onChange={() => toggleChecklistItem(item.key)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <span className={`text-xs font-medium ${
                    checklist[item.key] ? 'line-through text-slate-400' : 'text-slate-700'
                  }`}>
                    {item.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer / Action Buttons */}
        <div className="p-5 border-t border-slate-100 bg-slate-50 rounded-b-3xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onToggleSave(id)}
              className={`inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-colors ${
                isSaved
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-white' : ''}`} />
              <span>{isSaved ? 'Saved to Applications' : 'Save Opportunity'}</span>
            </button>

            <button
              onClick={copyLink}
              title="Copy official application URL"
              className="p-2.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {application_url && (
            <a
              href={application_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-500/20 transition-all hover:scale-[1.02]"
            >
              <span>Apply on Official Website</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
