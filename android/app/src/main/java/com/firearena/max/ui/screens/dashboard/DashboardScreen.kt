package com.firearena.max.ui.screens.dashboard

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavHostController
import com.firearena.max.App
import com.firearena.max.data.api.Me
import com.firearena.max.ui.common.NeonCard
import com.firearena.max.ui.common.NeonHeader
import com.firearena.max.ui.nav.Routes
import com.firearena.max.ui.theme.NeonCyan
import com.firearena.max.ui.theme.NeonGreen
import com.firearena.max.ui.theme.NeonMagenta
import com.firearena.max.ui.theme.NeonOrange
import com.firearena.max.ui.theme.TextMuted
import kotlinx.coroutines.launch

@Composable
fun DashboardScreen(nav: NavHostController) {
    val scope = rememberCoroutineScope()
    val container = App.instance.container
    val prefs = container.prefs
    var me by remember { mutableStateOf<Me?>(null) }
    var error by remember { mutableStateOf<String?>(null) }
    var showWelcome by remember { mutableStateOf(!prefs.wasShown("welcome")) }
    var showPromo by remember { mutableStateOf(!prefs.wasShown("vip_promo")) }

    LaunchedEffect(Unit) {
        scope.launch {
            runCatching { container.authRepo.me() }
                .onSuccess { me = it }
                .onFailure { error = it.message }
        }
    }

    if (showWelcome) {
        WelcomeDialog(
            username = me?.displayName ?: me?.username,
            referralCode = me?.referralCode,
            onDismiss = {
                prefs.markShown("welcome"); showWelcome = false
            },
        )
    } else if (showPromo) {
        VipPromoDialog(
            onBuyVip = {
                prefs.markShown("vip_promo"); showPromo = false
                nav.navigate(Routes.Vip)
            },
            onDismiss = {
                prefs.markShown("vip_promo"); showPromo = false
            },
        )
    }

    val roles = me?.roles ?: emptyList()
    val isStaff = roles.any { it in setOf("OWNER","CO_OWNER","ADMIN","FAM_MANAGER","PAYMENT_MANAGER","TOURNAMENT_MANAGER","MODERATOR") }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Fire Arena Max", fontWeight = FontWeight.Black) },
                actions = {
                    IconButton(onClick = { nav.navigate(Routes.Notifications) }) { Text("🔔") }
                    IconButton(onClick = { nav.navigate(Routes.Profile) }) { Text("👤") }
                }
            )
        }
    ) { pv ->
        Column(
            Modifier.padding(pv).fillMaxSize().verticalScroll(rememberScrollState())
        ) {
            NeonHeader(
                title = "Welcome, ${me?.displayName ?: me?.username ?: "Player"}",
                subtitle = "Balance: ${me?.wallet?.balanceCoins ?: 0} 🪙   •   Locked: ${me?.wallet?.lockedCoins ?: 0}"
            )
            Spacer(Modifier.height(16.dp))
            Column(Modifier.padding(horizontal = 16.dp)) {

                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    QuickTile("💰 Wallet", NeonOrange, Modifier.weight(1f)) { nav.navigate(Routes.Wallet) }
                    QuickTile("🏆 Tournaments", NeonCyan, Modifier.weight(1f)) { nav.navigate(Routes.Tournaments) }
                }
                Spacer(Modifier.height(12.dp))
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    QuickTile("💬 Chat", NeonMagenta, Modifier.weight(1f)) { nav.navigate(Routes.ChatList) }
                    QuickTile("👥 Teams", NeonGreen, Modifier.weight(1f)) { nav.navigate(Routes.Teams) }
                }
                Spacer(Modifier.height(12.dp))
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    QuickTile("👑 VIP", NeonOrange, Modifier.weight(1f)) { nav.navigate(Routes.Vip) }
                    QuickTile("🎁 Referrals", NeonGreen, Modifier.weight(1f)) { nav.navigate(Routes.Referrals) }
                }
                Spacer(Modifier.height(12.dp))
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    QuickTile("📊 Leaderboard", NeonCyan, Modifier.weight(1f)) { nav.navigate(Routes.Leaderboard) }
                    if (isStaff) {
                        QuickTile("🛠️ Admin", NeonMagenta, Modifier.weight(1f)) { nav.navigate(Routes.Admin) }
                    } else {
                        Spacer(Modifier.weight(1f))
                    }
                }

                Spacer(Modifier.height(20.dp))
                NeonCard {
                    Text("Your roles", fontWeight = FontWeight.SemiBold)
                    Spacer(Modifier.height(6.dp))
                    Text(if (roles.isEmpty()) "—" else roles.joinToString("  •  "), color = TextMuted, fontSize = 13.sp)
                }
                Spacer(Modifier.height(20.dp))
                if (error != null) Text(error!!, color = MaterialTheme.colorScheme.error)
            }
        }
    }
}

