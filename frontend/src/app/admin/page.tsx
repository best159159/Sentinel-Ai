'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { AdminStats, Incident } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamic import Recharts to prevent SSR issues during build
const BarChart = dynamic(() => import('recharts').then(mod => mod.BarChart), { ssr: false });
const Bar = dynamic(() => import('recharts').then(mod => mod.Bar), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });
const PieChart = dynamic(() => import('recharts').then(mod => mod.PieChart), { ssr: false });
const Pie = dynamic(() => import('recharts').then(mod => mod.Pie), { ssr: false });
const Cell = dynamic(() => import('recharts').then(mod => mod.Cell), { ssr: false });
const AreaChart = dynamic(() => import('recharts').then(mod => mod.AreaChart), { ssr: false });
const Area = dynamic(() => import('recharts').then(mod => mod.Area), { ssr: false });
import {
    HiOutlineChartBar,
    HiOutlineExclamation,
    HiOutlineTrendingUp,
    HiOutlineShieldCheck,
    HiOutlineClock,
    HiOutlineLocationMarker,
} from 'react-icons/hi';

const SEVERITY_COLORS = {
    Critical: '#ef4444',
    High: '#f97316',
    Medium: '#eab308',
    Low: '#22c55e',
};

const TYPE_COLORS = ['#3b82f6', '#ef4444', '#f97316', '#eab308', '#8b5cf6', '#06b6d4', '#6b7280'];

