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

// 🚫 Disabled: /refresh endpoint ถูกปิดชั่วคราวเพื่อประหยัด OpenAI API
router.post('/refresh', auth, async (req, res) => {
    return res.status(503).json({
        message: 'News refresh is temporarily disabled.',
        data: []
    });
});

module.exports = router;
