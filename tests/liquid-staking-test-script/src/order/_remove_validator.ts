import { BN } from "bn.js"
import { connection, payer } from "../config"
import { initialize, preRequisite } from "../instructions"
import { InitializeDataParam } from "../types"
import { add_validator, remove_validator } from "../instructions/basic_instruction"
import { voteAccount } from "../constant"

export const _remove_validator = async () => {
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
        voteAccount: voteAccount[2]
    }

    await add_validator(connection, payer, addValidatorParam, initParam)

    const removeValidatorParam = {
        voteAccount: voteAccount[2]
    }
    
    await remove_validator(connection, payer, removeValidatorParam, initParam)
}
