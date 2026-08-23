const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Activity = require('../models/Activity');
const Community = require('../models/Community');
const AICoachProfile = require('../models/AICoachProfile');
const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});
const router = express.Router();

// Middleware to verify token
const auth = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

// Get AI Coach profile
router.get('/profile', auth, async (req, res) => {
  try {
    let profile = await AICoachProfile.findOne({ userId: req.userId });
    if (!profile) {
      profile = new AICoachProfile({ userId: req.userId });
      await profile.save();
    }
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update AI Coach profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { goals, preferences, notifications } = req.body;
    let profile = await AICoachProfile.findOne({ userId: req.userId });
    if (!profile) {
      profile = new AICoachProfile({ userId: req.userId });
    }
    if (goals) profile.goals = goals;
    if (preferences) profile.preferences = preferences;
    if (notifications) profile.notifications = notifications;
    await profile.save();
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Build athlete context from real data
async function buildContext(userId) {
  const user = await User.findById(userId);
  const activities = await Activity.find({ userId }).sort({ date: -1 }).limit(10);
  const community = await Community.findOne({ region: user.region });
  const profile = await AICoachProfile.findOne({ userId }).lean() || { goals: [] };
  const weeklyActivities = activities.filter(a => new Date(a.date) > new Date(Date.now() - 7*24*60*60*1000));
  const totalDistance = weeklyActivities.reduce((sum, a) => sum + a.distance, 0);
  const totalDuration = weeklyActivities.reduce((sum, a) => sum + a.duration, 0);
  const totalXP = weeklyActivities.reduce((sum, a) => sum + (a.xpAwarded || 0), 0);
  const totalEnergy = weeklyActivities.reduce((sum, a) => sum + (a.energyAwarded || 0), 0);

  return {
    user: {
      id: user._id,
      name: user.name,
      level: user.level,
      xp: user.xp,
      energy: user.energy,
      streak: user.streak,
      trophies: user.trophies,
      region: user.region
    },
    weekly: {
      activities: weeklyActivities.length,
      totalDistance,
      totalDuration,
      totalXP,
      totalEnergy
    },
    recentActivities: activities.slice(0, 5).map(a => ({
      type: a.type,
      distance: a.distance,
      duration: a.duration,
      date: a.date,
      avs: a.verification?.avs || 0,
      energyAwarded: a.energyAwarded,
      xpAwarded: a.xpAwarded
    })),
    community: community ? {
      region: community.region,
      totalEnergy: community.totalEnergy,
      powerStationLevel: community.powerStationLevel,
      powerStationCurrentEnergy: community.powerStationCurrentEnergy,
      powerStationRequiredEnergy: community.powerStationRequiredEnergy
    } : null,
    goals: profile.goals || []
  };
}

// Generate AI response using FitCoach AI
async function generateResponse(context, message) {
  const systemInstruction = `
You are FitCoach AI, an expert virtual fitness coach built for a fitness
and sports application.

Your job is to help users become healthier, stronger, more active, and
consistent.

COACHING STYLE:
- Speak like an experienced, supportive personal trainer.
- Be motivating without being cheesy.
- Be confident but never pretend to know something that is unavailable.
- Be practical and realistic.
- Adapt your response to the user's available profile and fitness data.
- Talk naturally, like a real coach having a conversation with the user.
- Never shame the user for their fitness level, food choices, missed workouts,
  or lack of progress.
- Celebrate genuine progress.
- If the user is struggling, give them a small achievable next step.

FITNESS GOALS:
You can help with:
- Fat loss
- Weight maintenance
- Muscle building
- General fitness
- Strength
- Running
- Walking
- Workout consistency
- Motivation
- Basic nutrition guidance
- Recovery and rest
- Daily activity

USE THE USER'S DATA:
When user profile and fitness data are provided, use them in your answer.

IMPORTANT:
- Only use information actually provided in the user context.
- Do not invent missing user information.
- Give practical and realistic advice.
- Do not encourage extreme calorie restriction.
- Do not recommend starvation, purging, dehydration, or dangerous
  weight-loss methods.
- Encourage sustainable habits.

WORKOUT GUIDANCE:
- Recommend exercises appropriate to the user's stated goal and apparent
  fitness level.
- Give beginner-friendly alternatives when appropriate.
- Encourage proper warm-up, technique, recovery and gradual progression.
- Do not encourage dangerous training through pain or injury.
- If the user reports significant pain, injury, fainting, chest pain,
  severe shortness of breath, or another potentially serious symptom,
  recommend stopping exercise and seeking appropriate medical care.

DAILY PROGRESS:
When fitness data is available, consider:
- Activities
- Distance
- Workout duration
- XP
- Energy
- Streak
- Recent activity history

Don't judge progress using only one metric.

MOTIVATION:
If the user says they are lazy, tired, unmotivated, or don't feel like
working out:
- Do not lecture them.
- Give them a very small action they can start immediately.
- Focus on consistency rather than perfection.

RESPONSE STYLE:
- Start with the most useful answer.
- Keep responses concise and easy to read.
- Prefer short paragraphs instead of one large paragraph.
- Use Markdown headings when they improve readability.
- Use bullet points or numbered lists for workouts, plans, steps, or recommendations.
- Use bold text sparingly to highlight important points.
- Break long responses into clear sections.
- Avoid unnecessary repetition.
- Use emojis sparingly and only when they feel natural.
- Talk like a supportive personal fitness coach, not like a formal report.
- Ask a follow-up question only when it genuinely helps personalize the advice.
- Do not repeat the entire user profile in every response.
- Do not say "As an AI language model."
- Do not claim to be a human doctor, nutritionist, or certified trainer.

IMPORTANT:
You are a fitness coaching assistant, not a medical professional.
For medical diagnosis, serious symptoms, eating disorders, medication,
or other medical questions, encourage the user to consult a qualified
health professional.
`;

  const userContext = `
USER CONTEXT:
${JSON.stringify(context, null, 2)}

USER QUESTION:
${message}
`;

  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
    contents: userContext,
    config: {
      systemInstruction: systemInstruction
    }
  });

  return response.text || "I couldn't generate a response right now. Please try again.";
}
// Chat endpoint
// Chat endpoint
router.post('/chat', auth, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const context = await buildContext(req.userId);

    const reply = await generateResponse(context, message.trim());

    res.json({
      reply,
      context
    });

  } catch (err) {
    console.error('AI Coach error:', err);

    res.status(500).json({
      error: 'Unable to generate AI Coach response'
    });
  }
});

