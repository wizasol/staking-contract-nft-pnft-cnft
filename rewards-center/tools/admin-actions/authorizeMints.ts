import { chunkArray } from "@solana-nft-programs/common";
import type { Wallet } from "@coral-xyz/anchor/dist/cjs/provider";
import type { Connection } from "@solana/web3.js";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";

import {
  fetchIdlAccountDataById,
  findStakeAuthorizationRecordId,
  rewardsCenterProgram,
} from "../../sdk";
import { executeTransactionBatches } from "../utils";

export const commandName = "authorizeMints";
export const description = "Authorize mints";

export const getArgs = (_connection: Connection, _wallet: Wallet) => ({
  // stake pool id
  stakePoolId: new PublicKey("57crrxG7VvKAsuoBkpRSdnSRbDzmxnQg3pXwjyrF5gmX"),
  // array of mints and multipliers to set
  entryDatas: [] as { mintId: PublicKey }[],
  // file to read entry mints from
  entryFile: "tools/data/knittables-Legendary-Santa.csv",
  // number of entries per transaction
  batchSize: 12,
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
  const { stakePoolId, entryDatas: mintList } = args;
  let entryDatas = mintList;

  if (args.entryFile && entryDatas.length === 0) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment
    const file = require("fs").readFileSync(args.entryFile, {
      encoding: "utf-8",
    }) as string;
    entryDatas = file.split(",\n").map((v) => ({ mintId: new PublicKey(v) }));
  }

  const chunkData = entryDatas.map((e) => ({
    ...e,
    stakeAuthorizationRecordId: findStakeAuthorizationRecordId(
      stakePoolId,
      e.mintId
    ),
  }));

  console.log(`\n1/3 Fetching (${chunkData.length}) data...`);
  const stakeAuthorizationRecords = await fetchIdlAccountDataById(
    connection,
    chunkData.map((i) => i.stakeAuthorizationRecordId)
  );

  console.log(`\n2/3 Building transactions...`);
  const txs = [];
  const chunks = chunkArray(chunkData, args.batchSize);
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]!;
    const tx = new Transaction();
    console.log(`> ${i}/${chunks.length}`);
    for (let j = 0; j < chunk.length; j++) {
      const { mintId, stakeAuthorizationRecordId } = chunk[j]!;
      //   console.log(`>>[${j}/${chunk.length}] ${mintId.toString()}`);
      const stakeAuthorizationRecord =
        stakeAuthorizationRecords[stakeAuthorizationRecordId.toString()];
      if (!stakeAuthorizationRecord?.parsed) {
        const ix = await rewardsCenterProgram(connection, wallet)
          .methods.authorizeMint(mintId)
          .accountsStrict({
            stakePool: stakePoolId,
            stakeAuthorizationRecord: stakeAuthorizationRecordId,
            authority: wallet.publicKey,
            payer: wallet.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .instruction();
        tx.add(ix);
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
