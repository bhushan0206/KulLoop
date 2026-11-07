import React, { useState, useEffect } from 'react';
import { apiUrl } from '../utils/apiBase';
import { 
  Database, 
  HardDrive, 
  RefreshCw, 
  Download, 
  CheckCircle2, 
  FileCode, 
  X, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  Server,
  Layers
} from 'lucide-react';
import { fetchDbStatus, resetDatabaseToDefaults, DbStatusResponse } from '../services/api';

interface DatabaseStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDatabaseReset?: () => void;
}

export const DatabaseStatusModal: React.FC<DatabaseStatusModalProps> = ({
  isOpen,
  onClose,
  onDatabaseReset,
}) => {
  const [status, setStatus] = useState<DbStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const loadStatus = async () => {
    setLoading(true);
    const res = await fetchDbStatus();
    setStatus(res);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadStatus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDownloadSqlite = () => {
    window.location.href = '/api/db/export/sqlite-sql';
  };

  const handleDownloadJson = async () => {
    try {
      const res = await fetch(apiUrl('/api/db/all'));
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kulloop_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to export JSON backup:', e);
    }
  };

  const handleReset = async () => {
    if (confirm('Reset the database to an empty family template? Your saved occasions and members in the JSON store will be cleared.')) {
      setResetting(true);
      const ok = await resetDatabaseToDefaults();
      setResetting(false);
      if (ok) {
        await loadStatus();
        if (onDatabaseReset) onDatabaseReset();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-stone-100 p-5 flex items-start justify-between border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-300">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-amber-200 font-serif-display">
                  Persistent Storage Engine
                </h3>
                <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Active & File-Backed
                </span>
              </div>
              <p className="text-xs text-stone-300 mt-0.5">
                Disk persistence enabled — real storage replacing transient mock data
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-200 p-1 rounded-lg hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          {/* File Storage Specs Card */}
          <div className="bg-stone-50 border border-stone-200/90 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-stone-600 font-medium">
              <div className="flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-amber-600" />
                <span>Backend File System Path</span>
              </div>
              <span className="font-mono text-stone-500 bg-stone-200/60 px-2 py-0.5 rounded text-[11px]">
                Node / Express / Linux FS
              </span>
            </div>

            <div className="bg-stone-900 text-stone-100 font-mono text-xs p-3 rounded-lg flex items-center justify-between overflow-x-auto">
              <span className="text-amber-300 select-all">
                {status?.persistenceFile || '/data/kulloop_store.json'}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(status?.persistenceFile || '/data/kulloop_store.json');
                  setCopySuccess(true);
                  setTimeout(() => setCopySuccess(false), 2000);
                }}
                className="ml-3 text-[11px] text-stone-400 hover:text-stone-200 bg-stone-800 px-2 py-1 rounded transition-colors shrink-0"
              >
                {copySuccess ? 'Copied!' : 'Copy Path'}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center">
              <div className="bg-white border border-stone-200 rounded-lg p-2.5">
                <div className="text-[10px] text-stone-400 uppercase font-semibold">Occasions</div>
                <div className="text-lg font-bold text-stone-900 mt-0.5 font-mono">
                  {status?.recordsCount?.occasions ?? '...'}
                </div>
              </div>
              <div className="bg-white border border-stone-200 rounded-lg p-2.5">
                <div className="text-[10px] text-stone-400 uppercase font-semibold">Members</div>
                <div className="text-lg font-bold text-stone-900 mt-0.5 font-mono">
                  {status?.recordsCount?.members ?? '...'}
                </div>
              </div>
              <div className="bg-white border border-stone-200 rounded-lg p-2.5">
                <div className="text-[10px] text-stone-400 uppercase font-semibold">Lineage</div>
                <div className="text-lg font-bold text-stone-900 mt-0.5 font-mono">
                  {status?.recordsCount?.lineageMembers ?? '...'}
                </div>
              </div>
              <div className="bg-white border border-stone-200 rounded-lg p-2.5">
                <div className="text-[10px] text-stone-400 uppercase font-semibold">Audit Logs</div>
                <div className="text-lg font-bold text-amber-700 mt-0.5 font-mono">
                  {status?.auditLogCount ?? '...'}
                </div>
              </div>
            </div>
          </div>

          {/* Sync & Health Details */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-stone-600 pb-1 border-b border-stone-100">
              <span className="flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-stone-400" />
                Storage Driver:
              </span>
              <span className="font-semibold text-stone-800">
                {status?.driver || 'file-json-persistent-engine'}
              </span>
            </div>

            <div className="flex items-center justify-between text-stone-600 pb-1 border-b border-stone-100">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-stone-400" />
                Last Saved to Disk:
              </span>
              <span className="font-mono text-stone-800">
                {status?.lastSavedAt ? new Date(status.lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Just now'}
              </span>
            </div>

            <div className="flex items-center justify-between text-stone-600 pb-1 border-b border-stone-100">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Data Safety:
              </span>
              <span className="text-emerald-700 font-medium">
                Atomic Temp-File Swap (Zero Partial Writes)
              </span>
            </div>
          </div>

          {/* SQLite & Export Options */}
          <div className="bg-amber-50/70 border border-amber-200/90 rounded-xl p-4 space-y-3">
            <div className="flex items-start gap-2.5">
              <FileCode className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-950">
                  SQLite SQL Schema & DML Export
                </h4>
                <p className="text-[11px] text-amber-900/80 mt-0.5 leading-relaxed">
                  Export complete relational SQL schema and all data as an SQLite-compatible `.sql` file for direct loading into SQLite3 or relational database clients.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                onClick={handleDownloadSqlite}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-200/80 hover:bg-amber-300/80 border border-amber-300 rounded-lg transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Download SQLite (.sql)
              </button>
              <button
                onClick={handleDownloadJson}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-white hover:bg-stone-100 border border-stone-300 rounded-lg transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Download JSON Backup
              </button>
              <button
                onClick={loadStatus}
                disabled={loading}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-stone-600 hover:text-stone-900 hover:bg-stone-200/50 rounded-lg transition-colors ml-auto cursor-pointer"
                title="Refresh database status"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-stone-50 px-5 py-3 border-t border-stone-200 flex items-center justify-between text-xs">
          <button
            onClick={handleReset}
            disabled={resetting}
            className="text-stone-500 hover:text-red-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-stone-400" />
            <span>{resetting ? 'Resetting...' : 'Reset to Default Seed Data'}</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-900 hover:bg-stone-800 text-stone-100 rounded-lg font-medium transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
