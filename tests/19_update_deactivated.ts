import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { MarinadeForkingSmartContract } from "../target/types/marinade_forking_smart_contract";
import {
    sendAndConfirmTransaction,
    StakeProgram,
    SYSVAR_STAKE_HISTORY_PUBKEY,
} from '@solana/web3.js';
import {
    authorityMsolAcc,
    connection,
    msolMint,
    operationalSolAccount,
    payer,
    reservePda,
    stakeAccount,
    stakeAuthority,
    stakeList,
    stakeWithdrawAuthority,
    stateAccount,
    treasuryMsolAccount
} from ".";

describe("marinade-forking-smart-contract", () => {
    // Configure the client to use the local cluster.
    anchor.setProvider(anchor.AnchorProvider.env());

    const program = anchor.workspace.MarinadeForkingSmartContract as Program<MarinadeForkingSmartContract>;

    // * -------------------------------------------------------------------------------------
    // *  Advanced Instructions
    // * -------------------------------------------------------------------------------------
    // * update_deactivated : update_deactivated from liq pool
    // * 
    // * ================== Required ===================
    // * State state should be "resume"
    // * 
    // * 
    // * ===============================================
    // * Tx Route : initialize / update_deactivated
    // * -------------------------------------------------------------------------------------

    it("update_deactivated", async () => {

        // const airtx = await connection.requestAirdrop(reservePda, 2_039_280);

        // await connection.confirmTransaction(airtx)


        const updateActive = {
            state: stateAccount.publicKey,
            stakeList: stakeList.publicKey,
            stakeAccount: stakeAccount.publicKey,
            stakeWithdrawAuthority: stakeWithdrawAuthority,
            reservePda: reservePda,
            msolMint: msolMint,
            msolMintAuthority: authorityMsolAcc,
            treasuryMsolAccount: treasuryMsolAccount,
            stakeHistory: SYSVAR_STAKE_HISTORY_PUBKEY,
            stakeProgram: StakeProgram.programId
        }

        const tx = await program.methods.updateDeactivated(0)
            .accounts({
                common: updateActive,
                operationalSolAccount: operationalSolAccount.publicKey,
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
        const sig = await sendAndConfirmTransaction(connection, tx, [payer, operationalSolAccount]);
        console.log("Transaction Signature:", sig);
    })

});
