import { beforeAll, expect, test } from "@jest/globals";
import {
  createTransferInstruction,
  getAccount,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import type { SolanaProvider } from "@solana-nft-programs/common";
import {
  createMintTx,
  executeTransaction,
  executeTransactions,
  withFindOrInitAssociatedTokenAccount,
} from "@solana-nft-programs/common";
import { BN } from "bn.js";

import {
  DEFAULT_PAYMENT_INFO,
  fetchIdlAccount,
  findRewardDistributorId,
  findStakeEntryId,
  findStakePoolId,
  rewardsCenterProgram,
  SOL_PAYMENT_INFO,
  stake,
  unstake,
} from "../../sdk";
import { getTestProvider } from "../../tools/utils";
import { createMasterEditionTx } from "../utils";

const stakePoolIdentifier = `test-${Math.random()}`;
let provider: SolanaProvider;
let mintId: PublicKey;
const REWARD_SUPPLY = 100;
const REWARD_SECONDS = 1;
const REWARD_AMOUNT = 2;

let rewardMintId: PublicKey;

beforeAll(async () => {
  provider = await getTestProvider();
  const mintKeypair = Keypair.generate();
  mintId = mintKeypair.publicKey;
  const mintTx = await createMasterEditionTx(
    provider.connection,
    mintKeypair.publicKey,
    provider.wallet.publicKey
  );

  const rewardMintKeypair = Keypair.generate();
  rewardMintId = rewardMintKeypair.publicKey;
  const [rewardMintTx] = await createMintTx(
    provider.connection,
    rewardMintId,
    provider.wallet.publicKey,
    { amount: REWARD_SUPPLY }
  );
  await executeTransaction(
    provider.connection,
    new Transaction().add(...mintTx.instructions, ...rewardMintTx.instructions),
    provider.wallet,
    { signers: [mintKeypair, rewardMintKeypair] }
  );
});

test("Init pool", async () => {
  const program = rewardsCenterProgram(provider.connection, provider.wallet);
  const tx = new Transaction();
  const stakePoolId = findStakePoolId(stakePoolIdentifier);
  const ix = await program.methods
    .initPool({
      identifier: stakePoolIdentifier,
      allowedCollections: [],
      allowedCreators: [],
      requiresAuthorization: false,
      authority: provider.wallet.publicKey,
      resetOnUnstake: false,
      cooldownSeconds: 3,
      minStakeSeconds: null,
      endDate: null,
      stakePaymentInfo: SOL_PAYMENT_INFO,
      unstakePaymentInfo: SOL_PAYMENT_INFO,
    })
    .accounts({
      stakePool: stakePoolId,
      payer: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
  tx.add(ix);
  await executeTransaction(provider.connection, tx, provider.wallet);
  const pool = await fetchIdlAccount(
    provider.connection,
    stakePoolId,
    "stakePool"
  );
  expect(pool.parsed.authority.toString()).toBe(
    provider.wallet.publicKey.toString()
  );
  expect(pool.parsed.requiresAuthorization).toBe(false);
  expect(pool.parsed.stakePaymentInfo.toString()).toBe(
    SOL_PAYMENT_INFO.toString()
  );
});

test("Init reward distributor", async () => {
  const program = rewardsCenterProgram(provider.connection, provider.wallet);
  const tx = new Transaction();
  const stakePoolId = findStakePoolId(stakePoolIdentifier);
  const rewardDistributorId = findRewardDistributorId(stakePoolId);
  const ix = await program.methods
    .initRewardDistributor({
      identifier: new BN(0),
      rewardAmount: new BN(REWARD_AMOUNT),
      rewardDurationSeconds: new BN(REWARD_SECONDS),
      supply: null,
      defaultMultiplier: new BN(1),
      multiplierDecimals: 0,
      maxRewardSecondsReceived: null,
      claimRewardsPaymentInfo: DEFAULT_PAYMENT_INFO,
    })
    .accounts({
      rewardDistributor: rewardDistributorId,
      stakePool: stakePoolId,
      rewardMint: rewardMintId,
      authority: provider.wallet.publicKey,
      payer: provider.wallet.publicKey,
    })
    .instruction();
  tx.add(ix);

  const userRewardMintAta = getAssociatedTokenAddressSync(
    rewardMintId,
    provider.wallet.publicKey
  );
  const rewardDistributorAtaId = await withFindOrInitAssociatedTokenAccount(
    tx,
    provider.connection,
    rewardMintId,
    rewardDistributorId,
    provider.wallet.publicKey,
    true
  );

  tx.add(
    createTransferInstruction(
      userRewardMintAta,
      rewardDistributorAtaId,
      provider.wallet.publicKey,
      REWARD_SUPPLY
    )
  );
  await executeTransaction(provider.connection, tx, provider.wallet);
  const rewardDistributor = await fetchIdlAccount(
    provider.connection,
    rewardDistributorId,
    "rewardDistributor"
  );
  expect(rewardDistributor.parsed.authority.toString()).toBe(
    provider.wallet.publicKey.toString()
  );
  expect(rewardDistributor.parsed.rewardMint.toString()).toBe(
    rewardMintId.toString()
  );
  expect(rewardDistributor.parsed.multiplierDecimals).toBe(0);
  expect(Number(rewardDistributor.parsed.defaultMultiplier)).toBe(1);

  // reward account check
  const rewardDistributorAta = await getAccount(
    provider.connection,
    rewardDistributorAtaId
  );
  const amountAfter = Number(rewardDistributorAta.amount);
  expect(amountAfter).toBe(REWARD_SUPPLY);
});

test("Stake", async () => {
  const program = rewardsCenterProgram(provider.connection, provider.wallet);
  await executeTransactions(
    provider.connection,
    await stake(provider.connection, provider.wallet, stakePoolIdentifier, [
      { mintId },
    ]),
    provider.wallet
  );

  const stakePoolId = findStakePoolId(stakePoolIdentifier);
  const stakeEntryId = findStakeEntryId(stakePoolId, mintId);
  const userAtaId = getAssociatedTokenAddressSync(
    mintId,
    provider.wallet.publicKey
  );
  const entry = await fetchIdlAccount(
    provider.connection,
    stakeEntryId,
    "stakeEntry"
  );
  expect(entry.parsed.stakeMint.toString()).toBe(mintId.toString());
  expect(entry.parsed.lastStaker.toString()).toBe(
    provider.wallet.publicKey.toString()
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
        bytes: provider.wallet.publicKey.toString(),
      },
    },
  ]);
  expect(activeStakeEntries.length).toBe(1);
});

