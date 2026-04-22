package com.firearena.max.data.api

import kotlinx.serialization.Serializable

@Serializable
data class RegisterRequest(
    val email: String,
    val username: String,
    val password: String,
    val displayName: String? = null,
    val gameUid: String? = null,
    val phone: String? = null,
    val referralCode: String? = null,
)

@Serializable
data class LoginRequest(val identifier: String, val password: String)

@Serializable
data class AuthResponse(
    val accessToken: String,
    val refreshToken: String,
    val user: User,
    val roles: List<String>? = null,
)

@Serializable
data class RefreshRequest(val refreshToken: String)
@Serializable
data class AccessTokenResponse(val accessToken: String)

@Serializable
data class User(
    val id: String,
    val email: String,
    val username: String,
    val displayName: String? = null,
    val avatarUrl: String? = null,
    val gameUid: String? = null,
    val referralCode: String? = null,
    val isBanned: Boolean = false,
)

@Serializable
data class Me(
    val id: String,
    val email: String,
    val username: String,
    val displayName: String? = null,
    val avatarUrl: String? = null,
    val gameUid: String? = null,
    val referralCode: String? = null,
    val roles: List<String> = emptyList(),
    val wallet: Wallet? = null,
    val vip: VipInfo? = null,
)

@Serializable
data class VipInfo(val expiresAt: String)

@Serializable
data class Wallet(
    val id: String,
    val balanceCoins: Int,
    val lockedCoins: Int,
    val totalDeposited: Int,
    val totalWithdrawn: Int,
)

@Serializable
data class WalletTx(
    val id: String,
    val type: String,
    val status: String,
    val amountCoins: Int,
    val balanceAfter: Int,
    val referenceKind: String? = null,
    val note: String? = null,
    val createdAt: String,
)

@Serializable
data class Tournament(
    val id: String,
    val title: String,
    val game: String,
    val mode: String,
    val description: String? = null,
    val bannerUrl: String? = null,
    val entryFeeCoins: Int,
    val prizePoolCoins: Int,
    val maxSlots: Int,
    val filledSlots: Int,
    val startAt: String,
    val lockAt: String,
    val status: String,
    val vipOnly: Boolean,
    val roomId: String? = null,
    val roomPassword: String? = null,
    val rules: String? = null,
)

@Serializable
data class JoinTournamentRequest(val gameUid: String, val teamId: String? = null)

@Serializable
data class CreateTournamentRequest(
    val title: String,
    val game: String,
    val mode: String,
    val description: String? = null,
    val entryFeeCoins: Int,
    val prizePoolCoins: Int,
    val maxSlots: Int,
    val startAt: String,
    val lockAt: String,
    val vipOnly: Boolean = false,
    val rules: String? = null,
)

@Serializable
data class RazorpayOrderRequest(val amountCoins: Int)

@Serializable
data class RazorpayVipOrderRequest(val planCode: String)

@Serializable
data class RazorpayOrderResponse(
    val paymentId: String,
    val orderId: String,
    val amountCoins: Int,
    val keyId: String,
    val currency: String,
    val purpose: String? = null,
)

@Serializable
data class RazorpayVerifyResponse(val ok: Boolean, val purpose: String? = null, val alreadyApproved: Boolean? = null)

@Serializable
data class RazorpayVerifyRequest(
    val orderId: String,
    val paymentId: String,
    val signature: String,
)

@Serializable
data class UpiSubmitRequest(
    val amountCoins: Int,
    val utr: String,
    val upiId: String? = null,
    val screenshotUrl: String? = null,
)

@Serializable
data class ManualUpiInfo(val upiId: String, val qrUrl: String)
@Serializable
data class PaymentMethods(val razorpayEnabled: Boolean, val manualUpi: ManualUpiInfo)

@Serializable
data class Payment(
    val id: String,
    val provider: String,
    val amountCoins: Int,
    val status: String,
    val utr: String? = null,
    val rzpOrderId: String? = null,
    val approvedAt: String? = null,
    val createdAt: String,
)

@Serializable
data class WithdrawRequest(
    val amountCoins: Int,
    val upiId: String,
    val accountName: String? = null,
)

@Serializable
data class Withdrawal(
    val id: String,
    val amountCoins: Int,
    val upiId: String,
    val status: String,
    val payoutRef: String? = null,
    val createdAt: String,
)

@Serializable
data class ChatChannel(
    val id: String,
    val type: String,
    val name: String? = null,
    val refId: String? = null,
)

@Serializable
data class ChatMessage(
    val id: String,
    val channelId: String,
    val senderId: String,
    val body: String,
    val attachmentUrl: String? = null,
    val createdAt: String,
    val sender: ChatSender? = null,
)

@Serializable
data class ChatSender(val id: String, val username: String, val avatarUrl: String? = null)

@Serializable
data class SendMessageRequest(val body: String, val attachmentUrl: String? = null)

@Serializable
data class VipPlan(
    val id: String,
    val code: String,
    val title: String,
    val priceCoins: Int,
    val durationDays: Int,
    val description: String? = null,
)

@Serializable
data class VipStatus(val active: Boolean, val subscription: VipSubscription? = null)

@Serializable
data class VipSubscription(
    val id: String,
    val planId: String,
    val expiresAt: String,
    val plan: VipPlan? = null,
)

@Serializable
data class VipPurchaseRequest(val planCode: String)

@Serializable
data class Team(
    val id: String,
    val name: String,
    val tag: String,
    val ownerId: String,
    val logoUrl: String? = null,
    val description: String? = null,
)

@Serializable
data class CreateTeamRequest(
    val name: String,
    val tag: String,
    val description: String? = null,
    val logoUrl: String? = null,
)

@Serializable
data class Notification(
    val id: String,
    val type: String,
    val title: String,
    val body: String,
    val readAt: String? = null,
    val createdAt: String,
)

@Serializable
data class ReferralSummary(
    val code: String? = null,
    val totalReferred: Int = 0,
    val totalEarned: Int = 0,
)

@Serializable
data class LeaderboardRow(
    val rank: Int,
    val userId: String,
    val user: LeaderboardUser? = null,
    val prizeCoins: Int? = null,
    val kills: Int? = null,
    val referralCount: Int? = null,
    val earnedCoins: Int? = null,
)

@Serializable
data class LeaderboardUser(val id: String, val username: String, val avatarUrl: String? = null)

@Serializable
data class AdminStats(
    val userCount: Int,
    val activeVip: Int,
    val pendingUtr: Int,
    val pendingWd: Int,
    val tournaments: Int,
    val totalDeposited: Int,
    val totalWithdrawn: Int,
)

@Serializable
data class AdminRoleChange(val role: String)
@Serializable
data class AdminBanRequest(val reason: String)
@Serializable
data class AdminAdjustRequest(val delta: Int, val note: String)
@Serializable
data class AdminBroadcastRequest(val title: String, val body: String)
@Serializable
data class AdminRejectRequest(val reason: String)
@Serializable
data class AdminApprovePayout(val payoutRef: String? = null)
@Serializable
data class AdminMarkPaid(val payoutRef: String)

@Serializable
data class GenericOk(val ok: Boolean = true)
