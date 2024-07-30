import {
  chunkArray,
  executeTransaction,
  findMintMetadataId,
  withFindOrInitAssociatedTokenAccount,
} from "@solana-nft-programs/common";
import type {
  AllAccountsMap,
  IdlTypes,
  TypeDef,
} from "@coral-xyz/anchor/dist/cjs/program/namespace/types";
import type { Wallet } from "@coral-xyz/anchor/dist/cjs/provider";
import type { Connection } from "@solana/web3.js";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { BN } from "bn.js";

import type { IDL } from "../../sdk";
import {
  fetchIdlAccount,
  fetchIdlAccountDataById,
  findRewardDistributorId,
  findRewardEntryId,
  findStakeEntryId,
  rewardsCenterProgram,
  tryDecodeIdlAccount,
} from "../../sdk";
import { fetchMetadata } from "../metadata";

export const commandName = "initializeEntriesAndSetMultipliers";
export const description =
  "Initialize all entries and optionally set multipliers for reward entries. Optionalls use metadataRules for complex multiplier rules";

export const getArgs = (_connection: Connection, _wallet: Wallet) => ({
  // stake pool id
  stakePoolId: new PublicKey("3BZCupFU6X3wYJwgTsKS2vTs4VeMrhSZgx4P2TfzExtP"),
  // array of mints and optionally multiplier to initialize
  // REMINDER: Take into account rewardDistributor.multiplierDecimals!
  initEntries: [] as EntryData[],
  // optional update rules
  metadataRules: undefined as UpdateRule["metadata"],
  // number of entries per transaction
  batchSize: 3,
  // number of transactions in parallel
  parallelBatchSize: 20,
});

export type UpdateRule = {
  volume?: { volumeUpperBound: number; multiplier: number }[];
  metadata?: { traitType: string; value: string; multiplier: number }[];
  combination?: {
    primaryMint: PublicKey[];
    secondaryMints: PublicKey[];
    multiplier: number;
  };
};

export type MetadataJSON = {
  name: string;
  symbol: string;
  description: string;
  seller_fee_basis_points: number;
  image: string;
  external_url: string;
  edition: number;
  attributes: { trait_type: string; value: string }[];
};

type EntryData = { mintId: PublicKey; multiplier?: number };

