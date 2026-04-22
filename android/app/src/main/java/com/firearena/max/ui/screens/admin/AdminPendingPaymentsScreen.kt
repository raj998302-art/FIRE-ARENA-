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
import com.firearena.max.data.api.Payment
import com.firearena.max.ui.common.NeonCard
import kotlinx.coroutines.launch

@Composable
fun AdminPendingPaymentsScreen(nav: NavHostController) {
    val scope = rememberCoroutineScope()
    val repo = App.instance.container.paymentRepo
    var list by remember { mutableStateOf<List<Payment>>(emptyList()) }

    fun reload() = scope.launch { runCatching { list = repo.adminPending() } }
    LaunchedEffect(Unit) { reload() }

    Scaffold(topBar = { TopAppBar(title = { Text("Pending UTR") }, navigationIcon = {
        TextButton(onClick = { nav.popBackStack() }) { Text("Back") }
    }) }) { pv ->
        LazyColumn(Modifier.padding(pv).padding(16.dp)) {
            items(list) { p ->
                NeonCard {
                    Text("UTR: ${p.utr}", fontWeight = FontWeight.Bold)
                    Text("Amount: ${p.amountCoins} 🪙")
                    Text("Created: ${p.createdAt.take(16).replace("T", " ")}")
                    Spacer(Modifier.height(6.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        Button(onClick = { scope.launch {
                            runCatching { repo.adminApprove(p.id) }; reload()
                        } }) { Text("Approve") }
                        OutlinedButton(onClick = { scope.launch {
                            runCatching { repo.adminReject(p.id, "invalid utr") }; reload()
                        } }) { Text("Reject") }
                    }
                }
                Spacer(Modifier.height(8.dp))
            }
        }
    }
}
