import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { MarinadeForkingSmartContract } from "../target/types/marinade_forking_smart_contract";
import {
    sendAndConfirmTransaction,
} from '@solana/web3.js';
import { authorityAcc, connection, lpMint, mint_to, mSolLeg, msolMint, operationalSolAccount, payer, stakeAccount, stakeAuthority, stakeList, stateAccount, treasuryMsolAccount, validatorList, voteAccount } from ".";

describe("marinade-forking-smart-contract", () => {
    // Configure the client to use the local cluster.
    anchor.setProvider(anchor.AnchorProvider.env());

    const program = anchor.workspace.MarinadeForkingSmartContract as Program<MarinadeForkingSmartContract>;

    // * -------------------------------------------------------------------------------------
    // *  Advanced Instructions
    // * -------------------------------------------------------------------------------------
    // * resume : resume from liq pool
    // * 
    // * ================== Required ===================
    // * State state should be "pause"
    // * 
    // * 
    // * ===============================================
    // * Tx Route : initialize / resume
    // * -------------------------------------------------------------------------------------

    it("resume", async () => {
        const tx = await program.methods.resume()
            .accounts({
                state: stateAccount.publicKey,
                pauseAuthority: payer.publicKey,
            })
            .signers([payer])
            .transaction()
        // Set fee payer and recent blockhash
        tx.feePayer = payer.publicKey;
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        // Simulate the transaction to catch errors
        const simulationResult = await connection.simulateTransaction(tx);
        console.log("Simulation Result:", simulationResult);
        // Send the transaction
        const sig = await sendAndConfirmTransaction(connection, tx, [payer]);
        console.log("Transaction Signature:", sig);
    })
});
