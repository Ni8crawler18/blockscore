const express = require('express');
const cors = require('cors');
const { Connection, PublicKey } = require('@solana/web3.js');
const NodeCache = require('node-cache');

const app = express();
app.use(cors());
app.use(express.json());

// Cache scores for 5 minutes to reduce RPC calls
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

// ========== AGENTIC MONITORING ==========

// In-memory watchlist storage (lightweight for free tier)
const watchlist = new Map(); // wallet -> { addedAt, lastScore, previousScore, scoreHistory }

// Score change history for tracking
const scoreChanges = []; // { wallet, oldScore, newScore, change, timestamp }

// Colosseum Forum API config
const COLOSSEUM_API_KEY = '34e8e64e203b450286b7f1de43e48ab1eea69d4675e09545585f30ad3524bcd6';
const COLOSSEUM_API_URL = 'https://api.colosseum.org/forum'; // Placeholder - update with real endpoint

const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
const connection = new Connection(RPC_URL, 'confirmed');

// SNS Resolution via Bonfida SDK Proxy
async function resolveSNS(domain) {
  const name = domain.replace(/\.sol$/i, '');
  try {
    const res = await fetch(`https://sns-sdk-proxy.bonfida.workers.dev/resolve/${name}`);
    const data = await res.json();
    if (data.s === 'ok' && data.result) return data.result;
  } catch (e) {
    console.error('SNS resolution error:', e.message);
  }
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
    version: '1.1.0',
    endpoints: {
      'GET /score/:wallet': 'Get reputation score for a wallet',
      'POST /batch': 'Score multiple wallets (max 10)',
      'GET /health': 'Health check',
      'POST /watch': 'Add wallet to watchlist',
      'DELETE /watch/:wallet': 'Remove wallet from watchlist',
      'GET /watchlist': 'List watched wallets with scores',
      'POST /rescore/:wallet': 'Rescore wallet with change detection',
      'POST /watchlist/rescore': 'Bulk rescore all watched wallets',
      'GET /report': 'Daily summary report of watchlist',
      'GET /forum/preview': 'Preview forum alert post',
      'POST /forum/post': 'Post alert to Colosseum (admin only)'
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

// ========== WATCHLIST ENDPOINTS ==========

// Add wallet to watchlist
app.post('/watch', async (req, res) => {
  try {
    let { wallet } = req.body;
    if (!wallet) return res.status(400).json({ error: 'Wallet address required' });
    
    // Handle SNS domains
    if (wallet.endsWith('.sol')) {
      const resolved = await resolveSNS(wallet);
      if (!resolved) return res.status(400).json({ error: 'Could not resolve .sol domain' });
      wallet = resolved;
    }
    
    // Validate address
    try { new PublicKey(wallet); }
    catch { return res.status(400).json({ error: 'Invalid Solana address' }); }
    
    if (watchlist.has(wallet)) {
      return res.status(409).json({ error: 'Wallet already in watchlist', wallet });
    }
    
    // Get initial score
    const score = await scoreWallet(wallet);
    
    watchlist.set(wallet, {
      addedAt: new Date().toISOString(),
      lastScore: score.score,
      lastGrade: score.grade,
      previousScore: null,
      scoreHistory: [{ score: score.score, timestamp: new Date().toISOString() }]
    });
    
    res.json({ 
      status: 'added', 
      wallet, 
      currentScore: score.score,
      grade: score.grade,
      watchlistSize: watchlist.size 
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add wallet', message: err.message });
  }
});

// Remove wallet from watchlist
app.delete('/watch/:wallet', (req, res) => {
  const wallet = req.params.wallet;
  
  if (!watchlist.has(wallet)) {
    return res.status(404).json({ error: 'Wallet not in watchlist' });
  }
  
  watchlist.delete(wallet);
  res.json({ status: 'removed', wallet, watchlistSize: watchlist.size });
});

// List all watched wallets
app.get('/watchlist', (req, res) => {
  const wallets = [];
  watchlist.forEach((data, wallet) => {
    wallets.push({
      wallet,
      ...data,
      scoreChange: data.previousScore !== null ? data.lastScore - data.previousScore : null
    });
  });
  
  // Sort by score descending
  wallets.sort((a, b) => b.lastScore - a.lastScore);
  
  res.json({ 
    count: wallets.length, 
    wallets,
    recentChanges: scoreChanges.slice(-20) // Last 20 changes
  });
});

// ========== SCORE WITH CHANGE DETECTION ==========

// Rescore a watched wallet and detect changes
app.post('/rescore/:wallet', async (req, res) => {
  try {
    let wallet = req.params.wallet;
    
    // Handle SNS domains
    if (wallet.endsWith('.sol')) {
      const resolved = await resolveSNS(wallet);
      if (!resolved) return res.status(400).json({ error: 'Could not resolve .sol domain' });
      wallet = resolved;
    }
    
    // Clear cache to get fresh score
    cache.del(wallet);
    
    const newScore = await scoreWallet(wallet);
    const watchData = watchlist.get(wallet);
    
    let changeInfo = null;
    
    if (watchData) {
      const previousScore = watchData.lastScore;
      const change = newScore.score - previousScore;
      const significantChange = Math.abs(change) > 5;
      
      // Update watchlist
      watchData.previousScore = previousScore;
      watchData.lastScore = newScore.score;
      watchData.lastGrade = newScore.grade;
      watchData.scoreHistory.push({ score: newScore.score, timestamp: new Date().toISOString() });
      
      // Keep history manageable (last 50 entries)
      if (watchData.scoreHistory.length > 50) {
        watchData.scoreHistory = watchData.scoreHistory.slice(-50);
      }
      
      changeInfo = {
        previousScore,
        newScore: newScore.score,
        change,
        significantChange,
        direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
      };
      
      // Track significant changes
      if (significantChange) {
        scoreChanges.push({
          wallet,
          oldScore: previousScore,
          newScore: newScore.score,
          change,
          timestamp: new Date().toISOString()
        });
        
        // Keep changes log manageable
        if (scoreChanges.length > 100) {
          scoreChanges.shift();
        }
      }
    }
    
    res.json({
      ...newScore,
      changeInfo,
      isWatched: !!watchData
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to rescore wallet', message: err.message });
  }
});

// ========== AUTO-REPORT ENDPOINT ==========

app.get('/report', async (req, res) => {
  try {
    const wallets = [];
    const now = new Date();
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
    
    // Gather all watchlist data
    watchlist.forEach((data, wallet) => {
      wallets.push({
        wallet,
        score: data.lastScore,
        grade: data.lastGrade,
        previousScore: data.previousScore,
        change: data.previousScore !== null ? data.lastScore - data.previousScore : null,
        addedAt: data.addedAt
      });
    });
    
    if (wallets.length === 0) {
      return res.json({
        generated: now.toISOString(),
        summary: 'No wallets in watchlist',
        watchlistCount: 0
      });
    }
    
    // Sort for analysis
    const sorted = [...wallets].sort((a, b) => b.score - a.score);
    const topPerformers = sorted.slice(0, 5);
    const bottomPerformers = sorted.slice(-5).reverse();
    
    // Find significant changes (>5 points)
    const significantChanges = wallets
      .filter(w => w.change !== null && Math.abs(w.change) > 5)
      .sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
    
    // Recent changes in last 24h
    const recentChanges = scoreChanges.filter(c => new Date(c.timestamp) > oneDayAgo);
    
    // Calculate stats
    const avgScore = wallets.reduce((sum, w) => sum + w.score, 0) / wallets.length;
    const gradeDistribution = {};
    wallets.forEach(w => {
      gradeDistribution[w.grade] = (gradeDistribution[w.grade] || 0) + 1;
    });
    
    res.json({
      generated: now.toISOString(),
      summary: {
        watchlistCount: wallets.length,
        averageScore: Math.round(avgScore * 10) / 10,
        gradeDistribution
      },
      topPerformers: topPerformers.map(w => ({
        wallet: w.wallet,
        score: w.score,
        grade: w.grade
      })),
      bottomPerformers: bottomPerformers.map(w => ({
        wallet: w.wallet,
        score: w.score,
        grade: w.grade
      })),
      significantChanges: significantChanges.slice(0, 10),
      recentChanges24h: recentChanges,
      alerts: significantChanges.length > 0 
        ? `${significantChanges.length} wallet(s) with score changes > 5 points`
        : 'No significant score changes detected'
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate report', message: err.message });
  }
});

// ========== COLOSSEUM FORUM AUTO-POST (PREPARED) ==========

// Function to post score alerts to Colosseum forum
// Call manually via POST /forum/post or integrate into automated workflow
async function postToColosseumForum(title, content, category = 'alerts') {
  try {
    const response = await fetch(COLOSSEUM_API_URL + '/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${COLOSSEUM_API_KEY}`,
        'X-API-Key': COLOSSEUM_API_KEY
      },
      body: JSON.stringify({
        title,
        content,
        category
      })
    });
    
    if (!response.ok) {
      throw new Error(`Forum API returned ${response.status}`);
    }
    
    return await response.json();
  } catch (err) {
    console.error('Colosseum post failed:', err.message);
    return { error: err.message };
  }
}

// Generate alert message for significant score changes
function generateScoreAlert(changes) {
  if (changes.length === 0) return null;
  
  const lines = changes.map(c => {
    const direction = c.change > 0 ? '📈' : '📉';
    const sign = c.change > 0 ? '+' : '';
    return `${direction} \`${c.wallet.slice(0, 8)}...\`: ${c.oldScore} → ${c.newScore} (${sign}${c.change})`;
  });
  
  return {
    title: `🔔 BlockScore Alert: ${changes.length} Significant Score Change(s)`,
    content: `**Wallet Score Changes Detected**\n\n${lines.join('\n')}\n\n---\n*Generated by BlockScore Monitoring*`
  };
}

// Manual trigger for forum post (doesn't auto-run)
app.post('/forum/post', async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const recentSignificant = scoreChanges.filter(c => {
    const changeAge = Date.now() - new Date(c.timestamp).getTime();
    return changeAge < 24 * 60 * 60 * 1000; // Last 24h
  });
  
  if (recentSignificant.length === 0) {
    return res.json({ status: 'skipped', message: 'No significant changes to report' });
  }
  
  const alert = generateScoreAlert(recentSignificant);
  const result = await postToColosseumForum(alert.title, alert.content);
  
  res.json({ 
    status: 'posted', 
    changesReported: recentSignificant.length,
    result 
  });
});

// Dry-run: preview what would be posted
app.get('/forum/preview', (req, res) => {
  const recentSignificant = scoreChanges.filter(c => {
    const changeAge = Date.now() - new Date(c.timestamp).getTime();
    return changeAge < 24 * 60 * 60 * 1000;
  });
  
  if (recentSignificant.length === 0) {
    return res.json({ preview: null, message: 'No significant changes to report' });
  }
  
  const alert = generateScoreAlert(recentSignificant);
  res.json({ preview: alert, changesCount: recentSignificant.length });
});

// ========== BULK RESCORE WATCHLIST ==========

app.post('/watchlist/rescore', async (req, res) => {
  try {
    const results = [];
    const significantChanges = [];
    
    for (const [wallet, data] of watchlist) {
      // Clear cache for fresh score
      cache.del(wallet);
      
      const newScore = await scoreWallet(wallet);
      const change = newScore.score - data.lastScore;
      
      // Update watchlist
      data.previousScore = data.lastScore;
      data.lastScore = newScore.score;
      data.lastGrade = newScore.grade;
      data.scoreHistory.push({ score: newScore.score, timestamp: new Date().toISOString() });
      
      if (data.scoreHistory.length > 50) {
        data.scoreHistory = data.scoreHistory.slice(-50);
      }
      
      const result = {
        wallet,
        previousScore: data.previousScore,
        newScore: newScore.score,
        change,
        significantChange: Math.abs(change) > 5
      };
      
      results.push(result);
      
      if (Math.abs(change) > 5) {
        significantChanges.push(result);
        scoreChanges.push({
          wallet,
          oldScore: data.previousScore,
          newScore: newScore.score,
          change,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    res.json({
      rescored: results.length,
      results,
      significantChanges,
      alertCount: significantChanges.length
    });
  } catch (err) {
    res.status(500).json({ error: 'Bulk rescore failed', message: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`BlockScore API running on port ${PORT}`);
  console.log('Agentic monitoring features enabled: /watch, /watchlist, /report, /forum/*');
});
