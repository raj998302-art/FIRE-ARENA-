package com.firearena.max.ui.screens.vip

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.navigation.NavHostController
import com.firearena.max.App
import com.firearena.max.data.api.VipPlan
import com.firearena.max.data.api.VipStatus
import com.firearena.max.ui.common.NeonCard
import com.firearena.max.ui.common.NeonHeader
import com.firearena.max.ui.common.PrimaryButton
import com.firearena.max.ui.common.shortErr
import kotlinx.coroutines.launch

@Composable
fun VipScreen(nav: NavHostController) {
    val scope = rememberCoroutineScope()
    val repo = App.instance.container.vipRepo
    var plans by remember { mutableStateOf<List<VipPlan>>(emptyList()) }
    var status by remember { mutableStateOf<VipStatus?>(null) }
    var error by remember { mutableStateOf<String?>(null) }
    var message by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        scope.launch {
            runCatching { plans = repo.plans() }
            runCatching { status = repo.status() }
        }
    }

    Scaffold(topBar = { TopAppBar(title = { Text("VIP") }, navigationIcon = {
        TextButton(onClick = { nav.popBackStack() }) { Text("Back") }
    }) }) { pv ->
        Column(Modifier.padding(pv).fillMaxSize()) {
            NeonHeader("👑 VIP Membership", if (status?.active == true) "Active until ${status?.subscription?.expiresAt}" else "Not active")
            Column(Modifier.padding(16.dp)) {
                if (error != null) Text(error!!, color = MaterialTheme.colorScheme.error)
                if (message != null) Text(message!!, color = MaterialTheme.colorScheme.primary)
                plans.forEach { plan ->
                    NeonCard {
                        Text(plan.title, fontWeight = FontWeight.Black)
                        Text("${plan.durationDays} days", style = MaterialTheme.typography.labelMedium)
                        Spacer(Modifier.height(4.dp))
                        Text("${plan.priceCoins} 🪙", fontWeight = FontWeight.Bold)
                        Spacer(Modifier.height(8.dp))
                        PrimaryButton("Purchase ${plan.code}") {
                            error = null; message = null
                            scope.launch {
                                runCatching { repo.purchase(plan.code) }
                                    .onSuccess {
                                        message = "VIP active until ${it.expiresAt}"
                                        status = runCatching { repo.status() }.getOrNull()
                                    }
                                    .onFailure { error = (it.message ?: "failed").shortErr() }
                            }
                        }
                    }
                    Spacer(Modifier.height(12.dp))
                }
            }
        }
    }
}
