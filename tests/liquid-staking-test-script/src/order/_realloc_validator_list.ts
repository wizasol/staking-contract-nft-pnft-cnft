import { BN } from "bn.js";
import { connection, payer } from "../config";
import { add_validator, deposit, deposit_stake_account, initialize, preRequisite, realloc_validator_list, update_active, update_deactivated } from "../instructions";
import { InitializeDataParam, ReallocValidatorListParam, UpdateDeactivatedParam } from "../types";
import { voteAccount } from "../constant";

//! not yet
export const _realloc_validator_list = async () => {
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

    const reallocValidatorListParam : ReallocValidatorListParam =  {
        capacity : 20
    }
    await realloc_validator_list(connection, payer, reallocValidatorListParam, initParam)
}