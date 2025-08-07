import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { MarinadeForkingSmartContract } from "../target/types/marinade_forking_smart_contract";
import {
    sendAndConfirmTransaction,
} from '@solana/web3.js';
import { BN } from "bn.js";
import {
    authorityMSolLegAcc,
    connection,
    lpMint,
    mSolLeg,
    msolMint,
    payer,
    solLegPda,
    stakeAuthority,
    stateAccount
} from ".";
import { getAssociatedTokenAddress, getOrCreateAssociatedTokenAccount } from "@solana/spl-token";

describe("marinade-forking-smart-contract", () => {
    // Configure the client to use the local cluster.
    anchor.setProvider(anchor.AnchorProvider.env());

    const program = anchor.workspace.MarinadeForkingSmartContract as Program<MarinadeForkingSmartContract>;

    // * -------------------------------------------------------------------------------------
    // *  Base Instructions
    // * -------------------------------------------------------------------------------------
    // * remove_liquidity : remove liquidity from liq pool
    // * 
    // * ================== Required ===================
    // * State state should be "resume"
    // * 
    // * 
    // * ===============================================
    // * Tx Route : initialize / remove_liquidity
    // * -------------------------------------------------------------------------------------

    it("remove_liquidity", async () => {
        const burnFrom = await getOrCreateAssociatedTokenAccount(connection, payer, lpMint, stakeAuthority.publicKey)
        const transferMsolTo = await getAssociatedTokenAddress(msolMint, stakeAuthority.publicKey)

        const tx = await program.methods.removeLiquidity(new BN(10_000))
            .accounts({
                state: stateAccount.publicKey,
                lpMint: lpMint,
                burnFrom: burnFrom.address,
                burnFromAuthority: stakeAuthority.publicKey,
                transferSolTo: stakeAuthority.publicKey,
                transferMsolTo: transferMsolTo,
                liqPoolSolLegPda: solLegPda,
                liqPoolMsolLeg: mSolLeg,
                liqPoolMsolLegAuthority: authorityMSolLegAcc,
            })
            .signers([stakeAuthority])
            .transaction()

        // Set fee payer and recent blockhash
        tx.feePayer = payer.publicKey;
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

        // Simulate the transaction to catch errors
        const simulationResult = await connection.simulateTransaction(tx);
        console.log("Simulation Result:", simulationResult);

        // Send the transaction
        const sig = await sendAndConfirmTransaction(connection, tx, [payer, stakeAuthority]);
        console.log("Transaction Signature:", sig);
    })

});
