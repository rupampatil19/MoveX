package com.arfit.camera

import android.util.Size
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.lifecycle.compose.LocalLifecycleOwner
import com.arfit.ar.STANDARD_BONES
import com.arfit.engine.JointMapper
import com.arfit.pose.MpLandmark
import com.arfit.pose.PoseDetector
import com.arfit.pose.PoseFrame
import java.util.concurrent.Executors

/**
 * Phases 1-3: camera preview, MediaPipe pose detection, and a 2D skeleton
 * overlay drawn straight onto the preview. Emits every USABLE frame (full
 * required-landmark set visible, Section 13) via [onFrame]; emits null
 * otherwise so callers can show "full body not visible" without doing
 * their own visibility bookkeeping.
 */
@Composable
fun CameraPoseView(
    requiredLandmarks: Set<MpLandmark>,
    onFrame: (PoseFrame?) -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    var lastFrame by remember { mutableStateOf<PoseFrame?>(null) }
    var bodyVisible by remember { mutableStateOf(false) }

    val analysisExecutor = remember { Executors.newSingleThreadExecutor() }
    val poseDetector = remember {
        PoseDetector(context) { frame ->
            lastFrame = frame
            bodyVisible = frame != null && frame.hasRequiredLandmarks(requiredLandmarks)
            onFrame(if (bodyVisible) frame else null)
        }
    }

    DisposableEffect(Unit) {
        onDispose {
            poseDetector.close()
            analysisExecutor.shutdown()
        }
    }

    Box(modifier = modifier.fillMaxSize()) {
        AndroidView(
            modifier = Modifier.fillMaxSize(),
            factory = { ctx ->
                val previewView = PreviewView(ctx)
                val cameraProviderFuture = ProcessCameraProvider.getInstance(ctx)
                cameraProviderFuture.addListener({
                    val cameraProvider = cameraProviderFuture.get()

                    val preview = Preview.Builder().build().also {
                        it.setSurfaceProvider(previewView.surfaceProvider)
                    }

                    val analysis = ImageAnalysis.Builder()
                        .setTargetResolution(Size(480, 640))
                        .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                        .build()
                        .also {
                            it.setAnalyzer(analysisExecutor) { imageProxy ->
                                poseDetector.detectAsync(imageProxy)
                            }
                        }

                    cameraProvider.unbindAll()
                    cameraProvider.bindToLifecycle(
                        lifecycleOwner,
                        CameraSelector.DEFAULT_BACK_CAMERA,
                        preview,
                        analysis
                    )
                }, ContextCompat.getMainExecutor(ctx))
                previewView
            }
        )

        val frame = lastFrame
        if (frame != null) {
            Canvas(modifier = Modifier.fillMaxSize()) {
                val positions = JointMapper.toJointPositions(frame)
                val color = if (bodyVisible) Color(0xFF39D9F0) else Color(0xFFE05A5A)

                STANDARD_BONES.forEach { bone ->
                    val a = positions[bone.a] ?: return@forEach
                    val b = positions[bone.b] ?: return@forEach
                    drawLine(
                        color = color,
                        start = Offset(a.x * size.width, a.y * size.height),
                        end = Offset(b.x * size.width, b.y * size.height),
                        strokeWidth = 6f
                    )
                }
                positions.values.forEach { p ->
                    drawCircle(color, radius = 8f, center = Offset(p.x * size.width, p.y * size.height))
                }
            }
        }

        if (!bodyVisible) {
            BodyNotVisibleBanner(
                hint = if (lastFrame == null) "Move into frame" else "Full body not visible — move farther away"
            )
        }
    }
}

@Composable
private fun BoxScope.BodyNotVisibleBanner(hint: String) {
    Text(
        text = hint,
        color = Color.White,
        modifier = Modifier
            .align(Alignment.BottomCenter)
            .padding(bottom = 140.dp)
    )
}
