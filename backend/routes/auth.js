const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');
const db = require('../config/db');
const { validateRegister, validateLogin } = require('../middleware/validation');
const { auth } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register
router.post('/register', validateRegister, async (req, res) => {
    try {
        const { email, password, name, location } = req.body;

        const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) return res.status(400).json({ error: 'Email already registered' });

        const hashedPassword = await bcrypt.hash(password, 12);
        const id = randomUUID();
        const lat = location?.lat || null;
        const lng = location?.lng || null;

        await db.query(
            `INSERT INTO users (id, email, password, name, lat, lng) VALUES ($1, $2, $3, $4, $5, $6)`,
            [id, email, hashedPassword, name, lat, lng]
        );

        const token = jwt.sign({ userId: id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            token,
            user: { _id: id, email, name, role: 'user', location: { lat, lng } },
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// POST /api/auth/login
router.post('/login', validateLogin, async (req, res) => {
    try {
        const { email, password } = req.body;

        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({
            token,
            user: { _id: user.id, email: user.email, name: user.name, role: user.role, location: { lat: user.lat, lng: user.lng } },
        });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

// GET /api/auth/me
router.get('/me', auth, (req, res) => {
    res.json({
        user: { _id: req.user.id, email: req.user.email, name: req.user.name, role: req.user.role, location: { lat: req.user.lat, lng: req.user.lng } },
    });
});

// PUT /api/auth/location
router.put('/location', auth, async (req, res) => {
    const { lat, lng } = req.body;
    await db.query('UPDATE users SET lat = $1, lng = $2 WHERE id = $3', [lat, lng, req.user.id]);
    res.json({ message: 'Location updated', location: { lat, lng } });
});

module.exports = router;
