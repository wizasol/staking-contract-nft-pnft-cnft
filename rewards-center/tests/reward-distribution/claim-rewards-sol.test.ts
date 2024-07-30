import type { SolanaProvider } from "@solana-nft-programs/common";
import {
  createMintTx,
  executeTransaction,
  executeTransactions,
  withFindOrInitAssociatedTokenAccount,
} from "@solana-nft-programs/common";
import { beforeAll, expect, test } from "@jest/globals";
import {
  createTransferInstruction,
  getAccount,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import type { PublicKey } from "@solana/web3.js";
import { Keypair, SystemProgram, Transaction } from "@solana/web3.js";
import { BN } from "bn.js";

import {
  claimRewards,
  DEFAULT_PAYMENT_INFO,
  fetchIdlAccount,
  findRewardDistributorId,
  findRewardEntryId,
  findStakeEntryId,
  findStakePoolId,
  rewardsCenterProgram,
  SOL_PAYMENT_INFO,
  stake,
} from "../../sdk";
import { getTestProvider } from "../../tools/utils";
import { createMasterEditionTx } from "../utils";

const stakePoolIdentifier = `test-${Math.random()}`;
let provider: SolanaProvider;
const REWARD_SUPPLY = 100;
const REWARD_SECONDS = 1;
const REWARD_AMOUNT = 2;
let mintId: PublicKey;
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
      cooldownSeconds: null,
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
  expect(rewardDistributor.parsed.claimRewardsPaymentInfo.toString()).toBe(
    DEFAULT_PAYMENT_INFO.toString()
  );

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

test("Claim rewards", async () => {
  const program = rewardsCenterProgram(provider.connection, provider.wallet);
  await new Promise((r) => setTimeout(r, 4000));
  const rewardDistributorId = findRewardDistributorId(
    findStakePoolId(stakePoolIdentifier)
  );

  // reward ata
  const userRewardAtaBefore = await getAccount(
    provider.connection,
    getAssociatedTokenAddressSync(rewardMintId, provider.wallet.publicKey)
  );
  const amountBefore = Number(userRewardAtaBefore.amount);
  expect(amountBefore).toBe(0);

  // balance before
  const balanceBefore = await provider.connection.getBalance(
    provider.wallet.publicKey
  );

  await claimRewards(
    provider.connection,
    provider.wallet,
    stakePoolIdentifier,
    [{ mintId }],
    [rewardDistributorId]
  );

  await executeTransactions(
    provider.connection,
    await claimRewards(
      provider.connection,
      provider.wallet,
      stakePoolIdentifier,
      [{ mintId }],
      [rewardDistributorId]
    ),
    provider.wallet
  );

  // check stake entry
  const stakePoolId = findStakePoolId(stakePoolIdentifier);
  const stakeEntryId = findStakeEntryId(stakePoolId, mintId);
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
  expect(parseInt(entry.parsed.totalStakeSeconds.toString())).toBeGreaterThan(
    1
  );

  // check reward entry
  const rewardEntryId = findRewardEntryId(rewardDistributorId, stakeEntryId);
  const rewardEntry = await fetchIdlAccount(
    provider.connection,
    rewardEntryId,
    "rewardEntry"
  );
  expect(rewardEntry.parsed.stakeEntry.toString()).toBe(
    stakeEntryId.toString()
  );
  expect(rewardEntry.parsed.rewardDistributor.toString()).toBe(
    rewardDistributorId.toString()
  );
  expect(Number(rewardEntry.parsed.rewardSecondsReceived)).toBeGreaterThan(0);

  // check staked
  const userAtaId = getAssociatedTokenAddressSync(
    mintId,
    provider.wallet.publicKey
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

  // check rewards
  const userRewardAtaAfter = await getAccount(
    provider.connection,
    getAssociatedTokenAddressSync(rewardMintId, provider.wallet.publicKey)
  );
  const amountAfter = Number(userRewardAtaAfter.amount);
  expect(Number(userRewardAtaAfter.amount)).toBeGreaterThanOrEqual(8);

  // check reward distributor ata
  const rewardDistributorAtaAfter = await getAccount(
    provider.connection,
    getAssociatedTokenAddressSync(rewardMintId, rewardDistributorId, true)
  );
  const rewardDistributorAfter = Number(rewardDistributorAtaAfter.amount);
  expect(rewardDistributorAfter).toBe(REWARD_SUPPLY - amountAfter);

  // check payment payment ata
  const balanceAfter = await provider.connection.getBalance(
    provider.wallet.publicKey
  );
  const defaultPaymentInfo = await fetchIdlAccount(
    provider.connection,
    DEFAULT_PAYMENT_INFO,
    "paymentInfo"
  );
  expect(balanceBefore - balanceAfter).toBeGreaterThan(
    defaultPaymentInfo.parsed.paymentAmount.toNumber()
  );
});
