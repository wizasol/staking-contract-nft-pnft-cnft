import { Keypair, PublicKey } from "@solana/web3.js";
import {
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
    ConfigMarinadeParam,
} from "./basic_instruction_types"

import {
    OrderUnstakeParam,
    ClaimParam,
    StakeReserveParam,
    UpdateActiveParam,
    UpdateDeactivatedParam,
    DeactivateStakeParam,
    EmergencyUnstakeParam,
    PartialUnstakeParam,
    MergeStakeParam,
    RedelegateParam,
    WithdrawStakeAccountParam,
    ReallocStakeListParam,
    ReallocValidatorListParam,
} from "./advanced_instruction_types"
import BN from "bn.js";

interface InitParam {
    stateAccount: Keypair,
    stakeList: Keypair,
    validatorList: Keypair,
    operationalSolAccount: Keypair,
    stakeAccount: Keypair,
    authorityMsolAcc: PublicKey,
    authorityLpAcc: PublicKey,
    reservePda: PublicKey,
    solLegPda: PublicKey,
    authorityMSolLegAcc: PublicKey,
    stakeDepositAuthority: PublicKey,
    stakeWithdrawAuthority: PublicKey,
    msolMint: PublicKey,
    lpMint: PublicKey,
    treasuryMsolAccount: PublicKey,
    mSolLeg: PublicKey,
    mint_to: PublicKey,
    mint_to_lp: PublicKey,
    burnMsolFrom: PublicKey,
}

interface ParsedStakeAccountInfo {
    address: PublicKey
    ownerAddress: PublicKey
    authorizedStakerAddress: PublicKey | null
    authorizedWithdrawerAddress: PublicKey | null
    voterAddress: PublicKey | null
    activationEpoch: BN | null
    deactivationEpoch: BN | null
    isCoolingDown: boolean
    isLockedUp: boolean
    balanceLamports: BN | null
    stakedLamports: BN | null
}

export {
    InitParam,
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
    ConfigMarinadeParam,
    OrderUnstakeParam,
    ClaimParam,
    StakeReserveParam,
    UpdateActiveParam,
    UpdateDeactivatedParam,
    DeactivateStakeParam,
    ParsedStakeAccountInfo,
    EmergencyUnstakeParam,
    PartialUnstakeParam,
    MergeStakeParam,
    RedelegateParam,
    WithdrawStakeAccountParam,
    ReallocStakeListParam,
    ReallocValidatorListParam,
}