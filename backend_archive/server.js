require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

// Init DB first
require('./config/db');

const { setupSocket } = require('./socket/socketHandler');
const authRoutes = require('./routes/auth');
const incidentRoutes = require('./routes/incidents');
const newsRoutes = require('./routes/news');
const adminRoutes = require('./routes/admin');
const chatRoutes = require('./routes/chat');
const { generateThaiEmergencyNews } = require('./services/aiService');
const { randomUUID } = require('crypto');
const db = require('./config/db');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
});
app.set('io', io);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: '*', credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', db: 'postgresql' }));

app.use((err, req, res, next) => res.status(err.status || 500).json({ error: err.message }));

setupSocket(io);

// Refresh news automatically every 1 hour using OpenAI
/*
setInterval(async () => {
    try {
        console.log('🔄 [Cron] Generating fake Thai emergency news via ChatGPT...');
        const newsList = await generateThaiEmergencyNews();
        if (newsList && newsList.length > 0) {
            for (const item of newsList) {
                const id = randomUUID();
                await db.query(`
                    INSERT INTO news_risks (id, province, risk_score, summary, risk_level, source_title, source_url, lat, lng)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                `, [
                    id, item.province, item.riskScore, item.summary, item.riskLevel,
                    item.source_title, item.source_url, item.lat, item.lng
                ]);
            }
            console.log(`✅ [Cron] Inserted ${newsList.length} AI news events.`);
        }
    } catch (err) {
        console.error('❌ [Cron] Error generating AI news:', err.message);
    }
}, 60 * 60 * 1000); // Every 1 hour
*/

const PORT = process.env.BACKEND_PORT || process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`\n🚀 Sentinel AI Backend running on port ${PORT}`);
    console.log(`📦 Database: PostgreSQL`);
    console.log(`🤖 OpenAI: ${process.env.OPENAI_API_KEY?.startsWith('sk-') ? 'Connected ✅' : 'Not set — using fallback ⚠️'}`);
    console.log(`🌍 http://localhost:${PORT}\n`);
});
