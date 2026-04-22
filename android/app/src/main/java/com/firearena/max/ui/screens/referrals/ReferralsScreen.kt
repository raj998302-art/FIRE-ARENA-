package com.firearena.max.ui.screens.referrals

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavHostController
import com.firearena.max.App
import com.firearena.max.data.api.ReferralSummary
import com.firearena.max.ui.common.NeonCard
import com.firearena.max.ui.common.NeonHeader
import kotlinx.coroutines.launch

@Composable
fun ReferralsScreen(nav: NavHostController) {
    val scope = rememberCoroutineScope()
    val repo = App.instance.container.referralRepo
    var s by remember { mutableStateOf<ReferralSummary?>(null) }

    LaunchedEffect(Unit) { scope.launch { runCatching { s = repo.summary() } } }

    Scaffold(topBar = { TopAppBar(title = { Text("Referrals") }, navigationIcon = {
        TextButton(onClick = { nav.popBackStack() }) { Text("Back") }
    }) }) { pv ->
        Column(Modifier.padding(pv).fillMaxSize()) {
            NeonHeader("🎁 Invite friends", "Earn 10 🪙 when a referred friend deposits ₹100")
            Column(Modifier.padding(16.dp)) {
                NeonCard {
                    Text("Your code", style = MaterialTheme.typography.labelMedium)
                    Text(s?.code ?: "-", fontWeight = FontWeight.Black, fontSize = 28.sp)
                }
                Spacer(Modifier.height(12.dp))
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    NeonCard {
                        Text("Referred"); Text("${s?.totalReferred ?: 0}", fontWeight = FontWeight.Black)
                    }
                    NeonCard {
                        Text("Earned (🪙)"); Text("${s?.totalEarned ?: 0}", fontWeight = FontWeight.Black)
                    }
                }
            }
        }
    }
}
