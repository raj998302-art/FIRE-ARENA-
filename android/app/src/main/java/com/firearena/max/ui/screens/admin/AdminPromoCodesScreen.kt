package com.firearena.max.ui.screens.admin

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.navigation.NavHostController
import com.firearena.max.App
import com.firearena.max.data.api.CreatePromoRequest
import com.firearena.max.data.api.PromoCode
import com.firearena.max.ui.common.ErrorBanner
import com.firearena.max.ui.common.LabelField
import com.firearena.max.ui.common.NeonCard
import com.firearena.max.ui.common.NeonHeader
import com.firearena.max.ui.common.PrimaryButton
import com.firearena.max.ui.common.shortErr
import kotlinx.coroutines.launch

@Composable
fun AdminPromoCodesScreen(nav: NavHostController) {
    val scope = rememberCoroutineScope()
    val repo = App.instance.container.rewardsRepo

    var promos by remember { mutableStateOf<List<PromoCode>>(emptyList()) }
    var code by remember { mutableStateOf("") }
    var reward by remember { mutableStateOf("50") }
    var maxUses by remember { mutableStateOf("100") }
    var perUser by remember { mutableStateOf("1") }
    var error by remember { mutableStateOf<String?>(null) }
    var info by remember { mutableStateOf<String?>(null) }

    suspend fun refresh() { runCatching { promos = repo.adminListPromos() } }
    LaunchedEffect(Unit) { refresh() }

    Scaffold(topBar = { TopAppBar(title = { Text("Promo codes") }, navigationIcon = {
        TextButton(onClick = { nav.popBackStack() }) { Text("Back") }
    }) }) { pv ->
        Column(Modifier.padding(pv).fillMaxSize().verticalScroll(rememberScrollState())) {
            NeonHeader("🎟️ Promo codes", "One-time or multi-use reward codes")
            Column(Modifier.padding(16.dp)) {
                NeonCard {
                    Text("Create", fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(8.dp))
                    LabelField(code, { code = it.uppercase() }, "Code")
                    Spacer(Modifier.height(8.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Box(Modifier.weight(1f)) { LabelField(reward, { reward = it.filter { c -> c.isDigit() } }, "Reward 🪙") }
                        Box(Modifier.weight(1f)) { LabelField(maxUses, { maxUses = it.filter { c -> c.isDigit() } }, "Max uses") }
                        Box(Modifier.weight(1f)) { LabelField(perUser, { perUser = it.filter { c -> c.isDigit() } }, "Per user") }
                    }
                    Spacer(Modifier.height(10.dp))
                    ErrorBanner(error)
                    if (info != null) Text(info!!, color = MaterialTheme.colorScheme.primary)
                    Spacer(Modifier.height(6.dp))
                    PrimaryButton("Create code",
                        enabled = code.isNotBlank() && reward.toIntOrNull() != null) {
                        scope.launch {
                            error = null; info = null
                            runCatching {
                                repo.adminCreatePromo(
                                    CreatePromoRequest(
                                        code = code.trim(),
                                        rewardCoins = reward.toInt(),
                                        maxUses = maxUses.toIntOrNull(),
                                        perUserLimit = perUser.toIntOrNull(),
                                    )
                                )
                            }.onSuccess {
                                info = "Created ${it.code}: +${it.rewardCoins}🪙"
                                code = ""
                                refresh()
                            }.onFailure { error = (it.message ?: "Failed").shortErr() }
                        }
                    }
                }

                Spacer(Modifier.height(16.dp))
                Text("Active codes", fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(8.dp))
                promos.forEach { p ->
                    NeonCard {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Column(Modifier.weight(1f)) {
                                Text(p.code, fontWeight = FontWeight.Bold)
                                Text("+${p.rewardCoins}🪙 • ${p.usedCount}/${p.maxUses} used • ${if (p.isActive) "active" else "disabled"}",
                                    style = MaterialTheme.typography.bodySmall)
                            }
                            if (p.isActive) {
                                OutlinedButton(onClick = {
                                    scope.launch {
                                        runCatching { repo.adminDeactivatePromo(p.code) }
                                            .onSuccess { refresh() }
                                            .onFailure { error = (it.message ?: "Failed").shortErr() }
                                    }
                                }) { Text("Disable") }
                            }
                        }
                    }
                    Spacer(Modifier.height(6.dp))
                }
            }
        }
    }
}
