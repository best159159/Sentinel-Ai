const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Helper: wraps pool.query for convenience
const db = {
  query: (text, params) => pool.query(text, params),
  pool,
};

// Initialize tables
async function initDB() {
  try {
    await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                name TEXT NOT NULL,
                lat DOUBLE PRECISION,
                lng DOUBLE PRECISION,
                role TEXT DEFAULT 'user',
                last_alert_at TIMESTAMPTZ,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS incidents (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                type TEXT NOT NULL,
                description TEXT NOT NULL,
                image_url TEXT,
                lat DOUBLE PRECISION NOT NULL,
                lng DOUBLE PRECISION NOT NULL,
                status TEXT DEFAULT 'active',
                classified_type TEXT,
                severity_score DOUBLE PRECISION DEFAULT 0,
                urgency_level TEXT DEFAULT 'Low',
                keywords_detected TEXT DEFAULT '[]',
                recommendation TEXT,
                confidence_score DOUBLE PRECISION DEFAULT 0,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS news_risks (
                id TEXT PRIMARY KEY,
                province TEXT NOT NULL,
                risk_score DOUBLE PRECISION NOT NULL,
                summary TEXT NOT NULL,
                risk_level TEXT DEFAULT 'Low',
                source_title TEXT,
                source_url TEXT,
                source_date TEXT,
                lat DOUBLE PRECISION,
                lng DOUBLE PRECISION,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );

            -- Ensure columns exist for migration
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='news_risks' AND column_name='lat') THEN
                    ALTER TABLE news_risks ADD COLUMN lat DOUBLE PRECISION;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='news_risks' AND column_name='lng') THEN
                    ALTER TABLE news_risks ADD COLUMN lng DOUBLE PRECISION;
                END IF;
            END $$;
        `);
    console.log('✅ PostgreSQL ready');
  } catch (err) {
    console.error('❌ PostgreSQL init error:', err.message);
  }
}

initDB();

module.exports = db;
