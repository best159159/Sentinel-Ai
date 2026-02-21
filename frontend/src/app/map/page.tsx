'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import api from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';
import { Incident } from '@/types';
import AlertNotification from '@/components/AlertNotification';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-toastify';
import {
    HiOutlineRefresh,
    HiOutlineFilter,
    HiOutlineLocationMarker,
} from 'react-icons/hi';

// Dynamic import for MapView (SSR disabled because Mapbox needs browser)
const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

const filters = ['All', 'Critical', 'High', 'Medium', 'Low'] as const;

export default function MapPage() {
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [newsRisks, setNewsRisks] = useState<any[]>([]);
    const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>([]);
    const [activeFilter, setActiveFilter] = useState<string>('All');
    const [loading, setLoading] = useState(true);
    const [alert, setAlert] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [mapCenter, setMapCenter] = useState<[number, number]>([13.7563, 100.5018]);
    const [mapZoom, setMapZoom] = useState(6);
    const { user } = useAuth();

    const fetchIncidents = useCallback(async () => {
        try {
            const [{ data: incData }, { data: newsData }] = await Promise.all([
                api.get('/incidents?limit=200'),
                api.get('/news')
            ]);
            setIncidents(incData.incidents);
            setNewsRisks(newsData);
        } catch (err) {
            console.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchIncidents();
    }, [fetchIncidents]);

    // Parse URL params for redirect from "Near Me"
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const lat = params.get('lat');
            const lng = params.get('lng');
            const zoom = params.get('zoom');

            if (lat && lng) {
                setMapCenter([parseFloat(lat), parseFloat(lng)]);
                setMapZoom(zoom ? parseInt(zoom) : 15);
            }
        }
    }, []);

    // Try to pop open the alert if an ID was provided
    useEffect(() => {
        if (typeof window !== 'undefined' && incidents.length > 0 && !alert) {
            const params = new URLSearchParams(window.location.search);
            const id = params.get('id');
            if (id) {
                const inc = incidents.find(i => i._id === id);
                if (inc) {
                    setAlert({
                        id: inc._id,
                        type: inc.type,
                        description: inc.description,
                        severity: inc.aiAnalysis?.urgencyLevel || 'Unknown',
                        imageUrl: inc.imageUrl,
                        recommendation: inc.aiAnalysis?.recommendation,
                        location: inc.location,
                        confidenceScore: inc.aiAnalysis?.confidenceScore,
                        autoExpand: true
                    });
                    // Replace history so reloading the page doesn't pop it again
                    window.history.replaceState({}, '', '/map');
                }
            }
        }
    }, [incidents, alert]);

    // Apply filter
    useEffect(() => {
        if (activeFilter === 'All') {
            setFilteredIncidents(incidents);
        } else {
            setFilteredIncidents(
                incidents.filter((inc) => inc.aiAnalysis?.urgencyLevel === activeFilter)
            );
        }
    }, [incidents, activeFilter]);

    // Socket events
    const { registerLocation } = useSocket({
        onNewIncident: (incident) => {
            setIncidents((prev) => [incident, ...prev]);
            toast.success(`🚨 New ${incident.type} incident reported`);
        },
        onIncidentUpdated: (updated) => {
            setIncidents((prev) =>
                prev.map((inc) => (inc._id === updated._id ? updated : inc))
            );
        },
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
                });
            }
        },
    });

    // Register user location for proximity alerts periodically
    useEffect(() => {
        if (user?.location?.lat && user?.location?.lng) {
            registerLocation(user._id, user.location.lat, user.location.lng);
        }
    }, [user, registerLocation]);

    const handleSearchLocation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery) return;
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + ' Thailand')}`);
            const data = await res.json();
            if (data && data.length > 0) {
                setMapCenter([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
                setMapZoom(13);
            } else {
                toast.error('Location not found');
            }
        } catch (error) {
            toast.error('Search failed');
        }
    };

    const handleMyLocation = () => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition((position) => {
                setMapCenter([position.coords.latitude, position.coords.longitude]);
                setMapZoom(14);
                if (user?._id) {
                    registerLocation(user._id, position.coords.latitude, position.coords.longitude);
                }
            }, () => {
                toast.error('Could not get your location');
            });
        }
    };

    const stats = {
        total: incidents.length,
        critical: incidents.filter((i) => i.aiAnalysis?.urgencyLevel === 'Critical').length,
        high: incidents.filter((i) => i.aiAnalysis?.urgencyLevel === 'High').length,
        active: incidents.filter((i) => i.status === 'active').length,
    };

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-slate-50">
            {/* Top bar */}
            <div className="px-5 py-4 bg-white/90 backdrop-blur-xl border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] z-10">
                <div className="flex items-center gap-5">
                    <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                            <HiOutlineLocationMarker className="w-5 h-5 text-blue-600" />
                        </div>
                        Live Incident Map
                    </h1>
                    <div className="hidden lg:flex items-center gap-3 text-sm font-semibold">
                        <span className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700">
                            {stats.total} total
                        </span>
                        <span className="px-3 py-1.5 rounded-lg bg-red-100 text-red-700 border border-red-200">
                            {stats.critical} critical
                        </span>
                        <span className="px-3 py-1.5 rounded-lg bg-orange-100 text-orange-700 border border-orange-200">
                            {stats.high} high
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto mt-3 sm:mt-0 flex-wrap">
                    <form onSubmit={handleSearchLocation} className="flex bg-slate-50 rounded-xl overflow-hidden border border-slate-200 shadow-sm focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                        <input
                            type="text"
                            placeholder="ค้นหา จังหวัด, ตำบล..."
                            className="bg-transparent px-4 py-2 text-sm font-medium outline-none text-slate-700 w-40 sm:w-56 placeholder-slate-400"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button type="submit" className="bg-blue-600 text-white px-4 text-sm font-bold hover:bg-blue-700 transition">ค้นหา</button>
                    </form>
                    <button onClick={handleMyLocation} className="bg-green-50 text-green-700 border border-green-200 px-4 py-2 rounded-xl text-sm font-bold hover:bg-green-100 transition-all flex items-center shadow-sm">
                        📍 ตำแหน่งของฉัน
                    </button>

                    {/* Filters */}
                    <div className="hidden md:flex items-center gap-1 bg-slate-100 rounded-xl p-1 ml-auto border border-slate-200 shadow-inner">
                        {filters.map((f) => (
                            <button
                                key={f}
                                onClick={() => setActiveFilter(f)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeFilter === f
                                    ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
                                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => { setLoading(true); fetchIncidents(); }}
                        className="p-2.5 rounded-xl bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100 hover:text-slate-800 transition-all shadow-sm ml-1"
                    >
                        <HiOutlineRefresh className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Map */}
            <div className="flex-1 relative bg-slate-50">
                {loading && !incidents.length ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-50/80 backdrop-blur-sm z-20">
                        <div className="text-center bg-white p-6 rounded-2xl shadow-xl border border-slate-100">
                            <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-slate-600 text-sm font-bold tracking-wide">Initializing Intelligence Map...</p>
                        </div>
                    </div>
                ) : (
                    <MapView
                        center={mapCenter}
                        zoom={mapZoom}
                        incidents={filteredIncidents}
                        news={newsRisks}
                        className="w-full h-full"
                        onMarkerClick={(inc) => {
                            setAlert({
                                id: inc._id,
                                type: inc.type,
                                description: inc.description,
                                severity: inc.aiAnalysis?.urgencyLevel || 'Unknown',
                                imageUrl: inc.imageUrl,
                                recommendation: inc.aiAnalysis?.recommendation,
                                location: inc.location,
                                confidenceScore: inc.aiAnalysis?.confidenceScore,
                                clusterIncidents: (inc as any).clusterIncidents,
                                autoExpand: true
                            });
                        }}
                    />
                )}
            </div>

            {/* Alert notification */}
            <AlertNotification alert={alert} onDismiss={() => setAlert(null)} />
        </div>
    );
}
