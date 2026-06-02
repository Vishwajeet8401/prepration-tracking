import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Topic } from '../types';

export function useAllTopics(userId: string | undefined) {
  const [allTopics, setAllTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setAllTopics([]);
      setLoading(false);
      return;
    }

    const fetchAll = async () => {
      try {
        const q = query(collection(db, 'topics'), where('userId', '==', userId));
        const snapshot = await getDocs(q);
        
        const list: Topic[] = [];
        snapshot.forEach(doc => {
          list.push(doc.data() as Topic);
        });
        
        setAllTopics(list);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch all topics:", err);
        setLoading(false);
      }
    };

    fetchAll();
  }, [userId]);

  return { allTopics, loading };
}
