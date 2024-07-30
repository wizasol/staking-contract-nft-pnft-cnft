import { chunkArray } from "@solana-nft-programs/common";
import type { Wallet } from "@coral-xyz/anchor/dist/cjs/provider";
import type { Connection } from "@solana/web3.js";
import { PublicKey, Transaction } from "@solana/web3.js";

import { getProgramIdlAccounts, rewardsCenterProgram } from "../../sdk";
import { executeTransactionBatches } from "../utils";

export const commandName = "resetAllEntries";
export const description = "Reset all stake entries";

export const getArgs = (_connection: Connection, _wallet: Wallet) => ({
  // stake pool id
  stakePoolId: new PublicKey("57crrxG7VvKAsuoBkpRSdnSRbDzmxnQg3pXwjyrF5gmX"),
  // number of entries per transaction
  batchSize: 20,
  // number of transactions in parallel
  parallelBatchSize: 100,
  // whether to skip execution
  dryRun: false,
});

export const handler = async (
  connection: Connection,
  wallet: Wallet,
  args: ReturnType<typeof getArgs>
) => {
  const { stakePoolId } = args;
  console.log(`\n1/3 Fetching data...`);
  const chunkData = await getProgramIdlAccounts(connection, "stakeEntry", {
    filters: [
      {
        memcmp: {
          offset: 10,
          bytes: stakePoolId.toString(),
        },
      },
    ],
  });

  console.log(`\n2/3 Building transactions...`);
  const txs = [];
  const chunks = chunkArray(chunkData, args.batchSize);
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]!;
    const tx = new Transaction();
    console.log(`> ${i}/${chunks.length}`);
    for (let j = 0; j < chunk.length; j++) {
      const { pubkey: stakeEntryId } = chunk[j]!;
      const ix = await rewardsCenterProgram(connection, wallet)
        .methods.resetStakeEntry()
        .accountsStrict({
          stakePool: stakePoolId,
          stakeEntry: stakeEntryId,
          authority: wallet.publicKey,
        })
        .instruction();
      tx.add(ix);
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
