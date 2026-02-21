'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
    HiOutlineMap,
    HiOutlineDocumentReport,
    HiOutlineNewspaper,
    HiOutlineChartBar,
    HiOutlineLogout,
    HiOutlineLogin,
    HiOutlineMenu,
    HiOutlineX,
    HiOutlineShieldCheck,
    HiOutlineLocationMarker,
    HiOutlineViewGrid,
} from 'react-icons/hi';

const navLinks = [
    { href: '/map', label: 'Live Map', icon: HiOutlineMap },
    { href: '/near-me', label: 'Near Me', icon: HiOutlineLocationMarker },
    { href: '/report', label: 'Report', icon: HiOutlineDocumentReport },
    { href: '/news', label: 'Intelligence', icon: HiOutlineNewspaper },
    { href: '/admin', label: 'Dashboard', icon: HiOutlineChartBar },
];

export default function Navbar() {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    const activeNavLinks = user
        ? [...navLinks, { href: '/my-incidents', label: 'My Incidents', icon: HiOutlineViewGrid }]
        : navLinks;

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 group-hover:scale-105 transition-all duration-300">
                            <HiOutlineShieldCheck className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-black text-slate-800 hidden sm:block tracking-tight">
                            Sentinel<span className="text-blue-600"> AI</span>
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-1">
                        {activeNavLinks.map((link) => {
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${isActive
                                        ? 'text-blue-600 bg-blue-50'
                                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                                        }`}
                                >
                                    <link.icon className="w-[18px] h-[18px]" />
                                    {link.label}
                                    {isActive && (
                                        <motion.div
                                            layoutId="nav-indicator"
                                            className="absolute bottom-0 left-3 right-3 h-[3px] bg-blue-600 rounded-t-full"
                                        />
                                    )}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Auth buttons */}
                    <div className="hidden md:flex items-center gap-3">
                        {user ? (
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 shadow-sm">
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-xs font-bold text-white shadow-inner">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-sm font-semibold text-slate-700">{user.name}</span>
                                </div>
                                <button
                                    onClick={logout}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-slate-500 hover:text-red-500 hover:bg-red-50 transition-all"
                                >
                                    <HiOutlineLogout className="w-[18px] h-[18px]" />
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <Link
                                href="/login"
                                className="flex items-center gap-1.5 btn-primary !px-5 !py-2.5 text-sm font-bold shadow-blue-500/20"
                            >
                                <HiOutlineLogin className="w-4 h-4" />
                                Sign In
                            </Link>
                        )}
                    </div>

                    {/* Mobile toggle */}
                    <button
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className="md:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                    >
                        {mobileOpen ? <HiOutlineX className="w-5 h-5" /> : <HiOutlineMenu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile menu */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="md:hidden overflow-hidden border-t border-slate-200 bg-white shadow-xl absolute top-16 left-0 right-0"
                    >
                        <div className="px-4 py-3 space-y-1">
                            {activeNavLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setMobileOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${pathname === link.href
                                        ? 'text-blue-600 bg-blue-50'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                        }`}
                                >
                                    <link.icon className="w-5 h-5" />
                                    {link.label}
                                </Link>
                            ))}
                            <div className="pt-2 mt-2 border-t border-slate-100">
                                {user ? (
                                    <button
                                        onClick={() => { logout(); setMobileOpen(false); }}
                                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 w-full"
                                    >
                                        <HiOutlineLogout className="w-5 h-5" />
                                        Logout ({user.name})
                                    </button>
                                ) : (
                                    <Link
                                        href="/login"
                                        onClick={() => setMobileOpen(false)}
                                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-blue-600 hover:bg-blue-50"
                                    >
                                        <HiOutlineLogin className="w-5 h-5" />
                                        Sign In
                                    </Link>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
