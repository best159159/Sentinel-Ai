'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Incident } from '@/types';
import { toast } from 'react-toastify';
import { HiOutlineTrash, HiOutlineLocationMarker, HiOutlineViewGrid, HiOutlineClock } from 'react-icons/hi';
import { motion, AnimatePresence } from 'framer-motion';

export default function MyIncidentsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }

        const fetchMyIncidents = async () => {
            if (!user) return;
            try {
                const { data } = await api.get('/incidents/me');
                setIncidents(data.incidents || []);
            } catch (err) {
                console.error(err);
                toast.error('Failed to load your incidents');
            } finally {
                setLoading(false);
            }
        };

        fetchMyIncidents();
    }, [user, authLoading, router]);

    const handleDelete = async (id: string) => {
        if (!window.confirm('คุณแน่ใจหรือไม่ที่จะลบการแจ้งเหตุร้ายนี้? การลบแล้วไม่สามารถนำกลับมาได้อีก')) {
            return;
        }

        try {
            await api.delete(`/incidents/${id}`);
            setIncidents(prev => prev.filter(inc => inc._id !== id));
            toast.success('ลบเหตุการณ์สำเร็จ');
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('ไม่สามารถลบเหตุการณ์ได้');
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!user) return null;

    const getSeverityBadge = (level: string = 'Low') => {
        const styles: Record<string, string> = {
            Critical: 'bg-red-100 text-red-700 border-red-200',
            High: 'bg-orange-100 text-orange-700 border-orange-200',
            Medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
            Low: 'bg-green-100 text-green-700 border-green-200',
        };
        const s = styles[level] || styles.Medium;
        return <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${s}`}>{level}</span>;
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 py-12">
                <div className="max-w-4xl mx-auto px-6">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                            <HiOutlineViewGrid className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-slate-800 tracking-tight">การแจ้งเหตุของฉัน</h1>
                            <p className="text-slate-500 font-medium">จัดการและตรวจสอบประวัติการแจ้งเหตุร้ายของคุณ</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-8">
                {incidents.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm flex flex-col items-center">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                            <HiOutlineLocationMarker className="w-10 h-10 text-slate-400" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-700 mb-2">ยังไม่มีประวัติการแจ้งเหตุ</h3>
                        <p className="text-slate-500 mb-6 max-w-sm">
                            คุณยังไม่เคยรายงานเหตุฉุกเฉินเข้าระบบ หากพบเห็นเหตุสามารถรายงานได้ที่หน้าเมนูหลัก
                        </p>
                        <button onClick={() => router.push('/report')} className="btn-primary">
                            รายงานเหตุการณ์ใหม่
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        <AnimatePresence>
                            {incidents.map((incident) => (
                                <motion.div
                                    key={incident._id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row gap-6 relative overflow-hidden"
                                >
                                    {/* Accent Line */}
                                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500" />

                                    <div className="w-full sm:w-48 h-32 shrink-0 bg-slate-100 rounded-2xl overflow-hidden relative">
                                        {incident.imageUrl ? (
                                            <img src={incident.imageUrl} alt={incident.type} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                                                <HiOutlineLocationMarker className="w-8 h-8 opacity-50 mb-1" />
                                                <span className="text-xs font-semibold">ไม่มีรูปภาพ</span>
                                            </div>
                                        )}
                                        <div className="absolute top-2 left-2 shadow-sm rounded-lg overflow-hidden bg-white/90 backdrop-blur-sm">
                                            {getSeverityBadge(incident.aiAnalysis?.urgencyLevel)}
                                        </div>
                                    </div>

                                    <div className="flex-1 flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="text-xl font-bold text-slate-800">{incident.type}</h3>
                                                <button
                                                    onClick={() => handleDelete(incident._id)}
                                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition"
                                                    title="ลบเหตุการณ์"
                                                >
                                                    <HiOutlineTrash className="w-5 h-5" />
                                                </button>
                                            </div>
                                            <p className="text-slate-600 text-sm line-clamp-2 mb-3 leading-relaxed">
                                                {incident.description || 'ไม่มีคำอธิบาย'}
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap gap-x-6 gap-y-2 items-center text-xs text-slate-500 font-medium">
                                            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
                                                <HiOutlineClock className="w-4 h-4 text-slate-400" />
                                                <span>{new Date(incident.createdAt).toLocaleDateString('th-TH', {
                                                    year: 'numeric', month: 'short', day: 'numeric',
                                                    hour: '2-digit', minute: '2-digit'
                                                })}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
                                                <HiOutlineLocationMarker className="w-4 h-4 text-slate-400" />
                                                <span className="truncate max-w-[120px] sm:max-w-none">
                                                    {incident.location.lat.toFixed(4)}, {incident.location.lng.toFixed(4)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </main>
        </div>
    );
}
