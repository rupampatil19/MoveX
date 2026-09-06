package com.arfit.engine

import com.arfit.ar.GhostAnimation
import com.arfit.pose.MpLandmark
import com.arfit.pose.PoseFrame

enum class Severity { OK, MINOR, MAJOR }

/** Section 18's live feedback, grouped into the 4 checklist categories the UI shows. */
enum class FeedbackCategory { POSTURE, RANGE_OF_MOTION, STABILITY, SPEED }

data class Correction(val message: String, val severity: Severity, val category: FeedbackCategory)

data class FormAnalysis(
    val score: Int,
    val corrections: List<Correction>,
    val jointAngles: Map<String, Float> = emptyMap()
)

enum class RepPhase { READY, DOWN, BOTTOM, UP }

data class RepState(
    val phase: RepPhase,
    val repJustCompleted: Boolean,
    val totalReps: Int
)

data class Feedback(val primary: String, val secondary: String? = null)

interface ExerciseAnalyzer {
    val id: String
    val displayName: String
    val requiredLandmarks: Set<MpLandmark>

    fun analyzePose(frame: PoseFrame): FormAnalysis
    fun detectRepetition(frame: PoseFrame): RepState
    fun getTargetPose(): GhostAnimation
    fun getFeedback(analysis: FormAnalysis): Feedback

    fun reset()
}

abstract class BaseAnalyzer : ExerciseAnalyzer {
    override fun getFeedback(analysis: FormAnalysis): Feedback {
        val major = analysis.corrections.firstOrNull { it.severity == Severity.MAJOR }
        val minor = analysis.corrections.firstOrNull { it.severity == Severity.MINOR }
        val primary = major?.message ?: minor?.message ?: "GOOD FORM"
        val secondary = if (major != null) minor?.message else null
        return Feedback(primary, secondary)
    }
}