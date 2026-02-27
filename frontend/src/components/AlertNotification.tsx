'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineExclamation, HiOutlineX, HiOutlineLocationMarker } from 'react-icons/hi';
import { useState, useEffect } from 'react';

interface AlertData {
    id: string;
    type: string;
    description: string;
    severity: string;
    distance?: number;
    imageUrl?: string;
    recommendation?: string;
    location?: { lat: number, lng: number };
    autoExpand?: boolean;
    confidenceScore?: number;
    clusterIncidents?: any[];
}

export default function AlertNotification({
    alert,
    onDismiss,
}: {
    alert: AlertData | null;
    onDismiss: () => void;
}) {
    const [isVisible, setIsVisible] = useState(false);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        if (alert) {
            // Haptic Feedback for High/Critical alerts
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                if (alert.severity === 'Critical') {
                    navigator.vibrate([200, 100, 200, 100, 500]); // SOS-like pattern
                } else if (alert.severity === 'High') {
                    navigator.vibrate([200, 100, 200]);
                }
            }

            if (alert.autoExpand) {
                setShowModal(true);
                setIsVisible(false);
            } else if (!showModal) {
                setIsVisible(true);
                // Auto-dismiss after 10 seconds only if modal is not open
                const timer = setTimeout(() => {
                    setIsVisible(false);
                    setTimeout(onDismiss, 300);
                }, 10000);
                return () => clearTimeout(timer);
            }
        } else {
            setShowModal(false);
            setIsVisible(false);
        }
    }, [alert, onDismiss, showModal]);

    const severityColor = {
        Critical: 'border-l-red-500 bg-red-50',
        High: 'border-l-orange-500 bg-orange-50',
        Medium: 'border-l-yellow-500 bg-yellow-50',
        Low: 'border-l-green-500 bg-green-50',
    };

    const iconColor = {
        Critical: 'text-red-500 bg-red-100',
        High: 'text-orange-500 bg-orange-100',
        Medium: 'text-yellow-600 bg-yellow-100',
        Low: 'text-green-500 bg-green-100',
    };

    return (
        <>
            <AnimatePresence>
                {alert && isVisible && !showModal && (
                    <motion.div
                        initial={{ x: 400, opacity: 0, scale: 0.8 }}
                        animate={{ x: 0, opacity: 1, scale: 1 }}
                        exit={{ x: 400, opacity: 0, scale: 0.8 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-24 right-4 z-[10000] max-w-sm w-full cursor-pointer hover:scale-[1.02] transition-transform"
                        onClick={() => setShowModal(true)}
                    >
                        <div
                            className={`bg-white rounded-2xl shadow-xl border border-slate-200 border-l-[6px] ${severityColor[alert.severity as keyof typeof severityColor] || severityColor.Medium
                                } overflow-hidden`}
                        >
                            {alert.imageUrl && (
                                <div className="w-full h-32 relative">
                                    <img src={alert.imageUrl} alt="Incident" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                                </div>
                            )}
                            <div className="p-4 relative">
                                <div className="flex items-start gap-3">
                                    {!alert.imageUrl && (
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${iconColor[alert.severity as keyof typeof iconColor] || iconColor.Medium}`}>
                                            <HiOutlineExclamation className="w-6 h-6 pulse-ring" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-sm font-black text-slate-800">⚠️ แจ้งเตือนเหตุการณ์ใกล้ตัว!</span>
                                        </div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`text-xs px-2.5 py-1 rounded-md font-bold ${iconColor[alert.severity as keyof typeof iconColor] || iconColor.Medium}`}>
                                                ความรุนแรง: {alert.severity}
                                            </span>
                                            {alert.confidenceScore !== undefined && (
                                                <span className="text-xs px-2.5 py-1 rounded-md font-bold bg-blue-100 text-blue-700 border border-blue-200 flex items-center gap-1">
                                                    🤖 Confidence: {Math.round(alert.confidenceScore * 100)}%
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-base font-bold text-slate-700 mt-1">{alert.type}</p>
                                        <p className="text-sm font-medium text-slate-500 mt-1 line-clamp-2">{alert.description}</p>
                                        {alert.recommendation && (
                                            <div className="mt-3 bg-blue-50/60 rounded-lg p-2.5 border border-blue-100">
                                                <p className="text-xs font-bold text-blue-800 mb-1 flex items-center gap-1">🤖 วิธีรับมือเบื้องต้น:</p>
                                                <p className="text-xs font-medium text-blue-700 line-clamp-3 leading-relaxed whitespace-pre-line">{alert.recommendation}</p>
                                            </div>
                                        )}
                                        <p className="text-xs text-blue-600 mt-3 font-bold bg-blue-50/50 w-max px-2.5 py-1.5 rounded-lg border border-blue-100/50">👉 คลิกเพื่อดูรายละเอียดทั้งหมด</p>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsVisible(false);
                                            setTimeout(onDismiss, 300);
                                        }}
                                        className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all focus:outline-none"
                                    >
                                        <HiOutlineX className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal Detail View */}
            <AnimatePresence>
                {showModal && alert && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[20000] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm"
                        onClick={() => {
                            setShowModal(false);
                            onDismiss();
                        }}
                    >
                        <motion.div
                            initial={{ y: 50, opacity: 0, scale: 0.95 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: 50, opacity: 0, scale: 0.95 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-lg w-full border border-slate-100 max-h-[90vh] flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* If it's a cluster, show a beautifully styled horizontal scrolling gallery. */}
                            {alert.clusterIncidents && alert.clusterIncidents.length > 1 ? (
                                <div className="p-4 bg-slate-50 border-b border-slate-200 shrink-0">
                                    <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                        <HiOutlineLocationMarker className="w-4 h-4 text-blue-500" />
                                        ภาพถ่ายจากที่เกิดเหตุ ({alert.clusterIncidents.filter(ci => ci.imageUrl).length} ภาพ)
                                    </h4>
                                    <div className="flex overflow-x-auto gap-3 hidden-scrollbar custom-scrollbar pb-2">
                                        {alert.clusterIncidents.filter(ci => ci.imageUrl).map((ci, idx) => (
                                            <motion.div
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                key={idx}
                                                className="shrink-0 relative rounded-2xl overflow-hidden shadow-sm border border-slate-200"
                                            >
                                                <img src={ci.imageUrl} alt="Incident" className="h-32 w-48 object-cover" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                                                <div className="absolute bottom-2 left-2 text-white text-[10px] font-bold px-1.5 py-0.5 bg-black/40 rounded-md backdrop-blur-sm">
                                                    ภาพที่ {idx + 1}
                                                </div>
                                            </motion.div>
                                        ))}
                                        {alert.clusterIncidents.filter(ci => ci.imageUrl).length === 0 && alert.imageUrl && (
                                            <img src={alert.imageUrl} alt="Incident" className="w-full h-40 sm:h-56 object-cover shrink-0 rounded-2xl" />
                                        )}
                                    </div>
                                </div>
                            ) : (
                                alert.imageUrl && (
                                    <img src={alert.imageUrl} alt="Incident" className="w-full h-40 sm:h-56 object-cover shrink-0" />
                                )
                            )}

                            <div className="p-5 lg:p-6 overflow-y-auto custom-scrollbar flex-1 relative">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className={`text-xs px-3 py-1 rounded-md font-bold ${iconColor[alert.severity as keyof typeof iconColor] || iconColor.Medium}`}>
                                                ความรุนแรง: {alert.severity}
                                            </span>
                                            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-md border border-slate-200">
                                                {alert.type}
                                            </span>
                                            {alert.confidenceScore !== undefined && (
                                                <span className="text-xs px-3 py-1 rounded-md font-bold bg-blue-100 text-blue-700 border border-blue-200 flex items-center gap-1">
                                                    🤖 AI Confidence: {Math.round(alert.confidenceScore * 100)}%
                                                </span>
                                            )}
                                        </div>
                                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">รายละเอียดเหตุการณ์</h2>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setShowModal(false);
                                            onDismiss();
                                        }}
                                        className="p-2.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all focus:outline-none bg-slate-50 border border-slate-200"
                                    >
                                        <HiOutlineX className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 mb-5 shadow-inner">
                                    {alert.clusterIncidents && alert.clusterIncidents.length > 1 ? (
                                        <div className="space-y-4">
                                            <p className="font-bold text-red-600 mb-2">🔥 มีการรายงานเหตุการณ์นี้ซ้ำกัน {alert.clusterIncidents.length} รายการ (ในบริเวณใกล้เคียงเดียวกัน)</p>
                                            {alert.clusterIncidents.map((ci, idx) => (
                                                <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-sm text-slate-700">
                                                    <span className="font-bold text-slate-500 mr-2">รายงานที่ {idx + 1}:</span>
                                                    {ci.description || 'ไม่มีคำอธิบายเพิ่มเติม'}
                                                    <div className="text-xs text-slate-400 mt-1">เวลา: {new Date(ci.createdAt).toLocaleTimeString('th-TH')}</div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-base font-medium text-slate-700 leading-relaxed">{alert.description || 'ไม่มีคำอธิบายเพิ่มเติม'}</p>
                                    )}
                                </div>

                                {alert.location && (
                                    <div className="mb-5 rounded-2xl overflow-hidden border border-slate-200 h-40 relative shadow-sm">
                                        <iframe
                                            src={`https://www.openstreetmap.org/export/embed.html?bbox=${alert.location.lng - 0.01},${alert.location.lat - 0.01},${alert.location.lng + 0.01},${alert.location.lat + 0.01}&layer=mapnik&marker=${alert.location.lat},${alert.location.lng}`}
                                            className="w-full h-full border-none"
                                            title="Incident Location"
                                        />
                                        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-bold shadow-md border border-slate-100 text-slate-700">
                                            📍 พิกัดรอบๆ {alert.location.lat.toFixed(4)}, {alert.location.lng.toFixed(4)}
                                        </div>
                                    </div>
                                )}

                                {alert.recommendation && (
                                    <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100 mt-5 relative overflow-hidden shadow-sm">
                                        <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-bl-full -z-0"></div>
                                        <h3 className="text-base font-black text-blue-800 mb-3 flex items-center gap-2 relative z-10">
                                            🤖 AI แนะนำวิธีรับมือ:
                                        </h3>
                                        <div className="relative z-10 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                            <p className="text-sm font-medium text-blue-900 leading-relaxed whitespace-pre-line">{alert.recommendation}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="mt-8 flex justify-end">
                                    <button
                                        onClick={() => {
                                            setShowModal(false);
                                            onDismiss();
                                        }}
                                        className="btn-primary w-full sm:w-auto"
                                    >
                                        รับทราบและปิด
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
