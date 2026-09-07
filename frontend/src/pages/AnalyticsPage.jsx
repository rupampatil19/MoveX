import { useState, useEffect } from 'react';
import API from '../api';
import { motion } from 'framer-motion';
import {
  Activity, Route, Clock, Flame, RefreshCw, FileDown, Loader2
} from 'lucide-react';
import {
  LineChart as RechartsLine, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import { jsPDF } from 'jspdf';

const AnalyticsPage = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // PDF states
  const [period, setPeriod] = useState('today');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.get('/activity/mine');
      setActivities(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  const totalWorkouts = activities.length;
  const totalDistance = activities.reduce((sum, act) => sum + (Number(act.distance) || 0), 0);
  const totalDuration = activities.reduce((sum, act) => sum + (Number(act.duration) || 0), 0);
  const totalEnergy = activities.reduce((sum, act) => sum + (Number(act.energyAwarded) || 0), 0);

  const last30Days = [...activities]
    .filter(act => new Date(act.date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  const distanceOverTime = last30Days.map(act => ({
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
      const data = res.data;
      generatePDF(data);
    } catch (err) {
      console.error(err);
      setGenError('Unable to generate analysis right now. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const drawLineChart = (doc, trend, x, y, width, height) => {
    if (!trend || trend.length === 0) return y;

    const maxCount = Math.max(...trend.map(d => d.count), 1);
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

    points.forEach(p => {
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
    const barWidth = width / entries.length * 0.6;
    const gap = width / entries.length * 0.4;
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

    // Header
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

    // Summary
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

    // Activity breakdown
    y += 5;
    doc.setFontSize(12);
    doc.text('Activity Breakdown', 14, y);
    y += 8;
    doc.setFontSize(10);
    Object.entries(data.typeBreakdown).forEach(([type, count]) => {
      doc.text(`${type}: ${count}`, 14, y);
      y += 5;
    });

    // Daily Activity Trend
    if (data.dailyTrend && data.dailyTrend.length > 0) {
      if (y + 80 > 280) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.text('Daily Activity Trend', 14, y);
      y = drawLineChart(doc, data.dailyTrend, 14, y + 8, 180, 60);
    }

    // Workout Types
    if (Object.keys(data.typeBreakdown).length > 0) {
      if (y + 80 > 280) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.text('Workout Types', 14, y);
      y = drawBarChart(doc, data.typeBreakdown, 14, y + 8, 180, 60);
    }

    // Insights
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

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(gray);
    doc.text('Keep Moving. Evolve Together.', 14, 290);
    doc.save(`MoveX_Analysis_${Date.now()}.pdf`);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Historical Data Analysis</h1>
        <button onClick={fetchActivities} className="flex items-center gap-2 bg-[#2563EB] text-white px-4 py-2 rounded-lg hover:bg-[#1D4ED8] transition">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Analytics Content */}
      {loading ? (
        <p className="text-gray-500">Loading analytics...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <>
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 text-[#2563EB] mb-2"><Activity className="w-5 h-5" /><span className="text-sm text-gray-500">Workouts</span></div>
              <p className="text-2xl font-bold text-gray-800">{totalWorkouts}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 text-[#2563EB] mb-2"><Route className="w-5 h-5" /><span className="text-sm text-gray-500">Distance (km)</span></div>
              <p className="text-2xl font-bold text-gray-800">{totalDistance.toFixed(1)}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 text-[#2563EB] mb-2"><Clock className="w-5 h-5" /><span className="text-sm text-gray-500">Duration (min)</span></div>
              <p className="text-2xl font-bold text-gray-800">{totalDuration}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 text-[#2563EB] mb-2"><Flame className="w-5 h-5" /><span className="text-sm text-gray-500">Energy</span></div>
              <p className="text-2xl font-bold text-gray-800">{totalEnergy}</p>
            </div>
          </div>

          {/* Distance Trend Chart */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Distance Trend (Last 30 Days)</h2>
            {distanceOverTime.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <RechartsLine data={distanceOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E3ECE4" />
                  <XAxis dataKey="date" stroke="#6B7C72" />
                  <YAxis stroke="#6B7C72" />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #E3ECE4' }} />
                  <Line type="monotone" dataKey="distance" stroke="#2563EB" strokeWidth={2} />
                </RechartsLine>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500">No distance data in the last 30 days.</p>
            )}
          </div>

          {/* Workout Types Chart */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Workout Types</h2>
            {typeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={typeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E3ECE4" />
                  <XAxis dataKey="name" stroke="#6B7C72" />
                  <YAxis stroke="#6B7C72" />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #E3ECE4' }} />
                  <Bar dataKey="value" fill="#2563EB" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500">No workout types recorded yet.</p>
            )}
          </div>

          {/* Recent Activities */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Recent Activities</h2>
            <ul className="space-y-2">
              {activities.slice(0,5).map(act => (
                <li key={act._id} className="flex justify-between text-sm text-gray-700">
                  <span className="capitalize">{act.type}</span>
                  <span>{act.distance} km</span>
                  <span>{act.duration} min</span>
                  <span className="text-[#2563EB]">+{act.energyAwarded || 0} Energy</span>
                </li>
              ))}
              {activities.length === 0 && <li className="text-gray-500">No activities yet.</li>}
            </ul>
          </div>
        </>
      )}

      {/* PDF Generation Card moved to bottom */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <FileDown className="w-5 h-5 text-[#2563EB]" /> Generate Analysis PDF
        </h2>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {['today', 'month', 'custom'].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-full transition ${period === p ? 'bg-[#2563EB] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                {p === 'today' ? 'Today' : p === 'month' ? 'This Month' : 'Custom Range'}
              </button>
            ))}
          </div>

          {period === 'custom' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-500 mb-1">Start Date</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">End Date</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-2 border rounded-lg" />
              </div>
            </div>
          )}

          {genError && <p className="text-red-500 text-sm">{genError}</p>}

          <button
            onClick={handleGeneratePDF}
            disabled={generating}
            className="bg-[#2563EB] text-white px-6 py-2 rounded-lg hover:bg-[#1D4ED8] transition flex items-center gap-2"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
            {generating ? 'Preparing your MoveX Analysis...' : 'Generate PDF'}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default AnalyticsPage;