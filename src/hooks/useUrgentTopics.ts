import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { Topic } from '../types';

export function useUrgentTopics(userId: string | undefined) {
  const [urgentTopics, setUrgentTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setUrgentTopics([]);
      setLoading(false);
      return;
    }

    const fetchUrgentTopics = async () => {
      try {
        const now = new Date().toISOString();
        
        // Fetch up to 50 topics that are due or overdue, sorted by nextRevisionDate
        const urgentQuery = query(
          collection(db, 'topics'), 
          where('userId', '==', userId), 
          where('nextRevisionDate', '<', now),
          orderBy('nextRevisionDate', 'asc'),
          limit(50)
        );

        const snapshot = await getDocs(urgentQuery);
        const list: Topic[] = [];
        snapshot.forEach(doc => {
          list.push(doc.data() as Topic);
        });

        setUrgentTopics(list);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch urgent topics:", err);
        setLoading(false);
      }
    };

    fetchUrgentTopics();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchUrgentTopics, 300000);
    return () => clearInterval(interval);
  }, [userId]);

  return { urgentTopics, loading };
}
