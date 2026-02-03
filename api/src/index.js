const express = require('express');
const cors = require('cors');
const { Connection, PublicKey } = require('@solana/web3.js');
const NodeCache = require('node-cache');

const app = express();
app.use(cors());
app.use(express.json());

// Cache scores for 5 minutes to reduce RPC calls
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
const connection = new Connection(RPC_URL, 'confirmed');

// SNS Resolution via Bonfida API
async function resolveSNS(domain) {
  const name = domain.replace(/\.sol$/i, '');
  try {
    const res = await fetch(`https://sns-api.bonfida.com/v2/resolve/${name}`);
    const data = await res.json();
    if (data.success && data.result) return data.result;
  } catch (e) {}
  return null;
}

// Core scoring logic
async function scoreWallet(address) {
  const cached = cache.get(address);
  if (cached) return cached;

  const pubkey = new PublicKey(address);
  
  // Parallel fetch for speed
  const [accountInfo, signatures, tokenAccounts, balance] = await Promise.all([
    connection.getAccountInfo(pubkey).catch(() => null),
    connection.getSignaturesForAddress(pubkey, { limit: 1000 }).catch(() => []),
    connection.getParsedTokenAccountsByOwner(pubkey, { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }).catch(() => ({ value: [] })),
    connection.getBalance(pubkey).catch(() => 0)
  ]);

  const txCount = signatures.length;
  const solBalance = balance / 1e9;
  const tokenCount = tokenAccounts.value?.length || 0;

  // Calculate age from first transaction
  let ageInDays = 0;
  if (signatures.length > 0) {
    const oldest = signatures[signatures.length - 1];
    if (oldest.blockTime) {
      ageInDays = Math.floor((Date.now() / 1000 - oldest.blockTime) / 86400);
    }
  }

  // Scoring with reasons
  const breakdown = {
    age: scoreAge(ageInDays),
    activity: scoreActivity(txCount),
    balance: scoreBalance(solBalance),
    diversity: scoreDiversity(tokenCount)
  };

  const totalScore = Math.min(100, Math.round(
    breakdown.age.score + breakdown.activity.score + breakdown.balance.score + breakdown.diversity.score
  ));

  const grade = getGrade(totalScore);
  const badges = calculateBadges(totalScore, ageInDays, txCount, solBalance, tokenCount, grade);

  const result = {
    wallet: address,
    score: totalScore,
    grade,
    breakdown,
    badges,
    meta: { ageInDays, txCount, solBalance, tokenCount },
    timestamp: new Date().toISOString()
  };

  cache.set(address, result);
  return result;
}

function scoreAge(days) {
  let score = 0, reason = '', details = '';
  if (days >= 1095) { score = 25; reason = 'OG wallet'; details = `${days} days - veteran status`; }
  else if (days >= 730) { score = 20; reason = 'Established wallet'; details = `${days} days old`; }
  else if (days >= 365) { score = 15; reason = 'Mature wallet'; details = `${days} days old`; }
  else if (days >= 180) { score = 10; reason = 'Growing wallet'; details = `${days} days old`; }
  else if (days >= 30) { score = 5; reason = 'Young wallet'; details = `${days} days old`; }
  else { score = 2; reason = 'New wallet'; details = `${days} days old`; }
  return { score, maxScore: 25, reason, details };
}

function scoreActivity(txCount) {
  let score = 0, reason = '', details = '';
  if (txCount >= 1000) { score = 25; reason = 'Highly active'; details = `${txCount}+ transactions`; }
  else if (txCount >= 500) { score = 20; reason = 'Very active'; details = `${txCount} transactions`; }
  else if (txCount >= 100) { score = 15; reason = 'Active'; details = `${txCount} transactions`; }
  else if (txCount >= 25) { score = 10; reason = 'Moderate activity'; details = `${txCount} transactions`; }
  else if (txCount >= 5) { score = 5; reason = 'Light activity'; details = `${txCount} transactions`; }
  else { score = 2; reason = 'Minimal activity'; details = `${txCount} transactions`; }
  return { score, maxScore: 25, reason, details };
}

function scoreBalance(sol) {
  let score = 0, reason = '', details = '';
  if (sol >= 100) { score = 25; reason = 'Whale'; details = `${sol.toFixed(2)} SOL`; }
  else if (sol >= 50) { score = 20; reason = 'Large holder'; details = `${sol.toFixed(2)} SOL`; }
  else if (sol >= 10) { score = 15; reason = 'Solid balance'; details = `${sol.toFixed(2)} SOL`; }
  else if (sol >= 1) { score = 10; reason = 'Moderate balance'; details = `${sol.toFixed(2)} SOL`; }
  else if (sol >= 0.1) { score = 5; reason = 'Small balance'; details = `${sol.toFixed(2)} SOL`; }
  else { score = 2; reason = 'Dust balance'; details = `${sol.toFixed(4)} SOL`; }
  return { score, maxScore: 25, reason, details };
}

