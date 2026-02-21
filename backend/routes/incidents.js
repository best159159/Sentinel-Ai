const express = require('express');
const { randomUUID } = require('crypto');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { auth } = require('../middleware/auth');
const { validateIncident } = require('../middleware/validation');
const { upload } = require('../config/upload');
const db = require('../config/db');
const { analyzeIncident, calculateBoostedSeverity } = require('../services/aiService');
const { sendLocationAlerts } = require('../services/alertService');

const router = express.Router();

const reportLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { error: 'Too many reports' } });

function mapIncident(i) {
    return {
        ...i,
        _id: i.id,
        location: { lat: i.lat, lng: i.lng },
        imageUrl: i.image_url,
        keywordsDetected: JSON.parse(i.keywords_detected || '[]'),
        aiAnalysis: {
            classifiedType: i.classified_type,
            severityScore: i.severity_score,
            urgencyLevel: i.urgency_level,
            keywordsDetected: JSON.parse(i.keywords_detected || '[]'),
            recommendation: i.recommendation,
            confidenceScore: i.confidence_score,
        },
    };
}

// GET /api/incidents
router.get('/', async (req, res) => {
    try {
        let query = 'SELECT * FROM incidents';
        const params = [];
        const conditions = [];
        let paramIndex = 1;

        if (req.query.type) {
            conditions.push(`type = $${paramIndex++}`);
            params.push(req.query.type);
        }
        if (req.query.urgency) {
            conditions.push(`urgency_level = $${paramIndex++}`);
            params.push(req.query.urgency);
        }

        if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
        query += ' ORDER BY created_at DESC LIMIT 100';

        const result = await db.query(query, params);
        const incidents = result.rows.map(mapIncident);
        res.json({ incidents, pagination: { total: incidents.length } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch incidents' });
    }
});

// GET /api/incidents/heatmap
router.get('/heatmap', async (req, res) => {
    const result = await db.query('SELECT lat, lng, severity_score FROM incidents');
    const features = result.rows.map(i => ({
        type: 'Feature',
        properties: { weight: (i.severity_score || 50) / 100 },
        geometry: { type: 'Point', coordinates: [i.lng, i.lat] },
    }));
    res.json({ type: 'FeatureCollection', features });
});

// GET /api/incidents/me
router.get('/me', auth, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM incidents WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
        const incidents = result.rows.map(mapIncident);
        res.json({ incidents });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch your incidents' });
    }
});

// POST /api/incidents
router.post('/', auth, reportLimiter, upload.single('image'), async (req, res) => {
    try {
        const { type, description } = req.body;
        const location = typeof req.body.location === 'string'
            ? JSON.parse(req.body.location)
            : req.body.location;
        const { lat, lng } = location;

        let imageUrl = null;
        let base64Image = null;
        if (req.file) {
            imageUrl = `/uploads/${req.file.filename}`;
            try {
                const fs = require('fs');
                const fileBuffer = fs.readFileSync(req.file.path);
                base64Image = `data:${req.file.mimetype};base64,${fileBuffer.toString('base64')}`;
            } catch (err) {
                console.error("Error reading image for AI:", err.message);
            }
        }

        const analysis = await analyzeIncident(type, description, new Date().toISOString(), base64Image);
        const id = randomUUID();

        // 1. Cluster & Escalation Logic (Dynamic by type)
        const twentyMinAgo = new Date(Date.now() - 20 * 60 * 1000).toISOString();
        const largeScaleTypes = ['flood', 'fire', 'earthquake', 'storm', 'ไฟไหม้', 'น้ำท่วม', 'แผ่นดินไหว', 'พายุ', 'อัคคีภัย', 'ภัยพิบัติ'];
        const isLargeScale = type ? largeScaleTypes.some(t => type.toLowerCase().includes(t)) : false;

        const radiusInMeters = isLargeScale ? 1000 : 100;
        const radius = isLargeScale ? 0.009 : 0.0009; // approx degrees

        const nearbyCountResult = await db.query(
            `SELECT COUNT(*) as count FROM incidents WHERE lat BETWEEN $1 AND $2 AND lng BETWEEN $3 AND $4 AND created_at >= $5 AND type = $6`,
            [lat - radius, lat + radius, lng - radius, lng + radius, twentyMinAgo, type]
        );
        const clusteredCount = (parseInt(nearbyCountResult.rows[0]?.count) || 0) + 1;

        // 2. AI Confidence Logic (Tighter scoring, scales with cluster size)
        let confidenceScore = analysis.confidenceScore || 0.4;
        if (base64Image) {
            confidenceScore += 0.2; // Image increases confidence
        }

        // Every additional report in the cluster bumps confidence significantly
        if (clusteredCount > 1) {
            const extraConfidence = (clusteredCount - 1) * 0.15; // +0.15 for every extra report
            confidenceScore += extraConfidence;
        }

        if (description && description.length >= 80) {
            confidenceScore += 0.1; // Need long details to get extra confidence
        }
        analysis.confidenceScore = Math.min(1.0, confidenceScore);

        if (clusteredCount >= 3) {
            analysis.severityScore = Math.max(analysis.severityScore || 0, 85);
            analysis.urgencyLevel = 'Critical';
            const distStr = isLargeScale ? '1 กิโลเมตร' : '100 เมตร';
            analysis.recommendation = `🚨 [สถานการณ์ขยายตัว] ระบบตรวจพบรายงานเหตุการณ์ซ้ำหลายครั้งในระยะ ${distStr}!\n\n` + (analysis.recommendation || '');
        }

        await db.query(`
            INSERT INTO incidents (id, user_id, type, description, image_url, lat, lng,
                classified_type, severity_score, urgency_level, keywords_detected, recommendation, confidence_score)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        `, [
            id, req.user.id, type, description, imageUrl, lat, lng,
            analysis.classifiedType,
            analysis.severityScore,
            analysis.urgencyLevel,
            JSON.stringify(analysis.keywordsDetected),
            analysis.recommendation,
            analysis.confidenceScore
        ]);

        const incidentResult = await db.query('SELECT * FROM incidents WHERE id = $1', [id]);
        const incident = incidentResult.rows[0];
        const mapped = mapIncident(incident);

        const io = req.app.get('io');
        if (io) {
            io.emit('new-incident', mapped);
            await sendLocationAlerts(incident, io);
        }

        res.status(201).json(mapped);
    } catch (error) {
        console.error('Create error:', error);
        res.status(500).json({ error: 'Failed to create incident' });
    }
});

// DELETE /api/incidents/:id
router.delete('/:id', auth, async (req, res) => {
    try {
        const id = req.params.id;
        // Verify ownership
        const result = await db.query('SELECT user_id FROM incidents WHERE id = $1', [id]);
        const incident = result.rows[0];

        if (!incident) {
            return res.status(404).json({ error: 'Incident not found' });
        }

        if (incident.user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized to delete this incident' });
        }

        await db.query('DELETE FROM incidents WHERE id = $1', [id]);

        const io = req.app.get('io');
        if (io) {
            io.emit('incident-deleted', id);
        }

        res.json({ message: 'Incident deleted successfully' });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: 'Failed to delete incident' });
    }
});

module.exports = router;
