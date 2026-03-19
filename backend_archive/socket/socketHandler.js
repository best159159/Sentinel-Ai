/**
 * Socket.io handler for real-time communication
 */
function setupSocket(io) {
    io.on('connection', (socket) => {
        console.log(`🔌 User connected: ${socket.id}`);

        // Track user location for proximity alerts
        socket.on('register-location', (data) => {
            if (data.userId && data.lat && data.lng) {
                socket.userId = data.userId;
                socket.userLocation = { lat: data.lat, lng: data.lng };
                console.log(`📍 User ${data.userId} registered location`);
            }
        });

        // Join room for specific incident updates
        socket.on('watch-incident', (incidentId) => {
            socket.join(`incident:${incidentId}`);
        });

        // Typing indicator (optional, for future chat)
        socket.on('typing', (data) => {
            socket.broadcast.emit('user-typing', data);
        });

        socket.on('disconnect', () => {
            console.log(`🔌 User disconnected: ${socket.id}`);
        });
    });
}

module.exports = { setupSocket };
