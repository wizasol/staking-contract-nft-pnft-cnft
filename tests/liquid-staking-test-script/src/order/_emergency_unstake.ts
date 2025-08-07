import { BN } from "bn.js";
import { connection, payer } from "../config";
import { add_validator, deactivate_stake, deposit, deposit_stake_account, emergency_unstake, initialize, preRequisite, update_active } from "../instructions";
import { DeactivateStakeParam, EmergencyUnstakeParam, InitializeDataParam } from "../types";
import { voteAccount } from "../constant";
import { Keypair, sendAndConfirmTransaction, SystemProgram, Transaction } from "@solana/web3.js";

//! not yet
export const _emergency_unstake = async () => {
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
        score: 0,
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

    const emergencyUnstakeParam: EmergencyUnstakeParam = {
        stake_index: 0,
        validator_index: 0,
    }
    await emergency_unstake(connection, payer, emergencyUnstakeParam, initParam)
}