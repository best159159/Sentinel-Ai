const express = require('express');
const { randomUUID } = require('crypto');
const { auth } = require('../middleware/auth');
const db = require('../config/db');
const { generateThaiEmergencyNews } = require('../services/aiService');

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const result = await db.query("SELECT * FROM news_risks WHERE created_at >= $1 ORDER BY risk_score DESC LIMIT 50", [dayAgo]);
        res.json(result.rows.map(r => ({
            ...r,
            _id: r.id,
            riskScore: r.risk_score,
            riskLevel: r.risk_level,
            lat: r.lat,
            lng: r.lng,
            createdAt: r.created_at,
            source: { title: r.source_title, url: r.source_url }
        })));
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});

router.post('/refresh', auth, async (req, res) => {
    try {
        const newsList = await generateThaiEmergencyNews();
        const insertedRisks = [];

        for (const item of newsList) {
            const id = randomUUID();
            await db.query(`
                INSERT INTO news_risks (id, province, risk_score, summary, risk_level, source_title, source_url, lat, lng)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `, [
                id, item.province, item.riskScore, item.summary, item.riskLevel,
                item.source_title, item.source_url, item.lat, item.lng
            ]);

            insertedRisks.push({
                _id: id,
                province: item.province,
                riskScore: item.riskScore,
                summary: item.summary,
                riskLevel: item.riskLevel,
                lat: item.lat,
                lng: item.lng,
                createdAt: new Date().toISOString(),
                source: { title: item.source_title, url: item.source_url }
            });
        }

        res.json({ message: 'News refreshed successfully via AI', data: insertedRisks });
    } catch (error) {
        console.error('Error generating AI news:', error);
        res.status(500).json({ message: 'Failed to generate news', data: [] });
    }
});

module.exports = router;
