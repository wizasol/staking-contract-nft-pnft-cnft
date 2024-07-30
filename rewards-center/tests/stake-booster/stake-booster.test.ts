import { beforeAll, expect, test } from "@jest/globals";
import {
  getAccount,
  getAssociatedTokenAddressSync,
  NATIVE_MINT,
} from "@solana/spl-token";
import type { PublicKey } from "@solana/web3.js";
import { Keypair, SystemProgram, Transaction } from "@solana/web3.js";
import type { SolanaProvider } from "@solana-nft-programs/common";
import {
  executeTransaction,
  executeTransactions,
  withWrapSol,
} from "@solana-nft-programs/common";
import { BN } from "bn.js";

import {
  BASIS_POINTS_DIVISOR,
  boost,
  fetchIdlAccount,
  findStakeBoosterId,
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
const STARTING_AMOUNT = 100;
const PAYMENT_AMOUNT = 10;
const STAKE_SECONDS_TO_BOOST = 2;
let mintId: PublicKey;
let paymentMintId: PublicKey;
let paymentRecipientId: PublicKey;

beforeAll(async () => {
  provider = await getTestProvider();
  const mintKeypair = Keypair.generate();
  mintId = mintKeypair.publicKey;
  const mintTx = await createMasterEditionTx(
    provider.connection,
    mintKeypair.publicKey,
    provider.wallet.publicKey
  );
  await executeTransaction(
    provider.connection,
    await withWrapSol(
      new Transaction().add(...mintTx.instructions),
      provider.connection,
      provider.wallet,
      STARTING_AMOUNT
    ),
    provider.wallet,
    { signers: [mintKeypair] }
  );

  paymentMintId = NATIVE_MINT;
  paymentRecipientId = Keypair.generate().publicKey;
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

test("Create stake booster", async () => {
  const program = rewardsCenterProgram(provider.connection, provider.wallet);
  const tx = new Transaction();
  const stakePoolId = findStakePoolId(stakePoolIdentifier);
  const stakeBoosterId = findStakeBoosterId(stakePoolId);
  const ix = await program.methods
    .initStakeBooster({
      identifier: new BN(0),
      stakePool: stakePoolId,
      paymentAmount: new BN(PAYMENT_AMOUNT),
      paymentMint: paymentMintId,
      paymentShares: [
        { address: paymentRecipientId, basisPoints: BASIS_POINTS_DIVISOR },
      ],
      boostSeconds: new BN(1),
      startTimeSeconds: new BN(Date.now() / 1000 - 1000),
      boostActionPaymentInfo: SOL_PAYMENT_INFO,
    })
    .accounts({
      stakeBooster: stakeBoosterId,
      stakePool: stakePoolId,
      authority: provider.wallet.publicKey,
      payer: provider.wallet.publicKey,
    })
    .instruction();
  tx.add(ix);
  await executeTransaction(provider.connection, tx, provider.wallet);
  const stakeBooster = await fetchIdlAccount(
    provider.connection,
    stakeBoosterId,
    "stakeBooster"
  );
  expect(stakeBooster.parsed.paymentMint.toString()).toBe(
    paymentMintId.toString()
  );
  expect(Number(stakeBooster.parsed.boostSeconds)).toBe(1);
  expect(stakeBooster.parsed.paymentAmount.toString()).toBe(
    PAYMENT_AMOUNT.toString()
  );
});

test("Stake", async () => {
  // miss 3 seconds
  const program = rewardsCenterProgram(provider.connection, provider.wallet);
  await new Promise((r) => setTimeout(r, 3000));
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

test("Boost", async () => {
  const program = rewardsCenterProgram(provider.connection, provider.wallet);
  await new Promise((r) => setTimeout(r, 1000));

  // check stake entry before
  const stakePoolId = findStakePoolId(stakePoolIdentifier);
  const stakeEntryId = findStakeEntryId(stakePoolId, mintId);
  const entryBefore = await fetchIdlAccount(
    provider.connection,
    stakeEntryId,
    "stakeEntry"
  );
  expect(entryBefore.parsed.stakeMint.toString()).toBe(mintId.toString());
  expect(entryBefore.parsed.lastStaker.toString()).toBe(
    provider.wallet.publicKey.toString()
  );
  expect(parseInt(entryBefore.parsed.totalStakeSeconds.toString())).toBe(0);
  expect(parseInt(entryBefore.parsed.lastStakedAt.toString())).toBeGreaterThan(
    Date.now() / 1000 - 60
  );
  expect(parseInt(entryBefore.parsed.lastUpdatedAt.toString())).toBeGreaterThan(
    Date.now() / 1000 - 60
  );

  // check payment before
  const userPaymentAta = await getAccount(
    provider.connection,
    getAssociatedTokenAddressSync(paymentMintId, provider.wallet.publicKey)
  );
  const amountBefore = Number(userPaymentAta.amount);
  expect(amountBefore).toBe(STARTING_AMOUNT);

  await executeTransaction(
    provider.connection,
    await boost(
      provider.connection,
      provider.wallet,
      stakePoolIdentifier,
      {
        mintId,
      },
      STAKE_SECONDS_TO_BOOST
    ),
    provider.wallet
  );

  // check stake entry
  const entryAfter = await fetchIdlAccount(
    provider.connection,
    stakeEntryId,
    "stakeEntry"
  );
  expect(Number(entryAfter.parsed.totalStakeSeconds)).toBeGreaterThanOrEqual(
    STAKE_SECONDS_TO_BOOST
  );
  expect(entryAfter.parsed.stakeMint.toString()).toBe(mintId.toString());
  expect(entryAfter.parsed.lastStaker.toString()).toBe(
    provider.wallet.publicKey.toString()
  );
  expect(Number(entryAfter.parsed.lastStakedAt)).toBeGreaterThan(
    Date.now() / 1000 - 60
  );
  expect(Number(entryAfter.parsed.lastUpdatedAt)).toBeGreaterThan(
    Date.now() / 1000 - 60
  );

  // check staked
  const userAtaId = getAssociatedTokenAddressSync(
    mintId,
    provider.wallet.publicKey
  );
  const userAta = await getAccount(provider.connection, userAtaId);
  expect(userAta.isFrozen).toBe(true);
  expect(Number(userAta.amount)).toBe(1);
  const activeStakeEntries = await program.account.stakeEntry.all([
    {
      memcmp: {
        offset: 82,
        bytes: provider.wallet.publicKey.toString(),
      },
    },
  ]);
  expect(activeStakeEntries.length).toBe(1);

  // check payment
  const userPaymentAtaAfter = await getAccount(
    provider.connection,
    getAssociatedTokenAddressSync(paymentMintId, provider.wallet.publicKey)
  );
  const amountAfter = Number(userPaymentAtaAfter.amount);
  expect(amountAfter).toBe(
    STARTING_AMOUNT - PAYMENT_AMOUNT * STAKE_SECONDS_TO_BOOST
  );
});

test("Boost too far", async () => {
  await expect(
    executeTransaction(
      provider.connection,
      await boost(
        provider.connection,
        provider.wallet,
        stakePoolIdentifier,
        {
          mintId,
        },
        10000
      ),
      provider.wallet,
      { silent: true }
    )
  ).rejects.toThrow();
});
