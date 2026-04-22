package com.firearena.max.data.repo

import com.firearena.max.data.AuthPrefs
import com.firearena.max.data.api.*

class AuthRepository(private val api: ApiService, private val prefs: AuthPrefs) {
    suspend fun login(identifier: String, password: String): AuthResponse {
        val res = api.login(LoginRequest(identifier, password))
        saveSession(res)
        return res
    }

    suspend fun register(
        email: String, username: String, password: String,
        displayName: String? = null, gameUid: String? = null, phone: String? = null,
        referralCode: String? = null,
    ): AuthResponse {
        val res = api.register(RegisterRequest(email, username, password, displayName, gameUid, phone, referralCode))
        saveSession(res)
        return res
    }

    suspend fun logout() {
        val rt = prefs.refreshToken
        if (!rt.isNullOrEmpty()) {
            runCatching { api.logout(RefreshRequest(rt)) }
        }
        prefs.clear()
    }

    private fun saveSession(res: AuthResponse) {
        prefs.accessToken = res.accessToken
        prefs.refreshToken = res.refreshToken
        prefs.userId = res.user.id
        prefs.username = res.user.username
        prefs.roles = res.roles?.toSet() ?: emptySet()
    }

    suspend fun me(): Me {
        val m = api.me()
        prefs.roles = m.roles.toSet()
        return m
    }
}

class WalletRepository(private val api: ApiService) {
    suspend fun wallet() = api.wallet()
    suspend fun transactions(limit: Int = 50) = api.walletTransactions(limit)
}

class TournamentRepository(private val api: ApiService) {
    suspend fun list(status: String? = null) = api.tournaments(status)
    suspend fun myEntries() = api.myTournaments()
    suspend fun detail(id: String) = api.tournament(id)
    suspend fun join(id: String, gameUid: String, teamId: String? = null) =
        api.joinTournament(id, JoinTournamentRequest(gameUid, teamId))
    suspend fun leave(id: String) = api.leaveTournament(id)
    suspend fun create(body: CreateTournamentRequest) = api.createTournament(body)
}

class ChatRepository(private val api: ApiService) {
    suspend fun channels() = api.chatChannels()
    suspend fun messages(channelId: String, limit: Int = 50) = api.chatMessages(channelId, limit)
    suspend fun send(channelId: String, body: String, attachmentUrl: String? = null) =
        api.sendChatMessage(channelId, SendMessageRequest(body, attachmentUrl))
}

class PaymentRepository(private val api: ApiService) {
    suspend fun methods() = api.paymentMethods()
    suspend fun createRazorpayOrder(amount: Int) = api.createRazorpayOrder(RazorpayOrderRequest(amount))
    suspend fun createRazorpayVipOrder(planCode: String) = api.createRazorpayVipOrder(RazorpayVipOrderRequest(planCode))
    suspend fun verifyRazorpay(orderId: String, paymentId: String, signature: String) =
        api.verifyRazorpay(RazorpayVerifyRequest(orderId, paymentId, signature))
    suspend fun submitUtr(amount: Int, utr: String, upiId: String? = null) =
        api.submitUtr(UpiSubmitRequest(amount, utr, upiId))
    suspend fun myPayments() = api.myPayments()
    suspend fun adminPending() = api.adminPendingPayments()
    suspend fun adminApprove(id: String) = api.adminApprovePayment(id)
    suspend fun adminReject(id: String, reason: String) = api.adminRejectPayment(id, AdminRejectRequest(reason))
}

class WithdrawalRepository(private val api: ApiService) {
    suspend fun request(amount: Int, upiId: String, accountName: String? = null) =
        api.requestWithdrawal(WithdrawRequest(amount, upiId, accountName))
    suspend fun mine() = api.myWithdrawals()
    suspend fun adminPending() = api.adminPendingWithdrawals()
    suspend fun adminApprove(id: String, payoutRef: String? = null) =
        api.adminApproveWithdrawal(id, AdminApprovePayout(payoutRef))
    suspend fun adminReject(id: String, reason: String) =
        api.adminRejectWithdrawal(id, AdminRejectRequest(reason))
}

class VipRepository(private val api: ApiService) {
    suspend fun plans() = api.vipPlans()
    suspend fun status() = api.vipStatus()
    suspend fun purchase(code: String) = api.vipPurchase(VipPurchaseRequest(code))
}

class TeamRepository(private val api: ApiService) {
    suspend fun list() = api.teams()
    suspend fun mine() = api.myTeams()
    suspend fun create(name: String, tag: String, description: String? = null) =
        api.createTeam(CreateTeamRequest(name, tag, description))
    suspend fun join(id: String) = api.joinTeam(id)
    suspend fun leave(id: String) = api.leaveTeam(id)
}

class NotificationRepository(private val api: ApiService) {
    suspend fun list() = api.notifications()
    suspend fun readAll() = api.readAllNotifications()
}

class ReferralRepository(private val api: ApiService) {
    suspend fun summary() = api.referralSummary()
}

class LeaderboardRepository(private val api: ApiService) {
    suspend fun winnings() = api.leaderboardWinnings()
    suspend fun kills() = api.leaderboardKills()
    suspend fun referrers() = api.leaderboardReferrers()
}

class AdminRepository(private val api: ApiService) {
    suspend fun stats() = api.adminStats()
    suspend fun users(search: String? = null) = api.adminUsers(search)
    suspend fun addRole(userId: String, role: String) = api.adminAddRole(userId, AdminRoleChange(role))
    suspend fun removeRole(userId: String, role: String) = api.adminRemoveRole(userId, AdminRoleChange(role))
    suspend fun ban(userId: String, reason: String) = api.adminBan(userId, AdminBanRequest(reason))
    suspend fun unban(userId: String) = api.adminUnban(userId)
    suspend fun adjust(userId: String, delta: Int, note: String) =
        api.adminAdjustBalance(userId, AdminAdjustRequest(delta, note))
    suspend fun broadcast(title: String, body: String) =
        api.adminBroadcast(AdminBroadcastRequest(title, body))
}
