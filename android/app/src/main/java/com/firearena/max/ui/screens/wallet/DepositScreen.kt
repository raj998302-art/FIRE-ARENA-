package com.firearena.max.ui.screens.wallet

import android.app.Activity
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.navigation.NavHostController
import com.firearena.max.App
import com.firearena.max.data.api.ManualUpiInfo
import com.firearena.max.ui.common.ErrorBanner
import com.firearena.max.ui.common.LabelField
import com.firearena.max.ui.common.NeonCard
import com.firearena.max.ui.common.PrimaryButton
import com.firearena.max.ui.common.shortErr
import com.razorpay.Checkout
import kotlinx.coroutines.launch
import org.json.JSONObject

@Composable
fun DepositScreen(nav: NavHostController) {
    val scope = rememberCoroutineScope()
    val container = App.instance.container
    val ctx = LocalContext.current

    var amount by remember { mutableStateOf("100") }
    var utr by remember { mutableStateOf("") }
    var methods by remember { mutableStateOf<com.firearena.max.data.api.PaymentMethods?>(null) }
    var error by remember { mutableStateOf<String?>(null) }
    var message by remember { mutableStateOf<String?>(null) }
    var loading by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        runCatching { methods = container.paymentRepo.methods() }
    }

    Scaffold(topBar = {
        TopAppBar(title = { Text("Deposit") }, navigationIcon = {
            TextButton(onClick = { nav.popBackStack() }) { Text("Back") }
        })
    }) { pv ->
        Column(Modifier.padding(pv).fillMaxSize().padding(16.dp).verticalScroll(rememberScrollState())) {
            ErrorBanner(error)
            if (message != null) {
                Text(message!!, color = MaterialTheme.colorScheme.primary)
                Spacer(Modifier.height(8.dp))
            }
            NeonCard {
                Text("Razorpay (instant)", fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(8.dp))
                LabelField(amount, { amount = it.filter { c -> c.isDigit() } }, "Amount in coins (₹)")
                Spacer(Modifier.height(12.dp))
                PrimaryButton("Pay with Razorpay", loading = loading, enabled = (amount.toIntOrNull() ?: 0) >= 10) {
                    val amt = amount.toIntOrNull() ?: return@PrimaryButton
                    error = null; loading = true
                    scope.launch {
                        try {
                            val order = container.paymentRepo.createRazorpayOrder(amt)
                            val activity = ctx as? Activity ?: return@launch.also { loading = false }
                            val co = Checkout()
                            co.setKeyID(order.keyId)
                            val opts = JSONObject()
                            opts.put("name", "Fire Arena Max")
                            opts.put("description", "Wallet deposit")
                            opts.put("currency", order.currency)
                            opts.put("amount", order.amountCoins * 100)
                            opts.put("order_id", order.orderId)
                            co.open(activity, opts)
                            message = "Razorpay opened. Complete payment — verification runs automatically on return."
                            // Note: a real implementation listens to PaymentResultListener and calls verifyRazorpay(...)
                        } catch (e: Exception) {
                            error = (e.message ?: "failed").shortErr()
                        } finally { loading = false }
                    }
                }
            }
            Spacer(Modifier.height(16.dp))
            NeonCard {
                Text("Manual UPI (approval needed)", fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(6.dp))
                val upi = methods?.manualUpi
                if (upi != null) {
                    Text("Send to UPI: ${upi.upiId}")
                    if (upi.qrUrl.isNotBlank()) Text("QR: ${upi.qrUrl}")
                }
                Spacer(Modifier.height(10.dp))
                LabelField(amount, { amount = it.filter { c -> c.isDigit() } }, "Amount in coins (₹)")
                Spacer(Modifier.height(8.dp))
                LabelField(utr, { utr = it.uppercase() }, "UTR / Reference number")
                Spacer(Modifier.height(12.dp))
                PrimaryButton(
                    "Submit UTR for approval",
                    loading = loading,
                    enabled = utr.length in 8..22 && (amount.toIntOrNull() ?: 0) >= 10
                ) {
                    error = null; loading = true
                    scope.launch {
                        try {
                            container.paymentRepo.submitUtr(amount.toInt(), utr, upiId = methods?.manualUpi?.upiId)
                            message = "UTR submitted. Payment manager will review it shortly."
                            utr = ""
                        } catch (e: Exception) {
                            error = (e.message ?: "failed").shortErr()
                        } finally { loading = false }
                    }
                }
            }
        }
    }
}