test("Unstake cooldown start", async () => {
  const stakePoolId = findStakePoolId(stakePoolIdentifier);
  const rewardDistributorId = findRewardDistributorId(stakePoolId);
  const program = rewardsCenterProgram(provider.connection, provider.wallet);
  await new Promise((r) => setTimeout(r, 2000));
  await executeTransactions(
    provider.connection,
    await unstake(
      provider.connection,
      provider.wallet,
      stakePoolIdentifier,
      [{ mintId }],
      [rewardDistributorId]
    ),
    provider.wallet
  );

  const stakeEntryId = findStakeEntryId(stakePoolId, mintId);
  const userAtaId = getAssociatedTokenAddressSync(
    mintId,
    provider.wallet.publicKey
  );
  const entry = await fetchIdlAccount(
    provider.connection,
    stakeEntryId,
    "stakeEntry"
  );
  expect(entry.parsed.stakeMint.toString()).toBe(mintId.toString());
  expect(entry.parsed.lastStaker.toString()).toBe(
    provider.wallet.publicKey.toString()
  );
  expect(Number(entry.parsed.cooldownStartSeconds)).toBeGreaterThan(0);

  const userAta = await getAccount(provider.connection, userAtaId);
  expect(userAta.isFrozen).toBe(true);
  expect(parseInt(userAta.amount.toString())).toBe(1);
  const activeStakeEntries = await program.account.stakeEntry.all([
    {
      memcmp: {
        offset: 82,
        bytes: provider.wallet.publicKey.toString(),
      },
    },
  ]);
  expect(activeStakeEntries.length).toBe(1);
});

test("Unstake cooldown fail", async () => {
  const stakePoolId = findStakePoolId(stakePoolIdentifier);
  const rewardDistributorId = findRewardDistributorId(stakePoolId);
  await expect(
    executeTransactions(
      provider.connection,
      await unstake(
        provider.connection,
        provider.wallet,
        stakePoolIdentifier,
        [{ mintId }],
        [rewardDistributorId]
      ),
      provider.wallet,
      {
        errorHandler: (e) => {
          throw e;
        },
      }
    )
  ).rejects.toThrow();
});

test("Unstake", async () => {
  const stakePoolId = findStakePoolId(stakePoolIdentifier);
  const rewardDistributorId = findRewardDistributorId(stakePoolId);
  const program = rewardsCenterProgram(provider.connection, provider.wallet);
  await new Promise((r) => setTimeout(r, 4000));
  await executeTransactions(
    provider.connection,
    await unstake(
      provider.connection,
      provider.wallet,
      stakePoolIdentifier,
      [{ mintId }],
      [rewardDistributorId]
    ),
    provider.wallet
  );

  const stakeEntryId = findStakeEntryId(stakePoolId, mintId);
  const userAtaId = getAssociatedTokenAddressSync(
    mintId,
    provider.wallet.publicKey
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
  expect(userAta.isFrozen).toBe(false);
  expect(parseInt(userAta.amount.toString())).toBe(1);
  const activeStakeEntries = await program.account.stakeEntry.all([
    {
      memcmp: {
        offset: 82,
        bytes: provider.wallet.publicKey.toString(),
      },
    },
  ]);
  expect(activeStakeEntries.length).toBe(0);
});
