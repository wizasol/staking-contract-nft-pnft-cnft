import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { MarinadeForkingSmartContract } from "../target/types/marinade_forking_smart_contract";
import {
    PublicKey,
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
    
    const validatorVote = voteAccount[2]
    const [duplicationFlag] = PublicKey.findProgramAddressSync([stateAccount.publicKey.toBuffer(), Buffer.from("unique_validator"), validatorVote.toBuffer()], program.programId)

    // * -------------------------------------------------------------------------------------
    // *  Base Instructions
    // * -------------------------------------------------------------------------------------
    // * add_validator : add Validators to State Account
    // * 
    // * ================== Required ===================
    // * It is required to add valid vote address and not allowed to add same validator
    // * 
    // * ===============================================
    // * Tx Route : initialize / add_validator
    // * -------------------------------------------------------------------------------------

    it("add_validator", async () => {
       
        const tx = await program.methods
            .addValidator(1)
            .accounts({
                state: stateAccount.publicKey,
                managerAuthority: payer.publicKey,
                validatorList: validatorList.publicKey,
                validatorVote: validatorVote,
                duplicationFlag: duplicationFlag,
            })
            .signers([payer])
            .transaction()

        tx.feePayer = payer.publicKey;
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

        const simulationResult = await connection.simulateTransaction(tx);
        console.log("Simulation Result:", simulationResult);

        const sig = await sendAndConfirmTransaction(connection, tx, [payer]);
        console.log("Transaction Signature:", sig);

        const state = await program.account.state.fetch(stateAccount.publicKey);
        console.log("State Account:", state); //  this data
    })

    it("add_validator", async () => {
        const validatorVote = voteAccount[3]
        const [duplicationFlag] = PublicKey.findProgramAddressSync([stateAccount.publicKey.toBuffer(), Buffer.from("unique_validator"), validatorVote.toBuffer()], program.programId)

        const tx = await program.methods
            .addValidator(2)
            .accounts({
                state: stateAccount.publicKey,
                managerAuthority: payer.publicKey,
                validatorList: validatorList.publicKey,
                validatorVote: validatorVote,
                duplicationFlag: duplicationFlag,
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
