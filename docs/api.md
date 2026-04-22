# API reference (v0.1)

All endpoints return JSON. Base path: `/api`. Auth: `Authorization: Bearer <accessToken>`.

## Auth
- `POST /auth/register` — `{email, username, password, displayName?, gameUid?, phone?, referralCode?}` → `{accessToken, refreshToken, user}`
- `POST /auth/login` — `{identifier, password}` → `{accessToken, refreshToken, user, roles}`
- `POST /auth/refresh` — `{refreshToken}` → `{accessToken}`
- `POST /auth/logout` — `{refreshToken}` → `{ok:true}`
- `POST /auth/logout-all` (auth)

## Users
- `GET /users/me` (auth) — current user incl. wallet, roles, vip status
- `PATCH /users/me` (auth)
- `GET /users/:username` — public profile

## Wallet
- `GET /wallet` (auth)
- `GET /wallet/transactions?limit=&cursor=` (auth)

## Payments
- `GET /payments/methods` (auth) — lists Razorpay enabled + manual UPI info
- `POST /payments/razorpay/order` — `{amountCoins}` → `{orderId, keyId, amountCoins, currency}`
- `POST /payments/razorpay/verify` — `{orderId, paymentId, signature}` → `{ok:true}`
- `POST /payments/upi/submit` — `{amountCoins, utr, upiId?, screenshotUrl?}` (duplicate UTR blocked server-side)
- `GET /payments/me`
- **Admin** (`PAYMENT_MANAGER` or higher):
  - `GET /payments/admin/pending`
  - `POST /payments/admin/:id/approve`
  - `POST /payments/admin/:id/reject` — `{reason}`

## Withdrawals
- `POST /withdrawals/request` (auth) — `{amountCoins, upiId, accountName?}` (locks coins)
- `GET /withdrawals/me`
- **Admin**:
  - `GET /withdrawals/admin/pending`
  - `POST /withdrawals/admin/:id/approve` — `{payoutRef?}`
  - `POST /withdrawals/admin/:id/reject` — `{reason}`
  - `POST /withdrawals/admin/:id/paid` — `{payoutRef}`

## Tournaments
- `GET /tournaments?status=`
- `GET /tournaments/me`
- `GET /tournaments/:id`
- `POST /tournaments/:id/join` — `{gameUid, teamId?}`
- `POST /tournaments/:id/leave`
- **Tournament manager**:
  - `POST /tournaments` — create
  - `PATCH /tournaments/:id`
  - `POST /tournaments/:id/status` — `{status}`
  - `POST /tournaments/:id/room` — `{roomId, roomPassword}` (sets LIVE)
  - `POST /tournaments/:id/results` — `{results:[{userId, kills?, prizeCoins}]}`

## VIP
- `GET /vip/plans`
- `GET /vip/me`
- `POST /vip/purchase` — `{planCode}`

## Teams
- `GET /teams`, `GET /teams/me`, `GET /teams/:id`
- `POST /teams` — `{name, tag, description?, logoUrl?}`
- `POST /teams/:id/{join,leave,kick}`

## Chat
- `GET /chat/channels`
- `POST /chat/channels/private` — `{otherUserId}`
- `GET /chat/channels/:id/messages?limit=&before=`
- `POST /chat/channels/:id/messages` — `{body, attachmentUrl?}`
- `POST /chat/messages/:id/read`
- `DELETE /chat/messages/:id`
- `POST /chat/channels/:id/mute` (mod) — `{userId, minutes}`

**Socket.IO** (same port, path `/socket.io`):
- Auth: `io(url, { auth: { token: accessToken } })`
- Events: `chat:join(channelId, ack)`, `chat:leave(channelId)`, `chat:send({channelId, body, attachmentUrl}, ack)`, `chat:read(messageId, ack)`
- Server emits: `chat:message`, `chat:read`

## Referrals
- `GET /referrals/me` — code, total referred, total earned, list

## Notifications
- `GET /notifications`
- `POST /notifications/read-all`

## Leaderboard
- `GET /leaderboard/winnings`
- `GET /leaderboard/kills`
- `GET /leaderboard/referrers`

## Events
- `GET /events/active`
- Admin: `GET /events`, `POST /events`, `POST /events/:id/active`

## Admin
- `GET /admin/stats`
- `GET /admin/users?search=&limit=&cursor=`
- `GET /admin/users/:id`
- `POST /admin/users/:id/roles/add` — `{role}`
- `POST /admin/users/:id/roles/remove` — `{role}`
- `POST /admin/users/:id/ban` — `{reason}`
- `POST /admin/users/:id/unban`
- `POST /admin/users/:id/adjust` — `{delta, note}`
- `GET /admin/maintenance`, `POST /admin/maintenance` (owner) — `{enabled, message?}`
- `POST /admin/broadcast` — `{title, body}`
- `GET /admin/audit`
