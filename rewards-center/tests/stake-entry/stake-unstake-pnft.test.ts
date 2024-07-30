import { Wallet } from "@coral-xyz/anchor";
import { beforeAll, expect, test } from "@jest/globals";
import { TokenRecord } from "@metaplex-foundation/mpl-token-metadata";
import { getAccount, getAssociatedTokenAddressSync } from "@solana/spl-token";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import type { SolanaProvider } from "@solana-nft-programs/common";
import {
  executeTransaction,
  executeTransactions,
  findTokenRecordId,
} from "@solana-nft-programs/common";

import {
  fetchIdlAccount,
  findStakeEntryId,
  findStakePoolId,
  findUserEscrowId,
  rewardsCenterProgram,
  SOL_PAYMENT_INFO,
  stake,
  unstake,
} from "../../sdk";
import { getTestProvider } from "../../tools/utils";
import { createProgrammableAsset } from "../utils";

const stakePoolIdentifier = `test-${Math.random()}`;
let provider: SolanaProvider;
let mintId: PublicKey;
let stakerTokenAccountId: PublicKey;
/* const stakerWallet: Wallet = new Wallet(Keypair.generate()); */
const stakerWallet: Wallet = new Wallet(
  Keypair.fromSecretKey(
    new Uint8Array([
      237, 26, 119, 194, 182, 78, 220, 246, 42, 51, 60, 98, 83, 56, 108, 101,
      196, 196, 4, 106, 165, 137, 190, 168, 6, 103, 18, 99, 64, 36, 15, 118,
      161, 1, 146, 97, 141, 105, 28, 215, 177, 161, 244, 250, 179, 25, 61, 112,
      254, 56, 85, 124, 30, 143, 22, 167, 121, 110, 17, 13, 35, 245, 4, 240,
    ])
  )
);

const mints: PublicKey[] = [];

beforeAll(async () => {
  provider = await getTestProvider();

  /*   const airdropStaker = await provider.connection.requestAirdrop(
    stakerWallet.publicKey,
    5 * LAMPORTS_PER_SOL
  ); 
  await provider.connection.confirmTransaction(airdropStaker);  */
  for (let i = 0; i < 50; i++) {
    try {
      [stakerTokenAccountId, mintId] = await createProgrammableAsset(
        provider.connection,
        stakerWallet
      );
      mints.push(mintId);
      if (i % 2 === 0) {
        await new Promise((r) => setTimeout(r, 2000));
      }
    } catch (e) {
      console.log(e);
      throw e;
    }
  }
}, 10000000);

test("Init pool", async () => {
  console.log(
    "MINTs:",
    mints.map((m) => m.toBase58())
  );
});
/*
test("Init pool", async () => {
  try {
    const program = rewardsCenterProgram(provider.connection, stakerWallet);
    const tx = new Transaction();
    const stakePoolId = findStakePoolId(stakePoolIdentifier);
    const ix = await program.methods
      .initPool({
        identifier: stakePoolIdentifier,
        allowedCollections: [],
        allowedCreators: [],
        requiresAuthorization: false,
        authority: stakerWallet.publicKey,
        resetOnUnstake: false,
        cooldownSeconds: null,
        minStakeSeconds: null,
        endDate: null,
        stakePaymentInfo: SOL_PAYMENT_INFO,
        unstakePaymentInfo: SOL_PAYMENT_INFO,
      })
      .accounts({
        stakePool: stakePoolId,
        payer: stakerWallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .instruction();
    tx.add(ix);
    const txres = await executeTransaction(
      provider.connection,
      tx,
      stakerWallet
    );
    console.log("txres", txres);
    const pool = await fetchIdlAccount(
      provider.connection,
      stakePoolId,
      "stakePool"
    );
    expect(pool.parsed.authority.toString()).toBe(
      stakerWallet.publicKey.toString()
    );
    expect(pool.parsed.requiresAuthorization).toBe(false);
    expect(pool.parsed.stakePaymentInfo.toString()).toBe(
      SOL_PAYMENT_INFO.toString()
    );
  } catch (e) {
    console.log(e);
    throw e;
  }
  console.log("staking pool created", stakePoolIdentifier);
}, 10000000);*/

