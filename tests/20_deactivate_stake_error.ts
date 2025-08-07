import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { MarinadeForkingSmartContract } from "../target/types/marinade_forking_smart_contract";
import {
    Keypair,
    sendAndConfirmTransaction,
    StakeProgram,
    SYSVAR_STAKE_HISTORY_PUBKEY,
    SYSVAR_EPOCH_SCHEDULE_PUBKEY,
} from '@solana/web3.js';
import {
    connection,
    payer,
    reservePda,
    stakeAccount,
    stakeAuthority,
    stakeDepositAuthority,
    stakeList,
    stateAccount,
    validatorList
} from ".";

describe("marinade-forking-smart-contract", () => {
    // Configure the client to use the local cluster.
    anchor.setProvider(anchor.AnchorProvider.env());

    const program = anchor.workspace.MarinadeForkingSmartContract as Program<MarinadeForkingSmartContract>;

    // * -------------------------------------------------------------------------------------
    // *  Advanced Instructions
    // * -------------------------------------------------------------------------------------
    // * deactivate_stake : deactivate_stake from liq pool
    // * 
    // * ================== Required ===================
    // * State state should be "resume"
    // * 
    // * 
    // * ===============================================
    // * Tx Route : initialize / deactivate_stake
    // * -------------------------------------------------------------------------------------

    const splitStakeAccount = Keypair.generate();

    it("deactivate_stake", async () => {

        const tx = await program.methods.deactivateStake(0, 0)
            .accounts({
                state: stateAccount.publicKey,
                reservePda: reservePda,
                validatorList: validatorList.publicKey,
                stakeList: stakeList.publicKey,
                stakeAccount: stakeAccount.publicKey,
                stakeDepositAuthority: stakeDepositAuthority,
                splitStakeAccount: splitStakeAccount.publicKey,
                splitStakeRentPayer: stakeAuthority.publicKey,
                epochSchedule: SYSVAR_EPOCH_SCHEDULE_PUBKEY,
                stakeHistory: SYSVAR_STAKE_HISTORY_PUBKEY,
                stakeProgram: StakeProgram.programId
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
        const sig = await sendAndConfirmTransaction(connection, tx, [payer, stakeAccount,
            validatorList,
            stakeList,
            stakeAccount,
            splitStakeAccount,
            stakeAuthority]);
        console.log("Transaction Signature:", sig);
    })
});
