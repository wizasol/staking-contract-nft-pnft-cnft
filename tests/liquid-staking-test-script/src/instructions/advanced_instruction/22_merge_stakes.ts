
import { Connection, sendAndConfirmTransaction, Signer, StakeProgram, SYSVAR_EPOCH_SCHEDULE_PUBKEY, SYSVAR_STAKE_HISTORY_PUBKEY } from "@solana/web3.js";
import { program } from "../../config";
import { InitParam, MergeStakeParam } from "../../types";

const merge_stakes = async (connection: Connection, payer: Signer, mergeStakeParam: MergeStakeParam, initParam: InitParam) => {
    const {
        destination_stake_index,
        source_stake_index,
        validator_index,
        splitStakeAccount,
    } = mergeStakeParam

    const {
        stateAccount,
        stakeList,
        stakeDepositAuthority,
        stakeAccount,
        validatorList,
        stakeWithdrawAuthority,
        operationalSolAccount
    } = initParam

    const tx = await program.methods.mergeStakes(
        destination_stake_index,
        source_stake_index,
        validator_index
    )
        .accounts({
            state: stateAccount.publicKey,
            stakeList: stakeList.publicKey,
            validatorList: validatorList.publicKey,
            destinationStake: splitStakeAccount.publicKey,
            sourceStake: stakeAccount.publicKey,
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
    const sig = await sendAndConfirmTransaction(connection, tx, [payer]);
    console.log("Transaction Signature:", sig);
}

export {
    merge_stakes
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