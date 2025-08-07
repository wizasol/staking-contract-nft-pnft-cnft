
import { Connection, sendAndConfirmTransaction, Signer, STAKE_CONFIG_ID, StakeProgram, SYSVAR_EPOCH_SCHEDULE_PUBKEY, SYSVAR_STAKE_HISTORY_PUBKEY } from "@solana/web3.js";
import { program } from "../../config";
import { InitParam, ReallocStakeListParam, ReallocValidatorListParam, WithdrawStakeAccountParam } from "../../types";

const realloc_stake_list = async (connection: Connection, payer: Signer, reallocStakeListParam: ReallocStakeListParam, initParam: InitParam) => {
  const {
    capacity
  } = reallocStakeListParam

  const {
    stateAccount,
    stakeList,
  } = initParam

  const tx = await program.methods.reallocStakeList(capacity)
    .accounts({
      state: stateAccount.publicKey,
      adminAuthority: payer.publicKey,
      stakeList: stakeList.publicKey,
      rentFunds: payer.publicKey,
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
  realloc_stake_list
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