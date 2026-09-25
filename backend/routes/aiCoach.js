const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const Activity = require('../models/Activity');
const Community = require('../models/Community');
const AICoachProfile = require('../models/AICoachProfile');
const AIConversation = require('../models/AIConversation');
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

const router = express.Router();

// ============================================================
// AUTH MIDDLEWARE
// ============================================================
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

// ============================================================
// COACHING SYSTEM PROMPT
// ============================================================
const COACHING_PROMPT = `
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

// ============================================================
// BUILD ATHLETE CONTEXT
// ============================================================
async function buildContext(userId) {
  const user = await User.findById(userId);
  const activities = await Activity.find({ userId }).sort({ date: -1 }).limit(10);
  const community = await Community.findOne({ region: user.region });
  const profile = await AICoachProfile.findOne({ userId }).lean() || { goals: [] };
  const weeklyActivities = activities.filter(a => new Date(a.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
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

// ============================================================
// TITLE GENERATION — AI (primary)
// ============================================================
async function generateTitleWithAI(firstMessage) {
  const prompt = `Generate an EXTREMELY short title (2-4 words, max 40 characters) that captures the main topic of the user message below.

Rules:
- Return ONLY the title. No quotes, no periods, no explanations.
- 2-4 words maximum.
- Title Case.
- Be specific and descriptive.
- Do NOT include phrases like "Question about", "User asking", "Help with".
- If it is a health/symptom question, name the condition (e.g. "Back Pain", "Knee Injury").
- If it is a training question, name the focus (e.g. "Running Stamina", "Strength Training").

Examples:
- "I have back pain, what should I do?" -> Back Pain
- "How can I improve my running stamina?" -> Running Stamina
- "What should I eat for more protein?" -> Protein Intake
- "Can you make me a weekly workout plan?" -> Weekly Workout Plan
- "How do I maintain my 7 day streak?" -> 7-Day Streak
- "I feel tired all the time" -> Fatigue & Energy
- "Help me lose belly fat" -> Belly Fat Loss
- "My knee hurts after running" -> Knee Pain
- "Can you plan my recovery week?" -> Recovery Week

User message: "${firstMessage}"

Title:`;

  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
    contents: prompt
  });

  let title = (response.text || '').trim();

  // Cleanup: strip quotes, trailing punctuation, newlines, extra spaces
  title = title.split('\n')[0].trim();
  title = title.replace(/^["'`\s]+|["'`\s]+$/g, '');
  title = title.replace(/[.!?,;:]+$/, '');
  title = title.replace(/\s+/g, ' ');
  title = title.slice(0, 60);

  if (!title) throw new Error('AI returned empty title');
  return title;
}

// ============================================================
// TITLE GENERATION — Deterministic fallback
// ============================================================
function generateTitleFallback(text) {
  if (!text) return 'New Chat';
  let t = text.trim().replace(/\s+/g, ' ');
  t = t.replace(/[?!.]+$/, '');

  const stripPatterns = [
    /^(how (do|can|should|would|might) i)\s+/i,
    /^(what (should|can|do) i)\s+/i,
    /^(where (do|can|should) i)\s+/i,
    /^(when (should|can|do) i)\s+/i,
    /^(why (do|should|does|is|are))\s+/i,
    /^(can you|could you|would you|will you)\s+/i,
    /^(please|help me (to )?|i want to|i need to|i would like to)\s+/i,
    /^(tell me (about )?|show me)\s+/i
  ];

  for (const p of stripPatterns) {
    t = t.replace(p, '');
  }

  const words = t.split(' ').slice(0, 6);
  let title = words.join(' ');
  if (title.length > 60) title = title.slice(0, 57) + '...';
  return title.charAt(0).toUpperCase() + title.slice(1);
}

// ============================================================
// AI GENERATION — single-turn (legacy /chat)
// ============================================================
async function generateResponse(context, message) {
  const systemInstruction = COACHING_PROMPT;
  const userContext = `
USER CONTEXT:
${JSON.stringify(context, null, 2)}

USER QUESTION:
${message}
`;

  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
    contents: userContext,
    config: { systemInstruction }
  });

  return response.text || "I couldn't generate a response right now. Please try again.";
}

// ============================================================
// AI GENERATION — multi-turn with conversation history
// ============================================================
async function generateResponseWithHistory(context, messages) {
  const systemInstruction = `${COACHING_PROMPT}

USER CONTEXT (use this to personalize every reply):
${JSON.stringify(context, null, 2)}
`;

  const history = messages
    .slice(-20)
    .map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
    contents: history,
    config: { systemInstruction }
  });

  return response.text || "I couldn't generate a response right now. Please try again.";
}

// ============================================================
// AI COACH PROFILE
// ============================================================
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

