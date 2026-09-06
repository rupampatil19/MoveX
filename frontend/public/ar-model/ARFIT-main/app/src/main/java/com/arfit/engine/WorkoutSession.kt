package com.arfit.engine

data class WorkoutSummary(
    val exerciseName: String,
    val reps: Int,
    val averageForm: Int,
    val bestForm: Int,
    val consistency: Int,
    val durationSeconds: Int
)

/** Accumulates per-frame form scores and reps across one session — Section 23. */
class WorkoutSession(private val exerciseName: String) {
    private val scores = mutableListOf<Int>()
    private var reps = 0
    private val startedAtMs = System.currentTimeMillis()

    fun recordFrame(score: Int) {
        scores += score
    }

    fun recordRep() {
        reps++
    }

    fun summary(): WorkoutSummary {
        val avg = if (scores.isEmpty()) 0 else scores.average().toInt()
        val best = scores.maxOrNull() ?: 0
        val consistency = if (scores.size < 2) {
            100
        } else {
            val mean = scores.average()
            val variance = scores.sumOf { (it - mean) * (it - mean) } / scores.size
            val stdDev = kotlin.math.sqrt(variance)
            (100 - stdDev.coerceAtMost(100.0)).toInt().coerceIn(0, 100)
        }
        val durationSeconds = ((System.currentTimeMillis() - startedAtMs) / 1000).toInt()
        return WorkoutSummary(exerciseName, reps, avg, best, consistency, durationSeconds)
    }
}
