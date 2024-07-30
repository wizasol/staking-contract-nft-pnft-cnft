import type { Wallet } from "@coral-xyz/anchor/dist/cjs/provider";
import { PROGRAM_ID as TOKEN_AUTH_RULES_ID } from "@metaplex-foundation/mpl-token-auth-rules";
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import {
  createAssociatedTokenAccountIdempotentInstruction,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import type { Connection, PublicKey } from "@solana/web3.js";
import {
  ComputeBudgetProgram,
  SystemProgram,
  SYSVAR_INSTRUCTIONS_PUBKEY,
  Transaction,
} from "@solana/web3.js";
import {
  findAta,
  findTokenRecordId,
  tryNull,
} from "@solana-nft-programs/common";
import {
  findMintManagerId,
  MintManager,
  PROGRAM_ID as CREATOR_STANDARD_PROGRAM_ID,
} from "@solana-nft-programs/creator-standard";
import BN from "bn.js";

import {
  decodeIdlAccount,
  fetchIdlAccount,
  fetchIdlAccountDataById,
} from "./accounts";
import { remainingAccountsForAuthorization } from "./authorization";
import type { PaymentShare } from "./constants";
import { rewardsCenterProgram } from "./constants";
import {
  withRemainingAccountsForPayment,
  withRemainingAccountsForPaymentInfo,
  withRemainingAccountsForPaymentInfoSync,
} from "./payment";
import {
  findRewardEntryId,
  findRewardReceiptId,
  findStakeBoosterId,
  findStakeEntryId,
  findStakePoolId,
  findUserEscrowId,
} from "./pda";
import {
  findMintEditionId,
  findMintMetadataId,
  METADATA_PROGRAM_ID,
} from "./utils";

/**
 * Stake all mints and also initialize entries if not already initialized
 *
 * @param connection
 * @param wallet
 * @param stakePoolIdentifier
 * @param mintInfos
 * @returns
 */
export const stake = async (
  connection: Connection,
  wallet: Wallet,
  stakePoolIdentifier: string,
  mintInfos: {
    mintId: PublicKey;
    tokenAccountId?: PublicKey;
    amount?: BN;
    fungible?: boolean;
  }[],
) => {
  const stakePoolId = findStakePoolId(stakePoolIdentifier);
  const mints = mintInfos.map(
    ({ mintId, tokenAccountId, amount, fungible }) => {
      return {
        mintId,
        amount,
        stakeEntryId: findStakeEntryId(
          stakePoolId,
          mintId,
          fungible ? wallet.publicKey : undefined,
        ),
        mintTokenAccountId:
          tokenAccountId ??
          getAssociatedTokenAddressSync(mintId, wallet.publicKey, true),
      };
    },
  );
  const accountDataById = await fetchIdlAccountDataById(connection, [
    stakePoolId,
    ...mints.map((m) => m.stakeEntryId),
    ...mints.map((m) => findMintManagerId(m.mintId)),
    ...mints.map((m) => findMintMetadataId(m.mintId)),
  ]);
  const stakePoolData = accountDataById[stakePoolId.toString()];
  if (!stakePoolData?.parsed || stakePoolData.type !== "stakePool") {
    throw "Stake pool not found";
  }

  const stakePaymentInfoData = await fetchIdlAccount(
    connection,
    stakePoolData.parsed.stakePaymentInfo,
    "paymentInfo",
  );

  const txs: Transaction[] = [];
  for (const { mintId, mintTokenAccountId, stakeEntryId, amount } of mints) {
    const tx = new Transaction();
    const metadataId = findMintMetadataId(mintId);
    const mintManagerId = findMintManagerId(mintId);

    const mintManagerAccountInfo = accountDataById[mintManagerId.toString()];
    const metadataAccountInfo = accountDataById[metadataId.toString()];
    const metadataInfo = metadataAccountInfo
      ? Metadata.fromAccountInfo(metadataAccountInfo)[0]
      : undefined;

    const authorizationAccounts = remainingAccountsForAuthorization(
      stakePoolData,
      mintId,
      metadataInfo ?? null,
    );
    if (!accountDataById[stakeEntryId.toString()]) {
      const ix = await rewardsCenterProgram(connection, wallet)
        .methods.initEntry(wallet.publicKey)
        .accounts({
          stakeEntry: stakeEntryId,
          stakePool: stakePoolId,
          stakeMint: mintId,
          stakeMintMetadata: metadataId,
          payer: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .remainingAccounts(authorizationAccounts)
        .instruction();
      tx.add(ix);
    }

    const userEscrowId = findUserEscrowId(wallet.publicKey);

    const remainingAccounts = [
      ...authorizationAccounts,
      ...withRemainingAccountsForPaymentInfoSync(
        tx,
        wallet.publicKey,
        stakePaymentInfoData,
      ),
    ];

    if (mintManagerAccountInfo?.data) {
      const mintManager = MintManager.fromAccountInfo(
        mintManagerAccountInfo,
      )[0];
      const stakeIx = await rewardsCenterProgram(connection, wallet)
        .methods.stakeCcs(new BN(amount ?? 1))
        .accounts({
          stakePool: stakePoolId,
          stakeEntry: stakeEntryId,
          stakeMint: mintId,
          stakeMintMetadata: metadataId,
          stakeMintManager: mintManagerId,
          stakeMintManagerRuleset: mintManager.ruleset,
          user: wallet.publicKey,
          userEscrow: userEscrowId,
          userStakeMintTokenAccount: mintTokenAccountId,
          creatorStandardProgram: CREATOR_STANDARD_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .remainingAccounts(remainingAccounts)
        .instruction();
      tx.add(stakeIx);
    } else if (metadataInfo && metadataInfo.programmableConfig) {
      const editionId = findMintEditionId(mintId);
      const stakeTokenRecordAccountId = findTokenRecordId(
        mintId,
        mintTokenAccountId,
      );
      tx.add(
        ComputeBudgetProgram.setComputeUnitLimit({
          units: 100000000,
        }),
      );
      const stakeIx = await rewardsCenterProgram(connection, wallet)
        .methods.stakePnft()
        .accountsStrict({
          stakePool: stakePoolId,
          stakeEntry: stakeEntryId,
          stakeMint: mintId,
          stakeMintMetadata: metadataId,
          stakeMintEdition: editionId,
          stakeTokenRecordAccount: stakeTokenRecordAccountId,
          authorizationRules:
            metadataInfo?.programmableConfig?.ruleSet ?? METADATA_PROGRAM_ID,
          user: wallet.publicKey,
          userEscrow: userEscrowId,
          userStakeMintTokenAccount: mintTokenAccountId,
          tokenMetadataProgram: METADATA_PROGRAM_ID,
          sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          authorizationRulesProgram: TOKEN_AUTH_RULES_ID,
        })
        .remainingAccounts(remainingAccounts)
        .instruction();
      tx.add(stakeIx);
    } else {
      const editionId = findMintEditionId(mintId);
      const stakeIx = await rewardsCenterProgram(connection, wallet)
        .methods.stakeEdition(new BN(amount ?? 1))
        .accounts({
          stakePool: stakePoolId,
          stakeEntry: stakeEntryId,
          stakeMint: mintId,
          stakeMintEdition: editionId,
          stakeMintMetadata: metadataId,
          user: wallet.publicKey,
          userEscrow: userEscrowId,
          userStakeMintTokenAccount: mintTokenAccountId,
          tokenMetadataProgram: METADATA_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .remainingAccounts(remainingAccounts)
        .instruction();
      tx.add(stakeIx);
    }
    txs.push(tx);
  }
  return txs;
};

/**
 * Unstake all mints and also claim rewards from any specified reward distributor(s)
 *
 * @param connection
 * @param wallet
 * @param stakePoolIdentifier
 * @param mintInfos
 * @param rewardDistributorIds
 * @returns
 */
export const unstake = async (
  connection: Connection,
  wallet: Wallet,
  stakePoolIdentifier: string,
  mintInfos: {
    mintId: PublicKey;
    fungible?: boolean;
  }[],
  rewardDistributorIds?: PublicKey[],
) => {
  const stakePoolId = findStakePoolId(stakePoolIdentifier);
  const mints = mintInfos.map(({ mintId, fungible }) => {
    const stakeEntryId = findStakeEntryId(
      stakePoolId,
      mintId,
      fungible ? wallet.publicKey : undefined,
    );
    return {
      mintId,
      stakeEntryId,
      rewardEntryIds: rewardDistributorIds?.map((rewardDistributorId) =>
        findRewardEntryId(rewardDistributorId, stakeEntryId),
      ),
    };
  });

  let accountDataById = await fetchIdlAccountDataById(connection, [
    stakePoolId,
    ...(rewardDistributorIds ?? []),
    ...mints.map((m) => m.rewardEntryIds ?? []).flat(),
    ...mints.map((m) => findMintManagerId(m.mintId)),
    ...mints.map((m) => m.stakeEntryId),
  ]);
  const stakePoolData = accountDataById[stakePoolId.toString()];
  if (!stakePoolData?.parsed || stakePoolData.type !== "stakePool") {
    throw "Stake pool not found";
  }

  const claimRewardsPaymentInfoIds = rewardDistributorIds?.map((id) => {
    const rewardDistributorData = accountDataById[id.toString()];
    if (
      rewardDistributorData &&
      rewardDistributorData.type === "rewardDistributor"
    ) {
      return rewardDistributorData.parsed.claimRewardsPaymentInfo;
    }
    return null;
  });
  const accountDataById2 = await fetchIdlAccountDataById(connection, [
    stakePoolData.parsed.unstakePaymentInfo,
    ...(claimRewardsPaymentInfoIds ?? []),
  ]);
  accountDataById = { ...accountDataById, ...accountDataById2 };

  const txs: Transaction[] = [];
  for (const { mintId, stakeEntryId, rewardEntryIds } of mints) {
    const tx = new Transaction();
    const userEscrowId = findUserEscrowId(wallet.publicKey);
    const userAtaId = getAssociatedTokenAddressSync(mintId, wallet.publicKey);
    const stakeEntry = accountDataById[stakeEntryId.toString()];

    if (
      rewardEntryIds &&
      rewardDistributorIds &&
      rewardDistributorIds?.length > 0 &&
      !(
        stakeEntry?.type === "stakeEntry" &&
        stakeEntry.parsed.cooldownStartSeconds
      )
    ) {
      const ix = await rewardsCenterProgram(connection, wallet)
        .methods.updateTotalStakeSeconds()
        .accounts({
          stakeEntry: stakeEntryId,
          updater: wallet.publicKey,
        })
        .instruction();
      tx.add(ix);

      for (let j = 0; j < rewardDistributorIds.length; j++) {
        const rewardDistributorId = rewardDistributorIds[j]!;
        const rewardDistributorData =
          accountDataById[rewardDistributorId.toString()];
        const rewardEntryId = rewardEntryIds[j];
        if (
          rewardEntryId &&
          rewardDistributorData &&
          rewardDistributorData.type === "rewardDistributor"
        ) {
          const rewardMint = rewardDistributorData.parsed.rewardMint;
          const rewardEntry = accountDataById[rewardEntryId?.toString()];
          const rewardDistributorTokenAccount = getAssociatedTokenAddressSync(
            rewardMint,
            rewardDistributorId,
            true,
          );
          const userRewardMintTokenAccount = getAssociatedTokenAddressSync(
            rewardMint,
            wallet.publicKey,
            true,
          );
          if (!rewardEntry) {
            const ix = await rewardsCenterProgram(connection, wallet)
              .methods.initRewardEntry()
              .accounts({
                rewardEntry: findRewardEntryId(
                  rewardDistributorId,
                  stakeEntryId,
                ),
                rewardDistributor: rewardDistributorId,
                stakeEntry: stakeEntryId,
                payer: wallet.publicKey,
              })
              .instruction();
            tx.add(ix);
          }

          const remainingAccountsForPayment = [];
          const claimRewardsPaymentInfo =
            accountDataById[
              rewardDistributorData.parsed.claimRewardsPaymentInfo.toString()
            ];
          if (
            claimRewardsPaymentInfo &&
            claimRewardsPaymentInfo.type === "paymentInfo"
          ) {
            remainingAccountsForPayment.push(
              ...withRemainingAccountsForPaymentInfoSync(
                tx,
                wallet.publicKey,
                claimRewardsPaymentInfo,
              ),
            );
          }
          const ix = await rewardsCenterProgram(connection, wallet)
            .methods.claimRewards()
            .accounts({
              rewardEntry: findRewardEntryId(rewardDistributorId, stakeEntryId),
              rewardDistributor: rewardDistributorId,
              stakeEntry: stakeEntryId,
              stakePool: stakePoolId,
              rewardMint: rewardMint,
              userRewardMintTokenAccount: userRewardMintTokenAccount,
              rewardDistributorTokenAccount: rewardDistributorTokenAccount,
              user: wallet.publicKey,
            })
            .remainingAccounts(remainingAccountsForPayment)
            .instruction();
          tx.add(ix);
        }
      }
    }

    const remainingAccounts = [];
    const unstakePaymentInfo =
      accountDataById[stakePoolData.parsed.unstakePaymentInfo.toString()];
    if (unstakePaymentInfo && unstakePaymentInfo.type === "paymentInfo") {
      remainingAccounts.push(
        ...withRemainingAccountsForPaymentInfoSync(
          tx,
          wallet.publicKey,
          unstakePaymentInfo,
        ),
      );
    }
    const mintManagerId = findMintManagerId(mintId);
    const mintManagerAccountInfo = accountDataById[mintManagerId.toString()];
    const metadataId = findMintMetadataId(mintId);
    const metadata = await tryNull(
      Metadata.fromAccountAddress(connection, metadataId),
    );
    if (mintManagerAccountInfo?.data) {
      const ix = await rewardsCenterProgram(connection, wallet)
        .methods.unstakeCcs()
        .accounts({
          stakeEntry: stakeEntryId,
          stakePool: stakePoolId,
          stakeMint: mintId,
          stakeMintManager: mintManagerId,
          user: wallet.publicKey,
          userEscrow: userEscrowId,
          userStakeMintTokenAccount: userAtaId,
          creatorStandardProgram: CREATOR_STANDARD_PROGRAM_ID,
        })
        .remainingAccounts(remainingAccounts)
        .instruction();
      tx.add(ix);
    } else if (metadata?.programmableConfig) {
      const editionId = findMintEditionId(mintId);
      const stakeTokenRecordAccountId = findTokenRecordId(mintId, userAtaId);
      tx.add(
        ComputeBudgetProgram.setComputeUnitLimit({
          units: 100000000,
        }),
      );
      const unstakeIx = await rewardsCenterProgram(connection, wallet)
        .methods.unstakePnft()
        .accountsStrict({
          stakePool: stakePoolId,
          stakeEntry: stakeEntryId,
          stakeMint: mintId,
          stakeMintMetadata: metadataId,
          stakeMintEdition: editionId,
          stakeTokenRecordAccount: stakeTokenRecordAccountId,
          authorizationRules:
            metadata?.programmableConfig?.ruleSet ?? METADATA_PROGRAM_ID,
          user: wallet.publicKey,
          userEscrow: userEscrowId,
          userStakeMintTokenAccount: userAtaId,
          tokenMetadataProgram: METADATA_PROGRAM_ID,
          sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          authorizationRulesProgram: TOKEN_AUTH_RULES_ID,
        })
        .remainingAccounts(remainingAccounts)
        .instruction();
      tx.add(unstakeIx);
    } else {
      const editionId = findMintEditionId(mintId);
      const ix = await rewardsCenterProgram(connection, wallet)
        .methods.unstakeEdition()
        .accounts({
          stakeEntry: stakeEntryId,
          stakePool: stakePoolId,
          stakeMint: mintId,
          stakeMintEdition: editionId,
          user: wallet.publicKey,
          userEscrow: userEscrowId,
          userStakeMintTokenAccount: userAtaId,
          tokenMetadataProgram: METADATA_PROGRAM_ID,
        })
        .remainingAccounts(remainingAccounts)
        .instruction();
      tx.add(ix);
    }
    txs.push(tx);
  }
  return txs;
};

/**
 * Claim reward for all mints from any specified reward distributor(s)
 *
 * @param connection
 * @param wallet
 * @param stakePoolIdentifier
 * @param mintInfos
 * @param rewardDistributorIds
 * @returns
 */
export const claimRewards = async (
  connection: Connection,
  wallet: Wallet,
  stakePoolIdentifier: string,
  mintInfos: {
    mintId: PublicKey;
    fungible?: boolean;
  }[],
  rewardDistributorIds?: PublicKey[],
  claimingRewardsForUsers?: boolean,
) => {
  const stakePoolId = findStakePoolId(stakePoolIdentifier);
  const mints = mintInfos.map(({ mintId, fungible }) => {
    const stakeEntryId = findStakeEntryId(
      stakePoolId,
      mintId,
      fungible ? wallet.publicKey : undefined,
    );
    return {
      mintId,
      stakeEntryId,
      rewardEntryIds: rewardDistributorIds?.map((rewardDistributorId) =>
        findRewardEntryId(rewardDistributorId, stakeEntryId),
      ),
    };
  });

  let accountDataById = await fetchIdlAccountDataById(connection, [
    ...(rewardDistributorIds ?? []),
    ...mints.map((m) => m.rewardEntryIds ?? []).flat(),
    ...(claimingRewardsForUsers
      ? mints.map((m) => findStakeEntryId(stakePoolId, m.mintId)).flat()
      : []),
  ]);
  const claimRewardsPaymentInfoIds = rewardDistributorIds?.map((id) => {
    const rewardDistributorData = accountDataById[id.toString()];
    if (
      rewardDistributorData &&
      rewardDistributorData.type === "rewardDistributor"
    ) {
      return rewardDistributorData.parsed.claimRewardsPaymentInfo;
    }
    return null;
  });
  const accountDataById2 = await fetchIdlAccountDataById(connection, [
    ...(claimRewardsPaymentInfoIds ?? []),
  ]);
  accountDataById = { ...accountDataById, ...accountDataById2 };

  const txs: Transaction[] = [];

  for (const { stakeEntryId, rewardEntryIds } of mints) {
    const tx = new Transaction();
    if (
      rewardEntryIds &&
      rewardDistributorIds &&
      rewardDistributorIds?.length > 0
    ) {
      const ix = await rewardsCenterProgram(connection, wallet)
        .methods.updateTotalStakeSeconds()
        .accounts({
          stakeEntry: stakeEntryId,
          updater: wallet.publicKey,
        })
        .instruction();
      tx.add(ix);
      for (let j = 0; j < rewardDistributorIds.length; j++) {
        const rewardDistributorId = rewardDistributorIds[j]!;
        const rewardDistributorData =
          accountDataById[rewardDistributorId.toString()];
        const rewardEntryId = rewardEntryIds[j];
        if (
          rewardEntryId &&
          rewardDistributorData &&
          rewardDistributorData.type === "rewardDistributor"
        ) {
          const rewardMint = rewardDistributorData.parsed.rewardMint;
          const rewardEntry = accountDataById[rewardEntryId?.toString()];
          const rewardDistributorTokenAccount = getAssociatedTokenAddressSync(
            rewardMint,
            rewardDistributorId,
            true,
          );
          const stakeEntryDataInfo = accountDataById[stakeEntryId.toString()];
          const userRewardMintTokenAccountOwnerId = stakeEntryDataInfo
            ? decodeIdlAccount(stakeEntryDataInfo, "stakeEntry").parsed
                .lastStaker
            : wallet.publicKey;

          const userRewardMintTokenAccount = await findAta(
            rewardMint,
            userRewardMintTokenAccountOwnerId,
            true,
          );
          tx.add(
            createAssociatedTokenAccountIdempotentInstruction(
              wallet.publicKey,
              userRewardMintTokenAccount,
              userRewardMintTokenAccountOwnerId,
              rewardMint,
            ),
          );
          if (!rewardEntry) {
            const ix = await rewardsCenterProgram(connection, wallet)
              .methods.initRewardEntry()
              .accounts({
                rewardEntry: findRewardEntryId(
                  rewardDistributorId,
                  stakeEntryId,
                ),
                rewardDistributor: rewardDistributorId,
                stakeEntry: stakeEntryId,
                payer: wallet.publicKey,
              })
              .instruction();
            tx.add(ix);
          }

          const remainingAccountsForPayment = [];
          const unstakePaymentInfo =
            accountDataById[
              rewardDistributorData.parsed.claimRewardsPaymentInfo.toString()
            ];
          if (unstakePaymentInfo && unstakePaymentInfo.type === "paymentInfo") {
            remainingAccountsForPayment.push(
              ...withRemainingAccountsForPaymentInfoSync(
                tx,
                wallet.publicKey,
                unstakePaymentInfo,
              ),
            );
          }
          const ix = await rewardsCenterProgram(connection, wallet)
            .methods.claimRewards()
            .accounts({
              rewardEntry: findRewardEntryId(rewardDistributorId, stakeEntryId),
              rewardDistributor: rewardDistributorId,
              stakeEntry: stakeEntryId,
              stakePool: stakePoolId,
              rewardMint: rewardMint,
              userRewardMintTokenAccount: userRewardMintTokenAccount,
              rewardDistributorTokenAccount: rewardDistributorTokenAccount,
              user: wallet.publicKey,
            })
            .remainingAccounts(remainingAccountsForPayment)
            .instruction();
          tx.add(ix);
        }
      }
    }
    txs.push(tx);
  }
  return txs;
};

/**
 * Claim reward receipt from a given receipt manager
 *
 * @param connection
 * @param wallet
 * @param stakePoolIdentifier
 * @param mintInfo
 * @param receiptManagerId
 * @returns
 */
export const claimRewardReceipt = async (
  connection: Connection,
  wallet: Wallet,
  stakePoolIdentifier: string,
  mintInfo: {
    mintId: PublicKey;
    fungible?: boolean;
  },
  receiptManagerId: PublicKey,
) => {
  const stakePoolId = findStakePoolId(stakePoolIdentifier);
  const stakeEntryId = findStakeEntryId(
    stakePoolId,
    mintInfo.mintId,
    mintInfo.fungible ? wallet.publicKey : undefined,
  );
  const rewardReceiptId = findRewardReceiptId(receiptManagerId, stakeEntryId);

  const accountDataById = await fetchIdlAccountDataById(connection, [
    receiptManagerId,
    rewardReceiptId,
  ]);
  const receiptManagerData = accountDataById[receiptManagerId.toString()];
  if (
    !receiptManagerData?.parsed ||
    receiptManagerData.type !== "receiptManager"
  ) {
    throw "Receipt manager not found";
  }

  const tx = new Transaction();
  const ix = await rewardsCenterProgram(connection, wallet)
    .methods.updateTotalStakeSeconds()
    .accounts({
      stakeEntry: stakeEntryId,
      updater: wallet.publicKey,
    })
    .instruction();
  tx.add(ix);
  if (!accountDataById[rewardReceiptId.toString()]?.parsed) {
    const ix = await rewardsCenterProgram(connection, wallet)
      .methods.initRewardReceipt()
      .accounts({
        rewardReceipt: rewardReceiptId,
        receiptManager: receiptManagerId,
        stakeEntry: stakeEntryId,
        payer: wallet.publicKey,
      })
      .instruction();
    tx.add(ix);
  }
  const remainingAccountsForPayment = withRemainingAccountsForPayment(
    tx,
    wallet.publicKey,
    receiptManagerData.parsed.paymentMint,
    (receiptManagerData.parsed.paymentShares as PaymentShare[]).map(
      (p) => p.address,
    ),
  );

  const remainingAccountsForAction = await withRemainingAccountsForPaymentInfo(
    connection,
    tx,
    wallet.publicKey,
    receiptManagerData.parsed.claimActionPaymentInfo,
  );
  const rewardReceiptIx = await rewardsCenterProgram(connection, wallet)
    .methods.claimRewardReceipt()
    .accounts({
      rewardReceipt: rewardReceiptId,
      receiptManager: receiptManagerId,
      stakeEntry: stakeEntryId,
      payer: wallet.publicKey,
      claimer: wallet.publicKey,
    })
    .remainingAccounts([
      ...remainingAccountsForPayment,
      ...remainingAccountsForAction,
    ])
    .instruction();
  tx.add(rewardReceiptIx);
  return tx;
};

/**
 * Boost a given stake entry using the specified stake booster
 *
 * @param connection
 * @param wallet
 * @param stakePoolIdentifier
 * @param secondsToBoost
 * @param mintInfo
 * @param stakeBoosterIdentifer
 * @returns
 */
export const boost = async (
  connection: Connection,
  wallet: Wallet,
  stakePoolIdentifier: string,
  mintInfo: {
    mintId: PublicKey;
    fungible?: boolean;
  },
  secondsToBoost: number,
  stakeBoosterIdentifer?: number,
) => {
  const stakePoolId = findStakePoolId(stakePoolIdentifier);
  const stakeEntryId = findStakeEntryId(
    stakePoolId,
    mintInfo.mintId,
    mintInfo.fungible ? wallet.publicKey : undefined,
  );
  const stakeBoosterId = findStakeBoosterId(
    stakePoolId,
    stakeBoosterIdentifer ? new BN(stakeBoosterIdentifer) : undefined,
  );

  const accountDataById = await fetchIdlAccountDataById(connection, [
    stakeBoosterId,
  ]);
  const stakeBoosterData = accountDataById[stakeBoosterId.toString()];
  if (!stakeBoosterData?.parsed || stakeBoosterData.type !== "stakeBooster") {
    throw "Stake booster not found";
  }

  const tx = new Transaction();
  const ix = await rewardsCenterProgram(connection, wallet)
    .methods.updateTotalStakeSeconds()
    .accounts({
      stakeEntry: stakeEntryId,
      updater: wallet.publicKey,
    })
    .instruction();
  tx.add(ix);

  const remainingAccountsForPayment = withRemainingAccountsForPayment(
    tx,
    wallet.publicKey,
    stakeBoosterData.parsed.paymentMint,
    (stakeBoosterData.parsed.paymentShares as PaymentShare[]).map(
      (p) => p.address,
    ),
  );

  const remainingAccountsForAction = await withRemainingAccountsForPaymentInfo(
    connection,
    tx,
    wallet.publicKey,
    stakeBoosterData.parsed.boostActionPaymentInfo,
  );
  const boostIx = await rewardsCenterProgram(connection, wallet)
    .methods.boostStakeEntry({ secondsToBoost: new BN(secondsToBoost) })
    .accounts({
      stakePool: stakePoolId,
      stakeBooster: stakeBoosterId,
      stakeEntry: stakeEntryId,
      stakeMint: mintInfo.mintId,
    })
    .remainingAccounts([
      ...remainingAccountsForPayment,
      ...remainingAccountsForAction,
    ])
    .instruction();
  tx.add(boostIx);
  return tx;
};
