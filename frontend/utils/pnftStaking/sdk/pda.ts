import { BN, utils } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

import { REWARDS_CENTER_ADDRESS } from "./constants";

export const STAKE_ENTRY_SEED = "stake-entry";
export const findStakeEntryId = (
  stakePoolId: PublicKey,
  mintId: PublicKey,
  user?: PublicKey,
  isFungible?: boolean,
): PublicKey => {
  return PublicKey.findProgramAddressSync(
    [
      utils.bytes.utf8.encode(STAKE_ENTRY_SEED),
      stakePoolId.toBuffer(),
      mintId.toBuffer(),
      user && isFungible ? user.toBuffer() : PublicKey.default.toBuffer(),
    ],
    REWARDS_CENTER_ADDRESS,
  )[0];
};

export const STAKE_POOL_SEED = "stake-pool";
export const findStakePoolId = (identifier: string): PublicKey => {
  return PublicKey.findProgramAddressSync(
    [
      utils.bytes.utf8.encode(STAKE_POOL_SEED),
      utils.bytes.utf8.encode(identifier),
    ],
    REWARDS_CENTER_ADDRESS,
  )[0];
};

export const STAKE_AUTHORIZATION_RECORD_SEED = "stake-authorization";
export const findStakeAuthorizationRecordId = (
  stakePoolId: PublicKey,
  mintId: PublicKey,
): PublicKey => {
  return PublicKey.findProgramAddressSync(
    [
      utils.bytes.utf8.encode(STAKE_AUTHORIZATION_RECORD_SEED),
      stakePoolId.toBuffer(),
      mintId.toBuffer(),
    ],
    REWARDS_CENTER_ADDRESS,
  )[0];
};

export const USER_ESCROW_SEED = "escrow";
export const findUserEscrowId = (user: PublicKey): PublicKey => {
  return PublicKey.findProgramAddressSync(
    [utils.bytes.utf8.encode(USER_ESCROW_SEED), user.toBuffer()],
    REWARDS_CENTER_ADDRESS,
  )[0];
};

export const STAKE_BOOSTER_SEED = "stake-booster";
export const findStakeBoosterId = (
  stakePoolId: PublicKey,
  identifier?: BN,
): PublicKey => {
  return PublicKey.findProgramAddressSync(
    [
      utils.bytes.utf8.encode(STAKE_BOOSTER_SEED),
      stakePoolId.toBuffer(),
      (identifier ?? new BN(0)).toArrayLike(Buffer, "le", 8),
    ],
    REWARDS_CENTER_ADDRESS,
  )[0];
};

export const REWARD_DISTRIBUTOR_SEED = "reward-distributor";
export const findRewardDistributorId = (
  stakePoolId: PublicKey,
  identifier?: BN,
): PublicKey => {
  return PublicKey.findProgramAddressSync(
    [
      utils.bytes.utf8.encode(REWARD_DISTRIBUTOR_SEED),
      stakePoolId.toBuffer(),
      (identifier ?? new BN(0)).toArrayLike(Buffer, "le", 8),
    ],
    REWARDS_CENTER_ADDRESS,
  )[0];
};

export const REWARD_ENTRY_SEED = "reward-entry";
export const findRewardEntryId = (
  rewardDistributorId: PublicKey,
  stakeEntryId: PublicKey,
): PublicKey => {
  return PublicKey.findProgramAddressSync(
    [
      utils.bytes.utf8.encode(REWARD_ENTRY_SEED),
      rewardDistributorId.toBuffer(),
      stakeEntryId.toBuffer(),
    ],
    REWARDS_CENTER_ADDRESS,
  )[0];
};

export const RECEIPT_MANAGER_SEED = "receipt-manager";
export const findReceiptManagerId = (
  stakePoolId: PublicKey,
  identifier: string,
): PublicKey => {
  return PublicKey.findProgramAddressSync(
    [
      utils.bytes.utf8.encode(RECEIPT_MANAGER_SEED),
      stakePoolId.toBuffer(),
      utils.bytes.utf8.encode(identifier),
    ],
    REWARDS_CENTER_ADDRESS,
  )[0];
};

export const REWARD_RECEIPT_SEED = "reward-receipt";
export const findRewardReceiptId = (
  receiptManagerId: PublicKey,
  stakeEntryId: PublicKey,
): PublicKey => {
  return PublicKey.findProgramAddressSync(
    [
      utils.bytes.utf8.encode(REWARD_RECEIPT_SEED),
      receiptManagerId.toBuffer(),
      stakeEntryId.toBuffer(),
    ],
    REWARDS_CENTER_ADDRESS,
  )[0];
};

export const PAYMENT_INFO_SEED = "payment-info";
export const findPaymentInfoId = (identifier: string): PublicKey => {
  return PublicKey.findProgramAddressSync(
    [
      utils.bytes.utf8.encode(PAYMENT_INFO_SEED),
      utils.bytes.utf8.encode(identifier),
    ],
    REWARDS_CENTER_ADDRESS,
  )[0];
};
