import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { MarinadeForkingSmartContract } from "../target/types/marinade_forking_smart_contract";
import {
    Keypair,
    sendAndConfirmTransaction,
    StakeProgram,
    SYSVAR_STAKE_HISTORY_PUBKEY,
} from '@solana/web3.js';
import { BN } from "bn.js";
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
    // * emergency_unstake : emergency_unstake from liq pool
    // * 
    // * ================== Required ===================
    // * State state should be "resume"
    // * 
    // * 
    // * ===============================================
    // * Tx Route : initialize / emergency_unstake
    // * -------------------------------------------------------------------------------------

    it("partial_unstake", async () => {
        const newSplitStakeAccount = Keypair.generate()

        const tx = await program.methods.partialUnstake(0, 1, new BN(10 ** 12))
            .accounts({
                state: stateAccount.publicKey,
                validatorManagerAuthority: payer.publicKey,
                validatorList: validatorList.publicKey,
                stakeList: stakeList.publicKey,
                stakeAccount: stakeAccount.publicKey,
                stakeDepositAuthority: stakeDepositAuthority,
                reservePda: reservePda,
                splitStakeAccount: newSplitStakeAccount.publicKey,
                splitStakeRentPayer: stakeAuthority.publicKey,
                stakeHistory: SYSVAR_STAKE_HISTORY_PUBKEY,
                stakeProgram: StakeProgram.programId
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
        const sig = await sendAndConfirmTransaction(connection, tx, [stateAccount,
            payer,
            validatorList,
            stakeList,
            stakeAccount,
            newSplitStakeAccount,
            stakeAuthority]);
        console.log("Transaction Signature:", sig);
    })
});
