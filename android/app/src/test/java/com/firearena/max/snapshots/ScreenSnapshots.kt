package com.firearena.max.snapshots

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.firearena.max.ui.common.EmptyState
import com.firearena.max.ui.common.ErrorBanner
import com.firearena.max.ui.common.LabelField
import com.firearena.max.ui.common.NeonCard
import com.firearena.max.ui.common.NeonHeader
import com.firearena.max.ui.common.PrimaryButton
import com.firearena.max.ui.theme.BgDeep
import com.firearena.max.ui.theme.BgSurface
import com.firearena.max.ui.theme.BgSurfaceHi
import com.firearena.max.ui.theme.Danger
import com.firearena.max.ui.theme.FireArenaMaxTheme
import com.firearena.max.ui.theme.NeonCyan
import com.firearena.max.ui.theme.NeonGreen
import com.firearena.max.ui.theme.NeonMagenta
import com.firearena.max.ui.theme.NeonOrange
import com.firearena.max.ui.theme.TextMuted
import org.junit.Rule
import org.junit.Test

/**
 * Offline screen rendering for the gallery preview the user requested.
 *
 * These are NOT functional tests — they render preview-friendly variants of
 * each major screen with hard-coded mock data so reviewers can see the UI
 * without needing an emulator or running backend.
 *
 * Run with: `./gradlew :app:recordPaparazziDebug`
 * Output:    app/src/test/snapshots/images/ (PNG per @Test)
 */
class ScreenSnapshots {
    @get:Rule
    val paparazzi = Paparazzi(
        deviceConfig = DeviceConfig.PIXEL_5.copy(
            screenHeight = 1920,
            softButtons = false,
            nightMode = com.android.resources.NightMode.NIGHT,
        ),
        showSystemUi = false,
    )

    private fun stage(content: @Composable () -> Unit) {
        paparazzi.snapshot {
            FireArenaMaxTheme {
                Surface(color = BgDeep, modifier = Modifier.fillMaxSize()) {
                    content()
                }
            }
        }
    }

    @Test fun `01 login`() = stage { LoginPreview() }
    @Test fun `02 register`() = stage { RegisterPreview() }
    @Test fun `03 dashboard`() = stage { DashboardPreview() }
    @Test fun `04 wallet`() = stage { WalletPreview() }
    @Test fun `05 deposit`() = stage { DepositPreview() }
    @Test fun `06 withdraw`() = stage { WithdrawPreview() }
    @Test fun `07 tournaments`() = stage { TournamentsPreview() }
    @Test fun `08 tournament_detail`() = stage { TournamentDetailPreview() }
    @Test fun `09 vip`() = stage { VipPreview() }
    @Test fun `10 rewards_spin`() = stage { RewardsPreview() }
    @Test fun `11 chat_list`() = stage { ChatListPreview() }
    @Test fun `12 chat_channel`() = stage { ChatChannelPreview() }
    @Test fun `13 teams`() = stage { TeamsPreview() }
    @Test fun `14 referrals`() = stage { ReferralsPreview() }
    @Test fun `15 leaderboard`() = stage { LeaderboardPreview() }
    @Test fun `16 notifications`() = stage { NotificationsPreview() }
    @Test fun `17 profile`() = stage { ProfilePreview() }
    @Test fun `18 admin_dashboard`() = stage { AdminPreview() }
    @Test fun `19 admin_create_tournament`() = stage { AdminCreateTournamentPreview() }
    @Test fun `20 admin_pending_payments`() = stage { AdminPendingPaymentsPreview() }
}

// ---------- Reusable mock helpers ----------

@Composable
private fun ScreenScaffold(title: String, content: @Composable ColumnScope.() -> Unit) {
    Scaffold(
        topBar = {
            TopAppBar(title = { Text(title, fontWeight = FontWeight.Black) })
        },
        containerColor = BgDeep,
    ) { pv ->
        Column(
            Modifier.padding(pv).fillMaxSize().verticalScroll(rememberScrollState()),
            content = content
        )
    }
}

