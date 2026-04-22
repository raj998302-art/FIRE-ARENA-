package com.firearena.max.ui.screens.admin

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.navigation.NavHostController
import com.firearena.max.App
import com.firearena.max.data.api.AdminStats
import com.firearena.max.ui.common.LabelField
import com.firearena.max.ui.common.NeonCard
import com.firearena.max.ui.common.NeonHeader
import com.firearena.max.ui.common.PrimaryButton
import com.firearena.max.ui.common.shortErr
import com.firearena.max.ui.nav.Routes
import kotlinx.coroutines.launch

@Composable
fun AdminScreen(nav: NavHostController) {
    val scope = rememberCoroutineScope()
    val repo = App.instance.container.adminRepo
    var stats by remember { mutableStateOf<AdminStats?>(null) }
    var bTitle by remember { mutableStateOf("") }
    var bBody by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }
    var message by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) { scope.launch { runCatching { stats = repo.stats() } } }

    Scaffold(topBar = { TopAppBar(title = { Text("Admin") }, navigationIcon = {
        TextButton(onClick = { nav.popBackStack() }) { Text("Back") }
    }) }) { pv ->
        Column(Modifier.padding(pv).fillMaxSize().verticalScroll(rememberScrollState())) {
            NeonHeader("🛠️ Master panel", "Users • Finance • Tournaments • Broadcast")
            Column(Modifier.padding(16.dp)) {
                NeonCard {
                    Text("Stats", fontWeight = FontWeight.Bold)
                    Text("Users: ${stats?.userCount ?: "-"}")
                    Text("Active VIP: ${stats?.activeVip ?: "-"}")
                    Text("Pending UTR: ${stats?.pendingUtr ?: "-"}")
                    Text("Pending withdrawals: ${stats?.pendingWd ?: "-"}")
                    Text("Tournaments: ${stats?.tournaments ?: "-"}")
                    Text("Deposited total: ${stats?.totalDeposited ?: 0} 🪙")
                    Text("Withdrawn total: ${stats?.totalWithdrawn ?: 0} 🪙")
                }
                Spacer(Modifier.height(12.dp))
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Button(modifier = Modifier.weight(1f), onClick = { nav.navigate(Routes.AdminUsers) }) { Text("Users") }
                    Button(modifier = Modifier.weight(1f), onClick = { nav.navigate(Routes.AdminPendingPayments) }) { Text("UTR queue") }
                    Button(modifier = Modifier.weight(1f), onClick = { nav.navigate(Routes.AdminPendingWithdrawals) }) { Text("Withdrawals") }
                }
                Spacer(Modifier.height(12.dp))
                NeonCard {
                    Text("Broadcast", fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(6.dp))
                    LabelField(bTitle, { bTitle = it }, "Title")
                    Spacer(Modifier.height(6.dp))
                    LabelField(bBody, { bBody = it }, "Message", singleLine = false)
                    Spacer(Modifier.height(10.dp))
                    if (error != null) Text(error!!, color = MaterialTheme.colorScheme.error)
                    if (message != null) Text(message!!, color = MaterialTheme.colorScheme.primary)
                    Spacer(Modifier.height(6.dp))
                    PrimaryButton("Send broadcast", enabled = bTitle.isNotBlank() && bBody.isNotBlank()) {
                        scope.launch {
                            runCatching { repo.broadcast(bTitle, bBody) }
                                .onSuccess { message = "Sent!"; bTitle = ""; bBody = "" }
                                .onFailure { error = (it.message ?: "failed").shortErr() }
                        }
                    }
                }
            }
        }
    }
}
