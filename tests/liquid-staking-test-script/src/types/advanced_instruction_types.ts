import { Keypair, PublicKey } from "@solana/web3.js";
import BN from "bn.js";

interface OrderUnstakeParam {
    msol_amount: BN,
    newTicketAccount: Keypair
}

interface ClaimParam {
    newTicketAccount: Keypair
}

interface StakeReserveParam {
    validator_index: number,
    validatorVote: PublicKey
}

interface UpdateActiveParam {
    stake_index: number,
    validator_index: number
}

interface UpdateDeactivatedParam {
    stake_index: number,
}

interface DeactivateStakeParam {
    stake_index: number,
    validator_index: number,
    splitStakeAccount: Keypair
}

interface EmergencyUnstakeParam {
    stake_index: number,
    validator_index: number,
}

interface PartialUnstakeParam {
    stake_index: number,
    validator_index: number,
    desired_unstake_amount: BN,
    splitStakeAccount: Keypair
}

interface MergeStakeParam {
    destination_stake_index: number,
    source_stake_index: number,
    validator_index: number,
    splitStakeAccount: Keypair
}

interface RedelegateParam {
    stake_index: number,
    source_validator_index: number,
    dest_validator_index: number,
    validatorVote: PublicKey
    splitStakeAccount: Keypair,
    newRedelegateStakeAccount: Keypair,
}

interface WithdrawStakeAccountParam {
    stake_index: number,
    validator_index: number,
    msol_amount: BN,
    beneficiary: PublicKey,
    splitStakeAccount: Keypair,
}

interface ReallocStakeListParam {
    capacity: number,
}

interface ReallocValidatorListParam {
    capacity: number,
}

export {
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
}