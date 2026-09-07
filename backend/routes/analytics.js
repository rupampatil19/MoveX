const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Activity = require('../models/Activity');
const Community = require('../models/Community');

const router = express.Router();

// Auth middleware
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

// GET /api/analytics/report?period=today|month|custom&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
router.get('/report', auth, async (req, res) => {
  try {
    const { period, startDate, endDate } = req.query;
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ msg: 'User not found' });

    let start, end;
    const now = new Date();

    if (period === 'today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    } else if (period === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    } else if (period === 'custom') {
      if (!startDate || !endDate) return res.status(400).json({ msg: 'Start and end dates required for custom period' });
      start = new Date(startDate);
      end = new Date(endDate);
      end.setDate(end.getDate() + 1); // include end date
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return res.status(400).json({ msg: 'Invalid date format' });
      if (end <= start) return res.status(400).json({ msg: 'End date must be after start date' });
    } else {
      return res.status(400).json({ msg: 'Invalid period' });
    }

    // Query activities for this user in the date range
    const activities = await Activity.find({
      userId: req.userId,
      date: { $gte: start, $lt: end },
    }).sort({ date: -1 });

    // Aggregate
    const totalActivities = activities.length;
    const totalDistance = activities.reduce((sum, act) => sum + (act.distance || 0), 0);
    const totalDuration = activities.reduce((sum, act) => sum + (act.duration || 0), 0);
    const totalEnergy = activities.reduce((sum, act) => sum + (act.energyAwarded || 0), 0);
    const totalXP = activities.reduce((sum, act) => sum + (act.xpAwarded || 0), 0);
    const totalTrophies = activities.reduce((sum, act) => sum + (act.trophyAwarded ? 1 : 0), 0);

    // Activity type breakdown
    const typeCount = {};
    activities.forEach(act => {
      typeCount[act.type] = (typeCount[act.type] || 0) + 1;
    });

    // Daily trend
    const dailyMap = {};
    activities.forEach(act => {
      const day = new Date(act.date).toDateString();
      dailyMap[day] = dailyMap[day] || { count: 0, distance: 0, energy: 0 };
      dailyMap[day].count += 1;
      dailyMap[day].distance += act.distance || 0;
      dailyMap[day].energy += act.energyAwarded || 0;
    });
    const dailyTrend = Object.entries(dailyMap).map(([day, data]) => ({
      day: new Date(day).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
      ...data,
    })).sort((a, b) => new Date(a.day) - new Date(b.day));

    // Best day
    const bestDay = dailyTrend.length ? dailyTrend.reduce((max, d) => d.count > max.count ? d : max, dailyTrend[0]) : null;

    // Community contribution
    const communityContribution = activities.reduce((sum, act) => sum + (act.communityContribution || 0), 0);

    // Clan contribution (not directly stored; approximate from energy awarded 10%)
    const clanContribution = activities.reduce((sum, act) => sum + Math.round((act.energyAwarded || 0) * 0.1), 0);

    // Insights
    const insights = [];
    if (totalActivities === 0) {
      insights.push('Your MoveX journey is just getting started. Complete your first activity to begin building your progress story.');
    } else {
      if (bestDay) insights.push(`Your most active day was ${bestDay.day} with ${bestDay.count} activities.`);
      const mostCommonType = Object.entries(typeCount).sort((a,b) => b[1]-a[1])[0];
      if (mostCommonType) insights.push(`Your most frequent activity was ${mostCommonType[0]} (${mostCommonType[1]} times).`);
      if (communityContribution > 0) insights.push(`You contributed ${communityContribution} Energy to your region.`);
      if (totalEnergy > 0) insights.push(`You earned ${totalEnergy} Energy this period.`);
      if (totalActivities >= 5) insights.push('Your consistency is getting stronger. Keep the momentum going!');
      else insights.push('Every activity counts. Small steps create big progress.');
    }

    res.json({
      user: {
        name: user.name,
        accountType: user.accountType,
        region: user.region,
      },
      period: period === 'custom' ? `${startDate} to ${endDate}` : period,
      totalActivities,
      totalDistance,
      totalDuration,
      totalEnergy,
      totalXP,
      totalTrophies,
      currentStreak: user.streak,
      typeBreakdown: typeCount,
      dailyTrend,
      bestDay,
      communityContribution,
      clanContribution,
      insights,
      achievements: user.trophies,
    });
  } catch (err) {
    console.error('Analytics report error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;