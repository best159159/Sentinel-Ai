'use client';

// useSocket replaced by Firestore onSnapshot in map/page.tsx
// Kept for import compatibility

import { useCallback } from 'react';
import { Incident } from '@/types';

interface UseSocketOptions {
  onNewIncident?: (incident: Incident) => void;
  onIncidentUpdated?: (incident: Incident) => void;
  onProximityAlert?: (data: any) => void;
}

export function useSocket(options: UseSocketOptions = {}) {
  // registerLocation is now a no-op — proximity alerts use client-side distance check
  const registerLocation = useCallback((_userId: string, _lat: number, _lng: number) => {}, []);
  return { registerLocation };
}
