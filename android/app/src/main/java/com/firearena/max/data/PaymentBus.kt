package com.firearena.max.data

import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow

/**
 * Result of a Razorpay Checkout round-trip. Emitted by MainActivity's
 * PaymentResultListener and consumed by whichever composable initiated the checkout.
 */
sealed class PaymentResult {
    data class Success(val orderId: String, val paymentId: String, val signature: String) : PaymentResult()
    data class Error(val code: Int, val description: String, val orderId: String?) : PaymentResult()
    data class Cancelled(val orderId: String?) : PaymentResult()
}

/** Process-wide single-shot bus for Razorpay results. */
object PaymentBus {
    private val _results = MutableSharedFlow<PaymentResult>(extraBufferCapacity = 4)
    val results: SharedFlow<PaymentResult> = _results.asSharedFlow()

    /** The order_id that is currently open in Razorpay Checkout (if any). */
    @Volatile var pendingOrderId: String? = null

    suspend fun emit(result: PaymentResult) {
        _results.emit(result)
    }
    fun tryEmit(result: PaymentResult) {
        _results.tryEmit(result)
    }
}