@Composable
private fun NeonTile(label: String, color: Color, modifier: Modifier = Modifier) {
    Box(
        modifier
            .height(96.dp)
            .clip(RoundedCornerShape(16.dp))
            .background(
                Brush.linearGradient(listOf(color.copy(alpha = 0.30f), color.copy(alpha = 0.10f)))
            )
            .border(1.dp, color.copy(alpha = 0.55f), RoundedCornerShape(16.dp)),
        contentAlignment = Alignment.Center,
    ) {
        Text(label, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
    }
}

@Composable
private fun StatChip(label: String, value: String, color: Color) {
    Box(
        Modifier.clip(RoundedCornerShape(12.dp))
            .background(color.copy(alpha = 0.12f))
            .border(1.dp, color.copy(alpha = 0.35f), RoundedCornerShape(12.dp))
            .padding(horizontal = 14.dp, vertical = 10.dp)
    ) {
        Column {
            Text(label, color = TextMuted, fontSize = 11.sp)
            Text(value, color = Color.White, fontWeight = FontWeight.Black, fontSize = 18.sp)
        }
    }
}

// ---------- Login ----------
@Composable
private fun LoginPreview() {
    Column(Modifier.fillMaxSize().padding(24.dp), verticalArrangement = Arrangement.Center) {
        Text("🔥 FIRE ARENA MAX", color = NeonOrange, fontWeight = FontWeight.Black, fontSize = 28.sp)
        Spacer(Modifier.height(6.dp))
        Text("Sign in to enter the arena", fontSize = 14.sp, color = TextMuted)
        Spacer(Modifier.height(24.dp))
        NeonCard {
            LabelField("zenus_carlos", {}, "Email or username")
            Spacer(Modifier.height(12.dp))
            LabelField("••••••••••", {}, "Password", isPassword = true)
            Spacer(Modifier.height(16.dp))
            PrimaryButton("Login") {}
        }
        Spacer(Modifier.height(20.dp))
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            HorizontalDivider(modifier = Modifier.weight(1f))
            Text("or continue with", fontSize = 12.sp, color = TextMuted)
            HorizontalDivider(modifier = Modifier.weight(1f))
        }
        Spacer(Modifier.height(12.dp))
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            OutlinedButton(onClick = {}, modifier = Modifier.weight(1f).height(48.dp)) { Text("🔑 Google") }
            OutlinedButton(onClick = {}, modifier = Modifier.weight(1f).height(48.dp)) { Text("🎮 Discord") }
        }
        Spacer(Modifier.height(16.dp))
        TextButton(onClick = {}, modifier = Modifier.fillMaxWidth()) {
            Text("New player? Create an account →", color = NeonCyan)
        }
    }
}

// ---------- Register ----------
@Composable
private fun RegisterPreview() {
    Column(Modifier.fillMaxSize().padding(24.dp), verticalArrangement = Arrangement.Center) {
        Text("Create account", color = NeonOrange, fontWeight = FontWeight.Black, fontSize = 26.sp)
        Spacer(Modifier.height(20.dp))
        NeonCard {
            LabelField("rohan_op", {}, "Username")
            Spacer(Modifier.height(10.dp))
            LabelField("rohan@example.com", {}, "Email")
            Spacer(Modifier.height(10.dp))
            LabelField("Rohan Sharma", {}, "Display name")
            Spacer(Modifier.height(10.dp))
            LabelField("FAM-ZENUS-7K2", {}, "Referral code (optional)")
            Spacer(Modifier.height(10.dp))
            LabelField("••••••••••", {}, "Password", isPassword = true)
            Spacer(Modifier.height(16.dp))
            PrimaryButton("Create account") {}
        }
    }
}

// ---------- Dashboard ----------
@Composable
private fun DashboardPreview() {
    ScreenScaffold("Fire Arena Max") {
        NeonHeader(
            title = "Welcome, Zenus_Carlos",
            subtitle = "Balance: 12,450 🪙   •   Locked: 250"
        )
        Spacer(Modifier.height(16.dp))
        Column(Modifier.padding(horizontal = 16.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                NeonTile("💰 Wallet", NeonOrange, Modifier.weight(1f))
                NeonTile("🏆 Tournaments", NeonCyan, Modifier.weight(1f))
            }
            Spacer(Modifier.height(12.dp))
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                NeonTile("💬 Chat", NeonMagenta, Modifier.weight(1f))
                NeonTile("👥 Teams", NeonGreen, Modifier.weight(1f))
            }
            Spacer(Modifier.height(12.dp))
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                NeonTile("👑 VIP", NeonOrange, Modifier.weight(1f))
                NeonTile("🎁 Rewards", NeonMagenta, Modifier.weight(1f))
            }
            Spacer(Modifier.height(12.dp))
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                NeonTile("🤝 Referrals", NeonGreen, Modifier.weight(1f))
                NeonTile("🔔 Alerts", NeonCyan, Modifier.weight(1f))
            }
            Spacer(Modifier.height(20.dp))
            NeonCard {
                Text("⚡ Live: BGMI Squad Cup #42", color = NeonCyan, fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(4.dp))
                Text("Slots 78/100  •  Entry 50 🪙  •  Prize 4,000 🪙", color = TextMuted, fontSize = 12.sp)
                Spacer(Modifier.height(10.dp))
                PrimaryButton("Join now") {}
            }
        }
    }
}

