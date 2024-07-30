import {
  chunkArray,
  executeTransaction,
  executeTransactions,
  fetchAccountDataById,
} from "@solana-nft-programs/common";
import type { Wallet } from "@coral-xyz/anchor";
import type { Connection } from "@solana/web3.js";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";

import type { StakeEntry } from "../../sdk";
import { rewardsCenterProgram } from "../../sdk";

export const commandName = "stakeEntriesFillZeros";
export const description = "Check and fill all stake entries";

export const getArgs = (_connection: Connection, _wallet: Wallet) => ({
  // number of entries per transaction
  batchSize: 22,
  // number of transactions in parallel
  parallelBatchSize: 200,
  // pubkeys to include,
  pubkeys: [
    "7g2i3ZRFWCkVvnHt53EKxUkQSkq6R1qGbrWdPrVwC8Dg",
    "Ei4VfU7r5HcK6HfgvkjXQwAod2XxXzJA45vbvX3NtSHL",
    "43isy76xxcUbVEo5pbApmujN64xiapgMjtRzjq1oguqQ",
    "Z8jRosyGg6QvGeYLo5rZXXHQueycaJEGEfr2j3iiwpA",
    "tHwZxL54wxZRnGjGS5tG5PJmVGg1nw8zpEegyLMzFXj",
    "8X5kiRJBaHkT5DrU1CPzsP4gwuTxjDEBGJna4NmeUk62",
    "6ZuEhArzriicirGsrvEg2GRMGszbxHiiVrKoPcWsxWeW",
    "BzGybtqFfKrAF8pThaVB9Q3XnDkW2vMCx8eRmMcEyhgJ",
    "BsQarB4oaDkpWtod7d83WpaE6cXbqyCgb6Rcv3Z8guaf",
    "CBd2fpT8erNhqcYiYZJLQA7jQD62a4PhYdrdtSDwwiJA",
    "FTwULjtrVXdsdxe8vvx2jtwXznZaHmdCajNTG1UfUzyV",
    "DUC8q8y8z3Xn6BcT8xfc9G88dVygbiuUx8fqiR7s2QQD",
    "5VrBzZcNLJP4dQWfoMHGDJr7W6Nr4LyDoG9WqEErCCkB",
    "BNMpmjfhtz1f7bNBr4tUiNk6tg48aTQBpNjNusHu7FUw",
    "D7BDZCUzdtDdP61it8H7e6GQa3BEEkjFdPLgyP7byCd",
    "BWyD2qDXXuNnagN5eeu6QxETqnPizvfqUYZGZKWHzt78",
    "9QeLw9XgLm3rchyeiLpreryK2PdtGw2JsGfs3xkWGSrK",
    "HYJrL1CiGV2QEGwkPN2ZnHm1mMPA7gCHubBtTTo3Hoxb",
    "2L7LC3i8CbTYHMdSDgfPt1wHTBUdjBbmLHnawtNtdD5C",
    "3NGhC5gBE5p3iT3xUsbv8q6mrVTSLwSCw4grfuyMVycn",
    "Ew9JsdaxX21qVFPiiYrUYFyD83TEevjxpheqV5FvKYZy",
    "7pAJUBkX5NSY6T2i9frBc98N3GqN8sL1BKNPoP6gtD3F",
  ],
  // whether to skip execution
  dryRun: false,
});

export const handler = async (
  connection: Connection,
  wallet: Wallet,
  args: ReturnType<typeof getArgs>
) => {
  console.log(`\n1/3 Fetching data...`);
  const accountInfos = Object.values(
    await fetchAccountDataById(
      connection,
      args.pubkeys.map((pk) => new PublicKey(pk))
    )
  );
  console.log(`> ${accountInfos.length} total accounts`);

  // account filter
  const programAccounts: Pick<StakeEntry, "parsed" | "pubkey">[] = [];
  for (let i = 0; i < accountInfos.length; i++) {
    const a = accountInfos[i]!;
    try {
      const stakeEntryData: StakeEntry["parsed"] = rewardsCenterProgram(
        connection
      ).coder.accounts.decode("stakeEntry", a.data);
      const encoded = await rewardsCenterProgram(
        connection
      ).coder.accounts.encode("stakeEntry", stakeEntryData);
      if (a.data.slice(encoded.length).some((b) => b !== 0)) {
        programAccounts.push({ pubkey: a.pubkey, parsed: stakeEntryData });
      }
    } catch (e) {
      console.log(`[error] ${a.pubkey.toString()}`, e);
    }
  }

  console.log(
    `> ${programAccounts.length} post size filter`,
    programAccounts.map((a) => a.pubkey.toString())
  );

  console.log(`\n2/3 Building transactions...`);
  const txs = [];
  const chunks = chunkArray(programAccounts, args.batchSize);
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]!;
    const tx = new Transaction();
    console.log(`> ${i}/${chunks.length}`);
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
  executeTransactions;
};
