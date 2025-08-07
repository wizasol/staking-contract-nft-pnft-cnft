
import { Connection, sendAndConfirmTransaction, Signer, STAKE_CONFIG_ID, StakeProgram, SYSVAR_EPOCH_SCHEDULE_PUBKEY, SYSVAR_STAKE_HISTORY_PUBKEY } from "@solana/web3.js";
import { program } from "../../config";
import { EmergencyUnstakeParam, InitParam, MergeStakeParam, PartialUnstakeParam, RedelegateParam } from "../../types";

const redelegate = async (connection: Connection, payer: Signer, mergeStakeParam: RedelegateParam, initParam: InitParam) => {
    const {
        stake_index,
        source_validator_index,
        dest_validator_index,
        validatorVote,
        splitStakeAccount,
        newRedelegateStakeAccount
    } = mergeStakeParam

    const {
        stateAccount,
        stakeList,
        stakeDepositAuthority,
        stakeAccount,
        validatorList,
        reservePda,
    } = initParam

    const tx = await program.methods.redelegate(
        stake_index,
        source_validator_index,
        dest_validator_index
    )
        .accounts({
            state: stateAccount.publicKey,
            validatorList: validatorList.publicKey,
            stakeList: stakeList.publicKey,
            stakeAccount: stakeAccount.publicKey,
            stakeDepositAuthority: stakeDepositAuthority,
            reservePda: reservePda,
            splitStakeAccount: splitStakeAccount.publicKey,
            splitStakeRentPayer: payer.publicKey,
            destValidatorAccount: validatorVote,
            redelegateStakeAccount: newRedelegateStakeAccount.publicKey,
            stakeHistory: SYSVAR_STAKE_HISTORY_PUBKEY,
            stakeConfig: STAKE_CONFIG_ID,
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
    const sig = await sendAndConfirmTransaction(connection, tx, [
        payer,
        splitStakeAccount,
        newRedelegateStakeAccount
    ]);
    console.log("Transaction Signature:", sig);
}

export {
    redelegate
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