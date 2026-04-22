package com.firearena.max.ui.screens.chat

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.navigation.NavHostController
import com.firearena.max.App
import com.firearena.max.data.ChatSocket
import com.firearena.max.data.api.ChatMessage
import com.firearena.max.ui.common.NeonCard
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch
import kotlinx.serialization.json.Json

@Composable
fun ChatChannelScreen(nav: NavHostController, channelId: String) {
    val scope = rememberCoroutineScope()
    val container = App.instance.container
    val repo = container.chatRepo
    var messages by remember { mutableStateOf<List<ChatMessage>>(emptyList()) }
    var body by remember { mutableStateOf("") }
    var connected by remember { mutableStateOf(false) }
    val listState = rememberLazyListState()
    val json = remember { Json { ignoreUnknownKeys = true } }

    // Spin up a per-screen ChatSocket; disconnect when we leave.
    val socket = remember(channelId) {
        val token = container.prefs.accessToken.orEmpty()
        if (token.isEmpty()) null
        else ChatSocket(container.baseUrl.trimEnd('/'), token)
    }

    DisposableEffect(channelId, socket) {
        socket?.connect()
        onDispose { socket?.disconnect() }
    }

    LaunchedEffect(channelId, socket) {
        // Initial history
        runCatching { messages = repo.messages(channelId, 100).reversed() }
        // Track connection + stream
        socket?.let { s ->
            scope.launch { s.connected.collect { connected = it; if (it) s.joinChannel(channelId) } }
            scope.launch {
                s.messageFlow().collectLatest { raw ->
                    runCatching { json.decodeFromString(ChatMessage.serializer(), raw) }
                        .onSuccess { if (it.channelId == channelId) messages = messages + it }
                }
            }
        }
        // Fallback slow poll in case socket is unavailable
        while (true) {
            delay(15_000)
            if (!connected) runCatching { messages = repo.messages(channelId, 100).reversed() }
        }
    }

    Scaffold(topBar = {
        TopAppBar(
            title = { Text(if (connected) "Channel · live" else "Channel") },
            navigationIcon = { TextButton(onClick = { nav.popBackStack() }) { Text("Back") } }
        )
    }) { pv ->
        Column(Modifier.padding(pv).fillMaxSize()) {
            LazyColumn(Modifier.weight(1f).padding(8.dp), state = listState) {
                items(messages) { m ->
                    NeonCard {
                        Text(m.sender?.username ?: m.senderId, style = MaterialTheme.typography.labelMedium)
                        Text(m.body)
                        Text(m.createdAt.take(16).replace("T", " "), style = MaterialTheme.typography.labelSmall)
                    }
                    Spacer(Modifier.height(6.dp))
                }
            }
            Row(Modifier.padding(8.dp)) {
                OutlinedTextField(
                    value = body, onValueChange = { body = it },
                    modifier = Modifier.weight(1f),
                    placeholder = { Text("Type a message…") }
                )
                Spacer(Modifier.width(8.dp))
                Button(onClick = {
                    val t = body.trim()
                    if (t.isEmpty()) return@Button
                    body = ""
                    scope.launch {
                        if (connected) {
                            socket!!.sendMessage(channelId, t)
                        } else {
                            runCatching { repo.send(channelId, t) }
                            runCatching { messages = repo.messages(channelId, 100).reversed() }
                        }
                    }
                }) { Text("Send") }
            }
        }
    }
}