// ============================================================
// LEGACY /chat (single-turn, no history)
// ============================================================
router.post('/chat', auth, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const context = await buildContext(req.userId);
    const reply = await generateResponse(context, message.trim());

    res.json({ reply, context });
  } catch (err) {
    console.error('AI Coach error:', err);
    res.status(500).json({ error: 'Unable to generate AI Coach response' });
  }
});

// ============================================================
// GET /conversations — list metadata only
// ============================================================
router.get('/conversations', auth, async (req, res) => {
  try {
    const conversations = await AIConversation
      .find({ userId: req.userId })
      .select('-messages')
      .sort({ updatedAt: -1 })
      .lean();

    res.json(conversations);
  } catch (err) {
    console.error('List conversations error:', err);
    res.status(500).json({ error: 'Failed to load conversations' });
  }
});

// ============================================================
// POST /conversations — create empty conversation
// ============================================================
router.post('/conversations', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('accountType').lean();
    const conv = new AIConversation({
      userId: req.userId,
      title: 'New Chat',
      accountType: user?.accountType || 'BEGINNER'
    });
    await conv.save();
    res.json(conv);
  } catch (err) {
    console.error('Create conversation error:', err);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// ============================================================
// GET /conversations/:id — load one with full messages
// ============================================================
router.get('/conversations/:id', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid conversation ID' });
    }

    const conv = await AIConversation
      .findOne({ _id: req.params.id, userId: req.userId })
      .lean();

    if (!conv) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json(conv);
  } catch (err) {
    console.error('Load conversation error:', err);
    res.status(500).json({ error: 'Failed to load conversation' });
  }
});

// ============================================================
// POST /conversations/:id/messages — send message, get reply
// ============================================================
router.post('/conversations/:id/messages', auth, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid conversation ID' });
    }

    const conv = await AIConversation.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!conv) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const userMessage = message.trim();

    // 1. Persist user message FIRST
    conv.messages.push({ role: 'user', content: userMessage });

    const isFirstUserMessage =
      conv.messages.filter(m => m.role === 'user').length === 1;

    // 2. Optimistically set fallback title before saving (so it never stays "New Chat")
    if (isFirstUserMessage) {
      conv.title = generateTitleFallback(userMessage);
    }

    await conv.save();

    // 3. Build context
    const context = await buildContext(req.userId);

    // 4. Run AI reply + AI title in parallel
    let reply;
    let aiTitle = null;

    try {
      const [replyResult, titleResult] = await Promise.all([
        generateResponseWithHistory(context, conv.messages),
        isFirstUserMessage
          ? generateTitleWithAI(userMessage).catch((titleErr) => {
              console.error('AI title generation failed:', titleErr.message);
              return null;
            })
          : Promise.resolve(null)
      ]);
      reply = replyResult;
      aiTitle = titleResult;
    } catch (aiErr) {
      console.error('AI generation failed:', aiErr);
      return res.status(502).json({
        error: 'AI Coach could not respond',
        userMessage: conv.messages[conv.messages.length - 1],
        conversationId: conv._id
      });
    }

    // 5. If AI gave a good title, use it (overwrite the fallback)
    if (aiTitle) {
      conv.title = aiTitle;
    }

    // 6. Persist AI reply
    conv.messages.push({ role: 'assistant', content: reply });
    await conv.save();

    const total = conv.messages.length;
    res.json({
      conversationId: conv._id,
      title: conv.title,
      userMessage: conv.messages[total - 2],
      assistantMessage: conv.messages[total - 1]
    });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// ============================================================
// PATCH /conversations/:id — rename conversation
// ============================================================
router.patch('/conversations/:id', auth, async (req, res) => {
  try {
    const { title } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const cleaned = title.trim().slice(0, 60);

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid conversation ID' });
    }

    const conv = await AIConversation.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { title: cleaned, updatedAt: Date.now() },
      { new: true }
    ).select('-messages');

    if (!conv) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json(conv);
  } catch (err) {
    console.error('Rename conversation error:', err);
    res.status(500).json({ error: 'Failed to rename conversation' });
  }
});

// ============================================================
// DELETE /conversations/:id — with ownership check
// ============================================================
router.delete('/conversations/:id', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid conversation ID' });
    }

    const result = await AIConversation.deleteOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('Delete conversation error:', err);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

// ============================================================
// GET /context
// ============================================================
router.get('/context', auth, async (req, res) => {
  try {
    const context = await buildContext(req.userId);
    res.json(context);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// GET /recommendations
// ============================================================
router.get('/recommendations', auth, async (req, res) => {
  try {
    const context = await buildContext(req.userId);
    const recommendations = [];

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

// ============================================================
// GET /weekly-summary
// ============================================================
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