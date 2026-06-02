import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getCountFromServer, getAggregateFromServer, sum, average, Timestamp } from 'firebase/firestore';

export interface GlobalStats {
  totalTopics: number;
  totalQuestions: number;
  totalSessions: number;
  totalStudyTimeSeconds: number;
  avgConfidence: number;
  avgRecall: number;
  totalRevisions: number;
  dueTopics: number;
  overdueTopics: number;
  loading: boolean;
}

export function useGlobalStats(userId: string | undefined) {
  const [stats, setStats] = useState<GlobalStats>({
    totalTopics: 0,
    totalQuestions: 0,
    totalSessions: 0,
    totalStudyTimeSeconds: 0,
    avgConfidence: 50,
    avgRecall: 45,
    totalRevisions: 0,
    dueTopics: 0,
    overdueTopics: 0,
    loading: true
  });

  useEffect(() => {
    if (!userId) {
      setStats(s => ({ ...s, loading: false }));
      return;
    }

    const fetchStats = async () => {
      try {
        // Topics aggregation
        const topicsQuery = query(collection(db, 'topics'), where('userId', '==', userId));
        const topicsAgg = await getAggregateFromServer(topicsQuery, {
          avgConf: average('confidenceScore'),
          avgRec: average('recallScore'),
          totalRev: sum('revisionCount')
        });
        
        const topicsCountObj = await getCountFromServer(topicsQuery);
        const totalTopics = topicsCountObj.data().count;

        // Due/Overdue topics
        const now = new Date().toISOString();
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        
        const overdueQuery = query(collection(db, 'topics'), where('userId', '==', userId), where('nextRevisionDate', '<', now));
        const overdueCountObj = await getCountFromServer(overdueQuery);
        
        const dueQuery = query(collection(db, 'topics'), where('userId', '==', userId), where('nextRevisionDate', '>=', now), where('nextRevisionDate', '<', tomorrow));
        const dueCountObj = await getCountFromServer(dueQuery);

        // Questions count
        const qQuery = query(collection(db, 'questions'), where('userId', '==', userId));
        const qCountObj = await getCountFromServer(qQuery);

        // Sessions aggregation
        const sessQuery = query(collection(db, 'studySessions'), where('userId', '==', userId));
        const sessCountObj = await getCountFromServer(sessQuery);
        const sessAgg = await getAggregateFromServer(sessQuery, {
          totalDuration: sum('durationSeconds')
        });

        setStats({
          totalTopics,
          totalQuestions: qCountObj.data().count,
          totalSessions: sessCountObj.data().count,
          totalStudyTimeSeconds: sessAgg.data().totalDuration || 0,
          avgConfidence: topicsAgg.data().avgConf || 50,
          avgRecall: topicsAgg.data().avgRec || 45,
          totalRevisions: topicsAgg.data().totalRev || 0,
          dueTopics: dueCountObj.data().count,
          overdueTopics: overdueCountObj.data().count,
          loading: false
        });

      } catch (err) {
        console.error("Failed to fetch global aggregations:", err);
        setStats(s => ({ ...s, loading: false }));
      }
    };

    fetchStats();
    
    // Refresh stats every 30 seconds to keep them roughly up to date without massive reads
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  return stats;
}
