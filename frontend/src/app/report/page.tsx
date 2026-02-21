'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import IncidentForm from '@/components/IncidentForm';
import api from '@/lib/api';
import { Incident } from '@/types';
import { toast } from 'react-toastify';
import {
    HiOutlineDocumentReport,
    HiOutlineCheckCircle,
    HiOutlineLightningBolt,
} from 'react-icons/hi';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

export default function ReportPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [selectionMode, setSelectionMode] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [mapCenter, setMapCenter] = useState<[number, number]>([13.7563, 100.5018]);
    const [mapZoom, setMapZoom] = useState(6);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        const fetchIncidents = async () => {
            try {
                const { data } = await api.get('/incidents?limit=50');
                setIncidents(data.incidents);
            } catch (err) {
                // silent
            }
        };
        fetchIncidents();
    }, []);

    const handleMapClick = useCallback((lngLat: { lng: number; lat: number }) => {
        setSelectedLocation({ lat: lngLat.lat, lng: lngLat.lng });
        setSelectionMode(false);
    }, []);

    const handleSuccess = () => {
        setSubmitted(true);
        setSelectedLocation(null);
        toast.success('Incident reported! AI analysis complete.');
        setTimeout(() => setSubmitted(false), 3000);
        // Refresh incidents
        api.get('/incidents?limit=50').then(({ data }) => setIncidents(data.incidents));
    };

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
                // Also select this location automatically to save user a click
                setSelectedLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
                setSelectionMode(false);
            }, () => {
                toast.error('Could not get your location');
            });
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                            <HiOutlineDocumentReport className="w-6 h-6 text-blue-600" />
                        </div>
                        Report Incident
                    </h1>
                    <p className="text-slate-500 font-medium">
                        Submit a disaster or emergency report. AI will analyze it instantly.
                    </p>
                </motion.div>

                {submitted && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center gap-3"
                    >
                        <HiOutlineCheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                        <div>
                            <p className="text-green-300 font-medium">Report submitted successfully!</p>
                            <p className="text-green-400/70 text-sm">AI analysis has been completed and the incident is now on the map.</p>
                        </div>
                    </motion.div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Form */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200"
                    >
                        <div className="flex items-center gap-2 mb-8">
                            <div className="p-1.5 bg-yellow-100 rounded-lg">
                                <HiOutlineLightningBolt className="w-5 h-5 text-yellow-600" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800">Incident Details</h2>
                        </div>
                        <IncidentForm
                            selectedLocation={selectedLocation}
                            onSelectLocation={() => setSelectionMode(true)}
                            onSuccess={handleSuccess}
                        />
                    </motion.div>

                    {/* Map */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white rounded-3xl p-4 md:p-6 shadow-sm border border-slate-200 flex flex-col gap-4"
                        style={{ minHeight: '500px' }}
                    >
                        <div className="flex flex-wrap items-center gap-3">
                            <form onSubmit={handleSearchLocation} className="flex bg-slate-50 rounded-xl overflow-hidden border border-slate-200 shadow-sm focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all flex-1">
                                <input
                                    type="text"
                                    placeholder="ค้นหา จังหวัด, ตำบล, อำเภอ..."
                                    className="bg-transparent px-4 py-2 text-sm font-medium outline-none text-slate-700 w-full placeholder-slate-400"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <button type="submit" className="bg-blue-600 text-white px-5 text-sm font-bold hover:bg-blue-700 transition">ค้นหา</button>
                            </form>
                            <button onClick={handleMyLocation} className="bg-green-50 text-green-700 border border-green-200 px-4 py-2 rounded-xl text-sm font-bold hover:bg-green-100 transition-all flex items-center gap-1 shadow-sm">
                                📍 ตำแหน่งของคุณ
                            </button>
                        </div>
                        <div className="flex-1 relative rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
                            <MapView
                                center={mapCenter}
                                zoom={mapZoom}
                                incidents={incidents}
                                onMapClick={handleMapClick}
                                selectionMode={selectionMode}
                                selectedLocation={selectedLocation}
                                className="w-full h-full"
                            />
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
