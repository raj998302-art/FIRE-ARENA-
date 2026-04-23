package com.firearena.max.ui.screens.wallet

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavHostController
import com.firearena.max.App
import com.firearena.max.data.api.Wallet
import com.firearena.max.data.api.WalletTx
import com.firearena.max.ui.common.NeonCard
import com.firearena.max.ui.common.NeonHeader
import com.firearena.max.ui.common.PrimaryButton
import com.firearena.max.ui.nav.Routes
import kotlinx.coroutines.launch

@Composable
fun WalletScreen(nav: NavHostController) {
    val scope = rememberCoroutineScope()
    val repo = App.instance.container.walletRepo
    var wallet by remember { mutableStateOf<Wallet?>(null) }
    var txs by remember { mutableStateOf<List<WalletTx>>(emptyList()) }
    var refresh by remember { mutableStateOf(0) }

    LaunchedEffect(refresh) {
        scope.launch {
            runCatching { wallet = repo.wallet() }
            runCatching { txs = repo.transactions(100) }
        }
    }

    Scaffold(topBar = {
        TopAppBar(title = { Text("Wallet") }, navigationIcon = {
            TextButton(onClick = { nav.popBackStack() }) { Text("Back") }
        })
    }) { pv ->
        Column(Modifier.padding(pv).fillMaxSize()) {
            NeonHeader(title = "${wallet?.balanceCoins ?: 0} 🪙",
                subtitle = "Locked: ${wallet?.lockedCoins ?: 0}  •  Deposited: ${wallet?.totalDeposited ?: 0}  •  Withdrawn: ${wallet?.totalWithdrawn ?: 0}")
            Spacer(Modifier.height(12.dp))
            Row(Modifier.fillMaxWidth().padding(horizontal = 16.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Button(modifier = Modifier.weight(1f), onClick = { nav.navigate(Routes.Deposit) }) { Text("Deposit") }
                OutlinedButton(modifier = Modifier.weight(1f), onClick = { nav.navigate(Routes.Withdraw) }) { Text("Withdraw") }
            }
            Spacer(Modifier.height(16.dp))
            Text("Transactions", fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 16.dp))
            Spacer(Modifier.height(8.dp))
            LazyColumn(Modifier.weight(1f).padding(horizontal = 16.dp)) {
                items(txs) { t ->
                    NeonCard {
                        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                            Column(Modifier.weight(1f)) {
                                Text(t.type.replace("_", " "), fontWeight = FontWeight.SemiBold)
                                Text(t.note ?: "", fontSize = 12.sp)
                                Text(t.createdAt.take(16).replace("T", " "), fontSize = 11.sp)
                            }
                            val prefix = when (t.type) {
                                "DEPOSIT","REFERRAL_BONUS","TOURNAMENT_PRIZE","ADMIN_ADJUST","REFUND","UNLOCK",
                                "PROMO_REWARD","SPIN_REWARD","STREAK_BONUS" -> "+"
                                else -> "-"
                            }
                            Text("$prefix${t.amountCoins}", fontWeight = FontWeight.Bold)
                        }
                    }
                    Spacer(Modifier.height(8.dp))
                }
            }
        }
    }
}
