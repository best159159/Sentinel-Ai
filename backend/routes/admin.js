const express = require('express');
const { auth } = require('../middleware/auth');
const db = require('../config/db');

const router = express.Router();

router.get('/stats', auth, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString();

        const totalTodayResult = await db.query("SELECT COUNT(*) as count FROM incidents WHERE created_at >= $1", [todayStr]);
        const totalToday = parseInt(totalTodayResult.rows[0].count);

        const totalAllResult = await db.query("SELECT COUNT(*) as count FROM incidents");
        const totalAll = parseInt(totalAllResult.rows[0].count);

        // By type
        const typeResult = await db.query("SELECT type, COUNT(*) as count FROM incidents WHERE created_at >= $1 GROUP BY type", [todayStr]);
        const byType = {};
        typeResult.rows.forEach(r => { byType[r.type] = parseInt(r.count); });

        // By severity
        const sevResult = await db.query("SELECT urgency_level, COUNT(*) as count FROM incidents WHERE created_at >= $1 GROUP BY urgency_level", [todayStr]);
        const bySeverity = {};
        sevResult.rows.forEach(r => { bySeverity[r.urgency_level] = parseInt(r.count); });

        // Critical incidents
        const criticalResult = await db.query("SELECT * FROM incidents WHERE urgency_level = 'Critical' ORDER BY created_at DESC LIMIT 10");
        const criticalIncidents = criticalResult.rows.map(i => ({
            ...i, _id: i.id, location: { lat: i.lat, lng: i.lng }, aiAnalysis: { severityScore: i.severity_score }
        }));

        // Avg confidence
        const avgResult = await db.query("SELECT AVG(confidence_score) as avg FROM incidents WHERE created_at >= $1", [todayStr]);
        const averageConfidence = parseFloat(avgResult.rows[0].avg) || 0;

        res.json({ totalToday, totalAll, byType, bySeverity, criticalIncidents, averageConfidence, topRiskZones: [] });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'Failed to load stats' });
    }
});

module.exports = router;
