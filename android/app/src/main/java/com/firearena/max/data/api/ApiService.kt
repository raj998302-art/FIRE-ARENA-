package com.firearena.max.data.api

import retrofit2.http.*

interface ApiService {
    // --- Auth ---
    @POST("api/auth/register")
    suspend fun register(@Body body: RegisterRequest): AuthResponse

    @POST("api/auth/login")
    suspend fun login(@Body body: LoginRequest): AuthResponse

    @POST("api/auth/refresh")
    suspend fun refresh(@Body body: RefreshRequest): AccessTokenResponse

    @POST("api/auth/logout")
    suspend fun logout(@Body body: RefreshRequest): GenericOk

    // --- Users ---
    @GET("api/users/me")
    suspend fun me(): Me

    @PATCH("api/users/me")
    suspend fun updateMe(@Body body: Map<String, String>): User

    // --- Wallet ---
    @GET("api/wallet")
    suspend fun wallet(): Wallet

    @GET("api/wallet/transactions")
    suspend fun walletTransactions(@Query("limit") limit: Int = 50): List<WalletTx>

    // --- Payments ---
    @GET("api/payments/methods")
    suspend fun paymentMethods(): PaymentMethods

    @POST("api/payments/razorpay/order")
    suspend fun createRazorpayOrder(@Body body: RazorpayOrderRequest): RazorpayOrderResponse

    @POST("api/payments/razorpay/vip-order")
    suspend fun createRazorpayVipOrder(@Body body: RazorpayVipOrderRequest): RazorpayOrderResponse

    @POST("api/payments/razorpay/verify")
    suspend fun verifyRazorpay(@Body body: RazorpayVerifyRequest): RazorpayVerifyResponse

    @POST("api/payments/upi/submit")
    suspend fun submitUtr(@Body body: UpiSubmitRequest): Payment

    @GET("api/payments/me")
    suspend fun myPayments(): List<Payment>

    @GET("api/payments/admin/pending")
    suspend fun adminPendingPayments(): List<Payment>

    @POST("api/payments/admin/{id}/approve")
    suspend fun adminApprovePayment(@Path("id") id: String): GenericOk

    @POST("api/payments/admin/{id}/reject")
    suspend fun adminRejectPayment(@Path("id") id: String, @Body body: AdminRejectRequest): GenericOk

    // --- Withdrawals ---
    @POST("api/withdrawals/request")
    suspend fun requestWithdrawal(@Body body: WithdrawRequest): Withdrawal

    @GET("api/withdrawals/me")
    suspend fun myWithdrawals(): List<Withdrawal>

    @GET("api/withdrawals/admin/pending")
    suspend fun adminPendingWithdrawals(): List<Withdrawal>

    @POST("api/withdrawals/admin/{id}/approve")
    suspend fun adminApproveWithdrawal(@Path("id") id: String, @Body body: AdminApprovePayout): GenericOk

    @POST("api/withdrawals/admin/{id}/reject")
    suspend fun adminRejectWithdrawal(@Path("id") id: String, @Body body: AdminRejectRequest): GenericOk

    @POST("api/withdrawals/admin/{id}/paid")
    suspend fun adminMarkWithdrawalPaid(@Path("id") id: String, @Body body: AdminMarkPaid): Withdrawal

    // --- Tournaments ---
    @GET("api/tournaments")
    suspend fun tournaments(@Query("status") status: String? = null): List<Tournament>

    @GET("api/tournaments/me")
    suspend fun myTournaments(): List<Tournament>

    @GET("api/tournaments/{id}")
    suspend fun tournament(@Path("id") id: String): Tournament

    @POST("api/tournaments/{id}/join")
    suspend fun joinTournament(@Path("id") id: String, @Body body: JoinTournamentRequest): Map<String, String>

    @POST("api/tournaments/{id}/leave")
    suspend fun leaveTournament(@Path("id") id: String): GenericOk

    @POST("api/tournaments")
    suspend fun createTournament(@Body body: CreateTournamentRequest): Tournament

    // --- VIP ---
    @GET("api/vip/plans")
    suspend fun vipPlans(): List<VipPlan>

    @GET("api/vip/me")
    suspend fun vipStatus(): VipStatus

    @POST("api/vip/purchase")
    suspend fun vipPurchase(@Body body: VipPurchaseRequest): VipSubscription

