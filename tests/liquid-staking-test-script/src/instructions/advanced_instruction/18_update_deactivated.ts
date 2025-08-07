
import { Connection, sendAndConfirmTransaction, Signer, StakeProgram, SYSVAR_STAKE_HISTORY_PUBKEY } from "@solana/web3.js";
import { program } from "../../config";
import { InitParam, UpdateDeactivatedParam } from "../../types";

const update_deactivated = async (connection: Connection, payer: Signer, updateDeactivatedParam: UpdateDeactivatedParam, initParam: InitParam) => {
    const {
        stake_index,
    } = updateDeactivatedParam

    const {
        stateAccount,
        reservePda,
        stakeList,
        stakeWithdrawAuthority,
        stakeAccount,
        msolMint,
        authorityMsolAcc,
        treasuryMsolAccount,
        operationalSolAccount
    } = initParam

    const tx = await program.methods.updateDeactivated(stake_index)
        .accounts({
            common: {
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
            },
            operationalSolAccount: operationalSolAccount.publicKey,
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
    const sig = await sendAndConfirmTransaction(connection, tx, [payer, operationalSolAccount]);
    console.log("Transaction Signature:", sig);
}

export {
    update_deactivated
}