// Get context for AI Coach page
router.get('/context', auth, async (req, res) => {
  try {
    const context = await buildContext(req.userId);
    res.json(context);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get recommendations
router.get('/recommendations', auth, async (req, res) => {
  try {
    const context = await buildContext(req.userId);
    const recommendations = [];
    // Rule-based recommendations
    if (context.weekly.activities < 3) {
      recommendations.push({ type: 'goal', text: "You're below 3 activities this week. Aim for one more to stay consistent." });
    }
    if (context.user.streak > 0 && context.user.streak < 3) {
      recommendations.push({ type: 'streak', text: "Your streak is building. Don't let it break!" });
    }
    if (context.community && context.community.powerStationCurrentEnergy > context.community.powerStationRequiredEnergy * 0.7) {
      recommendations.push({ type: 'community', text: "Your community Power Station is close to upgrading! Contribute more energy." });
    }
    if (context.user.xp % 1000 > 700) {
      recommendations.push({ type: 'level', text: "You're close to next level! One activity should do it." });
    }
    res.json(recommendations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get weekly summary
router.get('/weekly-summary', auth, async (req, res) => {
  try {
    const context = await buildContext(req.userId);
    res.json({
      weekly: context.weekly,
      summary: `You completed ${context.weekly.activities} activities this week, covering ${context.weekly.totalDistance.toFixed(1)} km. You earned ${context.weekly.totalEnergy} Energy and ${context.weekly.totalXP} XP.`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;