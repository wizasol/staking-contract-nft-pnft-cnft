import { connectionFor, executeTransaction } from "@solana-nft-programs/common";
import { utils, Wallet } from "@coral-xyz/anchor";
import type { Cluster } from "@solana/web3.js";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { BN } from "bn.js";
import dotenv from "dotenv";

import {
  findRewardDistributorId,
  findStakePoolId,
  rewardsCenterProgram,
} from "../../sdk";

dotenv.config();

const wallet = Keypair.fromSecretKey(
  utils.bytes.bs58.decode(process.env.WALLET || "")
); // your wallet's secret key
const stakePoolIdentifier = `pool-name-0.5738181258361528`;

const main = async (cluster: Cluster) => {
  const connection = connectionFor(cluster);
  const program = rewardsCenterProgram(connection, new Wallet(wallet));
  const transaction = new Transaction();

  const stakePoolId = findStakePoolId(stakePoolIdentifier);
  const rewardDistributorId = findRewardDistributorId(stakePoolId);
  const ix = await program.methods
    .updateRewardDistributor({
      defaultMultiplier: new BN(100),
      multiplierDecimals: 2,
      rewardAmount: new BN(100000),
      rewardDurationSeconds: new BN(10),
      maxRewardSecondsReceived: null,
      claimRewardsPaymentInfo: new PublicKey(
        "Ad29pAAdYvYTcDzRHtA1req5an2DqFUfY1s5tkUC88Lr"
      ),
    })
    .accounts({
      rewardDistributor: rewardDistributorId,
      authority: wallet.publicKey,
    })
    .instruction();
  transaction.add(ix);

  let txid = "";
  try {
    txid = await executeTransaction(
      connection,
      transaction,
      new Wallet(wallet)
    );
  } catch (e) {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    console.log(`Transactionn failed: ${e}`);
  }

  try {
    await program.account.stakePool.fetch(stakePoolId);
    console.log(
      `Updated pool successfully https://explorer.solana.com/tx/${txid}?cluster=${cluster}.`
    );
  } catch (e) {
    console.log("Could not update marketplace successfully.");
  }
};

main("devnet").catch((e) => console.log(e));
