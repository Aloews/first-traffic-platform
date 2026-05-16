# First Traffic Platform - DSP for RTB Traffic Arbitrage 🚀

Production-ready **Demand-Side Platform (DSP)** for real-time bidding (RTB) traffic arbitrage.

## 🎯 Features

- ✅ **RTB Engine** - Real-time bidding with smart optimization
- ✅ **Multi-Source Traffic** - Hilltop Ads, Clickadilla, Telegram Mini Apps
- ✅ **Campaign Management** - Create, launch, pause campaigns
- ✅ **Bid Strategies** - ROI_OPTIMIZED, CPA, CPM, CPC
- ✅ **Real-time Analytics** - Track impressions, clicks, conversions
- ✅ **JWT Authentication** - Secure API access
- ✅ **PostgreSQL Database** - Reliable data storage

## 🚀 Quick Start

```bash
npm install
cp .env.example .env
docker-compose up -d
npm run dev
```

Server: `http://localhost:3000`

## 📡 API Endpoints

### Auth
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login

### Campaigns
- `POST /api/campaigns` - Create campaign
- `GET /api/campaigns` - Get all campaigns
- `GET /api/campaigns/{id}` - Get campaign
- `POST /api/campaigns/{id}/launch` - Launch
- `POST /api/campaigns/{id}/pause` - Pause

### RTB
- `POST /api/rtb/bid` - Place bid
- `POST /api/rtb/impression/{id}` - Track impression
- `POST /api/rtb/click/{id}` - Track click
- `POST /api/rtb/conversion/{id}` - Track conversion

### Analytics
- `GET /api/analytics/stats` - Dashboard stats
- `GET /api/analytics/range` - Date range analytics

## 📊 Tech Stack

- Node.js 18+
- TypeScript
- Express.js
- PostgreSQL
- TypeORM
- JWT

## 📄 License

MIT
