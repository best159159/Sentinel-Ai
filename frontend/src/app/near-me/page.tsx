'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { Incident } from '@/types';
import { useRouter } from 'next/navigation';
import { HiOutlineLocationMarker, HiOutlineMap, HiOutlineExclamation, HiOutlineClock, HiOutlineShieldCheck } from 'react-icons/hi';

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
}

export default function NearMePage() {
    const [incidents, setIncidents] = useState<(Incident & { distance: number })[]>([]);
    const [loading, setLoading] = useState(true);
    const [locationAllowed, setLocationAllowed] = useState<boolean | null>(null);
    const router = useRouter();

    useEffect(() => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    setLocationAllowed(true);
                    const { latitude, longitude } = position.coords;
                    try {
                        const { data } = await api.get('/incidents?limit=500');
                        const nearby = data.incidents
                            .map((inc: Incident) => ({
                                ...inc,
                                distance: getDistance(latitude, longitude, inc.location.lat, inc.location.lng)
                            }))
                            .filter((inc: any) => inc.distance <= 20)
                            .sort((a: any, b: any) => a.distance - b.distance);
                        setIncidents(nearby);
                    } catch (err) {
                        console.error('Failed to fetch incidents', err);
                    } finally {
                        setLoading(false);
                    }
                },
                (error) => {
                    console.error('Error getting location', error);
                    setLocationAllowed(false);
                    setLoading(false);
                },
                { enableHighAccuracy: true }
            );
        } else {
            setLocationAllowed(false);
            setLoading(false);
        }
    }, []);

    const severityColor = {
        Critical: 'border-l-red-500 bg-red-50',
        High: 'border-l-orange-500 bg-orange-50',
        Medium: 'border-l-yellow-500 bg-yellow-50',
        Low: 'border-l-green-500 bg-green-50',
    };

    const badgeColor = {
        Critical: 'bg-red-100 text-red-700 border border-red-200',
        High: 'bg-orange-100 text-orange-700 border border-orange-200',
        Medium: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
        Low: 'bg-green-100 text-green-700 border border-green-200',
    };

    return (
        <div className="min-h-[calc(100vh-64px)] bg-slate-50 pt-8 pb-16">
            <div className="max-w-4xl mx-auto px-4 sm:px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                            <HiOutlineLocationMarker className="w-6 h-6 text-white" />
                        </div>
                        เหตุการณ์ใกล้ฉัน
                    </h1>
                    <p className="text-slate-500 font-medium">
                        ค้นหาเหตุการณ์เตือนภัยในรัศมี 20 กิโลเมตรจากตำแหน่งปัจจุบันของคุณ เพื่อเฝ้าระวังความปลอดภัย
                    </p>
                </motion.div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-200/60 shadow-sm">
                        <div className="w-12 h-12 border-4 border-slate-100 border-t-purple-500 rounded-full animate-spin mb-4 shadow-sm"></div>
                        <p className="text-slate-600 font-bold tracking-wide">กำลังค้นหาตำแหน่งและประเมินความเสี่ยง...</p>
                    </div>
                ) : locationAllowed === false ? (
                    <div className="bg-red-50 border border-red-200 p-8 rounded-3xl text-center shadow-sm">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <HiOutlineExclamation className="w-8 h-8 text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-red-700 mb-2">ไม่สามารถเข้าถึงตำแหน่งที่ตั้งได้</h3>
                        <p className="text-red-600 text-sm font-medium mb-4">ระบบไม่สามารถดึงตำแหน่งปัจจุบันของคุณออกมาได้ โปรดอนุญาตให้เบราว์เซอร์เข้าถึง <br className="hidden sm:block" /> ตำแหน่งที่ตั้ง (Location Services) แล้วรีเฟรชหน้าเว็บอีกครั้ง</p>
                    </div>
                ) : incidents.length === 0 ? (
                    <div className="bg-white border border-slate-200/60 p-10 rounded-3xl text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                        <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg shadow-green-500/20">
                            <HiOutlineShieldCheck className="w-10 h-10 text-white" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">ปลอดภัย!</h3>
                        <p className="text-slate-500 font-medium">ไม่พบรายงานเหตุการณ์เตือนภัย ในระยะ 20 กิโลเมตรรอบตัวคุณ</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {incidents.map((incident, index) => (
                            <motion.div
                                key={incident._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className={`bg-white rounded-2xl shadow-sm border border-slate-200/80 border-l-[6px] overflow-hidden hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all flex flex-col ${severityColor[incident.aiAnalysis?.urgencyLevel as keyof typeof severityColor] || severityColor.Medium}`}
                            >
                                {incident.imageUrl && (
                                    <div className="w-full h-44 shrink-0 relative overflow-hidden">
                                        <img src={incident.imageUrl} alt={incident.type} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                                        <div className="absolute bottom-3 left-4 flex gap-2">
                                            <span className={`text-xs font-black px-2.5 py-1 rounded-md shadow-sm ${badgeColor[incident.aiAnalysis?.urgencyLevel as keyof typeof badgeColor] || badgeColor.Medium}`}>
                                                {incident.aiAnalysis?.urgencyLevel || 'Medium'}
                                            </span>
                                        </div>
                                    </div>
                                )}
                                <div className="p-5 flex-1 flex flex-col justify-between">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2 mb-3">
                                            {!incident.imageUrl && (
                                                <span className={`text-xs font-black px-2.5 py-1 rounded-md shadow-sm ${badgeColor[incident.aiAnalysis?.urgencyLevel as keyof typeof badgeColor] || badgeColor.Medium}`}>
                                                    {incident.aiAnalysis?.urgencyLevel || 'Medium'}
                                                </span>
                                            )}
                                            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md flex items-center gap-1 shadow-sm">
                                                <HiOutlineLocationMarker className="w-3.5 h-3.5" />
                                                ห่าง {incident.distance.toFixed(1)} กม.
                                            </span>
                                            <span className="text-xs font-medium text-slate-500 border border-slate-200 px-2.5 py-1 rounded-md flex items-center gap-1">
                                                <HiOutlineClock className="w-3.5 h-3.5" />
                                                {new Date(incident.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-black text-slate-800 mb-1">{incident.type}</h3>
                                        <p className="text-sm font-medium text-slate-500 line-clamp-2 mb-4 leading-relaxed">{incident.description}</p>
                                    </div>

                                    <button
                                        onClick={() => router.push(`/map?lat=${incident.location.lat}&lng=${incident.location.lng}&zoom=15&id=${incident._id}`)}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-white text-slate-700 font-bold rounded-xl transition-all border border-slate-200 shadow-sm hover:shadow hover:border-blue-300 hover:text-blue-700 mt-2"
                                    >
                                        <HiOutlineMap className="w-4 h-4" />
                                        ดูตำแหน่งบนแผนที่
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
