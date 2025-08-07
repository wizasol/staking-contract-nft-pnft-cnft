import { BN } from "bn.js";
import { connection, payer } from "../config";
import { add_validator, deactivate_stake, deposit, deposit_stake_account, emergency_unstake, initialize, order_unstake, partial_unstake, preRequisite, stake_reserve, update_active } from "../instructions";
import { DeactivateStakeParam, EmergencyUnstakeParam, InitializeDataParam, InitParam, StakeReserveParam } from "../types";
import { voteAccount } from "../constant";
import { Keypair, sendAndConfirmTransaction, StakeProgram, SystemProgram, Transaction } from "@solana/web3.js";

export const _deactivate_stake = async () => {
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

    const newTicketAccount = Keypair.generate()

    const orderUnstakeParam = {
        msol_amount : new BN(1000),
        newTicketAccount
    }
    await order_unstake(connection, payer, orderUnstakeParam, initParam)

    const newSplitStakeAccount = Keypair.generate()

    console.log(newSplitStakeAccount.publicKey.toBase58());

    const deactivateStakeParam: DeactivateStakeParam = {
        stake_index: 0,
        validator_index: 0,
        splitStakeAccount: newSplitStakeAccount
    }
    
    await deactivate_stake(connection, payer, deactivateStakeParam, initParam)
}