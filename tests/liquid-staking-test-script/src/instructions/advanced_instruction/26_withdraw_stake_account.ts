
import { Connection, sendAndConfirmTransaction, Signer, STAKE_CONFIG_ID, StakeProgram, SYSVAR_EPOCH_SCHEDULE_PUBKEY, SYSVAR_STAKE_HISTORY_PUBKEY } from "@solana/web3.js";
import { program } from "../../config";
import { InitParam, WithdrawStakeAccountParam } from "../../types";

const withdraw_stake_account = async (connection: Connection, payer: Signer, withdrawStakeAccountParam: WithdrawStakeAccountParam, initParam: InitParam) => {
    const {
        stake_index,
        validator_index,
        msol_amount,
        beneficiary,
        splitStakeAccount
    } = withdrawStakeAccountParam

    const {
        stateAccount,
        msolMint,
        burnMsolFrom,
        treasuryMsolAccount,
        validatorList,
        stakeList,
        stakeWithdrawAuthority,
        stakeDepositAuthority,
        stakeAccount,
    } = initParam

    const tx = await program.methods.withdrawStakeAccount(
        stake_index,
        validator_index,
        msol_amount,
        beneficiary
    ).accounts({
        state: stateAccount.publicKey,
        msolMint: msolMint,
        burnMsolFrom: burnMsolFrom,
        burnMsolAuthority: payer.publicKey,
        treasuryMsolAccount: treasuryMsolAccount,
        validatorList: validatorList.publicKey,
        stakeList: stakeList.publicKey,
        stakeWithdrawAuthority: stakeWithdrawAuthority,
        stakeDepositAuthority: stakeDepositAuthority,
        stakeAccount: stakeAccount.publicKey,
        splitStakeAccount: splitStakeAccount.publicKey,
        splitStakeRentPayer: payer.publicKey,
        stakeProgram: StakeProgram.programId,
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
    const sig = await sendAndConfirmTransaction(connection, tx, [payer, splitStakeAccount]);
    console.log("Transaction Signature:", sig);
}

export {
    withdraw_stake_account
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