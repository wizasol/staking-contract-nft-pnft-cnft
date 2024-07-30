import { chunkArray, executeTransaction } from "@solana-nft-programs/common";
import type { Wallet } from "@coral-xyz/anchor";
import type { Connection } from "@solana/web3.js";
import { SystemProgram, Transaction } from "@solana/web3.js";

import { getProgramIdlAccounts, rewardsCenterProgram } from "../../sdk";

export const commandName = "resizeStakeEntries";
export const description = "Check and resize all stake entries";

export const getArgs = (_connection: Connection, _wallet: Wallet) => ({
  // number of entries per transaction
  batchSize: 22,
  // number of transactions in parallel
  parallelBatchSize: 200,
  // pubkeys to include,
  pubkeyFilter: [""],
  // target size
  ignoreSize: 231,
  // whether to skip execution
  dryRun: false,
});

export const handler = async (
  connection: Connection,
  wallet: Wallet,
  args: ReturnType<typeof getArgs>
) => {
  console.log(`\n1/3 Fetching data...`);
  let programAccounts = await getProgramIdlAccounts(connection, "stakeEntry");
  console.log(`> ${programAccounts.length} total accounts`);

  // account filter
  programAccounts =
    args.pubkeyFilter.filter((s) => s).length > 0
      ? programAccounts.filter((acc) =>
          args.pubkeyFilter.includes(acc.pubkey.toString())
        )
      : programAccounts;
  console.log(`> ${programAccounts.length} post pubkey filter`);

  programAccounts = programAccounts.filter(
    (acc) => acc.data.length !== args.ignoreSize
  );
  console.log(`> ${programAccounts.length} post size filter`);

  console.log(`\n2/3 Building transactions...`);
  const txs = [];
  const accChunks = chunkArray(programAccounts, args.batchSize);
  for (let i = 0; i < accChunks.length; i++) {
    const chunk = accChunks[i]!;
    const tx = new Transaction();
    console.log(`> ${i}/${accChunks.length}`);
    for (let j = 0; j < chunk.length; j++) {
      const acc = chunk[j]!;
      // console.log(`>> ${j}/${chunk.length} ${acc.pubkey.toString()}`);
      const ix = await rewardsCenterProgram(connection, wallet)
        .methods.resizeStakeEntry()
        .accountsStrict({
          stakeEntry: acc.pubkey,
          payer: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .instruction();
      tx.add(ix);
    }
    if (tx.instructions.length > 0) {
      txs.push(tx);
    }
  }

  console.log(`\n3/3 Executing transactions...`);
  const txChunks = chunkArray(txs, args.parallelBatchSize);
  for (let i = 0; i < txChunks.length; i++) {
    console.log(`> ${i}/${txChunks.length}`);
    const chunk = txChunks[i]!;
    if (!args.dryRun) {
      await Promise.all(
        chunk.map((tx, j) =>
          executeTransaction(connection, tx, wallet)
            .then((txid) =>
              console.log(
                `>> ${i}/${txChunks.length} ${j}/${chunk.length} https://explorer.solana.com/tx/${txid}`
              )
            )
            .catch((e) => {
              console.log(
                `>> ${i}/${txChunks.length} ${j}/${chunk.length} error=`,
                e
              );
            })
        )
      );
    }
  }
};
