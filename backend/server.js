// ============================================================
// DNS WORKAROUND (must be first)
// ============================================================
const dns = require('dns');
dns.setServers(['1.1.1.1', '8.8.8.8']);

// ============================================================
// IMPORTS
// ============================================================
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

dotenv.config();

const app = express();

// ============================================================
// TRUST PROXY (required on Render for correct IP detection)
// ============================================================
app.set('trust proxy', 1);

// ============================================================
// SECURITY HEADERS (Helmet)
// ============================================================
app.use(helmet({
  contentSecurityPolicy: false,               // disabled — Leaflet, fonts need it off
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false,
}));

// ============================================================
// CORS (strict origin allowlist)
// ============================================================
const allowedOrigins = [
  process.env.CORS_ORIGIN || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (curl, Postman, mobile webviews)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// ============================================================
// BODY PARSERS (with size limits)
// ============================================================
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ============================================================
// RATE LIMITERS
// ============================================================
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use(globalLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts, please try again later.' },
});

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many AI Coach requests, please slow down.' },
});

const verificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many verification requests.' },
});

// ============================================================
// HTTP SERVER + SOCKET.IO
// ============================================================
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('register', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} registered for notifications`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// ============================================================
// MONGODB
// ============================================================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// ============================================================
// HEALTH CHECK
// ============================================================
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// ============================================================
// ROUTES
// ============================================================
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth', require('./routes/auth'));
app.use('/api/activity', require('./routes/activity'));
app.use('/api/verification', verificationLimiter, require('./routes/verification'));
app.use('/api/leaderboard', require('./routes/leaderboard'));
app.use('/api/community', require('./routes/community'));
app.use('/api/ai-coach', aiLimiter, require('./routes/aiCoach'));
app.use('/api/game-mode', require('./routes/gameMode'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/rewards', require('./routes/rewards'));
app.use('/api/clans', require('./routes/clans'));
app.use('/api/movex-system', require('./routes/movexSystem'));
app.use('/api/quests', require('./routes/quests'));
app.use('/api/events', require('./routes/events'));
app.use('/api/analytics', require('./routes/analytics'));

app.get('/', (req, res) => res.send('MoveX API is running'));

// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);

  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'CORS policy: origin not allowed' });
  }

  res.status(500).json({ error: 'Internal server error' });
});

// ============================================================
// START SERVER
// ============================================================
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));