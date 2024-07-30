import { executeTransaction } from "@solana-nft-programs/common";
import type { Wallet } from "@coral-xyz/anchor/dist/cjs/provider";
import type { Connection } from "@solana/web3.js";
import { SystemProgram, Transaction } from "@solana/web3.js";

import {
  DEFAULT_PAYMENT_INFO,
  findStakePoolId,
  rewardsCenterProgram,
} from "../../sdk";

export const commandName = "initPool";
export const description = "Initialize a stake pool";

export const getArgs = (_connection: Connection, _wallet: Wallet) => ({
  stakePoolIdentifier: "knittables-evo",
  stakePoolData: {
    allowedCollections: [],
    allowedCreators: [],
    requiresAuthorization: true,
    resetOnUnstake: true,
    cooldownSeconds: null,
    minStakeSeconds: null,
    endDate: null,
    stakePaymentInfo: DEFAULT_PAYMENT_INFO,
    unstakePaymentInfo: DEFAULT_PAYMENT_INFO,
  },
  dryRun: false,
});

export const handler = async (
  connection: Connection,
  wallet: Wallet,
  args: ReturnType<typeof getArgs>
) => {
  const { stakePoolIdentifier } = args;

  const transaction = new Transaction();
  const stakePoolId = findStakePoolId(stakePoolIdentifier);
  const ix = await rewardsCenterProgram(connection, wallet)
    .methods.initPool({
      identifier: stakePoolIdentifier,
      authority: wallet.publicKey,
      ...args.stakePoolData,
    })
    .accounts({
      stakePool: stakePoolId,
      payer: wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
  transaction.add(ix);

  const txid = await executeTransaction(connection, transaction, wallet);
  console.log(
    `[success] Created pool ${stakePoolId.toString()} https://explorer.solana.com/tx/${txid}.`
  );
};
