package com.arfit.engine

import com.arfit.engine.analyzers.PushUpAnalyzer
import com.arfit.engine.analyzers.SquatAnalyzer

/**
 * Single place that knows which analyzers exist. Add a new exercise by
 * writing one ExerciseAnalyzer implementation (see PushUpAnalyzer /
 * SquatAnalyzer for the pattern) and registering it here — nothing else
 * in the app needs to change. This is Section 30's core rule in code.
 */
object ExerciseRegistry {
    private val factories: Map<String, () -> ExerciseAnalyzer> = mapOf(
        "pushup" to { PushUpAnalyzer() },
        "squat" to { SquatAnalyzer() }
        // "lunge" to { LungeAnalyzer() },
        // "plank" to { PlankAnalyzer() },
        // "bicepcurl" to { BicepCurlAnalyzer() },
        // "shoulderpress" to { ShoulderPressAnalyzer() },
    )

    val available: List<String> get() = factories.keys.toList()

    fun create(exerciseId: String): ExerciseAnalyzer =
        factories[exerciseId]?.invoke()
            ?: throw IllegalArgumentException("No analyzer registered for '$exerciseId'")
}
