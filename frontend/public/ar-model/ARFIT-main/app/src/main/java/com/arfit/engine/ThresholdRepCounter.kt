package com.arfit.engine

/**
 * Generic hysteresis + temporal-confirmation state machine for repetitions,
 * driven by a single scalar "primary angle" (elbow angle for push-ups/curls,
 * knee angle for squats, etc — Section 19). Every exercise reuses this same
 * class with different thresholds instead of hand-rolling its own counter.
 *
 * READY/UP -> DOWN: angle crosses downThreshold and holds for holdFrames
 * DOWN -> BOTTOM: angle keeps crossing downThreshold and holds again
 * BOTTOM -> UP: angle crosses back past upThreshold and holds -> rep counts here
 *
 * [descending] = true means "down" is a decreasing angle (squat, push-up,
 * bicep curl all bend a joint toward a smaller angle at the bottom).
 */
class ThresholdRepCounter(
    private val downThreshold: Float,
    private val upThreshold: Float,
    private val holdFrames: Int = 5,   // was 3
    private val descending: Boolean = true
) {
    private var phase = RepPhase.READY
    private var framesInPhase = 0
    private var reps = 0

    /** Public read‑only access so analyzers can use it in fallback returns */
    val totalReps: Int get() = reps

    fun reset() {
        phase = RepPhase.READY
        framesInPhase = 0
        reps = 0
    }

    fun update(angle: Float): RepState {
        val crossedDown = if (descending) angle <= downThreshold else angle >= downThreshold
        val crossedUp = if (descending) angle >= upThreshold else angle <= upThreshold
        var justCompleted = false

        when (phase) {
            RepPhase.READY, RepPhase.UP -> {
                if (crossedDown) {
                    framesInPhase++
                    if (framesInPhase >= holdFrames) {
                        phase = RepPhase.DOWN
                        framesInPhase = 0
                    }
                } else {
                    framesInPhase = 0
                }
            }
            RepPhase.DOWN -> {
                if (crossedDown) {
                    framesInPhase++
                    if (framesInPhase >= holdFrames) {
                        phase = RepPhase.BOTTOM
                        framesInPhase = 0
                    }
                } else if (crossedUp) {
                    // bounced back up without settling at the bottom — don't count, just reset
                    phase = RepPhase.READY
                    framesInPhase = 0
                }
            }
            RepPhase.BOTTOM -> {
                if (crossedUp) {
                    framesInPhase++
                    if (framesInPhase >= holdFrames) {
                        phase = RepPhase.UP
                        framesInPhase = 0
                        reps++
                        justCompleted = true
                    }
                } else {
                    framesInPhase = 0
                }
            }
        }
        return RepState(phase, justCompleted, reps)
    }
}