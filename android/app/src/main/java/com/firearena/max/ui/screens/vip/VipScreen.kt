package com.firearena.max.ui.screens.vip

import android.app.Activity
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavHostController
import com.firearena.max.App
import com.firearena.max.data.PaymentBus
import com.firearena.max.data.PaymentResult
import com.firearena.max.data.api.VipPlan
import com.firearena.max.data.api.VipStatus
import com.firearena.max.ui.common.ErrorBanner
import com.firearena.max.ui.common.NeonHeader
import com.firearena.max.ui.common.shortErr
import com.firearena.max.ui.theme.NeonCyan
import com.firearena.max.ui.theme.NeonGreen
import com.firearena.max.ui.theme.NeonMagenta
import com.firearena.max.ui.theme.NeonOrange
import com.firearena.max.ui.theme.TextMuted
import com.razorpay.Checkout
import kotlinx.coroutines.flow.filter
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import org.json.JSONObject

@Composable
fun VipScreen(nav: NavHostController) {
    val scope = rememberCoroutineScope()
    val container = App.instance.container
    val ctx = LocalContext.current

    var plans by remember { mutableStateOf<List<VipPlan>>(emptyList()) }
    var status by remember { mutableStateOf<VipStatus?>(null) }
    var error by remember { mutableStateOf<String?>(null) }
    var message by remember { mutableStateOf<String?>(null) }
    var busyPlan by remember { mutableStateOf<String?>(null) }

    suspend fun refresh() {
        runCatching { plans = container.vipRepo.plans() }
        runCatching { status = container.vipRepo.status() }
    }
    LaunchedEffect(Unit) { refresh() }

    Scaffold(topBar = {
        TopAppBar(title = { Text("VIP") }, navigationIcon = {
            TextButton(onClick = { nav.popBackStack() }) { Text("Back") }
        })
    }) { pv ->
        Column(
            Modifier.padding(pv).fillMaxSize().verticalScroll(rememberScrollState())
        ) {
            NeonHeader(
                "👑 VIP Membership",
                if (status?.active == true) "Active until ${status?.subscription?.expiresAt?.take(10)}"
                else "Unlock exclusive tournaments, VIP chat & bonus rewards"
            )
            Column(Modifier.padding(16.dp)) {
                if (error != null) ErrorBanner(error)
                if (message != null) {
                    Spacer(Modifier.height(8.dp))
                    Text(message!!, color = NeonGreen, fontWeight = FontWeight.Bold)
                }
                Spacer(Modifier.height(8.dp))
                if (status?.active == true) {
                    ActiveVipBanner(expiresAt = status?.subscription?.expiresAt?.take(10) ?: "")
                    Spacer(Modifier.height(16.dp))
                }
                Text("Choose a plan", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                Spacer(Modifier.height(10.dp))
                plans.forEach { plan ->
                    VipPlanCard(
                        plan = plan,
                        highlight = plan.code.equals("MONTHLY", ignoreCase = true),
                        busyRazorpay = busyPlan == "${plan.code}:rzp",
                        busyWallet = busyPlan == "${plan.code}:wallet",
                        onBuyRazorpay = {
                            error = null; message = null; busyPlan = "${plan.code}:rzp"
                            scope.launch {
                                try {
                                    val order = container.paymentRepo.createRazorpayVipOrder(plan.code)
                                    PaymentBus.pendingOrderId = order.orderId
                                    val activity = ctx as? Activity
                                        ?: run { busyPlan = null; return@launch }
                                    val co = Checkout().apply { setKeyID(order.keyId) }
                                    val opts = JSONObject().apply {
                                        put("name", "Fire Arena Max")
                                        put("description", "${plan.title} · ${plan.durationDays} days")
                                        put("currency", order.currency)
                                        put("amount", order.amountCoins * 100)
                                        put("order_id", order.orderId)
                                        put("theme", JSONObject().put("color", "#E100FF"))
                                        put("send_sms_hash", true)
                                    }
                                    co.open(activity, opts)
                                    val result = PaymentBus.results
                                        .filter { r ->
                                            when (r) {
                                                is PaymentResult.Success -> r.orderId == order.orderId
                                                is PaymentResult.Error -> r.orderId == order.orderId
                                                is PaymentResult.Cancelled -> r.orderId == order.orderId
                                            }
                                        }
                                        .first()
                                    when (result) {
                                        is PaymentResult.Success -> {
                                            val v = container.paymentRepo.verifyRazorpay(
                                                result.orderId, result.paymentId, result.signature
                                            )
                                            if (v.ok) {
                                                message = "VIP unlocked — ${plan.title}!"
                                                refresh()
                                            } else error = "Verification failed"
                                        }
                                        is PaymentResult.Cancelled -> message = "Cancelled"
                                        is PaymentResult.Error -> error = "Payment failed: ${result.description}"
                                    }
                                } catch (e: Exception) {
                                    error = (e.message ?: "failed").shortErr()
                                } finally { busyPlan = null }
                            }
                        },
                        onBuyWithWallet = {
                            error = null; message = null; busyPlan = "${plan.code}:wallet"
                            scope.launch {
                                runCatching { container.vipRepo.purchase(plan.code) }
                                    .onSuccess { sub ->
                                        message = "VIP unlocked — active until ${sub.expiresAt.take(10)}"
                                        refresh()
                                    }
                                    .onFailure { error = (it.message ?: "failed").shortErr() }
                                busyPlan = null
                            }
                        },
                    )
                    Spacer(Modifier.height(14.dp))
                }
                Spacer(Modifier.height(12.dp))
                Text("VIP perks", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                Spacer(Modifier.height(6.dp))
                val perks = listOf(
                    "VIP-only tournaments with larger prize pools",
                    "Access to #vip chat channel",
                    "Golden username + VIP badge",
                    "Priority support in #support",
                    "Early access to new events and drops",
                )
                perks.forEach { Text("• $it", color = TextMuted); Spacer(Modifier.height(4.dp)) }
                Spacer(Modifier.height(24.dp))
            }
        }
    }
}

@Composable
private fun ActiveVipBanner(expiresAt: String) {
    val glow = rememberInfiniteTransition(label = "active-vip").animateFloat(
        initialValue = 0.4f, targetValue = 1f,
        animationSpec = infiniteRepeatable(tween(1400, easing = FastOutSlowInEasing), RepeatMode.Reverse),
        label = "glow",
    )
    Surface(
        shape = RoundedCornerShape(14.dp),
        color = Color.Transparent,
        modifier = Modifier.fillMaxWidth()
    ) {
        Box(
            Modifier.fillMaxWidth()
                .clip(RoundedCornerShape(14.dp))
                .background(Brush.horizontalGradient(listOf(
                    NeonOrange.copy(alpha = 0.35f * glow.value),
                    NeonMagenta.copy(alpha = 0.35f * glow.value),
                )))
                .border(1.dp, NeonGreen.copy(alpha = glow.value), RoundedCornerShape(14.dp))
                .padding(16.dp)
        ) {
            Column {
                Text("✨ VIP active", fontWeight = FontWeight.Black, fontSize = 18.sp, color = NeonGreen)
                Text("Expires $expiresAt", color = Color.White)
            }
        }
    }
}

@Composable
private fun VipPlanCard(
    plan: VipPlan,
    highlight: Boolean,
    busyRazorpay: Boolean,
    busyWallet: Boolean,
    onBuyRazorpay: () -> Unit,
    onBuyWithWallet: () -> Unit,
) {
    val infiniteTransition = rememberInfiniteTransition(label = "vip-plan-${plan.code}")
    val shimmer = infiniteTransition.animateFloat(
        initialValue = 0f, targetValue = 1f,
        animationSpec = infiniteRepeatable(tween(2800, easing = LinearEasing)),
        label = "shimmer",
    )
    val borderColor = if (highlight) NeonMagenta else NeonCyan
    Box(
        Modifier.fillMaxWidth()
            .clip(RoundedCornerShape(18.dp))
            .background(
                Brush.linearGradient(
                    colors = listOf(
                        Color(0xFF16182A),
                        Color(0xFF1D1F34).copy(alpha = 0.9f),
                        Color(0xFF16182A),
                    ),
                    start = androidx.compose.ui.geometry.Offset(0f, 0f),
                    end = androidx.compose.ui.geometry.Offset(1000f * shimmer.value, 1000f),
                )
            )
            .border(1.5.dp, borderColor.copy(alpha = 0.75f), RoundedCornerShape(18.dp))
            .padding(18.dp)
    ) {
        Column {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("👑", fontSize = 22.sp)
                Spacer(Modifier.width(8.dp))
                Text(plan.title, fontWeight = FontWeight.Black, fontSize = 18.sp, color = Color.White)
                Spacer(Modifier.weight(1f))
                if (highlight) {
                    Surface(shape = RoundedCornerShape(50), color = NeonMagenta.copy(alpha = 0.2f)) {
                        Text(
                            "BEST VALUE",
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                            color = NeonMagenta, fontSize = 10.sp, fontWeight = FontWeight.Bold,
                        )
                    }
                }
            }
            Spacer(Modifier.height(6.dp))
            Row(verticalAlignment = Alignment.Bottom) {
                Text("₹${plan.priceCoins}", fontWeight = FontWeight.Black, fontSize = 32.sp, color = NeonOrange)
                Spacer(Modifier.width(6.dp))
                Text("for ${plan.durationDays} days", color = TextMuted, fontSize = 13.sp)
            }
            Spacer(Modifier.height(4.dp))
            Text("${plan.priceCoins} 🪙 · auto-activates on payment", color = TextMuted, fontSize = 12.sp)
            Spacer(Modifier.height(14.dp))
            Button(
                onClick = onBuyRazorpay,
                enabled = !busyRazorpay && !busyWallet,
                modifier = Modifier.fillMaxWidth().height(48.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = NeonMagenta, contentColor = Color.White),
            ) {
                if (busyRazorpay) {
                    CircularProgressIndicator(Modifier.size(20.dp), strokeWidth = 2.dp, color = Color.White)
                } else {
                    Text("Pay ₹${plan.priceCoins} with Razorpay", fontWeight = FontWeight.Bold)
                }
            }
            Spacer(Modifier.height(8.dp))
            OutlinedButton(
                onClick = onBuyWithWallet,
                enabled = !busyRazorpay && !busyWallet,
                modifier = Modifier.fillMaxWidth().height(44.dp),
                shape = RoundedCornerShape(12.dp),
            ) {
                if (busyWallet) {
                    CircularProgressIndicator(Modifier.size(18.dp), strokeWidth = 2.dp)
                } else {
                    Text("Use wallet — ${plan.priceCoins} 🪙")
                }
            }
        }
    }
}
