/**
 * ARSection — MoveX AR workout hub.
 * Wraps the immersive ARWorkoutScreen with picker, history, and routing.
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Clock, Award, PersonStanding, Dumbbell,
  ChevronRight, TrendingUp, Sparkles,
} from 'lucide-react';
import { EXERCISES } from '../lib/ar/exercises.js';
import { loadSessions } from '../lib/ar/history.js';
import ARWorkoutScreen from '../components/ar/ARWorkoutScreen';
import MoveXCard from '../components/ui/MoveXCard';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';

const ICON_MAP = {
  squat: PersonStanding,
  pushup: Dumbbell,
};

const ARSection = () => {
  const [screen, setScreen] = useState('picker');
  const [exercise, setExercise] = useState(null);
  const [summary, setSummary] = useState(null);

  const startWorkout = (ex) => {
    setExercise(ex);
    setSummary(null);
    setScreen('workout');
  };

  const exitWorkout = () => {
    setExercise(null);
    setSummary(null);
    setScreen('picker');
  };

  // WORKOUT
  if (screen === 'workout' && exercise) {
    return (
      <ARWorkoutScreen
        exercise={exercise}
        summary={summary}
        onSummaryChange={setSummary}
        onExit={exitWorkout}
      />
    );
  }

  // HISTORY
  if (screen === 'history') {
    return <ARHistory onBack={() => setScreen('picker')} />;
  }

  // PICKER (default)
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 pb-28">
      <div className="relative hero-premium text-white rounded-hero p-5 sm:p-6 md:p-7">
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full glass-on-gradient text-[10px] font-semibold uppercase tracking-widest mb-3">
            <Sparkles className="w-3 h-3" />
            AR Workouts
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight mb-1.5">
            Real-time Form Coaching
          </h1>
          <p className="text-sm md:text-base text-white/85 max-w-lg">
            Your phone camera watches your form and counts every rep. No equipment, no wearables.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {EXERCISES.map((ex) => {
          const Icon = ICON_MAP[ex.id] || TrendingUp;
          return (
            <button
              key={ex.id}
              onClick={() => startWorkout(ex)}
              className="text-left bg-white rounded-card p-5 shadow-premium hover:shadow-premium-lg hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98] group"
            >
              <div className="w-12 h-12 rounded-2xl icon-tile-blue flex items-center justify-center mb-3 shadow-md group-hover:scale-105 transition-transform">
                <Icon className="w-6 h-6 text-white" />
              </div>
              <p className="text-base font-semibold text-ink-900">{ex.name}</p>
              <p className="text-xs text-ink-500 mt-0.5">{ex.tagline}</p>
              <div className="flex items-center justify-between mt-3">
                <p className="text-[11px] text-ink-400">
                  {ex.targetReps} reps · {ex.primaryJoint}
                </p>
                <ChevronRight className="w-4 h-4 text-ink-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          );
        })}
      </div>

      <MoveXCard>
        <p className="text-[10px] font-bold uppercase tracking-widest text-ink-500 mb-3">
          How it works
        </p>
        <ul className="space-y-2.5 text-sm text-ink-700">
          <li className="flex items-start gap-3">
            <span className="w-5 h-5 rounded-full bg-[#2563EB]/10 text-[#2563EB] text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
              1
            </span>
            <span>Prop your phone so your full body fits in frame</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-5 h-5 rounded-full bg-[#2563EB]/10 text-[#2563EB] text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
              2
            </span>
            <span>Hold still for 1 second — we count down 3-2-1</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-5 h-5 rounded-full bg-[#2563EB]/10 text-[#2563EB] text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
              3
            </span>
            <span>Get live form corrections and rep-by-rep accuracy</span>
          </li>
        </ul>
      </MoveXCard>

      <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4">
        <p className="text-[11px] text-amber-800 leading-relaxed">
          <strong>Tips:</strong> Squat — phone at hip height, side-on, ~2 m away.
          Push-up — phone on floor, side-on, ~1.5 m away. Stand sideways with your full body in frame.
        </p>
      </div>

      <Button
        variant="secondary"
        fullWidth
        onClick={() => setScreen('history')}
        icon={Clock}
      >
        View past sessions
      </Button>
    </motion.div>
  );
};

// ============================================================
// HISTORY
// ============================================================
const ARHistory = ({ onBack }) => {
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    setSessions(loadSessions());
  }, []);

  const fmtDate = (iso) =>
    new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  const accuracyColor = (a) =>
    a >= 90 ? 'text-emerald-600' :
    a >= 75 ? 'text-[#2563EB]' :
    a >= 55 ? 'text-amber-600' :
    'text-red-600';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 pb-28">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm text-ink-600 hover:text-ink-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to workouts
      </button>

      <div className="flex items-center gap-2.5">
        <Award className="w-6 h-6 text-[#2563EB] shrink-0" />
        <h1 className="text-2xl sm:text-3xl font-bold text-ink-900">Past Sessions</h1>
      </div>

      {sessions.length === 0 ? (
        <MoveXCard>
          <EmptyState
            icon={Award}
            title="No sessions yet"
            message="Complete your first AR workout and it will show up here."
            action={
              <Button variant="premium" onClick={onBack}>
                Start a workout
              </Button>
            }
          />
        </MoveXCard>
      ) : (
        <ul className="space-y-3">
          {sessions.map((s) => (
            <MoveXCard key={s.id} variant="bento" padded={false} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink-900 truncate">{s.exercise}</p>
                  <p className="text-xs text-ink-500 mt-0.5">
                    {fmtDate(s.date)} · {s.reps} reps · {Math.floor(s.durationSec / 60)}m {s.durationSec % 60}s
                  </p>
                  {s.issues && s.issues.length > 0 && (
                    <p className="text-[11px] text-amber-700 mt-1 truncate">
                      Focus: {s.issues[0].label}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-xl font-bold tabular-nums ${accuracyColor(s.accuracy)}`}>
                    {s.accuracy}%
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-ink-500">accuracy</p>
                </div>
              </div>
            </MoveXCard>
          ))}
        </ul>
      )}
    </motion.div>
  );
};

export default ARSection;