const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

app.use(cors());
app.get('/', (req, res) => {
    res.send('Video Chat Server Running');
});

// Socket.io signaling for WebRTC
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-room', (roomId) => {
        socket.join(roomId);
        socket.to(roomId).emit('user-joined', socket.id);
        console.log(`${socket.id} joined room ${roomId}`);
    });

    socket.on('signal', ({ roomId, data }) => {
        // Forward signaling data to other users in the room
        socket.to(roomId).emit('signal', { from: socket.id, data });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // Optionally: notify others in the room
    });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
}); 