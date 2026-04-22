package com.firearena.max.ui.screens.wallet

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.navigation.NavHostController
import com.firearena.max.App
import com.firearena.max.ui.common.ErrorBanner
import com.firearena.max.ui.common.LabelField
import com.firearena.max.ui.common.NeonCard
import com.firearena.max.ui.common.PrimaryButton
import com.firearena.max.ui.common.shortErr
import kotlinx.coroutines.launch

@Composable
fun WithdrawScreen(nav: NavHostController) {
    val scope = rememberCoroutineScope()
    val repo = App.instance.container.withdrawalRepo
    var amount by remember { mutableStateOf("100") }
    var upi by remember { mutableStateOf("") }
    var accountName by remember { mutableStateOf("") }
    var loading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    var message by remember { mutableStateOf<String?>(null) }

    Scaffold(topBar = {
        TopAppBar(title = { Text("Withdraw") }, navigationIcon = {
            TextButton(onClick = { nav.popBackStack() }) { Text("Back") }
        })
    }) { pv ->
        Column(Modifier.padding(pv).fillMaxSize().padding(16.dp)) {
            NeonCard {
                Text("Withdrawal request", fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(6.dp))
                Text("Minimum 100 coins. Coins are locked until your admin approves and marks the payout as paid.")
                Spacer(Modifier.height(10.dp))
                LabelField(amount, { amount = it.filter { c -> c.isDigit() } }, "Amount in coins")
                Spacer(Modifier.height(8.dp))
                LabelField(upi, { upi = it }, "UPI ID (e.g. name@okhdfcbank)")
                Spacer(Modifier.height(8.dp))
                LabelField(accountName, { accountName = it }, "Name on account (optional)")
                Spacer(Modifier.height(12.dp))
                ErrorBanner(error)
                if (message != null) Text(message!!, color = MaterialTheme.colorScheme.primary)
                Spacer(Modifier.height(8.dp))
                PrimaryButton("Request withdrawal", loading = loading,
                    enabled = (amount.toIntOrNull() ?: 0) >= 100 && upi.isNotBlank()) {
                    error = null; loading = true
                    scope.launch {
                        try {
                            repo.request(amount.toInt(), upi.trim(), accountName.takeIf { it.isNotBlank() })
                            message = "Request submitted. You will be notified once processed."
                        } catch (e: Exception) {
                            error = (e.message ?: "failed").shortErr()
                        } finally { loading = false }
                    }
                }
            }
        }
    }
}
