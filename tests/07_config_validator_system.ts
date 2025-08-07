import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { MarinadeForkingSmartContract } from "../target/types/marinade_forking_smart_contract";
import {
    sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
    connection,
    payer,
    stateAccount
} from ".";

describe("marinade-forking-smart-contract", () => {
    // Configure the client to use the local cluster.
    anchor.setProvider(anchor.AnchorProvider.env());

    const program = anchor.workspace.MarinadeForkingSmartContract as Program<MarinadeForkingSmartContract>;

    // * -------------------------------------------------------------------------------------
    // *  Base Instructions
    // * -------------------------------------------------------------------------------------
    // * config_validator_system : set Validator System to State Account
    // * 
    // * ================== Required ===================
    // * It is required to add valid vote address and not allowed to add same validator
    // * 
    // * ===============================================
    // * Tx Route : initialize / ( add_validator ) / config_validator_system
    // * -------------------------------------------------------------------------------------

    it("config_validator_system", async () => {

        const tx = await program.methods
            .configValidatorSystem(3)
            .accounts({
                state: stateAccount.publicKey,
                managerAuthority: payer.publicKey,
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

        //   // Retrieve and log the state account to confirm initialization
        const state = await program.account.state.fetch(stateAccount.publicKey);
        console.log("State Account:", state); //  this data
    })
});