    // --- Teams ---
    @GET("api/teams")
    suspend fun teams(): List<Team>

    @GET("api/teams/me")
    suspend fun myTeams(): List<Team>

    @POST("api/teams")
    suspend fun createTeam(@Body body: CreateTeamRequest): Team

    @POST("api/teams/{id}/join")
    suspend fun joinTeam(@Path("id") id: String): GenericOk

    @POST("api/teams/{id}/leave")
    suspend fun leaveTeam(@Path("id") id: String): GenericOk

    // --- Chat ---
    @GET("api/chat/channels")
    suspend fun chatChannels(): List<ChatChannel>

    @GET("api/chat/channels/{id}/messages")
    suspend fun chatMessages(@Path("id") id: String, @Query("limit") limit: Int = 50): List<ChatMessage>

    @POST("api/chat/channels/{id}/messages")
    suspend fun sendChatMessage(@Path("id") id: String, @Body body: SendMessageRequest): ChatMessage

    // --- Notifications ---
    @GET("api/notifications")
    suspend fun notifications(): List<Notification>

    @POST("api/notifications/read-all")
    suspend fun readAllNotifications(): Map<String, Int>

    // --- Referrals ---
    @GET("api/referrals/me")
    suspend fun referralSummary(): ReferralSummary

    // --- Leaderboard ---
    @GET("api/leaderboard/winnings")
    suspend fun leaderboardWinnings(): List<LeaderboardRow>

    @GET("api/leaderboard/kills")
    suspend fun leaderboardKills(): List<LeaderboardRow>

    @GET("api/leaderboard/referrers")
    suspend fun leaderboardReferrers(): List<LeaderboardRow>

    // --- Admin ---
    @GET("api/admin/stats")
    suspend fun adminStats(): AdminStats

    @GET("api/admin/users")
    suspend fun adminUsers(@Query("search") search: String? = null): List<Me>

    @POST("api/admin/users/{id}/roles/add")
    suspend fun adminAddRole(@Path("id") id: String, @Body body: AdminRoleChange): GenericOk

    @POST("api/admin/users/{id}/roles/remove")
    suspend fun adminRemoveRole(@Path("id") id: String, @Body body: AdminRoleChange): GenericOk

    @POST("api/admin/users/{id}/ban")
    suspend fun adminBan(@Path("id") id: String, @Body body: AdminBanRequest): User

    @POST("api/admin/users/{id}/unban")
    suspend fun adminUnban(@Path("id") id: String): User

    @POST("api/admin/users/{id}/adjust")
    suspend fun adminAdjustBalance(@Path("id") id: String, @Body body: AdminAdjustRequest): GenericOk

    @POST("api/admin/broadcast")
    suspend fun adminBroadcast(@Body body: AdminBroadcastRequest): Map<String, String>

    @POST("api/admin/maintenance")
    suspend fun adminSetMaintenance(@Body body: MaintenanceRequest): Map<String, String>

    @GET("api/admin/maintenance")
    suspend fun adminGetMaintenance(): Map<String, String>

    // --- OAuth ---
    @POST("api/auth/oauth/google")
    suspend fun oauthGoogle(@Body body: GoogleSignInRequest): AuthResponse

    @POST("api/auth/oauth/discord")
    suspend fun oauthDiscord(@Body body: DiscordSignInRequest): AuthResponse

    // --- Rewards ---
    @GET("api/rewards/spin/status")
    suspend fun spinStatus(): SpinStatus

    @POST("api/rewards/spin")
    suspend fun doSpin(): SpinResult

    @POST("api/rewards/promo/redeem")
    suspend fun redeemPromo(@Body body: PromoRedeemRequest): PromoRedeemResult

    @GET("api/rewards/admin/promos")
    suspend fun adminListPromos(): List<PromoCode>

    @POST("api/rewards/admin/promos")
    suspend fun adminCreatePromo(@Body body: CreatePromoRequest): PromoCode

    @POST("api/rewards/admin/promos/{code}/deactivate")
    suspend fun adminDeactivatePromo(@Path("code") code: String): PromoCode

    // --- Push ---
    @POST("api/notifications/push-token")
    suspend fun registerPushToken(@Body body: PushTokenRequest): GenericOk
}
