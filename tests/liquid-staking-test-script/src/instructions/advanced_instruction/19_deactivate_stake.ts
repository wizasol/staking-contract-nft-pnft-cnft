
import { Connection, sendAndConfirmTransaction, Signer, StakeProgram, SYSVAR_EPOCH_SCHEDULE_PUBKEY, SYSVAR_STAKE_HISTORY_PUBKEY } from "@solana/web3.js";
import { program } from "../../config";
import { DeactivateStakeParam, InitParam } from "../../types";

const deactivate_stake = async (connection: Connection, payer: Signer, deactivateStakeParam: DeactivateStakeParam, initParam: InitParam) => {
    const {
        stake_index,
        validator_index,
        splitStakeAccount,
    } = deactivateStakeParam

    const {
        stateAccount,
        reservePda,
        stakeList,
        stakeDepositAuthority,
        stakeAccount,
        validatorList,
    } = initParam

    const tx = await program.methods.deactivateStake(stake_index, validator_index)
        .accounts({
            state: stateAccount.publicKey,
            reservePda: reservePda,
            validatorList: validatorList.publicKey,
            stakeList: stakeList.publicKey,
            stakeAccount: stakeAccount.publicKey,
            stakeDepositAuthority: stakeDepositAuthority,
            splitStakeAccount: splitStakeAccount.publicKey,
            splitStakeRentPayer: payer.publicKey,
            epochSchedule: SYSVAR_EPOCH_SCHEDULE_PUBKEY,
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
    const sig = await sendAndConfirmTransaction(connection, tx, [payer , splitStakeAccount]);
    console.log("Transaction Signature:", sig);
}

export {
    deactivate_stake
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