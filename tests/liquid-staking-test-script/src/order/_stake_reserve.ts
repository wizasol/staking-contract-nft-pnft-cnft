import { BN } from "bn.js";
import { connection, payer } from "../config";
import { add_validator, claim, deposit, deposit_stake_account, initialize, order_unstake, preRequisite, stake_reserve, update_active } from "../instructions";
import { ClaimParam, InitializeDataParam, InitParam, OrderUnstakeParam, StakeReserveParam } from "../types";
import { voteAccount } from "../constant";
import { Keypair } from "@solana/web3.js";

export const _stake_reserve = async () => {
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

    const depositParam = {
        amount: new BN(10000000)
    }
    await deposit(connection, payer, depositParam, initParam)
    const newStakeAccount = Keypair.generate()

    const stakeReserveParam : StakeReserveParam = {
        validator_index: 0,
        validatorVote : voteAccount[0]
    }

    const newInitParam : InitParam= {
        ...initParam,
        stakeAccount : newStakeAccount
    }
    await stake_reserve(connection, payer, stakeReserveParam, newInitParam)
}