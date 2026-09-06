package com.arfit.engine

import kotlin.math.acos
import kotlin.math.sqrt

/** Angle at vertex [b], formed by rays b->a and b->c, in degrees (0–180). */
fun jointAngleDegrees(a: Vec3, b: Vec3, c: Vec3): Float {
    val v1 = Vec3(a.x - b.x, a.y - b.y, a.z - b.z)
    val v2 = Vec3(c.x - b.x, c.y - b.y, c.z - b.z)
    val dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z
    val len1 = sqrt(v1.x * v1.x + v1.y * v1.y + v1.z * v1.z).coerceAtLeast(1e-5f)
    val len2 = sqrt(v2.x * v2.x + v2.y * v2.y + v2.z * v2.z).coerceAtLeast(1e-5f)
    val cos = (dot / (len1 * len2)).coerceIn(-1f, 1f)
    return Math.toDegrees(acos(cos).toDouble()).toFloat()
}

fun distance(a: Vec3, b: Vec3): Float {
    val dx = a.x - b.x; val dy = a.y - b.y; val dz = a.z - b.z
    return sqrt(dx * dx + dy * dy + dz * dz)
}

/**
 * Exponential moving average smoother — Section 14 ("the AR target itself
 * must never jitter") and Section 17 ("do not make the score jump
 * rapidly"). Lower alpha = smoother but laggier.
 */
class EmaSmoother(private val alpha: Float = 0.35f) {
    private var value: Float? = null

    fun push(sample: Float): Float {
        val prev = value
        val next = if (prev == null) sample else alpha * sample + (1 - alpha) * prev
        value = next
        return next
    }

    fun reset() {
        value = null
    }
}
