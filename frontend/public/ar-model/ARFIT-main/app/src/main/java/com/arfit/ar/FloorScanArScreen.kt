@file:Suppress("DEPRECATION")

package com.arfit.ar

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.ImageFormat
import android.graphics.Rect
import android.graphics.YuvImage
import android.media.Image
import android.os.Handler
import android.os.Looper
import android.view.MotionEvent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.google.ar.core.Config
import com.google.ar.core.Plane
import com.google.ar.core.TrackingState
import dev.romainguy.kotlin.math.Float2
import io.github.sceneview.ar.ARScene
import io.github.sceneview.ar.arcore.createAnchorOrNull
import io.github.sceneview.ar.node.AnchorNode
import io.github.sceneview.ar.rememberARCameraNode
import io.github.sceneview.gesture.GestureDetector
import io.github.sceneview.gesture.MoveGestureDetector
import io.github.sceneview.gesture.RotateGestureDetector
import io.github.sceneview.gesture.ScaleGestureDetector
import io.github.sceneview.node.Node
import io.github.sceneview.rememberEngine
import io.github.sceneview.rememberMaterialLoader
import io.github.sceneview.rememberNodes
import com.arfit.pose.PoseDetector
import com.arfit.ui.WorkoutOverlay
import com.arfit.ui.WorkoutViewModel
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import java.io.ByteArrayOutputStream
import java.util.concurrent.Executors
import kotlin.time.Duration.Companion.milliseconds

private enum class ScanState { SEARCHING, FLOOR_DETECTED, GHOST_PLACED, WORKOUT }

@Composable
fun FloorScanArScreen(
    exerciseId: String,
    viewModel: WorkoutViewModel,
    onWorkoutFinished: (com.arfit.engine.WorkoutSummary) -> Unit
) {
    val engine = rememberEngine()
    val materialLoader = rememberMaterialLoader(engine)
    val cameraNode = rememberARCameraNode(engine)
    val childNodes = rememberNodes()
    val context = LocalContext.current

    var scanState by remember { mutableStateOf(ScanState.SEARCHING) }
    var ghost by remember { mutableStateOf<GhostSkeletonNode?>(null) }

    val analysisExecutor = remember { Executors.newSingleThreadExecutor() }
    val poseDetector = remember {
        PoseDetector(
            context = context,
            onResult = { frame ->
                Handler(Looper.getMainLooper()).post {
                    viewModel.onPoseFrame(frame)
                }
            }
        )
    }

    val animation = remember(exerciseId) { PoseLibrary.animationFor(exerciseId) }

    LaunchedEffect(ghost, animation, scanState) {
        val g = ghost ?: return@LaunchedEffect
        var frameIndex = 0
        while (isActive && scanState != ScanState.WORKOUT) {
            val from = animation.keyframes[frameIndex]
            val to = animation.keyframes[(frameIndex + 1) % animation.keyframes.size]
            val steps = 30
            repeat(steps) { step ->
                g.setPoseLerp(from, to, step / steps.toFloat())
                delay((animation.secondsPerKeyframe * 1000 / steps).toLong().milliseconds)
            }
            frameIndex = (frameIndex + 1) % animation.keyframes.size
        }
    }

    LaunchedEffect(Unit) {
        while (true) {
            delay(1000.milliseconds)
            viewModel.tick()
        }
    }

    DisposableEffect(Unit) {
        onDispose {
            analysisExecutor.shutdown()
            poseDetector.close()
        }
    }

    Box(modifier = Modifier.fillMaxSize()) {
        ARScene(
            modifier = Modifier.fillMaxSize(),
            engine = engine,
            materialLoader = materialLoader,
            cameraNode = cameraNode,
            childNodes = childNodes,
            planeRenderer = true,
            sessionConfiguration = { _, config ->
                config.planeFindingMode = Config.PlaneFindingMode.HORIZONTAL
                config.depthMode = Config.DepthMode.AUTOMATIC
                config.lightEstimationMode = Config.LightEstimationMode.ENVIRONMENTAL_HDR
            },
            onSessionUpdated = { _, frame ->
                if (scanState == ScanState.SEARCHING) {
                    val floorFound = frame.getUpdatedTrackables(Plane::class.java).any {
                        it.type == Plane.Type.HORIZONTAL_UPWARD_FACING &&
                                it.trackingState == TrackingState.TRACKING
                    }
                    if (floorFound) scanState = ScanState.FLOOR_DETECTED
                }

                if (scanState == ScanState.WORKOUT) {
                    // FIX: Replaced acquireDepthImage() with acquireDepthImage16Bits()
                    val depthImage = try {
                        frame.acquireDepthImage16Bits()
                    } catch (_: Exception) { null }

                    val intrinsics = frame.camera.imageIntrinsics
                    val pose = frame.camera.pose
                    viewModel.updateDepthData(depthImage, pose, intrinsics)

                    val cameraImage = try {
                        frame.acquireCameraImage()
                    } catch (_: Exception) { null }

                    cameraImage?.let { image ->
                        analysisExecutor.execute {
                            image.use { img ->
                                val bitmap = imageToBitmap(img)
                                poseDetector.detectBitmap(bitmap)
                            }
                        }
                    }
                }
            },
            onGestureListener = object : GestureDetector.OnGestureListener {
                override fun onDown(e: MotionEvent, node: Node?) {}
                override fun onShowPress(e: MotionEvent, node: Node?) {}
                override fun onSingleTapUp(e: MotionEvent, node: Node?) {}
                override fun onScroll(e1: MotionEvent?, e2: MotionEvent, node: Node?, distance: Float2) {}
                override fun onLongPress(e: MotionEvent, node: Node?) {}
                override fun onFling(e1: MotionEvent?, e2: MotionEvent, node: Node?, velocity: Float2) {}

                override fun onSingleTapConfirmed(e: MotionEvent, node: Node?) {
                    if (scanState != ScanState.FLOOR_DETECTED) return
                    val hitResult = cameraNode.frame?.hitTest(e.x, e.y)
                        ?.firstOrNull { it.trackable is Plane }
                    val anchor = hitResult?.createAnchorOrNull() ?: return
                    val newAnchorNode = AnchorNode(engine, anchor)
                    val newGhost = GhostSkeletonNode(engine, materialLoader)
                    newGhost.setPose(animation.keyframes.first())
                    newAnchorNode.addChildNode(newGhost)
                    childNodes += newAnchorNode
                    viewModel.ghostNode = newGhost
                    viewModel.anchorNode = newAnchorNode
                    ghost = newGhost
                    scanState = ScanState.GHOST_PLACED
                }

                override fun onDoubleTap(e: MotionEvent, node: Node?) {}
                override fun onDoubleTapEvent(e: MotionEvent, node: Node?) {}
                override fun onContextClick(e: MotionEvent, node: Node?) {}
                override fun onMoveBegin(detector: MoveGestureDetector, e: MotionEvent, node: Node?) {}
                override fun onMove(detector: MoveGestureDetector, e: MotionEvent, node: Node?) {}
                override fun onMoveEnd(detector: MoveGestureDetector, e: MotionEvent, node: Node?) {}
                override fun onRotateBegin(detector: RotateGestureDetector, e: MotionEvent, node: Node?) {}
                override fun onRotate(detector: RotateGestureDetector, e: MotionEvent, node: Node?) {}
                override fun onRotateEnd(detector: RotateGestureDetector, e: MotionEvent, node: Node?) {}
                override fun onScaleBegin(detector: ScaleGestureDetector, e: MotionEvent, node: Node?) {}
                override fun onScale(detector: ScaleGestureDetector, e: MotionEvent, node: Node?) {}
                override fun onScaleEnd(detector: ScaleGestureDetector, e: MotionEvent, node: Node?) {}
            }
        )

        when (scanState) {
            ScanState.SEARCHING, ScanState.FLOOR_DETECTED -> {
                PlacementOverlay(scanState)
            }
            ScanState.GHOST_PLACED -> {
                StartWorkoutOverlay(
                    onStart = {
                        scanState = ScanState.WORKOUT
                        viewModel.startWorkout()
                    }
                )
            }
            ScanState.WORKOUT -> {
                // FIX: Passed onWorkoutFinished to satisfy the onFinish parameter requirement
                WorkoutOverlay(
                    viewModel = viewModel,
                    onFinish = onWorkoutFinished
                )
            }
        }
    }
}

