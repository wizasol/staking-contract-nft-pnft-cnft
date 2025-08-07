
import { Connection, sendAndConfirmTransaction, Signer, StakeProgram, SYSVAR_STAKE_HISTORY_PUBKEY } from "@solana/web3.js";
import { program } from "../../config";
import { InitParam, UpdateActiveParam } from "../../types";

const update_active = async (connection: Connection, payer: Signer, updateActiveParam: UpdateActiveParam, initParam: InitParam) => {
    const {
        stake_index,
        validator_index
    } = updateActiveParam

    const {
        stateAccount,
        reservePda,
        validatorList,
        stakeList,
        stakeWithdrawAuthority,
        stakeAccount,
        msolMint,
        authorityMsolAcc,
        treasuryMsolAccount
    } = initParam

    const tx = await program.methods.updateActive(stake_index, validator_index)
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

}

export {
    update_active
}

//? Define the parameters for initializing the state
// const initializeData : InitializeDataParam = {
//     adminAuthority: authorityAcc.publicKey,
//     validatorManagerAuthority: payer.publicKey,
//     minStake: new BN(10000000), // Example value
//     rewardsFee: { numerator: 1, denominator: 100 }, // 1%
//     liqPool: {
//         lpLiquidityTarget: new BN(50000000000),
//         lpMaxFee: { basisPoints: new BN(1) },
//         lpMinFee: { basisPoints: new BN(1) },
//         lpTreasuryCut: { basisPoints: new BN(1) },
//     },
//     additionalStakeRecordSpace: 3,
//     additionalValidatorRecordSpace: 3,
//     slotsForStakeDelta: new BN(3000),
//     pauseAuthority: payer.publicKey,
// };