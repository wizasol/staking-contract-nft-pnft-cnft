import { Keypair, PublicKey } from "@solana/web3.js";
import BN from "bn.js";

interface InitializeDataParam {
    adminAuthority: PublicKey,
    validatorManagerAuthority: PublicKey,
    minStake: BN, // Example value
    rewardsFee: {
        numerator: number,
        denominator: number
    },
    liqPool: {
        lpLiquidityTarget: BN,
        lpMaxFee: {
            basisPoints: BN
        },
        lpMinFee: {
            basisPoints: BN
        },
        lpTreasuryCut: {
            basisPoints: BN
        },
    },
    additionalStakeRecordSpace: number,
    additionalValidatorRecordSpace: number,
    slotsForStakeDelta: BN,
    pauseAuthority: PublicKey,
};

interface ChangeAuthorityData {
    admin: PublicKey,
    validatorManager: PublicKey,
    operationalSolAccount: PublicKey,
    treasuryMsolAccount: PublicKey,
    pauseAuthority: PublicKey,
}

interface AddValidatorParam {
    score: number,
    voteAccount: PublicKey,
}

interface RemoveValidatorParam {
    voteAccount: PublicKey,
}

interface SetValidatorScore {
    index: number,
    validatorVote: PublicKey,
    score: number
}

interface ConfigValidatorSystem {
    extra_runs: number
}

interface DepositParam {
    amount: BN
}

interface DepositStakeParam {
    validatorIndex: number,
    amount: number
}

interface LiquidUnstakeParam {
    msol_amount: BN
}

interface AddLiquidityParam {
    lamports: BN
}

interface RemoveLiquidityParam {
    tokens: BN
}

interface ConfigLpParam {
    liquidityTarget: BN,
    minFee: { basisPoints: number },  // Correct usage for Fee type
    maxFee: { basisPoints: number },
    treasuryCut: { basisPoints: number },
}

interface ConfigMarinadeParam {
    rewardsFee: { basisPoints: number },
    slotsForStakeDelta: BN,
    minStake: BN,
    minDeposit: BN,
    minWithdraw: BN,
    stakingSolCap: BN,
    liquiditySolCap: BN,
    withdrawStakeAccountEnabled: true,
    delayedUnstakeFee: { bpCents: number },
    withdrawStakeAccountFee: { bpCents: number },
    maxStakeMovedPerEpoch: { basisPoints: number },
};

export {
    InitializeDataParam,
    ChangeAuthorityData,
    AddValidatorParam,
    RemoveValidatorParam,
    SetValidatorScore,
    ConfigValidatorSystem,
    DepositParam,
    DepositStakeParam,
    LiquidUnstakeParam,
    AddLiquidityParam,
    RemoveLiquidityParam,
    ConfigLpParam,
    ConfigMarinadeParam
}