# BlockScore API

On-chain reputation scoring backend for Solana wallets.

## Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | API info |
| `/health` | GET | Health check + cache stats |
| `/score/:wallet` | GET | Score a single wallet (supports .sol domains) |
| `/batch` | POST | Score up to 10 wallets |

## Usage

```bash
# Score a wallet
curl https://blockscore-api.onrender.com/score/toly.sol

# Batch scoring
curl -X POST https://blockscore-api.onrender.com/batch \
  -H "Content-Type: application/json" \
  -d '{"wallets": ["toly.sol", "raj.sol"]}'
```

## Local Development

```bash
npm install
npm run dev
```

## Deploy to Render

Connect this repo to Render and it will auto-deploy using `render.yaml`.