export const handler = async (
  connection: Connection,
  wallet: Wallet,
  args: ReturnType<typeof getArgs>
) => {
  const { stakePoolId, initEntries, metadataRules } = args;
  const program = rewardsCenterProgram(connection, wallet);

  const rewardDistributorId = findRewardDistributorId(stakePoolId);
  const rewardDistributorData = await fetchIdlAccount(
    connection,
    rewardDistributorId,
    "rewardDistributor"
  );
  console.log(
    `--------- Initialize ${
      initEntries.length
    } entries for pool (${stakePoolId.toString()}) and reward distributor (${rewardDistributorId.toString()}) ---------`
  );
  const stakeEntryIds = await Promise.all(
    initEntries.map((e) => findStakeEntryId(stakePoolId, e.mintId))
  );
  const stakeEntriesAccountInfos = await fetchIdlAccountDataById(
    connection,
    stakeEntryIds
  );
  const stakeEntries: {
    pubkey: PublicKey;
    parsed: TypeDef<
      AllAccountsMap<typeof IDL>["stakeEntry"],
      IdlTypes<typeof IDL>
    > | null;
  }[] = Object.values(stakeEntriesAccountInfos).map((accountInfo) => {
    return {
      pubkey: accountInfo.pubkey,
      parsed: tryDecodeIdlAccount(accountInfo, "stakeEntry").parsed,
    };
  });
  const stakeEntriesById: {
    [id: string]: {
      pubkey: string;
      parsed: TypeDef<
        AllAccountsMap<typeof IDL>["stakeEntry"],
        IdlTypes<typeof IDL>
      >;
    };
  } = stakeEntries.reduce(
    (acc, stakeEntry) =>
      stakeEntry.parsed
        ? {
            ...acc,
            [stakeEntry.pubkey.toString()]: stakeEntry.parsed,
          }
        : { ...acc },
    {}
  );

  const rewardEntryIds = stakeEntryIds.map((stakeEntryId) =>
    findRewardEntryId(rewardDistributorId, stakeEntryId)
  );
  const rewardEntriesAccountInfos = await fetchIdlAccountDataById(
    connection,
    rewardEntryIds
  );
  const rewardEntries: {
    pubkey: PublicKey;
    parsed: TypeDef<
      AllAccountsMap<typeof IDL>["rewardEntry"],
      IdlTypes<typeof IDL>
    > | null;
  }[] = Object.values(rewardEntriesAccountInfos).map((accountInfo) => {
    return {
      pubkey: accountInfo.pubkey,
      parsed: tryDecodeIdlAccount(accountInfo, "rewardEntry").parsed,
    };
  });
  const rewardEntriesById: {
    [id: string]: {
      pubkey: string;
      parsed: TypeDef<
        AllAccountsMap<typeof IDL>["rewardEntry"],
        IdlTypes<typeof IDL>
      >;
    };
  } = rewardEntries.reduce(
    (acc, rewardEntry) =>
      rewardEntry.parsed
        ? { ...acc, [rewardEntry.pubkey.toString()]: rewardEntry }
        : { ...acc },
    {}
  );

  const chunkedEntries = chunkArray(initEntries, args.batchSize);
  const batchedChunks = chunkArray(chunkedEntries, args.parallelBatchSize);
  for (let i = 0; i < batchedChunks.length; i++) {
    const chunk = batchedChunks[i]!;
    console.log(`\n\n\n ${i + 1}/${batchedChunks.length}`);
    await Promise.all(
      chunk.map(async (entries, c) => {
        const transaction = new Transaction();
        const entriesInTx: EntryData[] = [];

        let metadata: MetadataJSON[] = [];
        if (metadataRules) {
          [metadata] = await fetchMetadata(
            connection,
            entries.map((e) => e.mintId)
          );
        }
        for (let j = 0; j < entries.length; j++) {
          const { mintId, multiplier } = entries[j]!;
          const metadataId = findMintMetadataId(mintId);
          console.log(
            `>>[${c + 1}/${chunk.length}][${j + 1}/${
              entries.length
            }] (${mintId.toString()})`
          );
          try {
            const stakeEntryId = findStakeEntryId(stakePoolId, mintId);

            await withFindOrInitAssociatedTokenAccount(
              transaction,
              connection,
              mintId,
              stakeEntryId,
              wallet.publicKey,
              true
            );

            if (!stakeEntriesById[stakeEntryId.toString()]) {
              const ix = await program.methods
                .initEntry(wallet.publicKey)
                .accounts({
                  stakeEntry: stakeEntryId,
                  stakePool: stakePoolId,
                  stakeMint: mintId,
                  stakeMintMetadata: metadataId,
                  payer: wallet.publicKey,
                  systemProgram: SystemProgram.programId,
                })
                .instruction();
              transaction.add(ix);
              console.log(
                `>>[${c + 1}/${chunk.length}][${j + 1}/${
                  entries.length
                }] 1. Adding stake entry instruction`
              );
            }

            const rewardEntryId = findRewardEntryId(
              rewardDistributorId,
              stakeEntryId
            );
            const rewardEntry = rewardEntriesById[rewardEntryId.toString()];
            if (rewardDistributorData && !rewardEntry) {
              console.log(
                `>>[${c + 1}/${chunk.length}][${j + 1}/${
                  entries.length
                }] 2. Reward entry not found for reward distributor - adding reward entry instruction`
              );
              const initStakeEntryIx = await program.methods
                .initEntry(wallet.publicKey)
                .accounts({
                  stakeEntry: stakeEntryId,
                  stakePool: stakePoolId,
                  stakeMint: mintId,
                  stakeMintMetadata: metadataId,
                  payer: wallet.publicKey,
                  systemProgram: SystemProgram.programId,
                })
                .instruction();
              transaction.add(initStakeEntryIx);

              const initRewardEntryIx = await program.methods
                .initRewardEntry()
                .accounts({
                  rewardEntry: findRewardEntryId(
                    rewardDistributorId,
                    stakeEntryId
                  ),
                  rewardDistributor: rewardDistributorId,
                  stakeEntry: stakeEntryId,
                  payer: wallet.publicKey,
                })
                .instruction();
              transaction.add(initRewardEntryIx);
            }

            let multiplierToSet = multiplier;
            if (metadataRules) {
              `>>[${c + 1}/${chunk.length}][${j + 1}/${
                entries.length
              }] 2.5 Metadata rules are set to override mint multiplier`;
              const md = metadata[j]!;
              for (const rule of metadataRules) {
                if (
                  md.attributes.find(
                    (attr) =>
                      attr.trait_type === rule.traitType &&
                      attr.value === rule.value
                  )
                ) {
                  multiplierToSet = rule.multiplier;
                  console.log(
                    `>>> [${c + 1}/${chunk.length}][${j + 1}/${
                      entries.length
                    }] Using metadataRule (${rule.traitType}:${rule.value}=${
                      rule.multiplier
                    })`
                  );
                }
              }
            }

            if (
              multiplierToSet &&
              rewardEntry?.parsed.multiplier.toNumber() !== multiplierToSet
            ) {
              console.log(
                `>>[${c + 1}/${chunk.length}][${j + 1}/${
                  entries.length
                }] 3. Updating reward entry multipler from  ${
                  rewardEntry?.parsed.multiplier.toNumber() || 0
                } => ${multiplierToSet}`
              );

              const updateRewardEntryIx = await program.methods
                .updateRewardEntry({ multiplier: new BN(multiplierToSet) })
                .accounts({
                  rewardEntry: findRewardEntryId(
                    rewardDistributorId,
                    stakeEntryId
                  ),
                  rewardDistributor: rewardDistributorId,
                  authority: wallet.publicKey,
                })
                .instruction();
              transaction.add(updateRewardEntryIx);
            }
            entriesInTx.push({ mintId });
          } catch (e: unknown) {
            console.log(`[fail] (${mintId.toString()})`);
          }
        }

        try {
          if (transaction.instructions.length > 0) {
            const txid = await executeTransaction(
              connection,
              transaction,
              wallet,
              {}
            );
            console.log(
              `[success] ${entriesInTx
                .map((e) => e.mintId.toString())
                .join()} (https://explorer.solana.com/tx/${txid})`
            );
          }
        } catch (e) {
          console.log(e);
        }
      })
    );
  }
};
