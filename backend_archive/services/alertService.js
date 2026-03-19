const db = require('../config/db');

function haversineDistance(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function sendLocationAlerts(incident, io) {
    const ALERT_RADIUS_KM = 20;
    const SPAM_COOLDOWN_MS = 10 * 60 * 1000;
    const now = new Date();

    try {
        const result = await db.query('SELECT * FROM users WHERE lat IS NOT NULL AND lng IS NOT NULL AND id != $1', [incident.user_id || incident.userId]);
        const users = result.rows;
        const alertedUsers = [];

        for (const user of users) {
            const dist = haversineDistance(incident.lat, incident.lng, user.lat, user.lng);
            if (dist > ALERT_RADIUS_KM) continue;

            if (user.last_alert_at && (now - new Date(user.last_alert_at)) < SPAM_COOLDOWN_MS) continue;

            await db.query('UPDATE users SET last_alert_at = $1 WHERE id = $2', [now.toISOString(), user.id]);
            alertedUsers.push(user.id);
        }

        if (alertedUsers.length > 0) {
            io.emit('proximity-alert', {
                type: 'proximity_alert',
                alertedUsers,
                incident: {
                    _id: incident.id,
                    type: incident.type,
                    description: incident.description?.substring(0, 100),
                    severity: incident.urgency_level || incident.ai_severity || 'Unknown',
                    location: { lat: incident.lat, lng: incident.lng },
                    imageUrl: incident.image_url,
                    recommendation: incident.recommendation,
                },
                timestamp: now.toISOString(),
            });
        }
    } catch (error) {
        console.error('Alert error:', error.message);
    }
}

module.exports = { sendLocationAlerts, haversineDistance };
