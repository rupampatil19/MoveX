/**
 * Client for submitting AR workouts to the MoveX activity + verification pipeline.
 * AR workouts get the same rewards as GPS activities:
 *   - POST /activity        creates the Activity record
 *   - POST /verification/run/:id  runs AVS, awards Energy/XP/Trophy
 */
import API from '../api';

export async function submitARWorkout(exercise, summary) {
  const rawData = {
    source: 'ar',
    ar: {
      exercise: exercise.id,
      exerciseName: exercise.name,
      reps: summary.reps,
      target: summary.target,
      accuracy: summary.accuracy,
      durationSec: summary.durationSec,
      repScores: summary.repScores,
      partials: summary.partials,
      issueCount: summary.issues.length,
    },
  };

  // 1. Create the activity
  const saveRes = await API.post('/activity', {
    type: 'workout',
    distance: 0,
    duration: Number((summary.durationSec / 60).toFixed(2)),
    rawData,
  });

  const activityId = saveRes.data?.activity?._id;
  if (!activityId) throw new Error('Backend did not return activity id');

  // 2. Run verification (awards rewards)
  const verifyRes = await API.post(`/verification/run/${activityId}`);
  const data = verifyRes.data;

  return {
    activityId,
    avs: data.avs,
    decision: data.decision,
    confidence: data.confidence,
    energy: data.energyAwarded || 0,
    xp: data.xpAwarded || 0,
    trophy: data.trophyName || null,
    streak: data.user?.streak || 0,
    steps: data.verification?.steps || [],
    community: data.community || null,
  };
}