// ---- Convert android.media.Image to Bitmap ----
private fun imageToBitmap(image: Image): Bitmap {
    val planes = image.planes
    val yPlane = planes[0]
    val uPlane = planes[1]
    val vPlane = planes[2]

    val width = image.width
    val height = image.height

    val nv21 = ByteArray(width * height + 2 * ((width + 1) / 2) * ((height + 1) / 2))

    var pos = 0
    val yBuffer = yPlane.buffer
    val yRowStride = yPlane.rowStride
    for (row in 0 until height) {
        yBuffer.position(row * yRowStride)
        yBuffer.get(nv21, pos, width)
        pos += width
    }

    val chromaWidth = (width + 1) / 2
    val chromaHeight = (height + 1) / 2
    val uBuffer = uPlane.buffer
    val vBuffer = vPlane.buffer
    val uRowStride = uPlane.rowStride
    val uPixelStride = uPlane.pixelStride
    val vRowStride = vPlane.rowStride
    val vPixelStride = vPlane.pixelStride

    var uvPos = width * height
    for (row in 0 until chromaHeight) {
        for (col in 0 until chromaWidth) {
            val vIndex = row * vRowStride + col * vPixelStride
            val uIndex = row * uRowStride + col * uPixelStride
            nv21[uvPos++] = vBuffer.get(vIndex)
            nv21[uvPos++] = uBuffer.get(uIndex)
        }
    }

    val yuvImage = YuvImage(nv21, ImageFormat.NV21, width, height, null)
    val out = ByteArrayOutputStream()
    yuvImage.compressToJpeg(Rect(0, 0, width, height), 90, out)
    val bytes = out.toByteArray()
    return BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
}

@Composable
private fun BoxScope.PlacementOverlay(scanState: ScanState) {
    val (label, sub) = when (scanState) {
        ScanState.SEARCHING -> "point your camera at the floor" to "move your phone slowly"
        ScanState.FLOOR_DETECTED -> "floor detected" to "tap the floor to place your trainer"
        else -> "" to ""
    }
    Column(
        modifier = Modifier
            .align(Alignment.TopCenter)
            .padding(top = 24.dp)
            .background(Color.Black.copy(alpha = 0.55f), RoundedCornerShape(12.dp))
            .padding(horizontal = 16.dp, vertical = 10.dp)
    ) {
        Text(label, color = Color.White)
        Text(sub, color = Color.White.copy(alpha = 0.7f))
    }
}

@Composable
private fun BoxScope.StartWorkoutOverlay(onStart: () -> Unit) {
    Button(
        onClick = onStart,
        modifier = Modifier
            .align(Alignment.BottomCenter)
            .padding(bottom = 40.dp)
    ) {
        Text("Start Workout")
    }
}