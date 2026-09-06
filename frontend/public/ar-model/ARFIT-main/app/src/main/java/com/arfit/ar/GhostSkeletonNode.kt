@file:Suppress("unused", "SpellCheckingInspection")

package com.arfit.ar

import com.google.android.filament.Engine
import com.google.android.filament.MaterialInstance
import dev.romainguy.kotlin.math.Float3
import io.github.sceneview.loaders.MaterialLoader
import io.github.sceneview.math.Color
import io.github.sceneview.node.CylinderNode
import io.github.sceneview.node.Node
import io.github.sceneview.node.SphereNode
import kotlin.math.abs
import kotlin.math.asin
import kotlin.math.atan2
import kotlin.math.sqrt

enum class GhostState(val rgba: FloatArray) {
    NEUTRAL(floatArrayOf(0.30f, 0.85f, 0.95f, 0.55f)),
    ALIGNED(floatArrayOf(0.25f, 0.90f, 0.45f, 0.60f)),
    ADJUST(floatArrayOf(0.95f, 0.80f, 0.20f, 0.65f)),
    MISALIGNED(floatArrayOf(0.95f, 0.25f, 0.25f, 0.70f))
}

private const val JOINT_RADIUS = 0.052f
private const val BONE_RADIUS = 0.030f

class GhostSkeletonNode(
    engine: Engine,
    private val materialLoader: MaterialLoader
) : Node(engine) {

    private val jointNodes = mutableMapOf<Joint, SphereNode>()
    private val boneNodes = mutableMapOf<Bone, CylinderNode>()
    private var state: GhostState = GhostState.NEUTRAL
    private var currentMaterial: MaterialInstance = materialFor(GhostState.NEUTRAL)

    init {
        // FIX: Replaced Joint.values() with Joint.entries
        Joint.entries.forEach { joint ->
            val sphere = SphereNode(
                engine = engine,
                radius = JOINT_RADIUS,
                materialInstance = currentMaterial
            )
            addChildNode(sphere)
            jointNodes[joint] = sphere
        }
        STANDARD_BONES.forEach { bone ->
            val cylinder = CylinderNode(
                engine = engine,
                radius = BONE_RADIUS,
                height = 0.1f,
                materialInstance = currentMaterial
            )
            addChildNode(cylinder)
            boneNodes[bone] = cylinder
        }
    }

    // ---------- Pose setting from keyframes (animation) ----------
    fun setPose(pose: PoseKeyframe) {
        pose.joints.forEach { (joint, pos) ->
            jointNodes[joint]?.position = pos
        }
        STANDARD_BONES.forEach { bone ->
            val a = pose.joints[bone.a] ?: return@forEach
            val b = pose.joints[bone.b] ?: return@forEach
            updateBone(bone, a, b)
        }
    }

    fun setPoseLerp(from: PoseKeyframe, to: PoseKeyframe, t: Float) {
        // FIX: Replaced Joint.values() with Joint.entries
        val blended = Joint.entries.mapNotNull { joint ->
            val a = from.joints[joint] ?: return@mapNotNull null
            val b = to.joints[joint] ?: return@mapNotNull null
            joint to Float3(
                a.x + (b.x - a.x) * t,
                a.y + (b.y - a.y) * t,
                a.z + (b.z - a.z) * t
            )
        }.toMap()
        setPose(PoseKeyframe("blend", blended))
    }

    // ---------- Live mirroring from depth-unprojected user joints ----------
    /**
     * Updates all joints and bones from a map of current world positions.
     * Called every frame during workout to mirror the user's body in 3D.
     */
    fun setLivePose(positions: Map<Joint, Float3>) {
        // Update joint positions
        positions.forEach { (joint, pos) ->
            jointNodes[joint]?.position = pos
        }
        // Recompute bone cylinders from updated joint positions
        STANDARD_BONES.forEach { bone ->
            val a = positions[bone.a] ?: return@forEach
            val b = positions[bone.b] ?: return@forEach
            updateBone(bone, a, b)
        }
    }

    /**
     * Returns the current world‑space positions of all joints.
     * Used during alignment to compare the user's pose against the ghost's current pose.
     */
    fun getCurrentPose(): Map<Joint, Float3> {
        return jointNodes.mapValues { (_, sphere) -> sphere.position }
    }

    // ---------- Styling ----------
    fun setState(newState: GhostState) {
        if (newState == state) return
        state = newState
        currentMaterial = materialFor(newState)
        jointNodes.values.forEach { it.materialInstance = currentMaterial }
        boneNodes.values.forEach { it.materialInstance = currentMaterial }
    }

    private fun materialFor(newState: GhostState): MaterialInstance {
        val c = newState.rgba
        return materialLoader.createColorInstance(Color(c[0], c[1], c[2], c[3]))
    }

    // ---------- Bone update helpers (unchanged) ----------
    private fun updateBone(bone: Bone, a: Float3, b: Float3) {
        val cylinder = boneNodes[bone] ?: return
        val mid = Float3((a.x + b.x) / 2f, (a.y + b.y) / 2f, (a.z + b.z) / 2f)
        val length = distance(a, b)

        cylinder.position = mid
        cylinder.scale = Float3(1f, length / 0.1f, 1f)
        cylinder.rotation = rotationBetween(Float3(0f, 1f, 0f), normalize(sub(b, a)))
    }

    private fun distance(a: Float3, b: Float3): Float {
        val dx = b.x - a.x; val dy = b.y - a.y; val dz = b.z - a.z
        return sqrt(dx * dx + dy * dy + dz * dz)
    }

    private fun sub(a: Float3, b: Float3) = Float3(a.x - b.x, a.y - b.y, a.z - b.z)

    private fun normalize(v: Float3): Float3 {
        val len = sqrt(v.x * v.x + v.y * v.y + v.z * v.z).coerceAtLeast(0.0001f)
        return Float3(v.x / len, v.y / len, v.z / len)
    }

    private fun rotationBetween(from: Float3, to: Float3): Float3 {
        val dot = (from.x * to.x + from.y * to.y + from.z * to.z).coerceIn(-1f, 1f)

        if (dot > 0.9999f) return Float3(0f, 0f, 0f)

        val qx: Float; val qy: Float; val qz: Float; val qw: Float

        if (dot < -0.9999f) {
            var axis = cross(from, Float3(1f, 0f, 0f))
            if (axis.x * axis.x + axis.y * axis.y + axis.z * axis.z < 0.0001f) {
                axis = cross(from, Float3(0f, 0f, 1f))
            }
            axis = normalize(axis)
            qx = axis.x; qy = axis.y; qz = axis.z; qw = 0f
        } else {
            val c = cross(from, to)
            qx = c.x; qy = c.y; qz = c.z
            qw = 1f + dot
        }

        val len = sqrt(qx * qx + qy * qy + qz * qz + qw * qw).coerceAtLeast(0.0001f)
        return quaternionToEulerDegrees(qx / len, qy / len, qz / len, qw / len)
    }

    private fun cross(a: Float3, b: Float3) = Float3(
        a.y * b.z - a.z * b.y,
        a.z * b.x - a.x * b.z,
        a.x * b.y - a.y * b.x
    )

    private fun quaternionToEulerDegrees(x: Float, y: Float, z: Float, w: Float): Float3 {
        val sinRcosP = 2f * (w * x + y * z)
        val cosRcosP = 1f - 2f * (x * x + y * y)
        val roll = atan2(sinRcosP, cosRcosP)

        val sinP = 2f * (w * y - z * x)
        val pitch = if (abs(sinP) >= 1f) {
            (Math.PI.toFloat() / 2f) * (if (sinP >= 0f) 1f else -1f)
        } else {
            asin(sinP)
        }

        val sinYcosP = 2f * (w * z + x * y)
        val cosYcosP = 1f - 2f * (y * y + z * z)
        val yaw = atan2(sinYcosP, cosYcosP)

        return Float3(
            Math.toDegrees(roll.toDouble()).toFloat(),
            Math.toDegrees(pitch.toDouble()).toFloat(),
            Math.toDegrees(yaw.toDouble()).toFloat()
        )
    }
}