import React, { useState, useEffect } from 'react';
import { collection, doc, setDoc, getDocs, deleteDoc, query, where, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Cloud, RotateCcw, Save, Trash2, Calendar, FileJson, Check, AlertTriangle, Play, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CloudBackupControlsProps {
  userId: string;
  currentData: {
    topics: any[];
    questions: any[];
    applications: any[];
    interviews: any[];
    mistakes: any[];
    sessions: any[];
    voiceRecordings: any[];
    notifications: any[];
    intelliQuestions: any[];
  };
  onRestore: (data: any) => void;
  onPushNotification: (params: { title: string; message: string; type: 'revision' | 'weakness' | 'interview' | 'daily' }) => void;
}

interface Backup {
  id: string;
  userId: string;
  date: string;
  name: string;
  counts: {
    topics: number;
    questions: number;
    applications: number;
    interviews: number;
    mistakes: number;
    sessions: number;
    voiceRecordings: number;
    intelliQuestions: number;
  };
  data: any;
}

export default function CloudBackupControls({ userId, currentData, onRestore, onPushNotification }: CloudBackupControlsProps) {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(false);
  const [backupName, setBackupName] = useState('');
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [rulesMismatched, setRulesMismatched] = useState(false);

  const fetchBackups = async () => {
    if (!userId) return;
    try {
      const q = query(collection(db, 'backups'), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      const fetched: Backup[] = [];
      snapshot.forEach((doc) => {
        fetched.push(doc.data() as Backup);
      });
      // Sort by date descending
      fetched.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setBackups(fetched);
      setRulesMismatched(false);
    } catch (err: any) {
      if (err.code === 'permission-denied' || err.message?.includes('permission')) {
        console.warn("Cloud backups fetch blocked by Firestore security rules. Rules deployment or authentication sync is required.");
        setRulesMismatched(true);
      } else {
        console.error("fetchBackups error:", err);
      }
    }
  };

  useEffect(() => {
    if (userId) {
      fetchBackups();
    }
  }, [userId]);

  // Handle Manual/Auto Backup creation
  const handleCreateBackup = async (customName?: string) => {
    const finalName = customName || backupName.trim() || `Manual Snapshot - ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
    setLoading(true);
    setActionStatus('Creating Cloud Backup point...');
    
    const backupId = 'backup-' + Date.now();
    const newBackup: Backup = {
      id: backupId,
      userId,
      date: new Date().toISOString(),
      name: finalName,
      counts: {
        topics: currentData.topics.length,
        questions: currentData.questions.length,
        applications: currentData.applications.length,
        interviews: currentData.interviews.length,
        mistakes: currentData.mistakes.length,
        sessions: currentData.sessions.length,
        voiceRecordings: currentData.voiceRecordings.length,
        intelliQuestions: currentData.intelliQuestions.length
      },
      data: {
        topics: currentData.topics,
        questions: currentData.questions,
        applications: currentData.applications,
        interviews: currentData.interviews,
        mistakes: currentData.mistakes,
        sessions: currentData.sessions,
        voiceRecordings: currentData.voiceRecordings,
        notifications: currentData.notifications,
        intelliQuestions: currentData.intelliQuestions
      }
    };

    try {
      await setDoc(doc(db, 'backups', backupId), newBackup);
      onPushNotification({
        title: 'Restore Point Registered',
        message: `Cloud backup state "${finalName}" uploaded successfully.`,
        type: 'daily'
      });
      setBackupName('');
      setActionStatus('Backup saved successfully!');
      setTimeout(() => setActionStatus(null), 3000);
      fetchBackups();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `backups/${backupId}`);
    } finally {
      setLoading(false);
    }
  };

  // Trigger auto backup (throttled/checked)
  const triggerAutoBackupIfNeeded = async () => {
    // If no backups exist, or the last backup was > 30 minutes ago, auto-backup
    if (backups.length === 0) {
      handleCreateBackup('Initial Automated Backup');
      return;
    }
    const lastBackup = new Date(backups[0].date);
    const diffMins = (new Date().getTime() - lastBackup.getTime()) / (1000 * 60);
    if (diffMins > 30) {
      handleCreateBackup(`Scheduled Auto-Backup [Interval System]`);
    }
  };

  // Trigger on load
  useEffect(() => {
    if (userId && backups.length > 0) {
      // Check if auto backup is due
      const timer = setTimeout(() => {
        triggerAutoBackupIfNeeded();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [userId, backups.length]);

  // Restore state from backup
  const handleRestoreBackup = async (backup: Backup) => {
    if (!window.confirm(`Are you absolutely sure you want to restore to "${backup.name}"? This will overwrite your active database with the elements from ${new Date(backup.date).toLocaleString()}.`)) {
      return;
    }

    setLoading(true);
    setActionStatus(`Restoring snapshot indices...`);

    try {
      // Upload arrays to firestore in a batch or update state directly
      onRestore(backup.data);
      
      onPushNotification({
        title: 'Restore Done',
        message: `Candidate space successfully rewound to "${backup.name}".`,
        type: 'daily'
      });
      setActionStatus('Success: State recovered!');
      setTimeout(() => setActionStatus(null), 3000);
    } catch (err) {
      console.error(err);
      setActionStatus('Restore failed.');
    } finally {
      setLoading(false);
    }
  };

  // Delete Backup record
  const handleDeleteBackup = async (backupId: string) => {
    if (!window.confirm('Delete this restore point permanently?')) return;
    try {
      await deleteDoc(doc(db, 'backups', backupId));
      setBackups(backups.filter(b => b.id !== backupId));
      onPushNotification({
        title: 'Backup Purged',
        message: 'Deleted snapshot from cloud catalog.',
        type: 'daily'
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `backups/${backupId}`);
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Cloud className="w-5 h-5 text-indigo-400" />
            Cloud Backup & Disaster Recovery
          </h3>
          <p className="text-xs text-slate-400">
            Secure cloud-based restore points, automated incremental rollbacks, and recovery triggers
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fetchBackups()}
            className="p-2 bg-slate-850 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reload Index
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {rulesMismatched && (
          <div className="md:col-span-3 bg-amber-500/10 border border-amber-500/25 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-450">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500 mt-0.5 animate-pulse" />
            <div className="space-y-1 text-left">
              <span className="font-bold block uppercase tracking-wider text-[10px] font-mono">Cloud Sync Suspended (Action Required)</span>
              <p className="text-slate-400 leading-relaxed">
                Firestore reports `permission-denied` for the backups collection. This occurs because the local security rules are not active on your remote Firebase project yet. Please run <code className="text-amber-300 font-mono bg-slate-950/40 px-1 py-0.5 rounded">firebase deploy --only firestore:rules</code> in your project root or configure your cloud database rules manually in the Firebase console to enable cloud backups.
              </p>
            </div>
          </div>
        )}
        {/* Save/Manual backup column */}
        <div className="md:col-span-1 bg-slate-950/40 rounded-xl p-4 border border-slate-800/80 flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-1.5 mb-2">
              <Save className="w-4 h-4 text-emerald-400" />
              Manual Restore Point
            </h4>
            <p className="text-xs text-slate-400 mb-4">
              Export your precise spacing metrics, mistakes ledger, and logs into a recoverable state.
            </p>
            <input
              type="text"
              placeholder="e.g. Milestone Post-Revision Complete"
              value={backupName}
              onChange={(e) => setBackupName(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-lg text-white focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-500 mb-3"
            />
          </div>
          <button
            onClick={() => handleCreateBackup()}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-indigo-600/90 hover:bg-indigo-500 text-white font-medium text-xs rounded-lg cursor-pointer flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-indigo-500/20 transition-all disabled:opacity-50"
          >
            <Cloud className="w-4 h-4" />
            Push Cloud Snapshot
          </button>
        </div>

        {/* Backups Catalogue */}
        <div className="md:col-span-2">
          <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-1.5 mb-3">
            <FileJson className="w-4 h-4 text-indigo-400" />
            Cloud Backups & Restore Points ({backups.length})
          </h4>

          <AnimatePresence mode="popLayout">
            {backups.length === 0 ? (
              <div className="bg-slate-950/20 border border-dashed border-slate-800 rounded-xl p-8 text-center text-slate-500">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30 text-indigo-400" />
                <p className="text-xs font-medium">No available cloud snapshots found</p>
                <p className="text-[10px] mt-1 text-slate-600">The automation agent will create initial restore points as soon as actions occur.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                {backups.map((backup) => (
                  <motion.div
                    key={backup.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-slate-950/40 border border-slate-800/80 rounded-lg p-3 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-slate-100">{backup.name}</span>
                        {backup.name.includes('Auto') && (
                          <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded">Auto</span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 text-[10px] text-slate-500">
                        <span className="flex items-center gap-0.5">
                          <Calendar className="w-3 h-3" />
                          {new Date(backup.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                        <span>•</span>
                        <span className="text-slate-400">
                          {backup.counts.topics} topics | {backup.counts.questions} questions | {backup.counts.interviews} interviews | {backup.counts.voiceRecordings} recordings
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleRestoreBackup(backup)}
                        disabled={loading}
                        title="Restore to this snapshot point"
                        className="p-1 px-2.5 bg-indigo-900/30 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-500/20 rounded text-[10px] font-medium cursor-pointer flex items-center gap-1 transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Restore
                      </button>
                      <button
                        onClick={() => handleDeleteBackup(backup.id)}
                        title="Delete record from index"
                        className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {actionStatus && (
        <div className="mt-4 bg-slate-950/60 border border-indigo-500/20 rounded-lg p-2.5 flex items-center gap-2 text-xs text-indigo-300 animate-pulse">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>{actionStatus}</span>
        </div>
      )}
    </div>
  );
}