@Composable
private fun QuickTile(title: String, accent: androidx.compose.ui.graphics.Color, modifier: Modifier, onClick: () -> Unit) {
    Surface(
        onClick = onClick,
        modifier = modifier.height(88.dp),
        shape = RoundedCornerShape(14.dp),
        color = MaterialTheme.colorScheme.surface,
        tonalElevation = 2.dp,
    ) {
        Box(
            Modifier.fillMaxSize()
                .background(accent.copy(alpha = 0.10f))
                .clip(RoundedCornerShape(14.dp))
        ) {
            Box(Modifier.padding(16.dp).align(Alignment.CenterStart)) {
                Text(title, color = accent, fontWeight = FontWeight.Bold, fontSize = 16.sp)
            }
        }
    }
}

@Composable
private fun WelcomeDialog(username: String?, referralCode: String?, onDismiss: () -> Unit) {
    AlertDialog(
        onDismissRequest = onDismiss,
        confirmButton = {
            TextButton(onClick = onDismiss) { Text("Let's play") }
        },
        icon = { Text("🔥", fontSize = 34.sp) },
        title = { Text("Welcome${if (username != null) ", $username" else ""}!", fontWeight = FontWeight.Black) },
        text = {
            Column {
                Text("You're in. Here's what you can do right now:")
                Spacer(Modifier.height(8.dp))
                Text("• Deposit via Razorpay or UPI — 1 coin = ₹1")
                Text("• Join tournaments, climb the leaderboard")
                Text("• Chat with clans, join VIP for extra perks")
                Spacer(Modifier.height(10.dp))
                if (!referralCode.isNullOrBlank()) {
                    Surface(color = NeonOrange.copy(alpha = 0.15f), shape = RoundedCornerShape(10.dp)) {
                        Column(Modifier.padding(12.dp)) {
                            Text("Your referral code", color = TextMuted, fontSize = 12.sp)
                            Text(referralCode, fontWeight = FontWeight.Black, color = NeonOrange, fontSize = 18.sp)
                            Text("Share it — you earn 10 🪙 once your friend deposits ₹100.", color = TextMuted, fontSize = 12.sp)
                        }
                    }
                }
            }
        }
    )
}

@Composable
private fun VipPromoDialog(onBuyVip: () -> Unit, onDismiss: () -> Unit) {
    AlertDialog(
        onDismissRequest = onDismiss,
        confirmButton = {
            Button(
                onClick = onBuyVip,
                colors = ButtonDefaults.buttonColors(containerColor = NeonMagenta, contentColor = androidx.compose.ui.graphics.Color.White),
            ) { Text("See VIP plans", fontWeight = FontWeight.Bold) }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Maybe later") } },
        icon = { Text("👑", fontSize = 34.sp) },
        title = { Text("Go VIP, win bigger", fontWeight = FontWeight.Black) },
        text = {
            Column {
                Text("VIP members unlock higher prize pools, exclusive tournaments, VIP chat & priority support.")
                Spacer(Modifier.height(8.dp))
                Text("Weekly from ₹49 · Monthly from ₹149", color = NeonOrange, fontWeight = FontWeight.Bold)
            }
        }
    )
}
