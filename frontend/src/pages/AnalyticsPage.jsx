import { useState, useEffect } from 'react';
import API from '../api';
import { motion } from 'framer-motion';
import {
  Activity, Route, Clock, Flame, RefreshCw, FileDown, Loader2,
  TrendingUp, Trophy, Zap
} from 'lucide-react';
import {
  LineChart as RechartsLine, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import { jsPDF } from 'jspdf';
import MoveXCard from '../components/ui/MoveXCard';
import SectionHeader from '../components/ui/SectionHeader';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';

const AnalyticsPage = () => {
  const [activities, setActivities] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [period, setPeriod] = useState('today');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [actRes, userRes] = await Promise.all([
        API.get('/activity/mine'),
        API.get('/auth/me'),
      ]);
      setActivities(actRes.data);
      setCurrentUser(userRes.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const totalWorkouts = activities.length;
  const totalDistance = activities.reduce((s, a) => s + (Number(a.distance) || 0), 0);
  const totalDuration = Math.round(activities.reduce((s, a) => s + (Number(a.duration) || 0), 0));
  const totalEnergy = activities.reduce((s, a) => s + (Number(a.energyAwarded) || 0), 0);
  const totalXP = activities.reduce((s, a) => s + (Number(a.xpAwarded) || 0), 0);

  const last30Days = [...activities]
    .filter((act) => new Date(act.date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  const distanceOverTime = last30Days.map((act) => ({
    date: new Date(act.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    distance: Number(act.distance) || 0,
  }));

  const typeCount = activities.reduce((acc, act) => {
    acc[act.type] = (acc[act.type] || 0) + 1;
    return acc;
  }, {});
  const typeData = Object.entries(typeCount).map(([name, value]) => ({ name, value }));

  const handleGeneratePDF = async () => {
    if (period === 'custom') {
      if (!startDate || !endDate) {
        setGenError('Please select both start and end dates.');
        return;
      }
      if (new Date(endDate) < new Date(startDate)) {
        setGenError('End date cannot be before start date.');
        return;
      }
    }
    setGenerating(true);
    setGenError('');
    try {
      const params = { period };
      if (period === 'custom') {
        params.startDate = startDate;
        params.endDate = endDate;
      }
      const res = await API.get('/analytics/report', { params });
      generatePDF(res.data);
    } catch (err) {
      console.error(err);
      setGenError('Unable to generate analysis right now. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  // ---------- PDF drawing helpers (preserved as-is) ----------
  const drawLineChart = (doc, trend, x, y, width, height) => {
    if (!trend || trend.length === 0) return y;

    const maxCount = Math.max(...trend.map((d) => d.count), 1);
    const chartStartY = y + 10;
    const chartHeight = height - 20;
    const pointSpacing = width / (trend.length - 1 || 1);

    doc.setDrawColor('#6B7C72');
    doc.line(x, y + height, x + width, y + height);
    doc.line(x, y, x, y + height);

    const points = trend.map((d, i) => ({
      x: x + i * pointSpacing,
      y: chartStartY + chartHeight - (d.count / maxCount) * chartHeight,
    }));

    doc.setDrawColor('#2563EB');
    doc.setLineWidth(0.8);
    for (let i = 0; i < points.length - 1; i++) {
      doc.line(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y);
    }

    points.forEach((p) => {
      doc.setFillColor('#2563EB');
      doc.circle(p.x, p.y, 1.2, 'F');
    });

    doc.setFontSize(8);
    doc.setTextColor('#6B7C72');
    if (trend.length > 0) {
      doc.text(trend[0].day, x, y + height + 5);
      doc.text(trend[trend.length - 1].day, x + width - 20, y + height + 5);
    }
    return y + height + 10;
  };

  const drawBarChart = (doc, breakdown, x, y, width, height) => {
    const entries = Object.entries(breakdown);
    if (entries.length === 0) return y;

    const maxVal = Math.max(...entries.map(([, v]) => v), 1);
    const barWidth = (width / entries.length) * 0.6;
    const gap = (width / entries.length) * 0.4;
    const chartHeight = height - 20;

    doc.setFontSize(8);
    doc.setTextColor('#6B7C72');

    entries.forEach(([label, value], i) => {
      const barX = x + i * (barWidth + gap);
      const barHeight = (value / maxVal) * chartHeight;
      const barY = y + height - barHeight;

      doc.setFillColor('#2563EB');
      doc.rect(barX, barY, barWidth, barHeight, 'F');

      doc.setTextColor('#6B7C72');
      doc.text(String(value), barX + barWidth / 2, barY - 2, { align: 'center' });

      const shortLabel = label.length > 10 ? label.substring(0, 10) + '...' : label;
      doc.text(shortLabel, barX + barWidth / 2, y + height + 5, { align: 'center' });
    });

    return y + height + 20;
  };

  const generatePDF = (data) => {
    const doc = new jsPDF();
    const primary = '#2563EB';
    const dark = '#1F2D24';
    const gray = '#6B7C72';

    doc.setFillColor(primary);
    doc.rect(0, 0, 210, 25, 'F');
    doc.setTextColor('#FFFFFF');
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('MoveX', 14, 15);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Move More. Evolve Together.', 14, 21);

    doc.setTextColor(dark);
    doc.setFontSize(16);
    doc.text('Activity & Performance Analysis', 14, 35);

    doc.setFontSize(11);
    doc.text(`Name: ${data.user.name}`, 14, 45);
    doc.text(`Athlete Mode: ${data.user.accountType}`, 14, 51);
    doc.text(`Region: ${data.user.region}`, 14, 57);
    doc.text(`Period: ${data.period}`, 14, 63);

    let y = 75;
    doc.setFontSize(12);
    doc.text('Summary', 14, y);
    y += 8;
    doc.setFontSize(10);
    doc.text(`Activities: ${data.totalActivities}`, 14, y); y += 5;
    doc.text(`Total Distance: ${data.totalDistance.toFixed(1)} km`, 14, y); y += 5;
    doc.text(`Total Duration: ${data.totalDuration.toFixed(0)} min`, 14, y); y += 5;
    doc.text(`Energy Earned: ${data.totalEnergy}`, 14, y); y += 5;
    doc.text(`XP Earned: ${data.totalXP}`, 14, y); y += 5;
    doc.text(`Trophies Earned: ${data.totalTrophies}`, 14, y); y += 5;
    doc.text(`Current Streak: ${data.currentStreak} days`, 14, y); y += 5;

    y += 5;
    doc.setFontSize(12);
    doc.text('Activity Breakdown', 14, y);
    y += 8;
    doc.setFontSize(10);
    Object.entries(data.typeBreakdown).forEach(([type, count]) => {
      doc.text(`${type}: ${count}`, 14, y);
      y += 5;
    });

    if (data.dailyTrend && data.dailyTrend.length > 0) {
      if (y + 80 > 280) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.text('Daily Activity Trend', 14, y);
      y = drawLineChart(doc, data.dailyTrend, 14, y + 8, 180, 60);
    }

    if (Object.keys(data.typeBreakdown).length > 0) {
      if (y + 80 > 280) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.text('Workout Types', 14, y);
      y = drawBarChart(doc, data.typeBreakdown, 14, y + 8, 180, 60);
    }

    y += 5;
    if (y > 260) { doc.addPage(); y = 20; }
    doc.setFontSize(12);
    doc.text('MoveX Insights', 14, y);
    y += 8;
    doc.setFontSize(10);
    data.insights.forEach((insight, idx) => {
      if (y > 280) { doc.addPage(); y = 20; }
      doc.text(`${idx + 1}. ${insight}`, 14, y);
      y += 6;
    });

    doc.setFontSize(8);
    doc.setTextColor(gray);
    doc.text('Keep Moving. Evolve Together.', 14, 290);
    doc.save(`MoveX_Analysis_${Date.now()}.pdf`);
  };

  // ---------- Loading / Error states ----------
  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Analytics</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <MoveXCard key={i} padded={false} className="p-4">
              <LoadingSkeleton variant="line" count={2} />
            </MoveXCard>
          ))}
        </div>
        <MoveXCard>
          <LoadingSkeleton variant="line" count={6} />
        </MoveXCard>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Analytics</h1>
        <MoveXCard>
          <EmptyState
            icon={Activity}
            title="Couldn't load analytics"
            message={error}
            action={<Button onClick={fetchAll} icon={RefreshCw}>Retry</Button>}
          />
        </MoveXCard>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Your fitness intelligence dashboard</p>
        </div>
        <Button variant="secondary" size="sm" icon={RefreshCw} onClick={fetchAll}>
          Refresh
        </Button>
      </div>

      {/* PRIMARY STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MoveXCard padded={false} className="p-4">
          <Activity className="w-5 h-5 text-[#2563EB] mb-2" />
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Workouts</p>
          <p className="text-xl font-bold text-gray-900 mt-0.5">{totalWorkouts}</p>
        </MoveXCard>
        <MoveXCard padded={false} className="p-4">
          <Route className="w-5 h-5 text-[#2563EB] mb-2" />
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Distance</p>
          <p className="text-xl font-bold text-gray-900 mt-0.5">
            {totalDistance.toFixed(1)}<span className="text-xs text-gray-500 ml-0.5">km</span>
          </p>
        </MoveXCard>
        <MoveXCard padded={false} className="p-4">
          <Zap className="w-5 h-5 text-yellow-500 mb-2" />
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Energy</p>
          <p className="text-xl font-bold text-gray-900 mt-0.5">{totalEnergy}</p>
        </MoveXCard>
        <MoveXCard padded={false} className="p-4">
          <TrendingUp className="w-5 h-5 text-[#2563EB] mb-2" />
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">XP</p>
          <p className="text-xl font-bold text-gray-900 mt-0.5">{totalXP}</p>
        </MoveXCard>
      </div>

      {/* SECONDARY STATS */}
      <div className="grid grid-cols-3 gap-3">
        <MoveXCard padded={false} className="p-4">
          <Clock className="w-4 h-4 text-[#2563EB] mb-2" />
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Duration</p>
          <p className="text-base font-bold text-gray-900 mt-0.5">
            {Math.round(totalDuration)}<span className="text-xs text-gray-500 ml-0.5">min</span>
          </p>
        </MoveXCard>
        <MoveXCard padded={false} className="p-4">
          <Flame className="w-4 h-4 text-orange-500 mb-2" />
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Streak</p>
          <p className="text-base font-bold text-gray-900 mt-0.5">
            {currentUser?.streak || 0}<span className="text-xs text-gray-500 ml-0.5">d</span>
          </p>
        </MoveXCard>
        <MoveXCard padded={false} className="p-4">
          <Trophy className="w-4 h-4 text-[#2563EB] mb-2" />
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Trophies</p>
          <p className="text-base font-bold text-gray-900 mt-0.5">
            {currentUser?.trophyPoints ?? currentUser?.trophies?.length ?? 0}
          </p>
        </MoveXCard>
      </div>

      {/* DISTANCE TREND */}
      <div>
        <SectionHeader title="Distance Trend" subtitle="Last 30 days" icon={TrendingUp} />
        <MoveXCard>
          {distanceOverTime.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <RechartsLine data={distanceOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" stroke="#9CA3AF" fontSize={11} />
                <YAxis stroke="#9CA3AF" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="distance"
                  stroke="#2563EB"
                  strokeWidth={2}
                  dot={{ fill: '#2563EB', r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </RechartsLine>
            </ResponsiveContainer>
          ) : (
            <EmptyState
              icon={TrendingUp}
              title="No distance data yet"
              message="Log a few activities to see your trend over time."
            />
          )}
        </MoveXCard>
      </div>

      {/* WORKOUT TYPES */}
      <div>
        <SectionHeader title="Workout Types" icon={Activity} />
        <MoveXCard>
          {typeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={typeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" stroke="#9CA3AF" fontSize={11} />
                <YAxis stroke="#9CA3AF" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="value" fill="#2563EB" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState
              icon={Activity}
              title="No workouts logged yet"
              message="Your activity breakdown will appear here once you get moving."
            />
          )}
        </MoveXCard>
      </div>

      {/* RECENT ACTIVITIES */}
      <div>
        <SectionHeader title="Recent Activities" icon={Activity} actionTo="/activity" actionLabel="View all" />
        <MoveXCard>
          {activities.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="No activities yet"
              message="Start moving and your activities will show here."
            />
          ) : (
            <ul className="divide-y divide-gray-100">
              {activities.slice(0, 5).map((act) => (
                <li key={act._id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#2563EB]/10 flex items-center justify-center shrink-0">
                      <Activity className="w-4 h-4 text-[#2563EB]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 capitalize truncate">{act.type}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {act.distance ? `${act.distance} km` : '—'}
                        {act.duration ? ` · ${act.duration} min` : ''}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-yellow-600 shrink-0 ml-2">
                    +{act.energyAwarded || 0} E
                  </span>
                </li>
              ))}
            </ul>
          )}
        </MoveXCard>
      </div>

      {/* PDF GENERATION */}
      <div>
        <SectionHeader title="Generate Analysis PDF" icon={FileDown} />
        <MoveXCard>
          <p className="text-sm text-gray-500 mb-4">
            Export a shareable PDF report of your activities, trends, and MoveX insights.
          </p>

          <div className="flex flex-wrap gap-2 mb-4">
            {['today', 'month', 'custom'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  period === p
                    ? 'bg-[#2563EB] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {p === 'today' ? 'Today' : p === 'month' ? 'This Month' : 'Custom Range'}
              </button>
            ))}
          </div>

          {period === 'custom' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]/50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]/50"
                />
              </div>
            </div>
          )}

          {genError && (
            <p className="text-red-500 text-sm mb-3">{genError}</p>
          )}

          <Button
            variant="primary"
            icon={FileDown}
            loading={generating}
            onClick={handleGeneratePDF}
          >
            {generating ? 'Preparing your MoveX Analysis...' : 'Generate PDF'}
          </Button>
        </MoveXCard>
      </div>
    </motion.div>
  );
};

export default AnalyticsPage;