import type { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import type { PublicKey } from "@solana/web3.js";

import type { StakePool } from "./constants";
import { findStakeAuthorizationRecordId } from "./pda";

export const remainingAccountsForAuthorization = (
  stakePool: Pick<StakePool, "parsed" | "pubkey">,
  mintId: PublicKey,
  mintMetadata: Metadata | null,
) => {
  if (
    stakePool.parsed.requiresAuthorization &&
    !mintMetadata?.data.creators?.some((c) =>
      stakePool.parsed.allowedCreators
        .map((c) => c.toString())
        .includes(c.address.toString()),
    ) &&
    !(
      mintMetadata?.collection?.key &&
      stakePool.parsed.allowedCollections
        .map((c) => c.toString())
        .includes(mintMetadata?.collection?.key?.toString())
    )
  ) {
    return [
      {
        pubkey: findStakeAuthorizationRecordId(stakePool.pubkey, mintId),
        isSigner: false,
        isWritable: false,
      },
    ];
  }
  return [];
};
