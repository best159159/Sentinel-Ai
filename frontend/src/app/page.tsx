'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  HiOutlineMap,
  HiOutlineLightningBolt,
  HiOutlineShieldCheck,
  HiOutlineGlobe,
  HiOutlineChartBar,
  HiOutlineBell,
} from 'react-icons/hi';

const features = [
  {
    icon: HiOutlineMap,
    title: 'Real-Time Map',
    description: 'Live interactive map with incident markers, severity-based colors, and dynamic heatmap visualization.',
    gradient: 'from-blue-500 to-cyan-400',
  },
  {
    icon: HiOutlineLightningBolt,
    title: 'AI Analysis',
    description: 'GPT-5 mini powered incident analysis delivering severity scores, urgency classification, and response recommendations.',
    gradient: 'from-purple-500 to-pink-400',
  },
  {
    icon: HiOutlineShieldCheck,
    title: 'Smart Reports',
    description: 'Submit incidents with images, auto-location detection, and instant AI-driven classification.',
    gradient: 'from-green-500 to-emerald-400',
  },
  {
    icon: HiOutlineGlobe,
    title: 'National Intelligence',
    description: 'Real-time disaster news monitoring with AI-powered risk analysis across all provinces.',
    gradient: 'from-orange-500 to-yellow-400',
  },
  {
    icon: HiOutlineBell,
    title: 'Proximity Alerts',
    description: 'Location-based notifications when incidents are reported nearby with spam prevention.',
    gradient: 'from-red-500 to-orange-400',
  },
  {
    icon: HiOutlineChartBar,
    title: 'Analytics Dashboard',
    description: 'Comprehensive admin dashboard with incident breakdowns, risk zones, and confidence metrics.',
    gradient: 'from-indigo-500 to-blue-400',
  },
];

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-50 via-white to-slate-50" />
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-400/20 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-400/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-cyan-400/20 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '2s' }} />
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.4]"
            style={{
              backgroundImage: `linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)`,
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        <div className="relative max-w-5xl mx-auto text-center z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-50 border border-blue-100/80 shadow-sm text-blue-600 text-sm font-semibold mb-8">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
              Build the Future with AI
            </div>

            {/* Title */}
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tight mb-6">
              <span className="text-slate-800">Sentinel</span>{' '}
              <span className="gradient-text">AI</span>
            </h1>

            <p className="text-2xl sm:text-3xl text-slate-600 font-bold max-w-2xl mx-auto mb-6">
              Smart Community Safety Platform
            </p>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
              AI-powered disaster monitoring with real-time mapping, intelligent incident analysis,
              and proximity-based emergency alerts.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/map">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-primary text-base flex items-center gap-2 px-8 py-4"
                >
                  <HiOutlineMap className="w-5 h-5" />
                  View Live Map
                </motion.button>
              </Link>
              <Link href="/report">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 rounded-xl text-base font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm flex items-center gap-2"
                >
                  <HiOutlineLightningBolt className="w-5 h-5 text-purple-500" />
                  Report Incident
                </motion.button>
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-20 grid grid-cols-2 lg:grid-cols-3 gap-6 max-w-3xl mx-auto"
          >
            {[
              { value: 'Real-Time', label: 'Map Updates' },
              { value: 'GPT-5 mini', label: 'AI Analysis' },
              { value: '< 1min', label: 'Alert Speed' },
            ].map((stat, i) => (
              <div key={i} className="bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-white shadow-sm hover:shadow-md transition-all">
                <div className="text-3xl font-black text-slate-800 mb-2">{stat.value}</div>
                <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 rounded-full border-2 border-slate-300 flex items-start justify-center p-2 bg-white/50 backdrop-blur-sm">
            <div className="w-1.5 h-2.5 rounded-full bg-slate-400" />
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 bg-slate-50 relative">
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-black text-slate-800 mb-6">
              Powered by Intelligence
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto font-medium">
              Every feature is designed to save lives through faster response times and smarter analysis.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass-card-hover p-8 group border border-slate-100 bg-white"
              >
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-lg`}
                >
                  <feature.icon className="w-7 h-7 text-white drop-shadow-md" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">{feature.title}</h3>
                <p className="text-slate-500 leading-relaxed font-medium">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-4 relative">
        <div className="absolute inset-0 bg-blue-600 pattern-isometric pattern-blue-500 pattern-bg-blue-600 pattern-opacity-20 pattern-size-8" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-white/10 backdrop-blur-2xl p-12 sm:p-16 border border-white/20 rounded-3xl shadow-[0_0_50px_rgba(37,99,235,0.5)]"
          >
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-6 tracking-tight drop-shadow-sm">
              Ready to Make Your Community Safer?
            </h2>
            <p className="text-xl text-blue-100 mb-10 font-medium max-w-2xl mx-auto">
              Join Sentinel AI and help build a safer future with real-time disaster monitoring and AI-powered analysis.
            </p>
            <Link href="/register">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white text-blue-600 font-bold text-lg px-10 py-5 rounded-2xl shadow-xl hover:shadow-2xl transition-all"
              >
                Get Started — It&apos;s Free
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-10 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
              <HiOutlineShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="text-slate-200 font-bold text-lg">Sentinel <span className="text-blue-400">AI</span></span>
          </div>
          <p className="text-slate-400 text-sm font-medium">
            Built with Next.js, OpenAI, Mapbox & SQLite
          </p>
        </div>
      </footer>
    </div>
  );
}
