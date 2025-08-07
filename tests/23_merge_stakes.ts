import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { MarinadeForkingSmartContract } from "../target/types/marinade_forking_smart_contract";
import {
    Keypair,
    sendAndConfirmTransaction,
    StakeProgram,
    SYSVAR_STAKE_HISTORY_PUBKEY,
} from '@solana/web3.js';
import {
    connection,
    operationalSolAccount,
    payer,
    stakeAccount,
    stakeDepositAuthority,
    stakeList,
    stakeWithdrawAuthority,
    stateAccount,
    validatorList
} from ".";

describe("marinade-forking-smart-contract", () => {
    // Configure the client to use the local cluster.
    anchor.setProvider(anchor.AnchorProvider.env());

    const program = anchor.workspace.MarinadeForkingSmartContract as Program<MarinadeForkingSmartContract>;

    const stakeAccount1 = Keypair.generate()

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
    
    it("merge_stakes", async () => {

        const tx = await program.methods.mergeStakes(0, 1, 0)
            .accounts({
                state: stateAccount.publicKey,
                stakeList: stakeList.publicKey,
                validatorList: validatorList.publicKey,
                destinationStake: stakeAccount.publicKey,
                sourceStake: stakeAccount1.publicKey,
                // sourceStake: stakeAccount.publicKey,
                stakeDepositAuthority: stakeDepositAuthority,
                stakeWithdrawAuthority: stakeWithdrawAuthority,
                operationalSolAccount: operationalSolAccount.publicKey,
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
        const sig = await sendAndConfirmTransaction(connection, tx, [payer, validatorList, stakeList, stakeAccount, stakeAccount1]);
        console.log("Transaction Signature:", sig);
    })
});
