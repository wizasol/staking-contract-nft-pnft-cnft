
import { Connection, PublicKey, sendAndConfirmTransaction, Signer } from "@solana/web3.js";
import { program } from "../../config";
import { InitParam } from "../../types";
import { DepositParam } from "../../types/basic_instruction_types";

const deposit = async (connection: Connection, payer: Signer, depositParam: DepositParam, initParam: InitParam) => {
    const {
        amount
    } = depositParam;

    const {
        stateAccount,
        msolMint,
        solLegPda,
        mSolLeg,
        authorityMSolLegAcc,
        reservePda,
        mint_to,
        authorityMsolAcc
    } = initParam

    const tx = await program.methods.deposit(amount)
        .accounts({
            state: stateAccount.publicKey,
            msolMint: msolMint,
            liqPoolSolLegPda: solLegPda,
            liqPoolMsolLeg: mSolLeg,
            liqPoolMsolLegAuthority: authorityMSolLegAcc,
            reservePda: reservePda,
            transferFrom: payer.publicKey,
            mintTo: mint_to,
            msolMintAuthority: authorityMsolAcc,
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
}

export {
    deposit
}

//? Define the parameters for initializing the state
// interface DepositParam {
//     amount : BN
// }
