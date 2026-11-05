import React, { useState, useEffect } from 'react';
import { 
  X, 
  Bot, 
  CheckCircle2, 
  RefreshCw, 
  FolderCheck, 
  MessageSquare, 
  Database,
  ArrowRight,
  Sparkles,
  Send,
  AlertCircle,
  Clock,
  ExternalLink,
  Layers,
  FileCheck,
  FileText
} from 'lucide-react';
import { 
  syncSwitchOpportunities, 
  requestSwitchOpportunities, 
  getSwitchLogs, 
  getSwitchHistory,
  getAvailableShortlists 
} from '../services/api';

export default function SwitchStatusModal({ 
  isOpen, 
  onClose, 
  systemStatus, 
  onDataReloaded,
  profile 
}) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'shortlists' | 'messages' | 'logs'
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [statusType, setStatusType] = useState('info'); // 'info' | 'success' | 'error'

  const [roomMessages, setRoomMessages] = useState([]);
  const [syncLogs, setSyncLogs] = useState([]);
  const [shortlists, setShortlists] = useState([]);
  const [selectedShortlist, setSelectedShortlist] = useState('');
  const [customFilename, setCustomFilename] = useState('');
  const [syncResultDetails, setSyncResultDetails] = useState(null);
  const [loadingData, setLoadingData] = useState(false);

  // Search input for custom scout request
  const [customQuery, setCustomQuery] = useState('');

  // Fetch telemetry whenever modal opens
  useEffect(() => {
    if (isOpen) {
      loadTelemetry();
    }
  }, [isOpen]);

  const loadTelemetry = async () => {
    setLoadingData(true);
    try {
      const [historyRes, logsRes, shortlistsRes] = await Promise.all([
        getSwitchHistory(15),
        getSwitchLogs(),
        getAvailableShortlists()
      ]);
      setRoomMessages(historyRes?.events || []);
      setSyncLogs(logsRes || []);
      setShortlists(shortlistsRes || []);
      
      if (shortlistsRes?.length > 0) {
        // Default to a non-default shortlist if available
        const preferred = shortlistsRes.find(s => !s.isDefault) || shortlistsRes[0];
        setSelectedShortlist(prev => prev || preferred.filename);
      }
    } catch (err) {
      console.error('Failed to load Switch telemetry:', err);
    } finally {
      setLoadingData(false);
    }
  };

  if (!isOpen) return null;

  // Handle Sync Scout Opportunities
  const handleSync = async (filenameToSync = null) => {
    setIsSyncing(true);
    setStatusMessage(null);
    setSyncResultDetails(null);
    try {
      const targetFile = filenameToSync || customFilename.trim() || selectedShortlist || undefined;
      const res = await syncSwitchOpportunities(targetFile);
      if (res.success) {
        setStatusType('success');
        setStatusMessage(res.message);
        setSyncResultDetails(res);
        await loadTelemetry();
        if (onDataReloaded) onDataReloaded();
      } else {
        setStatusType('error');
        setStatusMessage(`Sync failed: ${res.error || 'Could not import shortlist'}`);
      }
    } catch (err) {
      setStatusType('error');
      setStatusMessage(`Sync exception: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle Request Fresh Opportunities
  const handleRequestScout = async () => {
    setIsRequesting(true);
    setStatusMessage(null);
    try {
      const res = await requestSwitchOpportunities({
        query: customQuery.trim() || undefined,
        category: 'all'
      });
      if (res.success) {
        setStatusType(res.deduplicated ? 'info' : 'success');
        setStatusMessage(res.message || (res.deduplicated ? 'Request deduplicated safely.' : 'Request dispatched to @bridge-coordinator!'));
        setCustomQuery('');
        setTimeout(loadTelemetry, 1500);
      } else {
        setStatusType('error');
        setStatusMessage(`Request failed: ${res.error || 'Failed to dispatch'}`);
      }
    } catch (err) {
      setStatusType('error');
      setStatusMessage(`Request error: ${err.message}`);
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/90">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-slate-900">Switch Multi-Agent Hub</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Live Connected
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Mattermost & Agent Room: <code className="font-mono text-indigo-700">OpportunityBridge</code></p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 pt-3 border-b border-slate-200/80 bg-slate-50/50 flex space-x-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Agent Overview
          </button>
          <button
            onClick={() => setActiveTab('shortlists')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === 'shortlists'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Sync Shortlists</span>
            {shortlists.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                {shortlists.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === 'messages'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Room Messages</span>
            {roomMessages.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 text-indigo-700 font-bold">
                {roomMessages.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === 'logs'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Sync History</span>
            {syncLogs.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700 font-bold">
                {syncLogs.length}
              </span>
            )}
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {statusMessage && (
            <div className={`p-3 rounded-2xl text-xs font-medium flex items-center space-x-2 animate-in fade-in ${
              statusType === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : statusType === 'error'
                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
            }`}>
              {statusType === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />}
              {statusType === 'error' && <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />}
              {statusType === 'info' && <Clock className="w-4 h-4 shrink-0 text-indigo-600" />}
              <span className="flex-1">{statusMessage}</span>
            </div>
          )}

          {/* Sync Result Breakdown Banner */}
          {syncResultDetails && (
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold text-slate-800">
                <span>Import Summary for: <code className="text-indigo-600">{syncResultDetails.filename}</code></span>
                <span className="text-[11px] text-slate-500">DB Total: {syncResultDetails.totalInDatabase}</span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-semibold text-[11px]">
                  ✓ {syncResultDetails.newlyImported} Newly Imported
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold text-[11px]">
                  ↷ {syncResultDetails.duplicatesSkipped} Duplicates Skipped
                </span>
                {syncResultDetails.rejected?.length > 0 && (
                  <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 font-semibold text-[11px]">
                    ✗ {syncResultDetails.rejected.length} Rejected
                  </span>
                )}
              </div>
              {syncResultDetails.rejected?.length > 0 && (
                <div className="mt-2 p-2 rounded-xl bg-rose-50 border border-rose-200 text-[11px] text-rose-800 space-y-1">
                  <span className="font-bold">Rejected Entries:</span>
                  {syncResultDetails.rejected.map((rej, i) => (
                    <div key={i}>• {rej.title}: {rej.reason}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                OpportunityBridge collaborates with autonomous Switch agents in Mattermost. <strong>bridge-coordinator</strong> coordinates search directives, while <strong>opportunity-scout</strong> validates live opportunities before writing them to the shared workspace.
              </p>

              {/* Agent Cards */}
              <div className="space-y-2.5">
                {/* Bridge Coordinator */}
                <div className="p-3.5 rounded-2xl border border-slate-200 bg-white flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                      BC
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-bold text-slate-900">bridge-coordinator</span>
                        <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-indigo-100 text-indigo-800">
                          Orchestrator
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">Coordinates workflow, reviews data contract & assigns tasks</p>
                    </div>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>

                {/* Opportunity Scout */}
                <div className="p-3.5 rounded-2xl border border-slate-200 bg-white flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                      OS
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-bold text-slate-900">opportunity-scout</span>
                        <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                          Researcher
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">Searches & verifies deadlines, links and eligibility in dataset</p>
                    </div>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>

                {/* Mattermost Room */}
                <div className="p-3.5 rounded-2xl border border-slate-200 bg-white flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900">Mattermost Room</span>
                      <p className="text-[11px] text-slate-500">Channel: <code className="text-slate-800 font-semibold font-mono">OpportunityBridge</code> (Port 60994)</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                    Synchronized
                  </span>
                </div>
              </div>

              {/* Request New Opportunities Box */}
              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-3">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-xs font-bold text-indigo-900">Send Search Directive to bridge-coordinator</h4>
                </div>
                <p className="text-[11px] text-indigo-700 leading-relaxed">
                  Dispatches student profile context (<strong>{profile?.branch || 'IT'}</strong>, Year {profile?.year_of_study || 2}) into the Switch room to trigger agent scouting.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customQuery}
                    onChange={(e) => setCustomQuery(e.target.value)}
                    placeholder="Optional keywords (e.g. Robotics, AI internships)"
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-indigo-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800"
                  />
                  <button
                    onClick={handleRequestScout}
                    disabled={isRequesting}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isRequesting ? 'Dispatching...' : 'Dispatch Request'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'shortlists' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Scout Workspace Shortlists</h4>
                  <p className="text-[11px] text-slate-500">Import targeted shortlists created by opportunity-scout</p>
                </div>
                <button
                  onClick={loadTelemetry}
                  disabled={loadingData}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
                >
                  <RefreshCw className={`w-3 h-3 ${loadingData ? 'animate-spin' : ''}`} />
                  <span>Rescan Workspace</span>
                </button>
              </div>

              {/* Shortlist File Selector */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                <label className="block text-xs font-semibold text-slate-700">
                  Select available scout shortlist:
                </label>
                {shortlists.length > 0 ? (
                  <select
                    value={selectedShortlist}
                    onChange={(e) => {
                      setSelectedShortlist(e.target.value);
                      setCustomFilename('');
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-mono text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  >
                    {shortlists.map(s => (
                      <option key={s.filename} value={s.filename}>
                        {s.filename} ({Math.round(s.size / 1024)} KB) {s.isDefault ? '[Default Catalog]' : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs text-slate-400">No shortlist files detected in scout workspace.</p>
                )}

                <div className="pt-2 border-t border-slate-200">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Or specify a custom shortlist filename:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={customFilename}
                      onChange={(e) => setCustomFilename(e.target.value)}
                      placeholder="e.g. piyuuu-robotics-space.json"
                      className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-mono text-slate-800 focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      onClick={() => handleSync(customFilename.trim() || selectedShortlist)}
                      disabled={isSyncing || (!customFilename.trim() && !selectedShortlist)}
                      className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors shrink-0"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>{isSyncing ? 'Importing...' : 'Sync This Shortlist'}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
                <strong>Safety Guarantee:</strong> Syncing a shortlist preserves all original 15 opportunities, verifies every record, drops invalid entries, prevents duplicates, and protects student bookmarks and application checklist progress.
              </div>
            </div>
          )}

          {activeTab === 'messages' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Genuine Room Activity</span>
                <button
                  onClick={loadTelemetry}
                  disabled={loadingData}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
                >
                  <RefreshCw className={`w-3 h-3 ${loadingData ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {roomMessages.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 border border-slate-200 rounded-2xl bg-slate-50">
                  No room messages recorded yet.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                  {roomMessages.map((msg, idx) => {
                    const isCoordinator = msg.sender_name === 'bridge-coordinator';
                    const isScout = msg.sender_name === 'opportunity-scout';
                    return (
                      <div 
                        key={idx}
                        className={`p-3 rounded-2xl border text-xs space-y-1 ${
                          isCoordinator
                            ? 'bg-indigo-50/50 border-indigo-100'
                            : isScout
                            ? 'bg-emerald-50/50 border-emerald-100'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`font-bold ${
                            isCoordinator ? 'text-indigo-700' : isScout ? 'text-emerald-700' : 'text-slate-700'
                          }`}>
                            {msg.sender_name || 'Agent'}
                          </span>
                          {msg.timestamp && (
                            <span className="text-[10px] text-slate-400">
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-700 whitespace-pre-wrap leading-relaxed font-sans text-[11px]">
                          {msg.body}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Database Synchronization Logs</span>
                <button
                  onClick={loadTelemetry}
                  disabled={loadingData}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
                >
                  <RefreshCw className={`w-3 h-3 ${loadingData ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {syncLogs.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 border border-slate-200 rounded-2xl bg-slate-50">
                  No sync events logged yet.
                </div>
              ) : (
                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                  {syncLogs.map((log) => (
                    <div key={log.id} className="p-3 rounded-2xl border border-slate-200 bg-white text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-800">{log.event_type}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                            log.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' :
                            log.status === 'SENT' ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {log.status}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(log.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600">{log.details}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleSync(customFilename.trim() || selectedShortlist)}
              disabled={isSyncing}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : `Sync ${customFilename.trim() || selectedShortlist || 'Scout Data'}`}</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
