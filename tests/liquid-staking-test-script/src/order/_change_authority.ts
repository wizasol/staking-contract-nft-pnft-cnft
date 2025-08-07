import { BN } from "bn.js"
import { connection, payer } from "../config"
import { change_authority, initialize, preRequisite } from "../instructions"
import { ChangeAuthorityData, InitializeDataParam } from "../types"
import { Keypair } from "@solana/web3.js"

export const _change_authority = async () => {
    const initParam = await preRequisite(connection, payer)

    const {
        operationalSolAccount,
        treasuryMsolAccount
    } = initParam

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

    const changeAuthorityData : ChangeAuthorityData = {
        admin: payer.publicKey,
        validatorManager: payer.publicKey,
        operationalSolAccount: operationalSolAccount.publicKey,
        treasuryMsolAccount: treasuryMsolAccount,
        pauseAuthority: payer.publicKey,
    }

    await change_authority(connection, payer, changeAuthorityData , initParam)
}
