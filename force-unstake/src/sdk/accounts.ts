import type { AllAccountsMap } from "@coral-xyz/anchor/dist/cjs/program/namespace/types";
import type {
  AccountInfo,
  Connection,
  GetAccountInfoConfig,
  GetProgramAccountsConfig,
  PublicKey,
} from "@solana/web3.js";
import type {
  NullableIdlAccountData,
  NullableIdlAccountInfo,
  ParsedIdlAccount,
} from "@solana-nft-programs/common";
import {
  decodeIdlAccount as cDecodeIdlAccount,
  decodeIdlAccountUnknown as cDecodeIdlAccountUnknown,
  fetchIdlAccount as cFetchIdlAccount,
  fetchIdlAccountNullable as cFetchIdlAccountNullable,
  getBatchedMultipleAccounts,
  getProgramIdlAccounts as cGetProgramIdlAccounts,
  tryDecodeIdlAccount as cTryDecodeIdlAccount,
  tryDecodeIdlAccountUnknown as cTryDecodeIdlAccountUnknown,
} from "@solana-nft-programs/common";

import { REWARDS_CENTER_ADDRESS, REWARDS_CENTER_IDL } from "./constants";
import type { SolanaNftProgramsRewardsCenter } from "./idl/solana_nft_programs_rewards_center";

/**
 * Fetch an account with idl types
 * @param connection
 * @param pubkey
 * @param accountType
 * @param config
 * @returns
 */
export const fetchIdlAccount = async <
  T extends keyof AllAccountsMap<SolanaNftProgramsRewardsCenter>,
>(
  connection: Connection,
  pubkey: PublicKey,
  accountType: T,
  config?: GetAccountInfoConfig,
) => {
  return cFetchIdlAccount<T, SolanaNftProgramsRewardsCenter>(
    connection,
    pubkey,
    accountType,
    REWARDS_CENTER_IDL,
    config,
  );
};

/**
 * Fetch a possibly null account with idl types of a specific type
 * @param connection
 * @param pubkey
 * @param accountType
 * @param config
 * @param idl
 * @returns
 */
export const fetchIdlAccountNullable = async <
  T extends keyof AllAccountsMap<SolanaNftProgramsRewardsCenter>,
>(
  connection: Connection,
  pubkey: PublicKey,
  accountType: T,
  config?: GetAccountInfoConfig,
) => {
  return cFetchIdlAccountNullable<T, SolanaNftProgramsRewardsCenter>(
    connection,
    pubkey,
    accountType,
    REWARDS_CENTER_IDL,
    config,
  );
};

/**
 * Decode an account with idl types of a specific type
 * @param accountInfo
 * @param accountType
 * @param idl
 * @returns
 */
export const decodeIdlAccount = <
  T extends keyof AllAccountsMap<SolanaNftProgramsRewardsCenter>,
>(
  accountInfo: AccountInfo<Buffer>,
  accountType: T,
) => {
  return cDecodeIdlAccount<T, SolanaNftProgramsRewardsCenter>(
    accountInfo,
    accountType,
    REWARDS_CENTER_IDL,
  );
};

/**
 * Try to decode an account with idl types of specific type
 * @param accountInfo
 * @param accountType
 * @param idl
 * @returns
 */
export const tryDecodeIdlAccount = <
  T extends keyof AllAccountsMap<SolanaNftProgramsRewardsCenter>,
>(
  accountInfo: AccountInfo<Buffer>,
  accountType: T,
) => {
  return cTryDecodeIdlAccount<T, SolanaNftProgramsRewardsCenter>(
    accountInfo,
    accountType,
    REWARDS_CENTER_IDL,
  );
};

/**
 * Decode an idl account of unknown type
 * @param accountInfo
 * @param idl
 * @returns
 */
export const decodeIdlAccountUnknown = <
  T extends keyof AllAccountsMap<SolanaNftProgramsRewardsCenter>,
>(
  accountInfo: AccountInfo<Buffer> | null,
): AccountInfo<Buffer> &
  ParsedIdlAccount<SolanaNftProgramsRewardsCenter>[T] => {
  return cDecodeIdlAccountUnknown<T, SolanaNftProgramsRewardsCenter>(
    accountInfo,
    REWARDS_CENTER_IDL,
  );
};

/**
 * Try to decode an account with idl types of unknown type
 * @param accountInfo
 * @param idl
 * @returns
 */
export const tryDecodeIdlAccountUnknown = <
  T extends keyof AllAccountsMap<SolanaNftProgramsRewardsCenter>,
>(
  accountInfo: AccountInfo<Buffer>,
): NullableIdlAccountInfo<T, SolanaNftProgramsRewardsCenter> => {
  return cTryDecodeIdlAccountUnknown<T, SolanaNftProgramsRewardsCenter>(
    accountInfo,
    REWARDS_CENTER_IDL,
  );
};

/**
 * Get program accounts of a specific idl type
 * @param connection
 * @param accountType
 * @param config
 * @param programId
 * @param idl
 * @returns
 */
export const getProgramIdlAccounts = async <
  T extends keyof AllAccountsMap<SolanaNftProgramsRewardsCenter>,
>(
  connection: Connection,
  accountType: T,
  config?: GetProgramAccountsConfig,
) => {
  return cGetProgramIdlAccounts<T, SolanaNftProgramsRewardsCenter>(
    connection,
    accountType,
    REWARDS_CENTER_ADDRESS,
    REWARDS_CENTER_IDL,
    config,
  );
};

export type IdlAccountDataById<
  T extends keyof AllAccountsMap<SolanaNftProgramsRewardsCenter>,
> = {
  [accountId: string]: NullableIdlAccountData<
    T,
    SolanaNftProgramsRewardsCenter
  >;
};

/**
 * Decode account infos with corresponding ids
 * @param accountIds
 * @param accountInfos
 * @returns
 */
export const decodeAccountInfos = <
  T extends keyof AllAccountsMap<SolanaNftProgramsRewardsCenter>,
>(
  accountIds: PublicKey[],
  accountInfos: (AccountInfo<Buffer> | null)[],
): IdlAccountDataById<T> => {
  return accountInfos.reduce((acc, accountInfo, i) => {
    if (!accountInfo?.data) return acc;
    const accoutIdString = accountIds[i]?.toString() ?? "";
    const ownerString = accountInfo.owner.toString();
    const baseData = {
      timestamp: Date.now(),
      pubkey: accountIds[i]!,
    };
    switch (ownerString) {
      // stakePool
      case REWARDS_CENTER_ADDRESS.toString(): {
        acc[accoutIdString] = {
          ...baseData,
          ...tryDecodeIdlAccountUnknown<T>(accountInfo),
        };
        return acc;
      }
      // fallback
      default:
        acc[accoutIdString] = {
          ...baseData,
          ...accountInfo,
          type: "unknown",
          parsed: null,
        };
        return acc;
    }
  }, {} as IdlAccountDataById<T>);
};

/**
 * Batch fetch a map of accounts and their corresponding ids
 * @param connection
 * @param ids
 * @returns
 */
export const fetchIdlAccountDataById = async <
  T extends keyof AllAccountsMap<SolanaNftProgramsRewardsCenter>,
>(
  connection: Connection,
  ids: (PublicKey | null)[],
): Promise<IdlAccountDataById<T>> => {
  const filteredIds = ids.filter((id): id is PublicKey => id !== null);
  const accountInfos = await getBatchedMultipleAccounts(
    connection,
    filteredIds,
  );
  return decodeAccountInfos(filteredIds, accountInfos);
};
