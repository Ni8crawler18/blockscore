import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { expect } from "chai";

// Import the IDL type (generated after anchor build)
// import { Blockscore } from "../target/types/blockscore";

describe("blockscore", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // @ts-ignore - IDL will be available after build
  const program = anchor.workspace.Blockscore as Program<any>;
  
  const authority = provider.wallet as anchor.Wallet;
  const testWallet = Keypair.generate();
  const agentKeypair = Keypair.generate();

  // PDAs
  let configPda: PublicKey;
  let configBump: number;
  let scorePda: PublicKey;
  let scoreBump: number;
  let agentPda: PublicKey;
  let agentBump: number;

  before(async () => {
    // Derive PDAs
    [configPda, configBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      program.programId
    );

    [scorePda, scoreBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("score"), testWallet.publicKey.toBuffer()],
      program.programId
    );

    [agentPda, agentBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("agent"), agentKeypair.publicKey.toBuffer()],
      program.programId
    );

    console.log("Program ID:", program.programId.toString());
    console.log("Authority:", authority.publicKey.toString());
    console.log("Config PDA:", configPda.toString());
    console.log("Test Wallet:", testWallet.publicKey.toString());
    console.log("Score PDA:", scorePda.toString());
  });

  describe("initialize", () => {
    it("initializes the program config", async () => {
      const tx = await program.methods
        .initialize()
        .accounts({
          config: configPda,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("Initialize tx:", tx);

      // Fetch and verify config
      const config = await program.account.programConfig.fetch(configPda);
      expect(config.authority.toString()).to.equal(authority.publicKey.toString());
      expect(config.totalScores.toNumber()).to.equal(0);
    });
  });

  describe("record_score", () => {
    it("records a score for a wallet", async () => {
      const score = 850; // 85.0
      const grade = "A";
      const metadata = JSON.stringify({ source: "test", version: "1.0" });

      const tx = await program.methods
        .recordScore(score, grade, metadata)
        .accounts({
          config: configPda,
          scoreAccount: scorePda,
          wallet: testWallet.publicKey,
          agent: null,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("Record score tx:", tx);

      // Fetch and verify score
      const scoreAccount = await program.account.scoreAccount.fetch(scorePda);
      expect(scoreAccount.wallet.toString()).to.equal(testWallet.publicKey.toString());
      expect(scoreAccount.score).to.equal(score);
      expect(scoreAccount.grade).to.equal(grade);
      expect(scoreAccount.metadata).to.equal(metadata);
      expect(scoreAccount.updateCount).to.equal(1);

      // Verify config updated
      const config = await program.account.programConfig.fetch(configPda);
      expect(config.totalScores.toNumber()).to.equal(1);
    });

    it("updates an existing score", async () => {
      const newScore = 920; // 92.0
      const newGrade = "A+";
      const metadata = JSON.stringify({ source: "test", version: "1.1" });

      const tx = await program.methods
        .recordScore(newScore, newGrade, metadata)
        .accounts({
          config: configPda,
          scoreAccount: scorePda,
          wallet: testWallet.publicKey,
          agent: null,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("Update score tx:", tx);

      // Verify updated score
      const scoreAccount = await program.account.scoreAccount.fetch(scorePda);
      expect(scoreAccount.score).to.equal(newScore);
      expect(scoreAccount.grade).to.equal(newGrade);
      expect(scoreAccount.updateCount).to.equal(2);

      // Total scores should not increase (update, not new)
      const config = await program.account.programConfig.fetch(configPda);
      expect(config.totalScores.toNumber()).to.equal(1);
    });

    it("rejects scores out of range", async () => {
      try {
        await program.methods
          .recordScore(1500, "X", "")
          .accounts({
            config: configPda,
            scoreAccount: scorePda,
            wallet: testWallet.publicKey,
            agent: null,
            authority: authority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
        expect.fail("Should have thrown error");
      } catch (err: any) {
        expect(err.error.errorCode.code).to.equal("ScoreOutOfRange");
      }
    });
  });

  describe("agent management", () => {
    it("adds an agent", async () => {
      const tx = await program.methods
        .addAgent()
        .accounts({
          config: configPda,
          agent: agentPda,
          newAgent: agentKeypair.publicKey,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("Add agent tx:", tx);

      // Verify agent
      const agent = await program.account.agentAccount.fetch(agentPda);
      expect(agent.agent.toString()).to.equal(agentKeypair.publicKey.toString());
      expect(agent.isActive).to.be.true;
    });

    it("agent can record scores", async () => {
      const newWallet = Keypair.generate();
      const [newScorePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("score"), newWallet.publicKey.toBuffer()],
        program.programId
      );

      // Fund agent
      const airdropTx = await provider.connection.requestAirdrop(
        agentKeypair.publicKey,
        1_000_000_000 // 1 SOL
      );
      await provider.connection.confirmTransaction(airdropTx);

      const tx = await program.methods
        .recordScore(750, "B+", "")
        .accounts({
          config: configPda,
          scoreAccount: newScorePda,
          wallet: newWallet.publicKey,
          agent: agentPda,
          authority: agentKeypair.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([agentKeypair])
        .rpc();

      console.log("Agent record score tx:", tx);

      const scoreAccount = await program.account.scoreAccount.fetch(newScorePda);
      expect(scoreAccount.score).to.equal(750);
    });

    it("removes an agent", async () => {
      const tx = await program.methods
        .removeAgent()
        .accounts({
          config: configPda,
          agent: agentPda,
          authority: authority.publicKey,
        })
        .rpc();

      console.log("Remove agent tx:", tx);

      const agent = await program.account.agentAccount.fetch(agentPda);
      expect(agent.isActive).to.be.false;
    });
  });

  describe("transfer_authority", () => {
    it("transfers authority to a new account", async () => {
      const newAuthority = Keypair.generate();

      const tx = await program.methods
        .transferAuthority(newAuthority.publicKey)
        .accounts({
          config: configPda,
          authority: authority.publicKey,
        })
        .rpc();

      console.log("Transfer authority tx:", tx);

      const config = await program.account.programConfig.fetch(configPda);
      expect(config.authority.toString()).to.equal(newAuthority.publicKey.toString());
    });
  });

  describe("read scores (anyone)", () => {
    it("anyone can read a wallet's score", async () => {
      // No transaction needed - just fetch the account
      const scoreAccount = await program.account.scoreAccount.fetch(scorePda);
      
      console.log("Score for wallet", testWallet.publicKey.toString());
      console.log("  Score:", scoreAccount.score);
      console.log("  Grade:", scoreAccount.grade);
      console.log("  Last Updated:", new Date(scoreAccount.lastUpdated.toNumber() * 1000).toISOString());
      console.log("  Update Count:", scoreAccount.updateCount);

      expect(scoreAccount.score).to.be.greaterThan(0);
    });

    it("derives score PDA from any wallet pubkey", async () => {
      const randomWallet = Keypair.generate();
      const [derivedPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("score"), randomWallet.publicKey.toBuffer()],
        program.programId
      );

      // Try to fetch - should return null for non-existent
      const scoreAccount = await program.account.scoreAccount.fetchNullable(derivedPda);
      expect(scoreAccount).to.be.null;
    });
  });
});
