/**
 * BlockScore Client Library
 * TypeScript helper for interacting with the BlockScore on-chain program
 */

import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider, Idl } from "@coral-xyz/anchor";
import { 
  PublicKey, 
  Connection, 
  Keypair, 
  SystemProgram,
  TransactionSignature 
} from "@solana/web3.js";

// Program ID - update after deployment
export const PROGRAM_ID = new PublicKey("BLocKScoReProgram11111111111111111111111111");

// Seed constants
export const CONFIG_SEED = "config";
export const SCORE_SEED = "score";
export const AGENT_SEED = "agent";

export interface ScoreData {
  wallet: PublicKey;
  score: number;
  grade: string;
  metadata: string;
  lastUpdated: number;
  updateCount: number;
}

export interface ConfigData {
  authority: PublicKey;
  totalScores: number;
}

export class BlockScoreClient {
  program: Program<any>;
  provider: AnchorProvider;

  constructor(program: Program<any>, provider: AnchorProvider) {
    this.program = program;
    this.provider = provider;
  }

  /**
   * Create a client from connection and wallet
   */
  static async create(
    connection: Connection,
    wallet: anchor.Wallet,
    idl: Idl,
    programId: PublicKey = PROGRAM_ID
  ): Promise<BlockScoreClient> {
    const provider = new AnchorProvider(connection, wallet, {
      commitment: "confirmed",
    });
    const program = new Program(idl, programId, provider);
    return new BlockScoreClient(program, provider);
  }

  // ============================================================================
  // PDA Derivation
  // ============================================================================

  getConfigPda(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from(CONFIG_SEED)],
      this.program.programId
    );
  }

  getScorePda(wallet: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from(SCORE_SEED), wallet.toBuffer()],
      this.program.programId
    );
  }

  getAgentPda(agent: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from(AGENT_SEED), agent.toBuffer()],
      this.program.programId
    );
  }

  // ============================================================================
  // Read Operations (Anyone)
  // ============================================================================

  /**
   * Get a wallet's score by pubkey
   */
  async getScore(wallet: PublicKey): Promise<ScoreData | null> {
    const [scorePda] = this.getScorePda(wallet);
    try {
      const account = await this.program.account.scoreAccount.fetch(scorePda);
      return {
        wallet: account.wallet,
        score: account.score,
        grade: account.grade,
        metadata: account.metadata,
        lastUpdated: account.lastUpdated.toNumber(),
        updateCount: account.updateCount,
      };
    } catch {
      return null;
    }
  }

  /**
   * Get program config
   */
  async getConfig(): Promise<ConfigData | null> {
    const [configPda] = this.getConfigPda();
    try {
      const account = await this.program.account.programConfig.fetch(configPda);
      return {
        authority: account.authority,
        totalScores: account.totalScores.toNumber(),
      };
    } catch {
      return null;
    }
  }

  /**
   * Check if a wallet has been scored
   */
  async hasScore(wallet: PublicKey): Promise<boolean> {
    const score = await this.getScore(wallet);
    return score !== null;
  }

  /**
   * Get all scored wallets (paginated)
   */
  async getAllScores(limit?: number): Promise<ScoreData[]> {
    const accounts = await this.program.account.scoreAccount.all();
    const scores = accounts.map((a) => ({
      wallet: a.account.wallet,
      score: a.account.score,
      grade: a.account.grade,
      metadata: a.account.metadata,
      lastUpdated: a.account.lastUpdated.toNumber(),
      updateCount: a.account.updateCount,
    }));
    return limit ? scores.slice(0, limit) : scores;
  }

  // ============================================================================
  // Write Operations (Authority/Agent Only)
  // ============================================================================

  /**
   * Initialize the program (one-time setup)
   */
  async initialize(): Promise<TransactionSignature> {
    const [configPda] = this.getConfigPda();
    return await this.program.methods
      .initialize()
      .accounts({
        config: configPda,
        authority: this.provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  }

  /**
   * Record or update a wallet's score
   */
  async recordScore(
    wallet: PublicKey,
    score: number,
    grade: string,
    metadata: string = "",
    agentPda?: PublicKey
  ): Promise<TransactionSignature> {
    const [configPda] = this.getConfigPda();
    const [scorePda] = this.getScorePda(wallet);

    return await this.program.methods
      .recordScore(score, grade, metadata)
      .accounts({
        config: configPda,
        scoreAccount: scorePda,
        wallet: wallet,
        agent: agentPda || null,
        authority: this.provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  }

  /**
   * Add an authorized agent
   */
  async addAgent(agentPubkey: PublicKey): Promise<TransactionSignature> {
    const [configPda] = this.getConfigPda();
    const [agentPda] = this.getAgentPda(agentPubkey);

    return await this.program.methods
      .addAgent()
      .accounts({
        config: configPda,
        agent: agentPda,
        newAgent: agentPubkey,
        authority: this.provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  }

  /**
   * Remove/deactivate an agent
   */
  async removeAgent(agentPubkey: PublicKey): Promise<TransactionSignature> {
    const [configPda] = this.getConfigPda();
    const [agentPda] = this.getAgentPda(agentPubkey);

    return await this.program.methods
      .removeAgent()
      .accounts({
        config: configPda,
        agent: agentPda,
        authority: this.provider.wallet.publicKey,
      })
      .rpc();
  }

  /**
   * Transfer authority to a new account
   */
  async transferAuthority(newAuthority: PublicKey): Promise<TransactionSignature> {
    const [configPda] = this.getConfigPda();

    return await this.program.methods
      .transferAuthority(newAuthority)
      .accounts({
        config: configPda,
        authority: this.provider.wallet.publicKey,
      })
      .rpc();
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert numeric score (0-1000) to display percentage (0.0-100.0)
 */
export function scoreToPercentage(score: number): number {
  return score / 10;
}

/**
 * Convert percentage (0.0-100.0) to numeric score (0-1000)
 */
export function percentageToScore(percentage: number): number {
  return Math.round(percentage * 10);
}

/**
 * Calculate grade from score
 */
export function calculateGrade(score: number): string {
  const pct = scoreToPercentage(score);
  if (pct >= 97) return "A+";
  if (pct >= 93) return "A";
  if (pct >= 90) return "A-";
  if (pct >= 87) return "B+";
  if (pct >= 83) return "B";
  if (pct >= 80) return "B-";
  if (pct >= 77) return "C+";
  if (pct >= 73) return "C";
  if (pct >= 70) return "C-";
  if (pct >= 67) return "D+";
  if (pct >= 63) return "D";
  if (pct >= 60) return "D-";
  return "F";
}

// Export for CommonJS compatibility
export default BlockScoreClient;
