import { chunkArray, findMintMetadataId } from "@solana-nft-programs/common";
import type { Wallet } from "@coral-xyz/anchor/dist/cjs/provider";
import type { Connection } from "@solana/web3.js";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { BN } from "bn.js";

import {
  BASIS_POINTS_DIVISOR,
  fetchIdlAccount,
  fetchIdlAccountDataById,
  findStakeEntryId,
  remainingAccountsForAuthorization,
  rewardsCenterProgram,
} from "../../sdk";
import { executeTransactionBatches } from "../utils";

export const commandName = "setStakeEntryMultipliers";
export const description = "Initialize stake entries and set multipliers";

export const getArgs = (_connection: Connection, _wallet: Wallet) => ({
  // stake pool id
  stakePoolId: new PublicKey("57crrxG7VvKAsuoBkpRSdnSRbDzmxnQg3pXwjyrF5gmX"),
  // file to read entry mints from
  entryFile: "tools/data/knittables-Tribe-Evo-Golden.csv",
  // multiplier to set
  multiplierBasisPoints: 30000,
  // number of entries per transaction
  batchSize: 3,
  // number of transactions in parallel
  parallelBatchSize: 20,
  // whether to skip execution
  dryRun: false,
});

export const handler = async (
  connection: Connection,
  wallet: Wallet,
  args: ReturnType<typeof getArgs>
) => {
  const { stakePoolId } = args;
  let entryDatas: { mintId: PublicKey; multiplierBasisPoints: number }[] = [];
  if (args.entryFile && entryDatas.length === 0) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment
    const file = require("fs").readFileSync(args.entryFile, {
      encoding: "utf-8",
    }) as string;
    entryDatas = file.split(",\n").map((v) => ({
      mintId: new PublicKey(v),
      multiplierBasisPoints: args.multiplierBasisPoints,
    }));
  }

  const chunkData = entryDatas.map((e) => ({
    ...e,
    stakeEntryId: findStakeEntryId(stakePoolId, e.mintId),
  }));

  console.log(`\n1/3 Fetching data...`);
  const stakePool = await fetchIdlAccount(
    connection,
    args.stakePoolId,
    "stakePool"
  );
  const stakeEntriesById = await fetchIdlAccountDataById(
    connection,
    chunkData.map((i) => i.stakeEntryId)
  );

  console.log(`\n2/3 Building transactions...`);
  const txs = [];
  const chunks = chunkArray(chunkData, args.batchSize);
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]!;
    const tx = new Transaction();
    console.log(`> ${i}/${chunks.length}`);
    for (let j = 0; j < chunk.length; j++) {
      const { mintId, stakeEntryId, multiplierBasisPoints } = chunk[j]!;
      console.log(`>>[${j}/${chunk.length}] ${mintId.toString()}`);
      const stakeEntry = stakeEntriesById[stakeEntryId.toString()];
      if (!stakeEntry?.parsed) {
        const authorizationAccounts = remainingAccountsForAuthorization(
          stakePool,
          mintId,
          null
        );
        const ix = await rewardsCenterProgram(connection, wallet)
          .methods.initEntry(wallet.publicKey)
          .accountsStrict({
            stakeEntry: stakeEntryId,
            stakePool: stakePoolId,
            stakeMint: mintId,
            stakeMintMetadata: findMintMetadataId(mintId),
            payer: wallet.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .remainingAccounts(authorizationAccounts)
          .instruction();
        tx.add(ix);
        console.log(
          `>>[${i + 1}/${chunks.length}][${j + 1}/${chunk.length}] 1. initEntry`
        );
      }

      if (
        !stakeEntry ||
        (stakeEntry.type === "stakeEntry" &&
          stakeEntry.parsed.multiplierBasisPoints?.toNumber() !==
            multiplierBasisPoints)
      ) {
        const ix = await rewardsCenterProgram(connection, wallet)
          .methods.setStakeEntryMultiplier(new BN(multiplierBasisPoints))
          .accountsStrict({
            stakeEntry: stakeEntryId,
            stakePool: stakePoolId,
            authority: wallet.publicKey,
          })
          .instruction();
        tx.add(ix);
        console.log(
          `>>[${i + 1}/${chunks.length}][${j + 1}/${chunk.length}] 2. ${
            stakeEntry?.parsed.multiplierBasisPoints
              ? stakeEntry?.parsed.multiplierBasisPoints.toNumber() /
                BASIS_POINTS_DIVISOR
              : "N/A"
          } ==> ${multiplierBasisPoints / BASIS_POINTS_DIVISOR}`
        );
      }
    }
    if (tx.instructions.length > 0) {
      txs.push(tx);
    }
  }

  console.log(
    `\n3/3 Executing ${txs.length} transactions batches=${args.parallelBatchSize}...`
  );
  if (!args.dryRun) {
    await executeTransactionBatches(connection, txs, wallet, {
      batchSize: args.parallelBatchSize,
      successHandler: (txid, { i, j, it, jt }) =>
        console.log(
          `>> ${i}/${it} ${j}/${jt} https://explorer.solana.com/tx/${txid}`
        ),
      errorHandler: (e, { i, j, it, jt }) =>
        console.log(`>> ${i}/${it} ${j}/${jt} error=`, e),
    });
  }
};
