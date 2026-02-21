'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { NewsRisk } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-toastify';
import {
    HiOutlineNewspaper,
    HiOutlineRefresh,
    HiOutlineExternalLink,
    HiOutlineGlobe,
    HiOutlineExclamation,
    HiOutlineClock,
} from 'react-icons/hi';

const riskColors: Record<string, string> = {
    Critical: 'border-l-red-500 bg-red-50',
    High: 'border-l-orange-500 bg-orange-50',
    Medium: 'border-l-yellow-500 bg-yellow-50',
    Low: 'border-l-green-500 bg-green-50',
};

const riskBadgeColors: Record<string, string> = {
    Critical: 'bg-red-100 text-red-700 border border-red-200',
    High: 'bg-orange-100 text-orange-700 border border-orange-200',
    Medium: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    Low: 'bg-green-100 text-green-700 border border-green-200',
};

export default function NewsPage() {
    const [newsRisks, setNewsRisks] = useState<NewsRisk[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        fetchNews();
    }, []);

    const fetchNews = async () => {
        try {
            const { data } = await api.get('/news');
            setNewsRisks(data);
        } catch (err) {
            console.error('Failed to fetch news');
        } finally {
            setLoading(false);
        }
    };

    const refreshNews = async () => {
        if (!user) {
            toast.error('Please sign in to refresh news data');
            return;
        }
        setRefreshing(true);
        try {
            const { data } = await api.post('/news/refresh');
            toast.success(data.message);
            await fetchNews();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to refresh');
        } finally {
            setRefreshing(false);
        }
    };

    // Group by province for unique display
    const uniqueProvinces = Array.from(
        new Map(newsRisks.map((item) => [item.province, item])).values()
    );

    return (
        <div className="min-h-screen">
            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-wrap items-start justify-between gap-4 mb-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
                >
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                                <HiOutlineGlobe className="w-6 h-6 text-orange-500" />
                            </div>
                            National Disaster Intelligence
                        </h1>
                        <p className="text-slate-500 font-medium">
                            AI-analyzed news articles for real-time risk assessment across provinces.
                        </p>
                    </div>
                    <button
                        onClick={refreshNews}
                        disabled={refreshing}
                        className="btn-primary flex items-center gap-2 text-sm px-5 py-3 shadow-md"
                    >
                        <HiOutlineRefresh className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        {refreshing ? 'Analyzing via AI...' : 'Refresh Intelligence'}
                    </button>
                </motion.div>

                {/* Risk Overview */}
                {uniqueProvinces.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8"
                    >
                        {[
                            {
                                label: 'Total Alerts',
                                value: newsRisks.length,
                                color: 'text-blue-400',
                            },
                            {
                                label: 'Critical',
                                value: newsRisks.filter((n) => n.riskLevel === 'Critical').length,
                                color: 'text-red-400',
                            },
                            {
                                label: 'High Risk',
                                value: newsRisks.filter((n) => n.riskLevel === 'High').length,
                                color: 'text-orange-400',
                            },
                            {
                                label: 'Provinces',
                                value: uniqueProvinces.length,
                                color: 'text-green-400',
                            },
                        ].map((stat, i) => (
                            <div key={i} className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 text-center hover:shadow-md transition-shadow">
                                <div className={`text-3xl font-black ${stat.color}`}>{stat.value}</div>
                                <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide mt-2">{stat.label}</div>
                            </div>
                        ))}
                    </motion.div>
                )}

                {/* News Cards */}
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="glass-card border border-slate-200 shadow-sm p-6">
                                <div className="shimmer h-5 w-40 rounded mb-4" />
                                <div className="shimmer h-4 w-full rounded mb-3" />
                                <div className="shimmer h-4 w-3/4 rounded" />
                            </div>
                        ))}
                    </div>
                ) : newsRisks.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-3xl text-center py-20 px-4 shadow-sm">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-5">
                            <HiOutlineNewspaper className="w-10 h-10 text-slate-400" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-700 mb-2">No Intelligence Data</h3>
                        <p className="text-slate-500 mb-6 font-medium text-lg">
                            Click &quot;Refresh Intelligence&quot; to fetch and analyze the latest disaster news via AI.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {newsRisks.map((item, index) => (
                            <motion.div
                                key={item._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className={`glass-card p-6 border-l-4 ${riskColors[item.riskLevel] || riskColors.Medium}`}
                            >
                                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                                    <div className="flex items-center gap-3">
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${riskBadgeColors[item.riskLevel] || riskBadgeColors.Medium
                                                }`}
                                        >
                                            {item.riskLevel}
                                        </span>
                                        <span className="text-lg font-black text-slate-800 tracking-tight">{item.province}</span>
                                        <span className="text-sm font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                                            Score: {item.riskScore}/100
                                        </span>
                                    </div>
                                    {item.source?.url && (
                                        <a
                                            href={item.source.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                                        >
                                            <HiOutlineExternalLink className="w-4 h-4" />
                                            Source Report
                                        </a>
                                    )}
                                </div>

                                <p className="text-base text-slate-700 leading-relaxed font-medium mb-4">{item.summary}</p>

                                <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-slate-500">
                                    {item.source?.title && (
                                        <span className="truncate max-w-sm flex items-center gap-2">
                                            <span className="text-lg">📰</span> {item.source.title}
                                        </span>
                                    )}
                                    <span className="flex items-center gap-1.5">
                                        <HiOutlineClock className="w-4 h-4" />
                                        {new Date(item.createdAt).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </span>
                                </div>

                                {/* Risk bar */}
                                <div className="mt-4 h-2 bg-slate-200 rounded-full overflow-hidden border border-slate-100">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${item.riskScore}%` }}
                                        transition={{ duration: 1, delay: index * 0.05 }}
                                        className={`h-full rounded-full ${item.riskScore >= 75
                                            ? 'bg-red-500'
                                            : item.riskScore >= 50
                                                ? 'bg-orange-500'
                                                : item.riskScore >= 25
                                                    ? 'bg-yellow-500'
                                                    : 'bg-green-500'
                                            }`}
                                    />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
