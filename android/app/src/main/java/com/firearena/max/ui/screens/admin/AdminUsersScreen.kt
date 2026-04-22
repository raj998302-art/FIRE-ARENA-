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
import com.firearena.max.data.api.Me
import com.firearena.max.ui.common.LabelField
import com.firearena.max.ui.common.NeonCard
import kotlinx.coroutines.launch

@Composable
fun AdminUsersScreen(nav: NavHostController) {
    val scope = rememberCoroutineScope()
    val repo = App.instance.container.adminRepo
    var list by remember { mutableStateOf<List<Me>>(emptyList()) }
    var search by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }

    fun reload() = scope.launch {
        runCatching { list = repo.users(search.ifBlank { null }) }
            .onFailure { error = it.message }
    }

    LaunchedEffect(Unit) { reload() }

    Scaffold(topBar = { TopAppBar(title = { Text("Users") }, navigationIcon = {
        TextButton(onClick = { nav.popBackStack() }) { Text("Back") }
    }) }) { pv ->
        Column(Modifier.padding(pv).fillMaxSize().padding(16.dp)) {
            Row {
                LabelField(search, { search = it }, "Search email/username/phone")
            }
            Button(onClick = { reload() }) { Text("Search") }
            Spacer(Modifier.height(8.dp))
            if (error != null) Text(error!!, color = MaterialTheme.colorScheme.error)
            LazyColumn {
                items(list) { u ->
                    NeonCard {
                        Text(u.username, fontWeight = FontWeight.Bold)
                        Text(u.email)
                        Text("Wallet: ${u.wallet?.balanceCoins ?: 0} 🪙")
                        Text("Roles: ${u.roles.joinToString()}")
                        Spacer(Modifier.height(6.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            TextButton(onClick = {
                                scope.launch { runCatching { repo.addRole(u.id, "VIP") }; reload() }
                            }) { Text("+VIP") }
                            TextButton(onClick = {
                                scope.launch { runCatching { repo.addRole(u.id, "MODERATOR") }; reload() }
                            }) { Text("+Mod") }
                            TextButton(onClick = {
                                scope.launch { runCatching { repo.ban(u.id, "banned by admin") }; reload() }
                            }) { Text("Ban") }
                            TextButton(onClick = {
                                scope.launch { runCatching { repo.unban(u.id) }; reload() }
                            }) { Text("Unban") }
                        }
                    }
                    Spacer(Modifier.height(6.dp))
                }
            }
        }
    }
}
