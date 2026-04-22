package com.firearena.max.data

import io.socket.client.IO
import io.socket.client.Socket
import io.socket.emitter.Emitter
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.callbackFlow
import org.json.JSONObject

/**
 * Thin wrapper around the Socket.IO-client for Fire Arena Max chat.
 * One instance per logged-in user. Pair with a composable scope so we
 * disconnect when the screen leaves.
 */
class ChatSocket(
    private val baseUrl: String,
    private val accessToken: String,
) {
    private var socket: Socket? = null
    private val _connected = MutableStateFlow(false)
    val connected: StateFlow<Boolean> = _connected.asStateFlow()

    fun connect() {
        if (socket?.connected() == true) return
        val opts = IO.Options().apply {
            auth = mapOf("token" to accessToken)
            path = "/socket.io"
            reconnection = true
        }
        socket = IO.socket(baseUrl, opts).apply {
            on(Socket.EVENT_CONNECT) { _connected.value = true }
            on(Socket.EVENT_DISCONNECT) { _connected.value = false }
            connect()
        }
    }

    fun disconnect() {
        socket?.disconnect()
        socket?.off()
        socket = null
        _connected.value = false
    }

    fun joinChannel(channelId: String) {
        socket?.emit("chat:join", channelId)
    }

    fun sendMessage(channelId: String, body: String, attachmentUrl: String? = null) {
        val payload = JSONObject().apply {
            put("channelId", channelId)
            put("body", body)
            if (attachmentUrl != null) put("attachmentUrl", attachmentUrl)
        }
        socket?.emit("chat:send", payload)
    }

    /** Stream of incoming `chat:message` events as raw JSON strings. */
    fun messageFlow(): Flow<String> = callbackFlow {
        val listener = Emitter.Listener { args ->
            val first = args.firstOrNull()?.toString() ?: return@Listener
            trySend(first)
        }
        socket?.on("chat:message", listener)
        awaitClose { socket?.off("chat:message", listener) }
    }
}
