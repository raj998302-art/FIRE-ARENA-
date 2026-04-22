package com.firearena.max.ui.screens.notifications

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
import com.firearena.max.data.api.Notification
import com.firearena.max.ui.common.EmptyState
import com.firearena.max.ui.common.NeonCard
import kotlinx.coroutines.launch

@Composable
fun NotificationsScreen(nav: NavHostController) {
    val scope = rememberCoroutineScope()
    val repo = App.instance.container.notificationRepo
    var list by remember { mutableStateOf<List<Notification>>(emptyList()) }

    LaunchedEffect(Unit) {
        scope.launch {
            runCatching { list = repo.list() }
            runCatching { repo.readAll() }
        }
    }

    Scaffold(topBar = { TopAppBar(title = { Text("Notifications") }, navigationIcon = {
        TextButton(onClick = { nav.popBackStack() }) { Text("Back") }
    }) }) { pv ->
        Column(Modifier.padding(pv).fillMaxSize()) {
            if (list.isEmpty()) EmptyState("Nothing yet")
            LazyColumn(Modifier.padding(16.dp)) {
                items(list) { n ->
                    NeonCard {
                        Text(n.title, fontWeight = FontWeight.Bold)
                        Text(n.body)
                        Text("${n.type} • ${n.createdAt.take(16).replace("T", " ")}", style = MaterialTheme.typography.labelSmall)
                    }
                    Spacer(Modifier.height(8.dp))
                }
            }
        }
    }
}
