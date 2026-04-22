# 🔥 Fire Arena Max

A production-oriented esports tournament platform: custom Node.js backend + native Android (Kotlin/Compose) client.

> **Important — real-money gaming disclaimer.** This software is a technical scaffold. Running a real-money gaming/fantasy-esports service in India (or most jurisdictions) is a **regulated activity**. Before going live you **must** consult a lawyer, register an entity, complete KYC/AML, obtain payment-aggregator approval for a gaming MCC, and comply with state-level gambling/skill-gaming laws, GST on deposits, and responsible-gaming rules. Do **not** deploy this publicly as-is.

## Repository layout

```
fire-arena-max/
├── backend/           Node + Express + TypeScript + Prisma + PostgreSQL + Socket.IO
├── android/           Kotlin + Jetpack Compose
├── docs/              Architecture, API, legal notes
├── index.html         Public privacy-policy page (existing)
└── .github/workflows/ CI for backend and Android
```

## Backend quick start

```bash
cd backend
cp .env.example .env
# edit .env – set DATABASE_URL, JWT_SECRET, RAZORPAY keys, OWNER_EMAIL, etc.
npm install
npx prisma generate
npx prisma migrate dev
npm run seed        # creates Owner "Zenus_Carlos" and admin raj998302@gmail.com
npm run dev
```

API runs on `http://localhost:4000`. Health check: `GET /health`.

## Android quick start

Open `android/` in Android Studio (Giraffe or later). Set `API_BASE_URL` in `app/src/main/res/values/config.xml` to your backend. Build & run on a device or emulator (API 26+).

## Deploy (Fly.io)

```bash
cd backend
fly launch --copy-config --dockerfile Dockerfile --name fire-arena-max-api --no-deploy
fly postgres create --name fire-arena-max-db && fly postgres attach fire-arena-max-db
fly secrets set JWT_SECRET=... RAZORPAY_KEY_ID=... RAZORPAY_KEY_SECRET=... OWNER_EMAIL=raj998302@gmail.com
fly deploy
```

## Roles (RBAC)

`OWNER`, `CO_OWNER`, `FAM_MANAGER`, `PAYMENT_MANAGER`, `TOURNAMENT_MANAGER`, `ADMIN`, `MODERATOR`, `VIP`, `USER`. A user can hold multiple roles. The seeded owner uses username `Zenus_Carlos`.

## Feature coverage

See [`docs/architecture.md`](docs/architecture.md) and [`docs/api.md`](docs/api.md). Honest status of each feature is tracked in [`docs/status.md`](docs/status.md) — some features are full implementations, others are MVP-level stubs. Treat this as a foundation to iterate on, not a finished product.

## License

Private / proprietary. All rights reserved.
