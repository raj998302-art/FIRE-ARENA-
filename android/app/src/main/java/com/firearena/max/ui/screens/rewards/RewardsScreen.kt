package com.firearena.max.ui.screens.rewards

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavHostController
import com.firearena.max.App
import com.firearena.max.data.api.SpinStatus
import com.firearena.max.ui.common.ErrorBanner
import com.firearena.max.ui.common.LabelField
import com.firearena.max.ui.common.NeonCard
import com.firearena.max.ui.common.NeonHeader
import com.firearena.max.ui.common.PrimaryButton
import com.firearena.max.ui.common.shortErr
import com.firearena.max.ui.theme.NeonCyan
import com.firearena.max.ui.theme.NeonMagenta
import com.firearena.max.ui.theme.NeonOrange
import kotlinx.coroutines.launch

@Composable
fun RewardsScreen(nav: NavHostController) {
    val scope = rememberCoroutineScope()
    val repo = App.instance.container.rewardsRepo

    var status by remember { mutableStateOf<SpinStatus?>(null) }
    var spinning by remember { mutableStateOf(false) }
    var lastWin by remember { mutableStateOf<String?>(null) }
    var error by remember { mutableStateOf<String?>(null) }

    var promoCode by remember { mutableStateOf("") }
    var promoMsg by remember { mutableStateOf<String?>(null) }

    suspend fun refresh() { runCatching { status = repo.spinStatus() }.onFailure { error = it.message?.shortErr() } }
    LaunchedEffect(Unit) { refresh() }

    val rotation = remember { Animatable(0f) }

    Scaffold(topBar = { TopAppBar(title = { Text("Rewards") }, navigationIcon = {
        TextButton(onClick = { nav.popBackStack() }) { Text("Back") }
    }) }) { pv ->
        Column(Modifier.padding(pv).fillMaxSize().verticalScroll(rememberScrollState())) {
            NeonHeader("🎁 Daily Rewards", "Spin the wheel • Keep the streak • Redeem codes")

            Column(Modifier.padding(16.dp)) {
                // Streak badge
                NeonCard {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("🔥", fontSize = 28.sp)
                        Spacer(Modifier.width(10.dp))
                        Column(Modifier.weight(1f)) {
                            Text("${status?.streak ?: 0}-day streak", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                            Text(
                                text = if ((status?.streak ?: 0) > 0)
                                    "Come back every day for streak bonuses every 7 days!"
                                else "Spin today to start your streak.",
                                fontSize = 12.sp, color = Color.Gray,
                            )
                        }
                    }
                }
                Spacer(Modifier.height(16.dp))

                // Spin wheel
                NeonCard {
                    Text("Daily Spin", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                    Spacer(Modifier.height(8.dp))

                    Box(Modifier.fillMaxWidth().height(260.dp), contentAlignment = Alignment.Center) {
                        Canvas(Modifier.size(220.dp)) {
                            val slices = (status?.wheel ?: emptyList()).size.coerceAtLeast(1)
                            rotate(rotation.value) {
                                val sweep = 360f / slices
                                val colors = listOf(NeonOrange, NeonMagenta, NeonCyan)
                                for (i in 0 until slices) {
                                    drawArc(
                                        color = colors[i % colors.size].copy(alpha = 0.9f),
                                        startAngle = i * sweep,
                                        sweepAngle = sweep,
                                        useCenter = true,
                                    )
                                }
                                drawCircle(
                                    brush = Brush.radialGradient(
                                        listOf(Color.White.copy(alpha = 0.18f), Color.Transparent)
                                    ),
                                    radius = size.minDimension / 2.2f,
                                    center = Offset(size.width / 2f, size.height / 2f),
                                )
                            }
                        }
                        Text("🔥", fontSize = 40.sp)
                    }

                    lastWin?.let {
                        Spacer(Modifier.height(8.dp))
                        Surface(color = NeonOrange.copy(alpha = 0.18f), shape = MaterialTheme.shapes.small) {
                            Text(it, Modifier.padding(12.dp), fontWeight = FontWeight.Bold)
                        }
                    }
                    Spacer(Modifier.height(10.dp))
                    ErrorBanner(error)
                    Spacer(Modifier.height(10.dp))
                    PrimaryButton(
                        text = if (status?.canSpin == false) "Come back tomorrow" else "SPIN NOW",
                        enabled = status?.canSpin == true && !spinning,
                        loading = spinning,
                    ) {
                        scope.launch {
                            spinning = true; error = null; lastWin = null
                            try {
                                val targetRot = 360f * 6 + (0..359).random()
                                rotation.snapTo(rotation.value % 360f)
                                rotation.animateTo(
                                    targetRot,
                                    animationSpec = tween(durationMillis = 2600, easing = FastOutSlowInEasing),
                                )
                                val res = repo.spin()
                                lastWin = buildString {
                                    append("+${res.baseReward} 🪙")
                                    if (res.streakBonus > 0) append("  🎉 +${res.streakBonus} streak bonus!")
                                    append("  (streak ${res.streak})")
                                }
                                refresh()
                            } catch (e: Exception) {
                                error = (e.message ?: "Spin failed").shortErr()
                            } finally { spinning = false }
                        }
                    }
                }

                Spacer(Modifier.height(16.dp))

                // Promo codes
                NeonCard {
                    Text("Redeem a promo code", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                    Spacer(Modifier.height(8.dp))
                    LabelField(promoCode, { promoCode = it.uppercase() }, "Code (e.g. WELCOME50)")
                    Spacer(Modifier.height(10.dp))
                    if (promoMsg != null) Text(promoMsg!!, color = MaterialTheme.colorScheme.primary)
                    Spacer(Modifier.height(6.dp))
                    PrimaryButton("Redeem", enabled = promoCode.isNotBlank()) {
                        scope.launch {
                            promoMsg = null; error = null
                            runCatching { repo.redeemPromo(promoCode.trim()) }
                                .onSuccess {
                                    promoMsg = "🎉 +${it.rewardCoins} 🪙 from ${it.code}"
                                    promoCode = ""
                                }
                                .onFailure { error = (it.message ?: "Invalid code").shortErr() }
                        }
                    }
                }
            }
        }
    }
}
