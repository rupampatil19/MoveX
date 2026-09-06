package com.arfit.ui

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.arfit.engine.FeedbackCategory
import com.arfit.engine.WorkoutSummary

private val ColorGood = Color(0xFF3DDC97)
private val ColorMid = Color(0xFFE8B84B)
private val ColorBad = Color(0xFFE0645A)

private fun stateColor(percent: Int) = when {
    percent >= 85 -> ColorGood
    percent >= 50 -> ColorMid
    else -> ColorBad
}

@Composable
fun WorkoutOverlay(
    viewModel: WorkoutViewModel,
    onFinish: (WorkoutSummary) -> Unit
) {
    // When stage becomes SUMMARY, call onFinish
    LaunchedEffect(viewModel.stage) {
        if (viewModel.stage == WorkoutStage.SUMMARY) {
            viewModel.summary?.let { onFinish(it) }
        }
    }

    Box(modifier = Modifier.fillMaxSize()) {
        // End button
        TextButton(
            onClick = { viewModel.finishWorkout() },
            modifier = Modifier.align(Alignment.TopEnd).padding(16.dp)
        ) {
            Text("END", color = Color.White, fontWeight = FontWeight.SemiBold)
        }

        when (viewModel.stage) {
            WorkoutStage.ALIGNING -> {
                AlignmentRing(
                    percent = viewModel.alignmentPercent,
                    modifier = Modifier.align(Alignment.Center)
                )
            }
            WorkoutStage.ACTIVE -> {
                AdjustmentCard(
                    items = viewModel.adjustments,
                    modifier = Modifier
                        .align(Alignment.TopStart)
                        .padding(16.dp)
                        .widthIn(max = 200.dp)
                )

                val allGood = viewModel.checklist.values.all { it }
                if (allGood || viewModel.formScore >= 75) {
                    StatusPill(
                        text = if (viewModel.formScore >= 90 && allGood) "PERFECT POSITION!" else "GOOD POSITION",
                        modifier = Modifier.align(Alignment.TopCenter).padding(top = 16.dp)
                    )
                }
            }
            WorkoutStage.SUMMARY -> { /* handled by LaunchedEffect */ }
        }

        Column(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth()
                .background(Color(0xFF0B0D10).copy(alpha = 0.92f))
                .padding(horizontal = 20.dp, vertical = 18.dp)
        ) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                StatBlock("FORM", "${viewModel.formScore}", stateColor(viewModel.formScore))
                StatBlock("REPS", "${viewModel.reps} / ${viewModel.targetReps}", Color.White)
                StatBlock("TIME", formatTime(viewModel.elapsedSeconds), Color.White)
            }

            if (viewModel.stage == WorkoutStage.ACTIVE) {
                Spacer(Modifier.height(14.dp))
                LiveFeedbackChecklist(viewModel.checklist)
            }

            Spacer(Modifier.height(12.dp))
            Text(viewModel.feedback.primary, color = Color.White, fontWeight = FontWeight.SemiBold, fontSize = 15.sp)
            viewModel.feedback.secondary?.let {
                Spacer(Modifier.height(2.dp))
                Text(it, color = Color.White.copy(alpha = 0.55f), fontSize = 13.sp)
            }
        }
    }
}

// ---- UI components ----
@Composable
private fun AlignmentRing(percent: Int, modifier: Modifier = Modifier) {
    val animatedPercent by animateFloatAsState(percent.toFloat(), label = "alignPercent")
    val color by animateColorAsState(stateColor(percent), label = "ringColor")
    Box(modifier = modifier.size(180.dp), contentAlignment = Alignment.Center) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            val strokeWidth = 10.dp.toPx()
            drawArc(
                color = Color.White.copy(alpha = 0.15f),
                startAngle = -90f, sweepAngle = 360f, useCenter = false,
                style = Stroke(strokeWidth),
                size = Size(size.width - strokeWidth, size.height - strokeWidth),
                topLeft = Offset(strokeWidth / 2, strokeWidth / 2)
            )
            drawArc(
                color = color,
                startAngle = -90f, sweepAngle = 360f * (animatedPercent / 100f), useCenter = false,
                style = Stroke(strokeWidth, cap = StrokeCap.Round),
                size = Size(size.width - strokeWidth, size.height - strokeWidth),
                topLeft = Offset(strokeWidth / 2, strokeWidth / 2)
            )
        }
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text("${percent}%", color = Color.White, fontSize = 36.sp, fontWeight = FontWeight.Bold)
            Text("ALIGNMENT", color = Color.White.copy(alpha = 0.6f), fontSize = 11.sp, letterSpacing = 1.sp)
        }
    }
}

@Composable
private fun AdjustmentCard(items: List<String>, modifier: Modifier = Modifier) {
    if (items.isEmpty()) return
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(14.dp))
            .background(Color(0xFF0B0D10).copy(alpha = 0.85f))
            .padding(14.dp)
    ) {
        Text("ADJUSTMENT", color = Color.White.copy(alpha = 0.55f), fontSize = 10.sp, letterSpacing = 1.sp, fontWeight = FontWeight.SemiBold)
        Spacer(Modifier.height(6.dp))
        items.take(3).forEach { message ->
            Text("•  $message", color = Color.White, fontSize = 12.sp, modifier = Modifier.padding(vertical = 2.dp))
        }
    }
}

@Composable
private fun StatusPill(text: String, modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(24.dp))
            .background(ColorGood)
            .padding(horizontal = 18.dp, vertical = 8.dp)
    ) {
        Text(text, color = Color(0xFF06140F), fontWeight = FontWeight.Bold, fontSize = 13.sp)
    }
}

@Composable
private fun LiveFeedbackChecklist(checklist: Map<FeedbackCategory, Boolean>) {
    val labels = mapOf(
        FeedbackCategory.POSTURE to "POSTURE",
        FeedbackCategory.RANGE_OF_MOTION to "RANGE OF MOTION",
        FeedbackCategory.STABILITY to "STABILITY",
        FeedbackCategory.SPEED to "SPEED"
    )
    Column {
        labels.forEach { (category, label) ->
            val good = checklist[category] ?: true
            Row(modifier = Modifier.fillMaxWidth().padding(vertical = 2.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(label, color = Color.White.copy(alpha = 0.65f), fontSize = 12.sp)
                Text(
                    if (good) "GOOD" else "WORK ON THIS",
                    color = if (good) ColorGood else ColorMid,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold
                )
            }
        }
    }
}

@Composable
private fun StatBlock(label: String, value: String, valueColor: Color) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(value, color = valueColor, fontSize = 20.sp, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(2.dp))
        Text(label, color = Color.White.copy(alpha = 0.5f), fontSize = 11.sp, letterSpacing = 1.sp)
    }
}

private fun formatTime(totalSeconds: Int): String {
    val m = totalSeconds / 60
    val s = totalSeconds % 60
    return "${m}:${s.toString().padStart(2, '0')}"
}