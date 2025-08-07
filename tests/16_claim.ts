import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { MarinadeForkingSmartContract } from "../target/types/marinade_forking_smart_contract";
import {
    Keypair,
    sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
    connection,
    payer,
    reservePda,
    stakeAuthority,
    stateAccount
} from ".";

describe("marinade-forking-smart-contract", () => {
    // Configure the client to use the local cluster.
    anchor.setProvider(anchor.AnchorProvider.env());

    const program = anchor.workspace.MarinadeForkingSmartContract as Program<MarinadeForkingSmartContract>;

    // * -------------------------------------------------------------------------------------
    // *  Advanced Instructions
    // * -------------------------------------------------------------------------------------
    // * claim : claim from liq pool
    // * 
    // * ================== Required ===================
    // * State state should be "resume"
    // * 
    // * 
    // * ===============================================
    // * Tx Route : initialize / claim
    // * -------------------------------------------------------------------------------------


    it("claim", async () => {

        //! Should double check on this
        const newTicketAccount = Keypair.generate()

        const tx = await program.methods.claim()
            .accounts({
                state: stateAccount.publicKey,
                reservePda: reservePda,
                ticketAccount: newTicketAccount.publicKey,
                transferSolTo: stakeAuthority.publicKey,
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
        const sig = await sendAndConfirmTransaction(connection, tx, [payer, stakeAuthority, newTicketAccount]);
        console.log("Transaction Signature:", sig);
    })

});
