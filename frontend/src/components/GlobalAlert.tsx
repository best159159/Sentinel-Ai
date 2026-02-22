'use client';

import { useState, useEffect } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useAuth } from '@/context/AuthContext';
import AlertNotification from './AlertNotification';

export default function GlobalAlert() {
    const { user } = useAuth();
    const [alert, setAlert] = useState<any>(null);

    const { registerLocation } = useSocket({
        onProximityAlert: (data) => {
            if (user && data.alertedUsers.includes(user._id)) {
                setAlert({
                    id: data.incident._id,
                    type: data.incident.type,
                    description: data.incident.description,
                    severity: data.incident.severity,
                    imageUrl: data.incident.imageUrl,
                    recommendation: data.incident.recommendation,
                    location: data.incident.location,
                    confidenceScore: data.incident.aiAnalysis?.confidenceScore,
                    autoExpand: true
                });
            }
        }
    });

    useEffect(() => {
        if (user?.location?.lat && user?.location?.lng) {
            registerLocation(user._id, user.location.lat, user.location.lng);
        }
    }, [user, registerLocation]);

    return <AlertNotification alert={alert} onDismiss={() => setAlert(null)} />;
}
