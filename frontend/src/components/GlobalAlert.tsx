'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import AlertNotification from './AlertNotification';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

function getDistanceMs(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3;
  const p1 = lat1 * Math.PI / 180;
  const p2 = lat2 * Math.PI / 180;
  const dp = (lat2 - lat1) * Math.PI / 180;
  const dl = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dp / 2) * Math.sin(dp / 2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function GlobalAlert() {
  const { user } = useAuth();
  const [alert, setAlert] = useState<any>(null);
  const [lastIncidentId, setLastIncidentId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.location?.lat || !window.location.pathname.includes('/map')) {
        // We only want this in background or if not in map to avoid duplicate alerts (optional)
    }

    const q = query(collection(db, 'incidents'), orderBy('createdAt', 'desc'), limit(1));
    const unsubscribe = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const latest = snap.docs[0];
        const data = latest.data();
        
        // Exclude if we already saw it
        if (latest.id === lastIncidentId) return;
        setLastIncidentId(latest.id);

        if (user && user.location?.lat && user.location?.lng && data.location?.lat) {
          const dist = getDistanceMs(user.location.lat, user.location.lng, data.location.lat, data.location.lng);
          
          // Alert if within 5km
          if (dist <= 5000) {
            setAlert({
              id: latest.id,
              type: data.type,
              description: data.description,
              severity: data.aiAnalysis?.urgencyLevel || 'Medium',
              imageUrl: data.imageUrl,
              recommendation: data.aiAnalysis?.recommendation,
              location: data.location,
              confidenceScore: data.aiAnalysis?.confidenceScore,
              autoExpand: true
            });
          }
        }
      }
    });

    return () => unsubscribe();
  }, [user, lastIncidentId]);

  return <AlertNotification alert={alert} onDismiss={() => setAlert(null)} />;
}
