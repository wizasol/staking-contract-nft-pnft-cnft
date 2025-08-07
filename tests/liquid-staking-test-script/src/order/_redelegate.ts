import { BN } from "bn.js";
import { connection, payer } from "../config";
import { add_validator, deposit, deposit_stake_account, initialize, preRequisite, redelegate, update_active, update_deactivated } from "../instructions";
import { InitializeDataParam, RedelegateParam, UpdateDeactivatedParam } from "../types";
import { voteAccount } from "../constant";
import { Keypair } from "@solana/web3.js";

//! not yet
export const _redelegate = async () => {
    const initParam = await preRequisite(connection, payer)

    const initializeData: InitializeDataParam = {
        adminAuthority: payer.publicKey,
        validatorManagerAuthority: payer.publicKey,
        minStake: new BN(10000000), // Example value
        rewardsFee: { numerator: 1, denominator: 100 }, // 1%
        liqPool: {
            lpLiquidityTarget: new BN(50000000000),
            lpMaxFee: { basisPoints: new BN(1) },
            lpMinFee: { basisPoints: new BN(1) },
            lpTreasuryCut: { basisPoints: new BN(1) },
        },
        additionalStakeRecordSpace: 3,
        additionalValidatorRecordSpace: 3,
        slotsForStakeDelta: new BN(3000),
        pauseAuthority: payer.publicKey,
    };

    await initialize(connection, payer, initializeData, initParam)

    const addValidatorParam = {
        score: 2,
        voteAccount: voteAccount[0]
    }

    await add_validator(connection, payer, addValidatorParam, initParam)

    const depositStakeAccountParam = {
        validatorIndex: 0,
        amount: 2 * 10 ** 9
    }

    await deposit_stake_account(connection, payer, depositStakeAccountParam, initParam)

    const updateActiveParam = {
        stake_index: 0,
        validator_index: 0
    }
    await update_active(connection, payer, updateActiveParam, initParam)

    const splitStakeAccount = Keypair.generate()
    const newRedelegateStakeAccount = Keypair.generate()

    const redelegateParam: RedelegateParam = {
        stake_index: 0,
        source_validator_index: 0 ,
        dest_validator_index: 1,
        validatorVote: voteAccount[0],
        splitStakeAccount: splitStakeAccount,
        newRedelegateStakeAccount: newRedelegateStakeAccount,
    }
    await redelegate(connection, payer, redelegateParam, initParam)
}