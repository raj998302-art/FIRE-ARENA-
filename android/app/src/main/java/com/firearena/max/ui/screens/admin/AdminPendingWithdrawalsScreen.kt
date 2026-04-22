package com.firearena.max.ui.screens.admin

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.navigation.NavHostController
import com.firearena.max.App
import com.firearena.max.data.api.Withdrawal
import com.firearena.max.ui.common.NeonCard
import kotlinx.coroutines.launch

@Composable
fun AdminPendingWithdrawalsScreen(nav: NavHostController) {
    val scope = rememberCoroutineScope()
    val repo = App.instance.container.withdrawalRepo
    var list by remember { mutableStateOf<List<Withdrawal>>(emptyList()) }

    fun reload() = scope.launch { runCatching { list = repo.adminPending() } }
    LaunchedEffect(Unit) { reload() }

    Scaffold(topBar = { TopAppBar(title = { Text("Pending withdrawals") }, navigationIcon = {
        TextButton(onClick = { nav.popBackStack() }) { Text("Back") }
    }) }) { pv ->
        LazyColumn(Modifier.padding(pv).padding(16.dp)) {
            items(list) { w ->
                NeonCard {
                    Text("UPI: ${w.upiId}", fontWeight = FontWeight.Bold)
                    Text("Amount: ${w.amountCoins} 🪙")
                    Text("Created: ${w.createdAt.take(16).replace("T", " ")}")
                    Spacer(Modifier.height(6.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        Button(onClick = { scope.launch {
                            runCatching { repo.adminApprove(w.id) }; reload()
                        } }) { Text("Approve") }
                        OutlinedButton(onClick = { scope.launch {
                            runCatching { repo.adminReject(w.id, "rejected by admin") }; reload()
                        } }) { Text("Reject") }
                    }
                }
                Spacer(Modifier.height(8.dp))
            }
        }
    }
}