// ---------- Wallet ----------
@Composable
private fun WalletPreview() {
    ScreenScaffold("Wallet") {
        NeonHeader(title = "12,450 🪙", subtitle = "Locked: 250  •  Lifetime deposit: 18,500")
        Spacer(Modifier.height(12.dp))
        Row(Modifier.fillMaxWidth().padding(horizontal = 16.dp), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            NeonTile("⬇ Deposit", NeonGreen, Modifier.weight(1f))
            NeonTile("⬆ Withdraw", NeonOrange, Modifier.weight(1f))
        }
        Spacer(Modifier.height(16.dp))
        Text("Recent transactions", color = TextMuted, fontSize = 12.sp, modifier = Modifier.padding(start = 16.dp))
        Spacer(Modifier.height(8.dp))
        listOf(
            Triple("DEPOSIT", "Razorpay deposit", 500),
            Triple("TOURNAMENT_PRIZE", "BGMI Cup #42 prize", 1500),
            Triple("SPIN_REWARD", "Daily spin", 25),
            Triple("STREAK_BONUS", "7-day streak", 20),
            Triple("ENTRY_FEE", "Free Fire Solo Cup #11", -50),
            Triple("WITHDRAW", "UPI withdrawal", -1200),
            Triple("PROMO_REWARD", "WELCOME100", 100),
        ).forEachIndexed { i, t ->
            val (kind, note, delta) = t
            val plus = delta > 0
            Row(
                Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 6.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column(Modifier.weight(1f)) {
                    Text(note, color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                    Text(kind, color = TextMuted, fontSize = 11.sp)
                }
                Text(
                    (if (plus) "+" else "") + "$delta 🪙",
                    color = if (plus) NeonGreen else Danger,
                    fontWeight = FontWeight.Bold,
                )
            }
            if (i < 6) HorizontalDivider(color = BgSurfaceHi)
        }
    }
}

// ---------- Deposit ----------
@Composable
private fun DepositPreview() {
    ScreenScaffold("Deposit") {
        Column(Modifier.padding(16.dp)) {
            NeonCard {
                Text("Razorpay (Cards / UPI / NetBanking)", fontWeight = FontWeight.Bold, color = NeonCyan)
                Spacer(Modifier.height(8.dp))
                LabelField("500", {}, "Amount in ₹")
                Spacer(Modifier.height(12.dp))
                PrimaryButton("Pay ₹500 with Razorpay") {}
                Spacer(Modifier.height(6.dp))
                Text("✓ Wallet credited automatically on success", color = NeonGreen, fontSize = 12.sp)
            }
            Spacer(Modifier.height(16.dp))
            NeonCard {
                Text("Manual UPI", fontWeight = FontWeight.Bold, color = NeonMagenta)
                Spacer(Modifier.height(6.dp))
                Text("Send to: firearena@upi", color = TextMuted, fontSize = 13.sp)
                Spacer(Modifier.height(10.dp))
                LabelField("250", {}, "Amount paid (₹)")
                Spacer(Modifier.height(8.dp))
                LabelField("UTR1234567890", {}, "12-digit UTR / Reference no.")
                Spacer(Modifier.height(12.dp))
                PrimaryButton("Submit for approval") {}
                Spacer(Modifier.height(6.dp))
                Text("Approval typically within 10 minutes", color = TextMuted, fontSize = 11.sp)
            }
        }
    }
}

// ---------- Withdraw ----------
@Composable
private fun WithdrawPreview() {
    ScreenScaffold("Withdraw") {
        Column(Modifier.padding(16.dp)) {
            NeonCard {
                Row { StatChip("Available", "12,200 🪙", NeonGreen); Spacer(Modifier.width(10.dp)); StatChip("Locked", "250", NeonOrange) }
                Spacer(Modifier.height(16.dp))
                LabelField("1500", {}, "Amount in coins (min 100)")
                Spacer(Modifier.height(10.dp))
                LabelField("zenus@upi", {}, "UPI ID")
                Spacer(Modifier.height(10.dp))
                LabelField("Mohammad Raj", {}, "Account holder name (optional)")
                Spacer(Modifier.height(14.dp))
                PrimaryButton("Request withdrawal") {}
                Spacer(Modifier.height(6.dp))
                Text("Coins are locked until admin approval. 24h SLA.", color = TextMuted, fontSize = 11.sp)
            }
        }
    }
}

// ---------- Tournaments ----------
@Composable
private fun TournamentsPreview() {
    ScreenScaffold("Tournaments") {
        Column(Modifier.padding(16.dp)) {
            listOf(
                Triple("BGMI Squad Cup #42", "Slots 78/100 • Entry 50 🪙 • Prize 4,000 🪙", "OPEN"),
                Triple("Free Fire Solo #11", "Slots 100/100 • Entry 25 🪙 • Prize 2,000 🪙", "FULL"),
                Triple("COD Mobile Duo Showdown", "Slots 14/40 • Entry 100 🪙 • Prize 3,500 🪙", "OPEN"),
                Triple("VIP-only Invite Cup", "Slots 4/16 • Entry 250 🪙 • Prize 3,750 🪙 👑", "VIP"),
                Triple("Apex Mobile Trios #5", "Match closed • Results pending", "ENDED"),
            ).forEach { (title, sub, badge) ->
                NeonCard {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Column(Modifier.weight(1f)) {
                            Text(title, color = Color.White, fontWeight = FontWeight.Bold)
                            Spacer(Modifier.height(4.dp))
                            Text(sub, color = TextMuted, fontSize = 12.sp)
                        }
                        Box(
                            Modifier.clip(RoundedCornerShape(8.dp))
                                .background(when (badge) { "OPEN" -> NeonGreen.copy(alpha = .15f); "VIP" -> NeonOrange.copy(alpha = .18f); else -> Color.Gray.copy(alpha = .15f) })
                                .padding(horizontal = 10.dp, vertical = 6.dp)
                        ) {
                            Text(badge, color = when (badge) { "OPEN" -> NeonGreen; "VIP" -> NeonOrange; else -> TextMuted }, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
                Spacer(Modifier.height(10.dp))
            }
        }
    }
}

// ---------- Tournament detail ----------
@Composable
private fun TournamentDetailPreview() {
    ScreenScaffold("BGMI Squad Cup #42") {
        Column(Modifier.padding(16.dp)) {
            NeonCard {
                Text("Schedule", color = NeonCyan, fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(4.dp))
                Text("Sat, 27 Apr 2026 • 8:00 PM IST", color = TextMuted, fontSize = 13.sp)
                Spacer(Modifier.height(10.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    StatChip("Entry", "50 🪙", NeonOrange)
                    StatChip("Prize", "4,000 🪙", NeonGreen)
                    StatChip("Slots", "78/100", NeonCyan)
                }
            }
            Spacer(Modifier.height(12.dp))
            NeonCard {
                Text("Match info", color = NeonMagenta, fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(6.dp))
                Text("Room ID:  ████ ████  (visible after admin publishes)", color = TextMuted, fontSize = 12.sp)
                Text("Password: ██████", color = TextMuted, fontSize = 12.sp)
            }
            Spacer(Modifier.height(12.dp))
            PrimaryButton("Join for 50 🪙") {}
            Spacer(Modifier.height(8.dp))
            OutlinedButton(onClick = {}, modifier = Modifier.fillMaxWidth().height(48.dp)) { Text("View participants") }
        }
    }
}

// ---------- VIP ----------
@Composable
private fun VipPreview() {
    ScreenScaffold("VIP Subscription") {
        Column(Modifier.padding(16.dp)) {
            // Active VIP banner
            Box(
                Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp))
                    .background(Brush.horizontalGradient(listOf(NeonOrange.copy(alpha = .35f), NeonMagenta.copy(alpha = .35f))))
                    .border(1.dp, NeonOrange, RoundedCornerShape(16.dp))
                    .padding(16.dp)
            ) {
                Column {
                    Text("👑  VIP MONTHLY active", color = Color.White, fontWeight = FontWeight.Black, fontSize = 18.sp)
                    Spacer(Modifier.height(4.dp))
                    Text("Renews 12 days from now", color = TextMuted, fontSize = 12.sp)
                }
            }
            Spacer(Modifier.height(16.dp))
            VipPlanCard("VIP WEEKLY", "₹99", "7 days", listOf("Exclusive chat", "Daily spin x2"), NeonCyan, false)
            Spacer(Modifier.height(12.dp))
            VipPlanCard("VIP MONTHLY", "₹299", "30 days", listOf("All weekly perks", "VIP-only tournaments", "Priority support"), NeonOrange, true)
            Spacer(Modifier.height(12.dp))
            VipPlanCard("VIP QUARTERLY", "₹799", "90 days", listOf("All monthly perks", "Custom badge", "Early features"), NeonMagenta, false)
        }
    }
}

@Composable
private fun VipPlanCard(name: String, price: String, duration: String, perks: List<String>, accent: Color, best: Boolean) {
    Box(
        Modifier.fillMaxWidth().clip(RoundedCornerShape(18.dp))
            .background(Brush.linearGradient(listOf(accent.copy(alpha = .14f), BgSurface)))
            .border(1.dp, accent.copy(alpha = .55f), RoundedCornerShape(18.dp))
    ) {
        Column(Modifier.padding(18.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(name, color = Color.White, fontWeight = FontWeight.Black, fontSize = 18.sp)
                Spacer(Modifier.weight(1f))
                if (best) Box(Modifier.clip(RoundedCornerShape(8.dp)).background(NeonOrange).padding(horizontal = 8.dp, vertical = 4.dp)) {
                    Text("BEST VALUE", color = Color.Black, fontWeight = FontWeight.Black, fontSize = 10.sp)
                }
            }
            Spacer(Modifier.height(4.dp))
            Row(verticalAlignment = Alignment.Bottom) {
                Text(price, color = accent, fontWeight = FontWeight.Black, fontSize = 32.sp)
                Spacer(Modifier.width(8.dp))
                Text("/ $duration", color = TextMuted, fontSize = 13.sp)
            }
            Spacer(Modifier.height(10.dp))
            perks.forEach { Text("• $it", color = Color.White.copy(alpha = .85f), fontSize = 13.sp) }
            Spacer(Modifier.height(14.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Button(onClick = {}, modifier = Modifier.weight(1f).height(46.dp), shape = RoundedCornerShape(12.dp)) { Text("Buy via Razorpay") }
                OutlinedButton(onClick = {}, modifier = Modifier.weight(1f).height(46.dp), shape = RoundedCornerShape(12.dp)) { Text("Pay with Coins") }
            }
        }
    }
}

// ---------- Rewards (daily spin) ----------
@Composable
private fun RewardsPreview() {
    ScreenScaffold("Daily Rewards") {
        Column(Modifier.padding(16.dp)) {
            Box(
                Modifier.fillMaxWidth().height(280.dp)
                    .clip(RoundedCornerShape(20.dp))
                    .background(Brush.radialGradient(listOf(NeonMagenta.copy(alpha = .35f), BgDeep)))
                    .border(2.dp, NeonMagenta.copy(alpha = .6f), RoundedCornerShape(20.dp)),
                contentAlignment = Alignment.Center,
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("🎰", fontSize = 64.sp)
                    Spacer(Modifier.height(8.dp))
                    Text("DAILY SPIN", color = Color.White, fontWeight = FontWeight.Black, fontSize = 22.sp)
                    Text("Win up to 100 🪙", color = TextMuted, fontSize = 13.sp)
                }
            }
            Spacer(Modifier.height(16.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                StatChip("Streak", "5 days", NeonGreen)
                StatChip("Next bonus", "+20 in 2 days", NeonOrange)
                StatChip("Last spin", "+12 🪙", NeonCyan)
            }
            Spacer(Modifier.height(16.dp))
            PrimaryButton("Spin now") {}
            Spacer(Modifier.height(20.dp))
            NeonCard {
                Text("Promo code", color = NeonCyan, fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(8.dp))
                LabelField("WELCOME100", {}, "Code")
                Spacer(Modifier.height(10.dp))
                PrimaryButton("Redeem") {}
            }
        }
    }
}

// ---------- Chat list ----------
@Composable
private fun ChatListPreview() {
    ScreenScaffold("Chat") {
        Column(Modifier.padding(16.dp)) {
            listOf(
                Triple("🌍 Global", "Anyone can post • 1.2k online", NeonCyan),
                Triple("👑 VIP Lounge", "VIPs only • 142 online", NeonOrange),
                Triple("🛡 Support", "FAM team replies in <10m", NeonGreen),
                Triple("👥 Team: Alpha Wolves", "5 members • Last: GG!", NeonMagenta),
                Triple("✉ Private: ProGamer42", "you: catch you in the lobby", NeonCyan),
            ).forEach { (name, sub, c) ->
                NeonCard {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(Modifier.size(40.dp).clip(RoundedCornerShape(20.dp)).background(c.copy(alpha = .25f)))
                        Spacer(Modifier.width(12.dp))
                        Column(Modifier.weight(1f)) {
                            Text(name, color = Color.White, fontWeight = FontWeight.Bold)
                            Text(sub, color = TextMuted, fontSize = 12.sp)
                        }
                    }
                }
                Spacer(Modifier.height(10.dp))
            }
        }
    }
}

// ---------- Chat channel ----------
@Composable
private fun ChatChannelPreview() {
    ScreenScaffold("🌍 Global  ·  live") {
        Column(Modifier.fillMaxSize().padding(horizontal = 12.dp)) {
            Spacer(Modifier.height(8.dp))
            data class Msg(val who: String, val text: String, val mine: Boolean = false)
            val msgs = listOf(
                Msg("Zenus_Carlos 👑", "Squad cup at 8pm, who's in?"),
                Msg("ProGamer42", "Team Alpha is locked in 🔥"),
                Msg("rohan_op", "Need 1 more, dm me"),
                Msg("Lol Gamer", "Joined 🎮", mine = true),
                Msg("KillStreak", "GLHF everyone"),
                Msg("ModBot", "Reminder: no toxicity. ✋"),
            )
            msgs.forEach { m ->
                Row(Modifier.fillMaxWidth().padding(vertical = 4.dp),
                    horizontalArrangement = if (m.mine) Arrangement.End else Arrangement.Start) {
                    Box(
                        Modifier.clip(RoundedCornerShape(14.dp))
                            .background(if (m.mine) NeonOrange.copy(alpha = .25f) else BgSurfaceHi)
                            .padding(horizontal = 12.dp, vertical = 8.dp)
                    ) {
                        Column {
                            if (!m.mine) Text(m.who, color = NeonCyan, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            Text(m.text, color = Color.White, fontSize = 14.sp)
                        }
                    }
                }
            }
            Spacer(Modifier.weight(1f))
            Row(Modifier.fillMaxWidth().padding(vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) {
                OutlinedTextField(value = "Type a message…", onValueChange = {}, modifier = Modifier.weight(1f))
                Spacer(Modifier.width(8.dp))
                Button(onClick = {}, modifier = Modifier.height(48.dp)) { Text("Send") }
            }
        }
    }
}

// ---------- Teams ----------
@Composable
private fun TeamsPreview() {
    ScreenScaffold("Teams") {
        Column(Modifier.padding(16.dp)) {
            NeonCard {
                Text("My Team — Alpha Wolves", color = NeonOrange, fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(6.dp))
                Text("Captain: Zenus_Carlos  •  5 / 6 members", color = TextMuted, fontSize = 12.sp)
                Spacer(Modifier.height(10.dp))
                listOf("Zenus_Carlos 👑", "ProGamer42", "rohan_op", "KillStreak", "Sniper_X").forEach {
                    Text("• $it", color = Color.White, fontSize = 14.sp)
                }
                Spacer(Modifier.height(10.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedButton(onClick = {}, modifier = Modifier.weight(1f).height(44.dp)) { Text("Invite") }
                    OutlinedButton(onClick = {}, modifier = Modifier.weight(1f).height(44.dp)) { Text("Team chat") }
                }
            }
            Spacer(Modifier.height(14.dp))
            Text("Discover teams", color = TextMuted, fontSize = 12.sp)
            Spacer(Modifier.height(6.dp))
            listOf("Phoenix Strikers — 4/6", "Neon Reapers — 5/6", "Loot Lords — 3/4").forEach {
                NeonCard { Text(it, color = Color.White, fontWeight = FontWeight.SemiBold) }
                Spacer(Modifier.height(8.dp))
            }
        }
    }
}

// ---------- Referrals ----------
@Composable
private fun ReferralsPreview() {
    ScreenScaffold("Referrals") {
        Column(Modifier.padding(16.dp)) {
            NeonCard {
                Text("Your code", color = TextMuted, fontSize = 12.sp)
                Spacer(Modifier.height(4.dp))
                Text("FAM-ZENUS-7K2", color = NeonOrange, fontWeight = FontWeight.Black, fontSize = 28.sp)
                Spacer(Modifier.height(8.dp))
                Text("Earn 10 🪙 once your friend deposits ₹100.", color = TextMuted, fontSize = 12.sp)
                Spacer(Modifier.height(12.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedButton(onClick = {}, modifier = Modifier.weight(1f).height(44.dp)) { Text("Copy") }
                    Button(onClick = {}, modifier = Modifier.weight(1f).height(44.dp)) { Text("Share") }
                }
            }
            Spacer(Modifier.height(14.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                StatChip("Invited", "12", NeonCyan)
                StatChip("Qualified", "7", NeonGreen)
                StatChip("Earned", "70 🪙", NeonOrange)
            }
        }
    }
}

// ---------- Leaderboard ----------
@Composable
private fun LeaderboardPreview() {
    ScreenScaffold("Leaderboard") {
        Column(Modifier.padding(16.dp)) {
            listOf(
                "1. Zenus_Carlos 👑" to "32,500",
                "2. ProGamer42" to "28,150",
                "3. KillStreak" to "21,440",
                "4. Sniper_X" to "18,900",
                "5. rohan_op" to "16,720",
                "6. NoScopeKing" to "15,300",
                "7. ApexQueen" to "14,800",
                "8. ShadowFox" to "13,950",
                "9. PixelPirate" to "12,400",
                "10. LoLGamer" to "11,200",
            ).forEachIndexed { i, (n, s) ->
                Row(Modifier.fillMaxWidth().padding(vertical = 8.dp)) {
                    Text(n, color = if (i < 3) NeonOrange else Color.White, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
                    Text("$s 🪙", color = NeonGreen, fontWeight = FontWeight.Bold)
                }
                if (i < 9) HorizontalDivider(color = BgSurfaceHi)
            }
        }
    }
}

// ---------- Notifications ----------
@Composable
private fun NotificationsPreview() {
    ScreenScaffold("Notifications") {
        Column(Modifier.padding(16.dp)) {
            listOf(
                Triple("👑 VIP Activated", "Welcome to VIP MONTHLY — 30 days unlocked.", "2m"),
                Triple("🏆 Tournament starting", "BGMI Squad Cup #42 starts in 30 minutes.", "28m"),
                Triple("💸 Withdrawal approved", "₹1,200 paid to zenus@upi (UTR 4242…).", "1h"),
                Triple("🎁 Streak bonus", "+20 🪙 — 7-day streak reward credited.", "3h"),
                Triple("💬 New mention", "ProGamer42 mentioned you in #global.", "5h"),
                Triple("📣 Broadcast", "Maintenance window: Sun 02:00–02:30 IST.", "yesterday"),
            ).forEach { (title, body, time) ->
                NeonCard {
                    Row {
                        Column(Modifier.weight(1f)) {
                            Text(title, color = Color.White, fontWeight = FontWeight.Bold)
                            Spacer(Modifier.height(2.dp))
                            Text(body, color = TextMuted, fontSize = 12.sp)
                        }
                        Text(time, color = TextMuted, fontSize = 11.sp)
                    }
                }
                Spacer(Modifier.height(10.dp))
            }
        }
    }
}

// ---------- Profile ----------
@Composable
private fun ProfilePreview() {
    ScreenScaffold("Profile") {
        Column(Modifier.padding(16.dp)) {
            NeonCard {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(Modifier.size(64.dp).clip(RoundedCornerShape(32.dp)).background(NeonOrange.copy(alpha = .25f)),
                        contentAlignment = Alignment.Center) {
                        Text("👑", fontSize = 28.sp)
                    }
                    Spacer(Modifier.width(14.dp))
                    Column {
                        Text("Zenus_Carlos", color = Color.White, fontWeight = FontWeight.Black, fontSize = 20.sp)
                        Text("raj998302@gmail.com", color = TextMuted, fontSize = 12.sp)
                        Spacer(Modifier.height(4.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            listOf("OWNER", "VIP").forEach { r ->
                                Box(Modifier.clip(RoundedCornerShape(8.dp)).background(NeonOrange.copy(alpha = .2f)).padding(horizontal = 8.dp, vertical = 3.dp)) {
                                    Text(r, color = NeonOrange, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }
            }
            Spacer(Modifier.height(16.dp))
            listOf("Linked accounts", "Notifications", "Sessions / devices", "Change password", "Logout").forEach { item ->
                NeonCard {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(item, color = Color.White, modifier = Modifier.weight(1f))
                        Text("›", color = TextMuted, fontSize = 22.sp)
                    }
                }
                Spacer(Modifier.height(8.dp))
            }
        }
    }
}

// ---------- Admin ----------
@Composable
private fun AdminPreview() {
    ScreenScaffold("Admin Panel") {
        Column(Modifier.padding(16.dp)) {
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                StatChip("Users", "2,841", NeonCyan)
                StatChip("VIP", "146", NeonOrange)
                StatChip("Pending UTRs", "7", NeonMagenta)
                StatChip("Withdrawals", "3", NeonGreen)
            }
            Spacer(Modifier.height(16.dp))
            listOf(
                "Users" to "Search, ban, role-assign, adjust balance",
                "Pending payments" to "Approve / reject UTR submissions",
                "Withdrawals" to "Approve / reject / mark paid",
                "Tournaments" to "Create, publish room ID, declare results",
                "Promo codes" to "Create / disable codes",
                "Maintenance mode" to "Enable / disable site-wide",
                "Broadcast" to "Send push to all users",
            ).forEach { (title, sub) ->
                NeonCard {
                    Column {
                        Text(title, color = Color.White, fontWeight = FontWeight.Bold)
                        Text(sub, color = TextMuted, fontSize = 12.sp)
                    }
                }
                Spacer(Modifier.height(10.dp))
            }
        }
    }
}

// ---------- Admin: create tournament ----------
@Composable
private fun AdminCreateTournamentPreview() {
    ScreenScaffold("Create Tournament") {
        Column(Modifier.padding(16.dp)) {
            NeonCard {
                LabelField("BGMI Squad Cup #43", {}, "Title")
                Spacer(Modifier.height(8.dp))
                LabelField("BGMI", {}, "Game")
                Spacer(Modifier.height(8.dp))
                LabelField("100", {}, "Slots")
                Spacer(Modifier.height(8.dp))
                LabelField("50", {}, "Entry fee (coins)")
                Spacer(Modifier.height(8.dp))
                LabelField("4000", {}, "Prize pool (coins)")
                Spacer(Modifier.height(8.dp))
                LabelField("2026-04-30 20:00", {}, "Start time")
                Spacer(Modifier.height(8.dp))
                LabelField("Squad TPP, Erangel, 30min", {}, "Rules / notes")
                Spacer(Modifier.height(14.dp))
                PrimaryButton("Create tournament") {}
            }
        }
    }
}

// ---------- Admin: pending payments ----------
@Composable
private fun AdminPendingPaymentsPreview() {
    ScreenScaffold("Pending Payments") {
        Column(Modifier.padding(16.dp)) {
            listOf(
                Triple("rohan_op", "₹500 • UTR4242424242 • 4m ago", "MANUAL"),
                Triple("ProGamer42", "₹1500 • UTR9988776655 • 12m ago", "MANUAL"),
                Triple("KillStreak", "₹250 • Razorpay • verifying", "RAZORPAY"),
            ).forEach { (user, info, kind) ->
                NeonCard {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Column(Modifier.weight(1f)) {
                            Text(user, color = Color.White, fontWeight = FontWeight.Bold)
                            Text(info, color = TextMuted, fontSize = 12.sp)
                        }
                        Box(
                            Modifier.clip(RoundedCornerShape(8.dp))
                                .background(if (kind == "MANUAL") NeonMagenta.copy(alpha = .15f) else NeonCyan.copy(alpha = .15f))
                                .padding(horizontal = 8.dp, vertical = 4.dp)
                        ) { Text(kind, color = if (kind == "MANUAL") NeonMagenta else NeonCyan, fontSize = 10.sp, fontWeight = FontWeight.Bold) }
                    }
                    Spacer(Modifier.height(10.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        Button(onClick = {}, colors = ButtonDefaults.buttonColors(containerColor = NeonGreen.copy(alpha = .2f), contentColor = NeonGreen), modifier = Modifier.weight(1f).height(40.dp)) { Text("Approve") }
                        Button(onClick = {}, colors = ButtonDefaults.buttonColors(containerColor = Danger.copy(alpha = .2f), contentColor = Danger), modifier = Modifier.weight(1f).height(40.dp)) { Text("Reject") }
                    }
                }
                Spacer(Modifier.height(10.dp))
            }
        }
    }
}
