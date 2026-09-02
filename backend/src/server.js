import { createServer } from 'http';
import { Server } from 'socket.io';
import { createApp } from './app.js';

// This entry point is for local development and traditional Node hosts
// (Railway, Render, a VPS) where the process stays alive — so it wraps the
// shared Express app with a real HTTP server and Socket.IO for real-time
// notifications. For Vercel's serverless functions, see api/index.js instead,
// which uses the same createApp() but skips the socket server.

const app = createApp();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: process.env.CLIENT_URL || '*' } });

app.set('io', io);

io.on('connection', (socket) => {
  socket.on('join', (companyId) => socket.join(`company:${companyId}`));
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`\u2713 DMS API listening on http://localhost:${PORT}`);
});
