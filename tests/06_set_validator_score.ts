import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { MarinadeForkingSmartContract } from "../target/types/marinade_forking_smart_contract";
import {
    sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
    connection,
    payer,
    stateAccount,
    validatorList,
    voteAccount
} from ".";

describe("marinade-forking-smart-contract", () => {

    anchor.setProvider(anchor.AnchorProvider.env());

    const program = anchor.workspace.MarinadeForkingSmartContract as Program<MarinadeForkingSmartContract>;

    const validatorVote = voteAccount[1]

    // * -------------------------------------------------------------------------------------
    // *  Base Instructions
    // * -------------------------------------------------------------------------------------
    // * set_validator_score : set Validator Score to State Account
    // * 
    // * ================== Required ===================
    // * It is required to add valid vote address and not allowed to add same validator
    // * 
    // * ===============================================
    // * Tx Route : initialize / ( add_validator ) / set_validator_score
    // * -------------------------------------------------------------------------------------


    it("set_validator_score", async () => {

        const tx = await program.methods
            .setValidatorScore(1, validatorVote, 2)
            .accounts({
                state: stateAccount.publicKey,
                managerAuthority: payer.publicKey,
                validatorList: validatorList.publicKey,
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
