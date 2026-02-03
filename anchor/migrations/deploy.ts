// Migrations are an early feature and may change.
// This file is auto-run on `anchor deploy` if no custom migration script is set.

import * as anchor from "@coral-xyz/anchor";

module.exports = async function (provider: anchor.AnchorProvider) {
  // Configure client to use the provider.
  anchor.setProvider(provider);

  // Add deployment logic here if needed.
  // For example, you might want to initialize the program after deployment:
  
  /*
  const program = anchor.workspace.Blockscore;
  const [configPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  );

  try {
    await program.methods
      .initialize()
      .accounts({
        config: configPda,
        authority: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();
    console.log("Program initialized!");
  } catch (err) {
    console.log("Program may already be initialized:", err);
  }
  */
};
