@file:Suppress("SpellCheckingInspection")

package com.arfit.ui

import android.media.Image
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.arfit.ar.GhostSkeletonNode
import com.arfit.ar.Joint
import com.arfit.engine.*
import com.arfit.pose.MpLandmark
import com.arfit.pose.PoseFrame
import com.google.ar.core.CameraIntrinsics
import com.google.ar.core.Pose
import dev.romainguy.kotlin.math.Float3
import io.github.sceneview.ar.node.AnchorNode

enum class WorkoutStage { ALIGNING, ACTIVE, SUMMARY }

class WorkoutViewModel(exerciseId: String, initialTargetReps: Int) : ViewModel() {
    val analyzer: ExerciseAnalyzer = ExerciseRegistry.create(exerciseId)
    private val session = WorkoutSession(analyzer.displayName)

    var ghostNode: GhostSkeletonNode? = null
    var anchorNode: AnchorNode? = null

    private var depthImage: Image? = null
    private var cameraPose: Pose? = null
    private var cameraIntrinsics: CameraIntrinsics? = null
    private val depthUnprojector = DepthUnprojector()

    var stage by mutableStateOf(WorkoutStage.ALIGNING)
        private set

    // FIX: Optimized primitive states
    var alignmentPercent by mutableIntStateOf(0)
        private set
    var formScore by mutableIntStateOf(0)
        private set
    var reps by mutableIntStateOf(0)
        private set

    val targetReps: Int = initialTargetReps

    // FIX: Optimized primitive state
    var elapsedSeconds by mutableIntStateOf(0)
        private set

    var feedback by mutableStateOf(Feedback("GET IN POSITION"))
        private set
    var adjustments by mutableStateOf<List<String>>(emptyList())
        private set
    var checklist by mutableStateOf(FeedbackCategory.entries.associateWith { true })
        private set
    var summary by mutableStateOf<WorkoutSummary?>(null)
        private set

    private var lastRepAtMs: Long? = null
    private val minRepIntervalMs = 600L
    private var speedIsGood = true

    fun updateDepthData(image: Image?, pose: Pose, intrinsics: CameraIntrinsics) {
        depthImage?.close()
        depthImage = image
        cameraPose = pose
        cameraIntrinsics = intrinsics
    }

    fun startWorkout() {
        stage = WorkoutStage.ALIGNING
        alignmentPercent = 0
        formScore = 0
        reps = 0
        elapsedSeconds = 0
        feedback = Feedback("GET IN POSITION")
        adjustments = emptyList()
        checklist = FeedbackCategory.entries.associateWith { true }
        summary = null
        lastRepAtMs = null
        speedIsGood = true
        analyzer.reset()
    }

    fun tick() {
        if (stage != WorkoutStage.SUMMARY) elapsedSeconds++
    }

    fun onPoseFrame(frame: PoseFrame?) {
        if (frame == null) {
            feedback = Feedback("FULL BODY NOT VISIBLE", "Move farther away")
            return
        }

        val pose = cameraPose
        val intrinsics = cameraIntrinsics

        // --- Live Ghost Mirroring ---
        if (stage != WorkoutStage.SUMMARY && ghostNode != null && pose != null && intrinsics != null) {
            val width = frame.imageWidth.toFloat()
            val height = frame.imageHeight.toFloat()
            val jointWorldPositions = mutableMapOf<Joint, Float3>()

            for (joint in Joint.entries) {
                val landmark = when (joint) {
                    Joint.HEAD -> MpLandmark.NOSE
                    Joint.NECK -> MpLandmark.LEFT_SHOULDER
                    Joint.LEFT_SHOULDER -> MpLandmark.LEFT_SHOULDER
                    Joint.RIGHT_SHOULDER -> MpLandmark.RIGHT_SHOULDER
                    Joint.LEFT_ELBOW -> MpLandmark.LEFT_ELBOW
                    Joint.RIGHT_ELBOW -> MpLandmark.RIGHT_ELBOW
                    Joint.LEFT_WRIST -> MpLandmark.LEFT_WRIST
                    Joint.RIGHT_WRIST -> MpLandmark.RIGHT_WRIST
                    Joint.SPINE_MID -> MpLandmark.LEFT_HIP
                    Joint.LEFT_HIP -> MpLandmark.LEFT_HIP
                    Joint.RIGHT_HIP -> MpLandmark.RIGHT_HIP
                    Joint.LEFT_KNEE -> MpLandmark.LEFT_KNEE
                    Joint.RIGHT_KNEE -> MpLandmark.RIGHT_KNEE
                    Joint.LEFT_ANKLE -> MpLandmark.LEFT_ANKLE
                    Joint.RIGHT_ANKLE -> MpLandmark.RIGHT_ANKLE
                }

                val lm = frame.raw.getOrNull(landmark.index) ?: continue
                val u = lm.x * (width - 1)
                val v = lm.y * (height - 1)

                // Uses fallback inside unprojector if depthImage is null
                val depth = depthUnprojector.sampleDepth(depthImage, u.toInt(), v.toInt())
                val worldVec = depthUnprojector.unprojectToWorld(u, v, depth, intrinsics, pose)

                jointWorldPositions[joint] = Float3(worldVec.x, worldVec.y, worldVec.z)
            }

            if (jointWorldPositions.isNotEmpty()) {
                ghostNode?.setLivePose(jointWorldPositions)
            }
        }

        // --- Workout Logic ---
        val analysis = analyzer.analyzePose(frame)
        val repState = analyzer.detectRepetition(frame)

        when (stage) {
            WorkoutStage.ALIGNING -> {
                alignmentPercent = analysis.score
                feedback = if (alignmentPercent >= 60) {
                    Feedback("PERFECT POSITION", "Starting...")
                } else {
                    Feedback("ALIGN WITH THE TRAINER", "${alignmentPercent}% aligned")
                }
                if (alignmentPercent >= 60) stage = WorkoutStage.ACTIVE
            }
            WorkoutStage.ACTIVE -> {
                formScore = analysis.score
                session.recordFrame(analysis.score)
                adjustments = analysis.corrections.map { it.message }

                val activeCategories = analysis.corrections.map { it.category }.toSet()
                checklist = mapOf(
                    FeedbackCategory.POSTURE to (FeedbackCategory.POSTURE !in activeCategories),
                    FeedbackCategory.RANGE_OF_MOTION to (FeedbackCategory.RANGE_OF_MOTION !in activeCategories),
                    FeedbackCategory.STABILITY to (FeedbackCategory.STABILITY !in activeCategories),
                    FeedbackCategory.SPEED to speedIsGood
                )

                if (repState.repJustCompleted) {
                    reps = repState.totalReps
                    session.recordRep()
                    val now = System.currentTimeMillis()
                    val last = lastRepAtMs
                    speedIsGood = last == null || (now - last) >= minRepIntervalMs
                    lastRepAtMs = now
                    if (reps >= targetReps) {
                        finishWorkout()
                        return
                    }
                }
                feedback = analyzer.getFeedback(analysis)
            }
            WorkoutStage.SUMMARY -> Unit
        }
    }

    fun finishWorkout() {
        summary = session.summary()
        stage = WorkoutStage.SUMMARY
        analyzer.reset()
    }

    override fun onCleared() {
        depthImage?.close()
    }
}

class WorkoutViewModelFactory(
    private val exerciseId: String,
    private val targetReps: Int = 12
) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T =
        WorkoutViewModel(exerciseId, targetReps) as T
}