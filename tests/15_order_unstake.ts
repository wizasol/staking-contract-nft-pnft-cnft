import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { MarinadeForkingSmartContract } from "../target/types/marinade_forking_smart_contract";
import {
    Keypair,
    sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
    getOrCreateAssociatedTokenAccount,
} from '@solana/spl-token';
import { BN } from "bn.js";
import {
    connection,
    msolMint,
    payer,
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
    // * order_unstake : order unstake from liq pool
    // * 
    // * ================== Required ===================
    // * State state should be "resume"
    // * 
    // * 
    // * ===============================================
    // * Tx Route : initialize / order_unstake
    // * -------------------------------------------------------------------------------------

    it("order_unstake", async () => {
        //! Should double check on this
        const newTicketAccount = Keypair.generate()

        const burnMsolFrom = await getOrCreateAssociatedTokenAccount(connection, stakeAuthority, msolMint, stakeAuthority.publicKey)

        const tx = await program.methods.orderUnstake(new BN(10 ** 9))
            .accounts({
                state: stateAccount.publicKey,
                msolMint: msolMint,
                burnMsolFrom: burnMsolFrom.address,
                burnMsolAuthority: stakeAuthority.publicKey,
                newTicketAccount: newTicketAccount.publicKey
            })
            .preInstructions([
                await program.account.ticketAccountData.createInstruction(newTicketAccount)
            ])
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
