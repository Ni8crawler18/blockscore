# Historical Score Tracking - Design Document

## Overview

This document outlines how BlockScore could implement historical score tracking to show wallet reputation changes over time.

## Current State

BlockScore currently calculates wallet scores in real-time by querying Solana RPC endpoints. Each score is ephemeral and not stored anywhere.

## Proposed Architecture

### 1. Database Schema

```sql
-- Score snapshots table
CREATE TABLE score_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address VARCHAR(44) NOT NULL,
  score INTEGER NOT NULL,
  grade CHAR(1) NOT NULL,
  age_score INTEGER NOT NULL,
  activity_score INTEGER NOT NULL,
  balance_score INTEGER NOT NULL,
  diversity_score INTEGER NOT NULL,
  -- Stats at time of snapshot
  sol_balance DECIMAL(20, 9),
  staked_sol DECIMAL(20, 9),
  token_count INTEGER,
  nft_count INTEGER,
  tx_count INTEGER,
  oldest_tx_days INTEGER,
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  INDEX idx_wallet_created (wallet_address, created_at DESC)
);

-- Badges earned (point-in-time)
CREATE TABLE badge_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address VARCHAR(44) NOT NULL,
  badge_id VARCHAR(50) NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  snapshot_id UUID REFERENCES score_snapshots(id),
  
  INDEX idx_wallet_badges (wallet_address, earned_at DESC)
);
```

### 2. Data Collection Strategy

**Option A: On-Demand Snapshots**
- Save a snapshot whenever a user checks their score
- Pros: Low infrastructure cost, only tracks active users
- Cons: Irregular data points, gaps in history

**Option B: Scheduled Snapshots**
- Run a daily cron job to snapshot tracked wallets
- Pros: Consistent data points, better for charts
- Cons: Need to manage a "tracked wallets" list, higher costs

**Option C: Hybrid Approach (Recommended)**
- Save on-demand snapshots for all lookups
- Allow users to "subscribe" their wallet for daily tracking
- Premium feature: More frequent snapshots, longer history retention

### 3. API Endpoints

```typescript
// Get score history for a wallet
GET /api/history?wallet={address}&days=30

// Response
{
  "wallet": "...",
  "history": [
    {
      "date": "2024-01-15",
      "score": 75,
      "grade": "B",
      "breakdown": {
        "age": 20,
        "activity": 20,
        "balance": 15,
        "diversity": 20
      }
    },
    // ... more entries
  ],
  "trend": "up", // up, down, stable
  "change": +5  // vs first entry
}

// Subscribe wallet for tracking
POST /api/track
{ "wallet": "..." }

// Get badges timeline
GET /api/badges/history?wallet={address}
```

### 4. UI Components

**Score History Chart**
- Line chart showing score over time
- Toggle individual metrics (age, activity, balance, diversity)
- Hover to see specific values

**Trend Indicator**
- Show ↑/↓/→ arrows on score card
- "Score improved by 5 points this month"

**Badge Timeline**
- Visual timeline of when badges were earned
- "You earned 💎 Diamond Hands on Jan 15, 2024"

**Milestone Notifications**
- "Congratulations! Your score just hit 80!"
- "You've maintained A-grade for 30 days straight"

### 5. Implementation Phases

**Phase 1: Basic Storage**
- Add Vercel KV or Postgres database
- Store snapshots on each lookup
- Show "last checked" timestamp

**Phase 2: History View**
- Add /history page with chart
- Basic 30-day history view
- Weekly summary emails (opt-in)

**Phase 3: Advanced Features**
- Wallet subscriptions for daily tracking
- Badge achievements timeline
- Leaderboard history (historical rankings)
- Export history as CSV/JSON

**Phase 4: Insights & Analytics**
- "Your score peaked at 85 on March 15"
- "Activity score dropped after Feb 20"
- AI-generated insights ("Consider diversifying your holdings")
- Comparison with similar wallets

### 6. Storage Considerations

**Vercel KV (Redis)**
- Good for: Recent history, fast lookups
- Limitations: No complex queries, limited to 256MB on free tier
- Cost: ~$0.20/100K requests

**Vercel Postgres**
- Good for: Historical data, aggregations
- Limitations: 256MB storage on free tier
- Cost: ~$0.10/GB storage

**Supabase Alternative**
- 500MB free database
- Built-in row-level security
- Real-time subscriptions for live updates

### 7. Privacy Considerations

- All wallet data is already public on-chain
- Allow users to opt-out of tracking
- Implement data retention policy (e.g., 1 year max)
- No PII collected, only wallet addresses

### 8. Cost Estimates

For 10,000 tracked wallets with daily snapshots:
- Storage: ~10MB/month
- API calls: ~300K/month
- Estimated cost: ~$5-10/month on Vercel

### 9. Technical Decisions Needed

1. **Database choice**: Vercel KV vs Postgres vs Supabase
2. **Snapshot frequency**: On-demand only vs scheduled
3. **History retention**: 30 days vs 90 days vs unlimited
4. **Rate limiting**: How many snapshots per wallet per day

---

## Quick Start Implementation

To add basic history tracking today:

```typescript
// Add to /api/score/route.ts
import { kv } from '@vercel/kv'

// After calculating score
await kv.lpush(`history:${wallet}`, JSON.stringify({
  score: result.score,
  grade: result.grade,
  breakdown: result.breakdown,
  timestamp: Date.now()
}))
// Keep only last 30 entries
await kv.ltrim(`history:${wallet}`, 0, 29)
```

```typescript
// New /api/history/route.ts
export async function GET(req: Request) {
  const wallet = new URL(req.url).searchParams.get('wallet')
  const history = await kv.lrange(`history:${wallet}`, 0, -1)
  return Response.json({ history: history.map(h => JSON.parse(h)) })
}
```

This minimal implementation requires:
1. `npm install @vercel/kv`
2. Connect Vercel KV storage in dashboard
3. Add KV_REST_API_URL and KV_REST_API_TOKEN env vars