export default function AdminPage() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await api.get('/admin/stats');
                setStats(data);
            } catch (err) {
                console.error('Failed to fetch admin stats');
            } finally {
                setLoading(false);
            }
        };
        if (user) fetchStats();
    }, [user]);

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-400">Failed to load dashboard data</p>
            </div>
        );
    }

    const typeChartData = Object.entries(stats.byType).map(([name, value]) => ({
        name,
        value,
    }));

    const severityChartData = Object.entries(stats.bySeverity).map(([name, value]) => ({
        name,
        value,
        color: SEVERITY_COLORS[name as keyof typeof SEVERITY_COLORS] || '#6b7280',
    }));

    return (
        <div className="min-h-screen">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-4xl font-black text-slate-800 flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
                            <HiOutlineChartBar className="w-6 h-6 text-white" />
                        </div>
                        Admin Dashboard
                    </h1>
                    <p className="text-slate-500 font-medium">
                        Real-time overview of all incidents, risk zones, and AI performance.
                    </p>
                </motion.div>

                {/* Stat Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {[
                        {
                            label: 'Incidents Today',
                            value: stats.totalToday,
                            icon: HiOutlineExclamation,
                            color: 'text-blue-400',
                            bg: 'bg-blue-500/10',
                        },
                        {
                            label: 'Total Incidents',
                            value: stats.totalAll,
                            icon: HiOutlineTrendingUp,
                            color: 'text-purple-400',
                            bg: 'bg-purple-500/10',
                        },
                        {
                            label: 'AI Confidence',
                            value: `${(stats.averageConfidence * 100).toFixed(1)}%`,
                            icon: HiOutlineShieldCheck,
                            color: 'text-green-400',
                            bg: 'bg-green-500/10',
                        },
                        {
                            label: 'Risk Zones',
                            value: stats.topRiskZones.length,
                            icon: HiOutlineLocationMarker,
                            color: 'text-red-400',
                            bg: 'bg-red-500/10',
                        },
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="glass-card shadow-sm border border-slate-100 p-6 flex items-center gap-5 hover:shadow-md transition-shadow"
                        >
                            <div className={`w-14 h-14 rounded-2xl ${stat.bg} flex items-center justify-center shrink-0`}>
                                <stat.icon className={`w-7 h-7 ${stat.color}`} />
                            </div>
                            <div>
                                <div className="text-3xl font-black text-slate-800">{stat.value}</div>
                                <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide mt-1">{stat.label}</div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Incidents by Type */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-card p-6"
                    >
                        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <div className="w-2 h-6 bg-blue-500 rounded-full"></div>
                            Incidents by Type
                        </h3>
                        {typeChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={typeChartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        cursor={{ fill: '#f1f5f9' }}
                                        contentStyle={{
                                            background: '#ffffff',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '12px',
                                            color: '#1e293b',
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                            fontWeight: '600'
                                        }}
                                    />
                                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                        {typeChartData.map((_, index) => (
                                            <Cell key={index} fill={TYPE_COLORS[index % TYPE_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-64 flex items-center justify-center text-gray-500 text-sm">
                                No incidents today
                            </div>
                        )}
                    </motion.div>

                    {/* Severity Distribution */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="glass-card p-6"
                    >
                        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <div className="w-2 h-6 bg-purple-500 rounded-full"></div>
                            Severity Distribution
                        </h3>
                        {severityChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={280}>
                                <PieChart>
                                    <Pie
                                        data={severityChartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={4}
                                        dataKey="value"
                                    >
                                        {severityChartData.map((entry, index) => (
                                            <Cell key={index} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            background: '#ffffff',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '12px',
                                            color: '#1e293b',
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                            fontWeight: '600'
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-64 flex items-center justify-center text-gray-500 text-sm">
                                No severity data
                            </div>
                        )}
                        {/* Legend */}
                        <div className="flex flex-wrap justify-center gap-4 mt-4">
                            {severityChartData.map((item) => (
                                <div key={item.name} className="flex items-center gap-2 text-xs text-gray-400">
                                    <div className="w-3 h-3 rounded-full" style={{ background: item.color }} />
                                    {item.name}: {item.value}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Critical Incidents & Risk Zones */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Critical Incidents */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card p-6"
                    >
                        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                                <HiOutlineExclamation className="w-6 h-6 text-red-500" />
                            </div>
                            Critical Incidents
                        </h3>
                        {stats.criticalIncidents.length > 0 ? (
                            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                                {stats.criticalIncidents.map((incident: any) => (
                                    <div
                                        key={incident._id}
                                        className="p-5 rounded-2xl bg-white border border-red-200 shadow-sm hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="px-3 py-1 rounded-full bg-red-50 text-red-600 text-sm font-bold border border-red-100">
                                                {incident.type}
                                            </span>
                                            <span className="text-sm text-red-500 font-bold bg-white px-2 py-1 rounded-md shadow-sm border border-red-100">
                                                Score: {incident.aiAnalysis?.severityScore}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-600 line-clamp-2 font-medium">{incident.description}</p>
                                        <div className="flex items-center gap-2 mt-3 text-xs text-slate-400 font-semibold">
                                            <HiOutlineClock className="w-4 h-4" />
                                            {new Date(incident.createdAt).toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-12 text-center text-slate-400 text-sm font-medium">
                                No critical incidents 🎉
                            </div>
                        )}
                    </motion.div>

                    {/* Top Risk Zones */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="glass-card p-6"
                    >
                        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                                <HiOutlineLocationMarker className="w-6 h-6 text-orange-500" />
                            </div>
                            Top Risk Zones
                        </h3>
                        {stats.topRiskZones.length > 0 ? (
                            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                                {stats.topRiskZones.map((zone, i) => (
                                    <div
                                        key={i}
                                        className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-sm font-bold text-slate-700 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
                                                📍 {zone.location.lat.toFixed(4)}, {zone.location.lng.toFixed(4)}
                                            </span>
                                            <span
                                                className={`text-sm font-bold px-3 py-1 rounded-lg border shadow-sm ${zone.avgSeverity >= 75
                                                    ? 'bg-red-50 text-red-600 border-red-200'
                                                    : zone.avgSeverity >= 50
                                                        ? 'bg-orange-50 text-orange-600 border-orange-200'
                                                        : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                                    }`}
                                            >
                                                Avg: {zone.avgSeverity}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-slate-500 font-medium bg-slate-50/50 p-2 rounded-lg">
                                            <span><strong>{zone.incidentCount}</strong> incidents</span>
                                            <span>Types: <strong>{zone.types.join(', ')}</strong></span>
                                        </div>
                                        {/* Severity bar */}
                                        <div className="mt-4 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ${zone.avgSeverity >= 75
                                                    ? 'bg-red-500'
                                                    : zone.avgSeverity >= 50
                                                        ? 'bg-orange-500'
                                                        : 'bg-yellow-500'
                                                    }`}
                                                style={{ width: `${zone.avgSeverity}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-12 text-center text-slate-400 text-sm font-medium">
                                No risk zones detected
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
