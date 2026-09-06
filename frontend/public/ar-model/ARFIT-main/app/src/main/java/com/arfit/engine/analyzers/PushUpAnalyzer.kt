package com.arfit.engine.analyzers

import com.arfit.ar.GhostAnimation
import com.arfit.ar.Joint
import com.arfit.ar.PoseLibrary
import com.arfit.engine.*
import com.arfit.pose.MpLandmark
import com.arfit.pose.PoseFrame

class PushUpAnalyzer : BaseAnalyzer() {
    override val id = "pushup"
    override val displayName = "Push-Up"
    override val requiredLandmarks = setOf(
        MpLandmark.LEFT_SHOULDER, MpLandmark.RIGHT_SHOULDER,
        MpLandmark.LEFT_ELBOW, MpLandmark.RIGHT_ELBOW,
        MpLandmark.LEFT_WRIST, MpLandmark.RIGHT_WRIST,
        MpLandmark.LEFT_HIP, MpLandmark.RIGHT_HIP,
        MpLandmark.LEFT_KNEE, MpLandmark.RIGHT_KNEE,
        MpLandmark.LEFT_ANKLE, MpLandmark.RIGHT_ANKLE
    )

    private val repCounter = ThresholdRepCounter(downThreshold = 100f, upThreshold = 150f, descending = true)
    private val scoreSmoother = EmaSmoother(alpha = 0.3f)

    override fun analyzePose(frame: PoseFrame): FormAnalysis {
        val p = JointMapper.toJointPositions(frame)

        // Use safe calls and provide fallback (e.g. 180° angle) if missing – should not happen due to requiredLandmarks filter.
        val ls = p[Joint.LEFT_SHOULDER] ?: return FormAnalysis(0, listOf(Correction("No shoulder", Severity.MAJOR, FeedbackCategory.POSTURE)))
        val le = p[Joint.LEFT_ELBOW] ?: return FormAnalysis(0, listOf(Correction("No elbow", Severity.MAJOR, FeedbackCategory.POSTURE)))
        val lw = p[Joint.LEFT_WRIST] ?: return FormAnalysis(0, listOf(Correction("No wrist", Severity.MAJOR, FeedbackCategory.POSTURE)))
        val rs = p[Joint.RIGHT_SHOULDER] ?: return FormAnalysis(0, listOf(Correction("No shoulder", Severity.MAJOR, FeedbackCategory.POSTURE)))
        val re = p[Joint.RIGHT_ELBOW] ?: return FormAnalysis(0, listOf(Correction("No elbow", Severity.MAJOR, FeedbackCategory.POSTURE)))
        val rw = p[Joint.RIGHT_WRIST] ?: return FormAnalysis(0, listOf(Correction("No wrist", Severity.MAJOR, FeedbackCategory.POSTURE)))
        val lh = p[Joint.LEFT_HIP] ?: return FormAnalysis(0, listOf(Correction("No hip", Severity.MAJOR, FeedbackCategory.POSTURE)))
        val lk = p[Joint.LEFT_KNEE] ?: return FormAnalysis(0, listOf(Correction("No knee", Severity.MAJOR, FeedbackCategory.POSTURE)))

        val elbowL = jointAngleDegrees(ls, le, lw)
        val elbowR = jointAngleDegrees(rs, re, rw)
        val elbowAvg = (elbowL + elbowR) / 2f

        val backAngle = jointAngleDegrees(ls, lh, lk)

        val corrections = mutableListOf<Correction>()
        var penalty = 0

        if (backAngle < 160f) {
            val severity = if (backAngle < 145f) Severity.MAJOR else Severity.MINOR
            val hipsSagging = lh.y > ls.y
            corrections += Correction(
                if (hipsSagging) "LOWER YOUR HIPS" else "RAISE YOUR HIPS",
                severity,
                FeedbackCategory.POSTURE
            )
            penalty += if (severity == Severity.MAJOR) 25 else 10
        }

        val shoulderWidth = distance(ls, rs)
        val wristWidth = distance(lw, rw)
        if (wristWidth > shoulderWidth * 1.9f) {
            corrections += Correction("BRING HANDS CLOSER TOGETHER", Severity.MINOR, FeedbackCategory.STABILITY)
            penalty += 8
        }

        if (elbowAvg in 101f..134f) {
            corrections += Correction("GO DEEPER", Severity.MINOR, FeedbackCategory.RANGE_OF_MOTION)
            penalty += 8
        }

        val rawScore = (100 - penalty).coerceIn(0, 100)
        val smoothed = scoreSmoother.push(rawScore.toFloat()).toInt()

        return FormAnalysis(
            score = smoothed,
            corrections = corrections,
            jointAngles = mapOf("elbow" to elbowAvg, "back" to backAngle)
        )
    }

    override fun detectRepetition(frame: PoseFrame): RepState {
        val p = JointMapper.toJointPositions(frame)
        val ls = p[Joint.LEFT_SHOULDER] ?: return RepState(RepPhase.READY, false, repCounter.totalReps)
        val le = p[Joint.LEFT_ELBOW] ?: return RepState(RepPhase.READY, false, repCounter.totalReps)
        val lw = p[Joint.LEFT_WRIST] ?: return RepState(RepPhase.READY, false, repCounter.totalReps)
        val rs = p[Joint.RIGHT_SHOULDER] ?: return RepState(RepPhase.READY, false, repCounter.totalReps)
        val re = p[Joint.RIGHT_ELBOW] ?: return RepState(RepPhase.READY, false, repCounter.totalReps)
        val rw = p[Joint.RIGHT_WRIST] ?: return RepState(RepPhase.READY, false, repCounter.totalReps)
        val elbowL = jointAngleDegrees(ls, le, lw)
        val elbowR = jointAngleDegrees(rs, re, rw)
        return repCounter.update((elbowL + elbowR) / 2f)
    }

    override fun getTargetPose(): GhostAnimation = PoseLibrary.animationFor(id)
    override fun reset() {
        repCounter.reset()
        scoreSmoother.reset()
    }
}