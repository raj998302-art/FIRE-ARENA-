package com.firearena.max.ui.screens.admin

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.navigation.NavHostController
import com.firearena.max.App
import com.firearena.max.data.api.Me
import com.firearena.max.ui.common.LabelField
import com.firearena.max.ui.common.NeonCard
import com.firearena.max.ui.common.shortErr
import kotlinx.coroutines.launch

private val ROLES = listOf("VIP", "MODERATOR", "ADMIN", "TOURNAMENT_MANAGER", "PAYMENT_MANAGER", "FAM_MANAGER", "CO_OWNER")

@Composable
fun AdminUsersScreen(nav: NavHostController) {
    val scope = rememberCoroutineScope()
    val repo = App.instance.container.adminRepo
    var list by remember { mutableStateOf<List<Me>>(emptyList()) }
    var search by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }

    var banTarget by remember { mutableStateOf<Me?>(null) }
    var roleTarget by remember { mutableStateOf<Me?>(null) }
    var adjustTarget by remember { mutableStateOf<Me?>(null) }

    fun reload() = scope.launch {
        runCatching { list = repo.users(search.ifBlank { null }) }
            .onFailure { error = it.message?.shortErr() }
    }

    LaunchedEffect(Unit) { reload() }

    Scaffold(topBar = { TopAppBar(title = { Text("Users") }, navigationIcon = {
        TextButton(onClick = { nav.popBackStack() }) { Text("Back") }
    }) }) { pv ->
        Column(Modifier.padding(pv).fillMaxSize().padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(Modifier.weight(1f)) {
                    LabelField(search, { search = it }, "Search email/username/phone")
                }
                Spacer(Modifier.width(8.dp))
                Button(onClick = { reload() }) { Text("Search") }
            }
            Spacer(Modifier.height(8.dp))
            if (error != null) Text(error!!, color = MaterialTheme.colorScheme.error)
            LazyColumn {
                items(list) { u ->
                    NeonCard {
                        Text(u.username, fontWeight = FontWeight.Bold)
                        Text(u.email)
                        Text("Wallet: ${u.wallet?.balanceCoins ?: 0} 🪙   ${if (u.roles.contains("OWNER")) "👑 Owner" else ""}")
                        Text("Roles: ${u.roles.joinToString()}")
                        Spacer(Modifier.height(6.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            TextButton(onClick = { roleTarget = u }) { Text("Roles") }
                            TextButton(onClick = { adjustTarget = u }) { Text("Adjust 🪙") }
                            TextButton(onClick = { banTarget = u }) { Text("Ban") }
                            TextButton(onClick = {
                                scope.launch { runCatching { repo.unban(u.id) }.onSuccess { reload() } }
                            }) { Text("Unban") }
                        }
                    }
                    Spacer(Modifier.height(6.dp))
                }
            }
        }
    }

    roleTarget?.let { user ->
        RoleDialog(user, onDismiss = { roleTarget = null }, onAdd = { role ->
            scope.launch { runCatching { repo.addRole(user.id, role) }
                .onSuccess { roleTarget = null; reload() }
                .onFailure { error = it.message?.shortErr() } }
        }, onRemove = { role ->
            scope.launch { runCatching { repo.removeRole(user.id, role) }
                .onSuccess { roleTarget = null; reload() }
                .onFailure { error = it.message?.shortErr() } }
        })
    }
    adjustTarget?.let { user ->
        AdjustBalanceDialog(user, onDismiss = { adjustTarget = null }, onConfirm = { delta, note ->
            scope.launch { runCatching { repo.adjust(user.id, delta, note) }
                .onSuccess { adjustTarget = null; reload() }
                .onFailure { error = it.message?.shortErr() } }
        })
    }
    banTarget?.let { user ->
        BanDialog(user, onDismiss = { banTarget = null }, onConfirm = { reason ->
            scope.launch { runCatching { repo.ban(user.id, reason) }
                .onSuccess { banTarget = null; reload() }
                .onFailure { error = it.message?.shortErr() } }
        })
    }
}

@Composable
private fun RoleDialog(user: Me, onDismiss: () -> Unit, onAdd: (String) -> Unit, onRemove: (String) -> Unit) {
    AlertDialog(
        onDismissRequest = onDismiss,
        confirmButton = { TextButton(onClick = onDismiss) { Text("Close") } },
        title = { Text("Roles • ${user.username}") },
        text = {
            Column {
                Text("Current: ${user.roles.joinToString().ifBlank { "—" }}")
                Spacer(Modifier.height(8.dp))
                ROLES.forEach { role ->
                    Row(
                        Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text(role)
                        Row {
                            TextButton(onClick = { onAdd(role) }) { Text("+") }
                            TextButton(onClick = { onRemove(role) }) { Text("−") }
                        }
                    }
                }
            }
        }
    )
}

@Composable
private fun AdjustBalanceDialog(user: Me, onDismiss: () -> Unit, onConfirm: (Int, String) -> Unit) {
    var delta by remember { mutableStateOf("") }
    var note by remember { mutableStateOf("") }
    AlertDialog(
        onDismissRequest = onDismiss,
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } },
        confirmButton = {
            TextButton(
                enabled = delta.toIntOrNull() != null && note.isNotBlank(),
                onClick = { onConfirm(delta.toInt(), note.trim()) }
            ) { Text("Apply") }
        },
        title = { Text("Adjust balance • ${user.username}") },
        text = {
            Column {
                LabelField(delta, { delta = it.filter { c -> c == '-' || c.isDigit() } }, "Delta (negative to deduct)")
                Spacer(Modifier.height(8.dp))
                LabelField(note, { note = it }, "Note (admin audit)")
            }
        }
    )
}

@Composable
private fun BanDialog(user: Me, onDismiss: () -> Unit, onConfirm: (String) -> Unit) {
    var reason by remember { mutableStateOf("") }
    AlertDialog(
        onDismissRequest = onDismiss,
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } },
        confirmButton = {
            TextButton(enabled = reason.isNotBlank(), onClick = { onConfirm(reason.trim()) }) { Text("Ban") }
        },
        title = { Text("Ban ${user.username}?") },
        text = { LabelField(reason, { reason = it }, "Reason") }
    )
}