function scoreDiversity(tokenCount) {
  let score = 0, reason = '', details = '';
  if (tokenCount >= 20) { score = 25; reason = 'Highly diversified'; details = `${tokenCount} tokens`; }
  else if (tokenCount >= 10) { score = 20; reason = 'Well diversified'; details = `${tokenCount} tokens`; }
  else if (tokenCount >= 5) { score = 15; reason = 'Diversified'; details = `${tokenCount} tokens`; }
  else if (tokenCount >= 2) { score = 10; reason = 'Some diversity'; details = `${tokenCount} tokens`; }
  else if (tokenCount >= 1) { score = 5; reason = 'Single token'; details = `${tokenCount} token`; }
  else { score = 2; reason = 'No tokens'; details = 'SOL only'; }
  return { score, maxScore: 25, reason, details };
}

function getGrade(score) {
  if (score >= 95) return 'S';
  if (score >= 80) return 'A';
  if (score >= 60) return 'B';
  if (score >= 40) return 'C';
  if (score >= 20) return 'D';
  return 'F';
}

function calculateBadges(score, age, txCount, sol, tokens, grade) {
  const badges = [];
  if (grade === 'S') badges.push({ name: 'S-Tier', icon: '👑', rarity: 'legendary' });
  if (score === 100) badges.push({ name: 'Perfect Score', icon: '⭐', rarity: 'legendary' });
  if (age >= 1095) badges.push({ name: 'OG Holder', icon: '👴', rarity: 'legendary' });
  if (age >= 365) badges.push({ name: 'Diamond Hands', icon: '💎', rarity: 'epic' });
  if (sol >= 100) badges.push({ name: 'Whale', icon: '🐋', rarity: 'epic' });
  if (txCount >= 1000) badges.push({ name: 'Active Trader', icon: '📈', rarity: 'epic' });
  if (tokens >= 20) badges.push({ name: 'Token Collector', icon: '🌈', rarity: 'epic' });
  if (sol >= 10 && sol < 100) badges.push({ name: 'Dolphin', icon: '🐬', rarity: 'rare' });
  if (txCount >= 100 && txCount < 1000) badges.push({ name: 'Frequent User', icon: '⚡', rarity: 'rare' });
  if (age < 30) badges.push({ name: 'Fresh Wallet', icon: '🌱', rarity: 'common' });
  return badges;
}

// Routes
app.get('/', (req, res) => {
  res.json({
    name: 'BlockScore API',
    version: '1.0.0',
    endpoints: {
      'GET /score/:wallet': 'Get reputation score for a wallet',
      'POST /batch': 'Score multiple wallets (max 10)',
      'GET /health': 'Health check'
    },
    docs: 'https://blockscore.vercel.app/docs'
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', cache: cache.getStats(), timestamp: new Date().toISOString() });
});

app.get('/score/:wallet', async (req, res) => {
  try {
    let wallet = req.params.wallet;
    
    // Handle SNS domains
    if (wallet.endsWith('.sol')) {
      const resolved = await resolveSNS(wallet);
      if (!resolved) return res.status(400).json({ error: 'Could not resolve .sol domain' });
      wallet = resolved;
    }
    
    // Validate address
    try { new PublicKey(wallet); } 
    catch { return res.status(400).json({ error: 'Invalid Solana address' }); }
    
    const result = await scoreWallet(wallet);
    res.json(result);
  } catch (err) {
    console.error('Score error:', err);
    res.status(500).json({ error: 'Failed to score wallet', message: err.message });
  }
});

app.post('/batch', async (req, res) => {
  try {
    const { wallets } = req.body;
    if (!Array.isArray(wallets) || wallets.length === 0) {
      return res.status(400).json({ error: 'Provide wallets array' });
    }
    if (wallets.length > 10) {
      return res.status(400).json({ error: 'Max 10 wallets per batch' });
    }
    
    const results = await Promise.all(wallets.map(async (w) => {
      try {
        let wallet = w;
        if (wallet.endsWith('.sol')) {
          const resolved = await resolveSNS(wallet);
          if (!resolved) return { wallet: w, error: 'Could not resolve .sol domain' };
          wallet = resolved;
        }
        return await scoreWallet(wallet);
      } catch (err) {
        return { wallet: w, error: err.message };
      }
    }));
    
    res.json({ results, count: results.length });
  } catch (err) {
    res.status(500).json({ error: 'Batch scoring failed', message: err.message });
  }
});

// Cache management (for future on-chain sync)
app.post('/cache/clear', (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  cache.flushAll();
  res.json({ status: 'Cache cleared' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`BlockScore API running on port ${PORT}`);
});
