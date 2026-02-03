# BlockScore Anchor Program

On-chain wallet reputation scoring system built with Anchor for Solana.

## Overview

BlockScore stores wallet reputation scores on-chain using Program Derived Addresses (PDAs). Each scored wallet gets its own account containing:

- **Score**: 0-1000 (representing 0.0-100.0%)
- **Grade**: Letter grade (A+, A, B, C, D, F)
- **Metadata**: Optional JSON string for additional data
- **Timestamps**: When the score was last updated
- **Update count**: How many times the score has changed

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    BlockScore Program                    │
├─────────────────────────────────────────────────────────┤
│  ProgramConfig (PDA: ["config"])                        │
│  ├── authority: Pubkey                                   │
│  ├── total_scores: u64                                   │
│  └── bump: u8                                            │
├─────────────────────────────────────────────────────────┤
│  ScoreAccount (PDA: ["score", wallet_pubkey])           │
│  ├── wallet: Pubkey                                      │
│  ├── score: u16 (0-1000)                                │
│  ├── grade: String (max 3 chars)                        │
│  ├── metadata: String (max 256 chars)                   │
│  ├── last_updated: i64                                   │
│  ├── update_count: u32                                   │
│  └── bump: u8                                            │
├─────────────────────────────────────────────────────────┤
│  AgentAccount (PDA: ["agent", agent_pubkey])            │
│  ├── authority: Pubkey                                   │
│  ├── agent: Pubkey                                       │
│  ├── is_active: bool                                     │
│  ├── created_at: i64                                     │
│  └── bump: u8                                            │
└─────────────────────────────────────────────────────────┘
```

## Instructions

| Instruction | Description | Access |
|-------------|-------------|--------|
| `initialize` | Set up program with authority | Once, by deployer |
| `record_score` | Store/update a wallet's score | Authority or Agent |
| `add_agent` | Add authorized scoring agent | Authority only |
| `remove_agent` | Deactivate an agent | Authority only |
| `transfer_authority` | Change program authority | Authority only |

## Prerequisites

- [Rust](https://rustup.rs/) (1.70+)
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools) (1.17+)
- [Anchor](https://www.anchor-lang.com/docs/installation) (0.29+)
- [Node.js](https://nodejs.org/) (18+)
- [Yarn](https://yarnpkg.com/) or npm

## Installation

```bash
# Clone and enter directory
cd blockscore/anchor

# Install dependencies
npm install
# or
yarn install

# Build the program
anchor build
```

## Deployment to Devnet

### 1. Configure Solana for Devnet

```bash
# Set cluster to devnet
solana config set --url devnet

# Check config
solana config get
```

### 2. Create/Fund a Wallet

```bash
# Generate new keypair (or use existing)
solana-keygen new -o ~/.config/solana/id.json

# Get devnet SOL (run multiple times if needed)
solana airdrop 2
solana airdrop 2

# Check balance
solana balance
```

### 3. Generate Program Keypair

```bash
# Generate program keypair
solana-keygen new -o target/deploy/blockscore-keypair.json

# Get the program ID
solana address -k target/deploy/blockscore-keypair.json
```

### 4. Update Program ID

Edit `programs/blockscore/src/lib.rs`:
```rust
declare_id!("YOUR_PROGRAM_ID_HERE");
```

Also update `Anchor.toml`:
```toml
[programs.devnet]
blockscore = "YOUR_PROGRAM_ID_HERE"
```

### 5. Build and Deploy

```bash
# Build with new program ID
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Or use the npm script
npm run deploy:devnet
```

### 6. Initialize the Program

After deployment, initialize the program with your authority:

```typescript
import * as anchor from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";

const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);
const program = anchor.workspace.Blockscore;

const [configPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("config")],
  program.programId
);

await program.methods
  .initialize()
  .accounts({
    config: configPda,
    authority: provider.wallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

## Usage Examples

### Record a Score

```typescript
const walletToScore = new PublicKey("...");
const [scorePda] = PublicKey.findProgramAddressSync(
  [Buffer.from("score"), walletToScore.toBuffer()],
  program.programId
);

await program.methods
  .recordScore(
    850,           // Score: 85.0%
    "A",           // Grade
    JSON.stringify({ source: "api", version: "1.0" })
  )
  .accounts({
    config: configPda,
    scoreAccount: scorePda,
    wallet: walletToScore,
    agent: null,
    authority: provider.wallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

### Read a Score (Anyone)

```typescript
const [scorePda] = PublicKey.findProgramAddressSync(
  [Buffer.from("score"), walletToScore.toBuffer()],
  program.programId
);

const scoreAccount = await program.account.scoreAccount.fetch(scorePda);
console.log("Score:", scoreAccount.score / 10, "%");
console.log("Grade:", scoreAccount.grade);
console.log("Last Updated:", new Date(scoreAccount.lastUpdated.toNumber() * 1000));
```

### Add an Agent

```typescript
const agentPubkey = new PublicKey("...");
const [agentPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("agent"), agentPubkey.toBuffer()],
  program.programId
);

await program.methods
  .addAgent()
  .accounts({
    config: configPda,
    agent: agentPda,
    newAgent: agentPubkey,
    authority: provider.wallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

## Testing

```bash
# Run tests on localnet
anchor test

# Run tests on existing validator
anchor test --skip-local-validator

# Run specific test
anchor test -- --grep "record_score"
```

## Client Library

A TypeScript client is available in `app/client.ts`:

```typescript
import { BlockScoreClient, calculateGrade } from "./app/client";

const client = await BlockScoreClient.create(connection, wallet, idl);

// Read score
const score = await client.getScore(walletPubkey);

// Record score
await client.recordScore(walletPubkey, 850, "A", '{"source":"api"}');

// Get all scores
const allScores = await client.getAllScores();
```

## Events

The program emits events for monitoring:

- `ProgramInitialized`: Authority set
- `ScoreRecorded`: Score created/updated
- `AuthorityTransferred`: Authority changed
- `AgentAdded`: New agent authorized
- `AgentRemoved`: Agent deactivated

## Account Sizes

| Account | Size (bytes) | Rent (SOL) |
|---------|--------------|------------|
| ProgramConfig | 49 | ~0.001 |
| ScoreAccount | 319 | ~0.003 |
| AgentAccount | 82 | ~0.001 |

## Security Considerations

1. **Authority**: Only the authority (and active agents) can record scores
2. **PDAs**: Each wallet has a unique PDA derived from its pubkey
3. **Validation**: Scores are bounded (0-1000), grades limited to 3 chars
4. **Agent System**: Delegated authority with ability to revoke

## License

MIT

---

## Quick Reference

### PDAs
- Config: `["config"]`
- Score: `["score", wallet_pubkey]`
- Agent: `["agent", agent_pubkey]`

### Score Ranges
- 970-1000: A+ (97-100%)
- 930-969: A (93-96.9%)
- 900-929: A- (90-92.9%)
- 870-899: B+ (87-89.9%)
- 830-869: B (83-86.9%)
- 800-829: B- (80-82.9%)
- 770-799: C+ (77-79.9%)
- 730-769: C (73-76.9%)
- 700-729: C- (70-72.9%)
- 670-699: D+ (67-69.9%)
- 630-669: D (63-66.9%)
- 600-629: D- (60-62.9%)
- 0-599: F (0-59.9%)