/*
test("Stake", async () => {
  const program = rewardsCenterProgram(provider.connection, stakerWallet);
  console.log("MINT", mintId);
  await executeTransactions(
    provider.connection,
    await stake(provider.connection, stakerWallet, stakePoolIdentifier, [
      { mintId },
    ]),
    stakerWallet
  );

  const stakePoolId = findStakePoolId(stakePoolIdentifier);
  const stakeEntryId = findStakeEntryId(stakePoolId, mintId);
  const userAtaId = getAssociatedTokenAddressSync(
    mintId,
    stakerWallet.publicKey
  );
  const entry = await fetchIdlAccount(
    provider.connection,
    stakeEntryId,
    "stakeEntry"
  );
  expect(entry.parsed.stakeMint.toString()).toBe(mintId.toString());
  expect(entry.parsed.lastStaker.toString()).toBe(
    stakerWallet.publicKey.toString()
  );
  expect(parseInt(entry.parsed.lastStakedAt.toString())).toBeGreaterThan(
    Date.now() / 1000 - 60
  );
  expect(parseInt(entry.parsed.lastUpdatedAt.toString())).toBeGreaterThan(
    Date.now() / 1000 - 60
  );

  const userAta = await getAccount(provider.connection, userAtaId);
  expect(userAta.isFrozen).toBe(true);
  expect(parseInt(userAta.amount.toString())).toBe(1);
  const activeStakeEntries = await program.account.stakeEntry.all([
    {
      memcmp: {
        offset: 82,
        bytes: stakerWallet.publicKey.toString(),
      },
    },
  ]);
  // expect(activeStakeEntries.length).toBe(1);

  const tokenRecordId = findTokenRecordId(mintId, stakerTokenAccountId);
  const tokenRecordData = await TokenRecord.fromAccountAddress(
    provider.connection,
    tokenRecordId
  );
  expect(tokenRecordData.delegate?.toString()).toBe(
    findUserEscrowId(stakerWallet.publicKey).toString()
  );
});

test("Stake again fail", async () => {
  await expect(
    executeTransactions(
      provider.connection,
      await stake(provider.connection, stakerWallet, stakePoolIdentifier, [
        { mintId },
      ]),
      stakerWallet,
      {
        errorHandler: (e) => {
          throw e;
        },
      }
    )
  ).rejects.toThrow();
});

test("Unstake", async () => {
  await new Promise((r) => setTimeout(r, 2000));
  const program = rewardsCenterProgram(provider.connection, stakerWallet);
  await executeTransactions(
    provider.connection,
    await unstake(provider.connection, stakerWallet, stakePoolIdentifier, [
      { mintId },
    ]),
    stakerWallet
  );

  const stakePoolId = findStakePoolId(stakePoolIdentifier);
  const stakeEntryId = findStakeEntryId(stakePoolId, mintId);
  const userAtaId = getAssociatedTokenAddressSync(
    mintId,
    stakerWallet.publicKey
  );
  const entry = await fetchIdlAccount(
    provider.connection,
    stakeEntryId,
    "stakeEntry"
  );
  expect(entry.parsed.stakeMint.toString()).toBe(mintId.toString());
  expect(entry.parsed.lastStaker.toString()).toBe(PublicKey.default.toString());
  expect(parseInt(entry.parsed.lastStakedAt.toString())).toBeGreaterThan(
    Date.now() / 1000 - 60
  );
  expect(parseInt(entry.parsed.lastUpdatedAt.toString())).toBeGreaterThan(
    Date.now() / 1000 - 60
  );
  expect(parseInt(entry.parsed.totalStakeSeconds.toString())).toBeGreaterThan(
    1
  );

  const userAta = await getAccount(provider.connection, userAtaId);
  expect(parseInt(userAta.amount.toString())).toBe(1);
  const activeStakeEntries = await program.account.stakeEntry.all([
    {
      memcmp: {
        offset: 82,
        bytes: stakerWallet.publicKey.toString(),
      },
    },
  ]);
  expect(activeStakeEntries.length).toBe(0);

  const tokenRecordId = findTokenRecordId(mintId, stakerTokenAccountId);
  const tokenRecordData = await TokenRecord.fromAccountAddress(
    provider.connection,
    tokenRecordId
  );
  expect(tokenRecordData.delegate).toBe(null);
});
*/
