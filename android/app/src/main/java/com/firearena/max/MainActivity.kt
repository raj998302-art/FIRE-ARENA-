package com.firearena.max

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.firearena.max.data.PaymentBus
import com.firearena.max.data.PaymentResult
import com.firearena.max.ui.nav.AppNavHost
import com.firearena.max.ui.theme.FireArenaMaxTheme
import com.razorpay.Checkout
import com.razorpay.ExternalWalletListener
import com.razorpay.PaymentData
import com.razorpay.PaymentResultWithDataListener

class MainActivity : ComponentActivity(),
    PaymentResultWithDataListener,
    ExternalWalletListener {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        Checkout.preload(applicationContext)
        enableEdgeToEdge()
        setContent {
            FireArenaMaxTheme(darkTheme = true) {
                AppNavHost()
            }
        }
    }

    // Razorpay success callback — payment_id + order_id + signature are in `data`.
    override fun onPaymentSuccess(paymentId: String?, data: PaymentData?) {
        val orderId = data?.orderId ?: PaymentBus.pendingOrderId
        val signature = data?.signature.orEmpty()
        if (paymentId.isNullOrBlank() || orderId.isNullOrBlank() || signature.isEmpty()) {
            PaymentBus.tryEmit(PaymentResult.Error(-1, "Missing payment fields from Razorpay", orderId))
            return
        }
        PaymentBus.tryEmit(PaymentResult.Success(orderId, paymentId, signature))
        PaymentBus.pendingOrderId = null
    }

    override fun onPaymentError(code: Int, description: String?, data: PaymentData?) {
        val orderId = data?.orderId ?: PaymentBus.pendingOrderId
        if (code == Checkout.PAYMENT_CANCELED) {
            PaymentBus.tryEmit(PaymentResult.Cancelled(orderId))
        } else {
            PaymentBus.tryEmit(PaymentResult.Error(code, description ?: "Payment failed", orderId))
        }
        PaymentBus.pendingOrderId = null
    }

    override fun onExternalWalletSelected(walletName: String?, data: PaymentData?) {
        // We're not using external wallets; fall back to error.
        PaymentBus.tryEmit(PaymentResult.Error(-2, "External wallet not supported: $walletName", data?.orderId))
    }
}
