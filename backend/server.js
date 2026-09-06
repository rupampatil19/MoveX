const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/activity', require('./routes/activity'));
app.use('/api/verification', require('./routes/verification'));
app.use('/api/leaderboard', require('./routes/leaderboard'));
app.use('/api/community', require('./routes/community'));
app.use('/api/ai-coach', require('./routes/aiCoach'));
app.use('/api/game-mode', require('./routes/gameMode'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/rewards', require('./routes/rewards'));
app.use('/api/clans', require('./routes/clans'));
app.use('/api/movex-system', require('./routes/movexSystem'));
app.use('/api/quests', require('./routes/quests'));
app.use('/api/events', require('./routes/events'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));