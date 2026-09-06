package com.arfit.engine.analyzers

import com.arfit.ar.GhostAnimation
import com.arfit.ar.Joint
import com.arfit.ar.PoseLibrary
import com.arfit.engine.*
import com.arfit.pose.MpLandmark
import com.arfit.pose.PoseFrame
import kotlin.math.abs

class SquatAnalyzer : BaseAnalyzer() {
    override val id = "squat"
    override val displayName = "Squat"
    override val requiredLandmarks = setOf(
        MpLandmark.LEFT_SHOULDER, MpLandmark.RIGHT_SHOULDER,
        MpLandmark.LEFT_HIP, MpLandmark.RIGHT_HIP,
        MpLandmark.LEFT_KNEE, MpLandmark.RIGHT_KNEE,
        MpLandmark.LEFT_ANKLE, MpLandmark.RIGHT_ANKLE
    )

    private val repCounter = ThresholdRepCounter(downThreshold = 110f, upThreshold = 155f, descending = true)
    private val scoreSmoother = EmaSmoother(alpha = 0.3f)

    override fun analyzePose(frame: PoseFrame): FormAnalysis {
        val p = JointMapper.toJointPositions(frame)

        val lh = p[Joint.LEFT_HIP] ?: return FormAnalysis(0, listOf(Correction("No hip", Severity.MAJOR, FeedbackCategory.POSTURE)))
        val lk = p[Joint.LEFT_KNEE] ?: return FormAnalysis(0, listOf(Correction("No knee", Severity.MAJOR, FeedbackCategory.POSTURE)))
        val la = p[Joint.LEFT_ANKLE] ?: return FormAnalysis(0, listOf(Correction("No ankle", Severity.MAJOR, FeedbackCategory.POSTURE)))
        val rh = p[Joint.RIGHT_HIP] ?: return FormAnalysis(0, listOf(Correction("No hip", Severity.MAJOR, FeedbackCategory.POSTURE)))
        val rk = p[Joint.RIGHT_KNEE] ?: return FormAnalysis(0, listOf(Correction("No knee", Severity.MAJOR, FeedbackCategory.POSTURE)))
        val ra = p[Joint.RIGHT_ANKLE] ?: return FormAnalysis(0, listOf(Correction("No ankle", Severity.MAJOR, FeedbackCategory.POSTURE)))
        val ls = p[Joint.LEFT_SHOULDER] ?: return FormAnalysis(0, listOf(Correction("No shoulder", Severity.MAJOR, FeedbackCategory.POSTURE)))
        // For back angle we also need left shoulder, left hip, left knee (we already have lh, lk)
        // We have ls from above.

        val kneeL = jointAngleDegrees(lh, lk, la)
        val kneeR = jointAngleDegrees(rh, rk, ra)
        val kneeAvg = (kneeL + kneeR) / 2f

        val backAngle = jointAngleDegrees(ls, lh, lk)

        val corrections = mutableListOf<Correction>()
        var penalty = 0

        val kneeOverAnkleL = abs(lk.x - la.x)
        val kneeOverAnkleR = abs(rk.x - ra.x)
        val stanceWidth = distance(la, ra).coerceAtLeast(0.05f)
        if (kneeOverAnkleL > stanceWidth * 0.5f || kneeOverAnkleR > stanceWidth * 0.5f) {
            corrections += Correction("KEEP YOUR KNEES ALIGNED", Severity.MAJOR, FeedbackCategory.STABILITY)
            penalty += 22
        }

        if (backAngle < 150f) {
            corrections += Correction("KEEP YOUR BACK STRAIGHT", Severity.MINOR, FeedbackCategory.POSTURE)
            penalty += 10
        }

        if (kneeAvg in 111f..140f) {
            corrections += Correction("LOWER YOUR HIPS", Severity.MINOR, FeedbackCategory.RANGE_OF_MOTION)
            penalty += 8
        }

        val rawScore = (100 - penalty).coerceIn(0, 100)
        val smoothed = scoreSmoother.push(rawScore.toFloat()).toInt()

        return FormAnalysis(
            score = smoothed,
            corrections = corrections,
            jointAngles = mapOf("knee" to kneeAvg, "back" to backAngle)
        )
    }

    override fun detectRepetition(frame: PoseFrame): RepState {
        val p = JointMapper.toJointPositions(frame)
        val lh = p[Joint.LEFT_HIP] ?: return RepState(RepPhase.READY, false, repCounter.totalReps)
        val lk = p[Joint.LEFT_KNEE] ?: return RepState(RepPhase.READY, false, repCounter.totalReps)
        val la = p[Joint.LEFT_ANKLE] ?: return RepState(RepPhase.READY, false, repCounter.totalReps)
        val rh = p[Joint.RIGHT_HIP] ?: return RepState(RepPhase.READY, false, repCounter.totalReps)
        val rk = p[Joint.RIGHT_KNEE] ?: return RepState(RepPhase.READY, false, repCounter.totalReps)
        val ra = p[Joint.RIGHT_ANKLE] ?: return RepState(RepPhase.READY, false, repCounter.totalReps)
        val kneeL = jointAngleDegrees(lh, lk, la)
        val kneeR = jointAngleDegrees(rh, rk, ra)
        return repCounter.update((kneeL + kneeR) / 2f)
    }

    override fun getTargetPose(): GhostAnimation = PoseLibrary.animationFor(id)
    override fun reset() {
        repCounter.reset()
        scoreSmoother.reset()
    }
}