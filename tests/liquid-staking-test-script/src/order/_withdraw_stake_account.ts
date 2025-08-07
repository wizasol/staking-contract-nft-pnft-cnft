import { BN } from "bn.js";
import { connection, payer } from "../config";
import { add_validator, config_marinade, deposit, deposit_stake_account, initialize, preRequisite, update_active, update_deactivated, withdraw_stake_account } from "../instructions";
import { ConfigMarinadeParam, InitializeDataParam, UpdateDeactivatedParam, WithdrawStakeAccountParam } from "../types";
import { voteAccount } from "../constant";
import { Keypair } from "@solana/web3.js";

//! not yet
export const _withdraw_stake_account = async () => {
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

    const configMarinadeParam : ConfigMarinadeParam = {
        rewardsFee: { basisPoints: 1 },
        slotsForStakeDelta: new BN (3000),  //  minimun
        minStake: new BN (10000000),            //  minimum
        minDeposit: new BN (4),
        minWithdraw: new BN (5),
        stakingSolCap: new BN (6),
        liquiditySolCap: new BN (7),
        withdrawStakeAccountEnabled: true,
        delayedUnstakeFee: { bpCents: 8 },
        withdrawStakeAccountFee: { bpCents: 9 },
        maxStakeMovedPerEpoch: { basisPoints: 10 },
    };

    await config_marinade(connection, payer, configMarinadeParam, initParam)

    const updateActiveParam = {
        stake_index: 0,
        validator_index: 0
    }
    await update_active(connection, payer, updateActiveParam, initParam)

    const splitStakeAccount = Keypair.generate()

    const withdrawStakeAccountParam: WithdrawStakeAccountParam = {
        stake_index: 0,
        validator_index: 0,
        msol_amount: new BN(10 ** 9),
        beneficiary: voteAccount[0],
        splitStakeAccount: splitStakeAccount,
    }
    await withdraw_stake_account(connection, payer, withdrawStakeAccountParam, initParam)
}