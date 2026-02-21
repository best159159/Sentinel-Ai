'use client';

import { useEffect, useRef, useCallback } from 'react';
import { getSocket } from '@/lib/socket';
import { Incident } from '@/types';

interface UseSocketOptions {
    onNewIncident?: (incident: Incident) => void;
    onIncidentUpdated?: (incident: Incident) => void;
    onProximityAlert?: (data: any) => void;
}

export function useSocket(options: UseSocketOptions = {}) {
    const optionsRef = useRef(options);
    optionsRef.current = options;

    useEffect(() => {
        const socket = getSocket();

        const handleNewIncident = (incident: Incident) => {
            optionsRef.current.onNewIncident?.(incident);
        };

        const handleUpdated = (incident: Incident) => {
            optionsRef.current.onIncidentUpdated?.(incident);
        };

        const handleAlert = (data: any) => {
            optionsRef.current.onProximityAlert?.(data);
        };

        socket.on('new-incident', handleNewIncident);
        socket.on('incident-updated', handleUpdated);
        socket.on('proximity-alert', handleAlert);

        return () => {
            socket.off('new-incident', handleNewIncident);
            socket.off('incident-updated', handleUpdated);
            socket.off('proximity-alert', handleAlert);
        };
    }, []);

    const registerLocation = useCallback((userId: string, lat: number, lng: number) => {
        const socket = getSocket();
        socket.emit('register-location', { userId, lat, lng });
    }, []);

    return { registerLocation };
}
