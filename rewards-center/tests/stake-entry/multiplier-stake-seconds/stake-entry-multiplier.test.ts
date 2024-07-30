import { Wallet } from "@coral-xyz/anchor";
import { beforeAll, expect, test } from "@jest/globals";
import { getAccount, getAssociatedTokenAddressSync } from "@solana/spl-token";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import type { SolanaProvider } from "@solana-nft-programs/common";
import {
  executeTransaction,
  executeTransactions,
  findMintMetadataId,
  newAccountWithLamports,
} from "@solana-nft-programs/common";
import { BN } from "bn.js";

import {
  BASIS_POINTS_DIVISOR,
  fetchIdlAccount,
  findStakeEntryId,
  findStakePoolId,
  rewardsCenterProgram,
  SOL_PAYMENT_INFO,
  stake,
  unstake,
} from "../../../sdk";
import { getTestProvider } from "../../../tools/utils";
import { createMasterEditionTx } from "../../utils";

const stakePoolIdentifier = `test-${Math.random()}`;
const multiplierBasisPoints = 10000 * 2.5;
let provider: SolanaProvider;
let mintId: PublicKey;
let nonAuthority: Keypair;

beforeAll(async () => {
  provider = await getTestProvider();
  const mintKeypair = Keypair.generate();
  mintId = mintKeypair.publicKey;
  nonAuthority = await newAccountWithLamports(provider.connection);
  await executeTransaction(
    provider.connection,
    await createMasterEditionTx(
      provider.connection,
      mintKeypair.publicKey,
      provider.wallet.publicKey
    ),
    provider.wallet,
    { signers: [mintKeypair] }
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
});

test("Init entry", async () => {
  const tx = new Transaction();
  const stakePoolId = findStakePoolId(stakePoolIdentifier);
  const stakeEntryId = findStakeEntryId(stakePoolId, mintId);
  const ix = await rewardsCenterProgram(provider.connection, provider.wallet)
    .methods.initEntry(provider.wallet.publicKey)
    .accountsStrict({
      stakePool: stakePoolId,
      stakeEntry: stakeEntryId,
      stakeMint: mintId,
      stakeMintMetadata: findMintMetadataId(mintId),
      payer: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
  tx.add(ix);
  await executeTransaction(provider.connection, tx, provider.wallet);
  const stakeEntry = await fetchIdlAccount(
    provider.connection,
    stakeEntryId,
    "stakeEntry"
  );
  expect(stakeEntry.parsed.stakeMint.toString()).toBe(mintId.toString());
  expect(stakeEntry.parsed.pool.toString()).toBe(stakePoolId.toString());
  expect(stakeEntry.parsed.multiplierBasisPoints).toBe(null);
  expect(stakeEntry.parsed.multiplierStakeSeconds).toBe(null);
});

test("Set multiplier", async () => {
  const tx = new Transaction();
  const stakePoolId = findStakePoolId(stakePoolIdentifier);
  const stakeEntryId = findStakeEntryId(stakePoolId, mintId);
  const ix = await rewardsCenterProgram(provider.connection, provider.wallet)
    .methods.setStakeEntryMultiplier(new BN(multiplierBasisPoints))
    .accountsStrict({
      stakeEntry: stakeEntryId,
      stakePool: stakePoolId,
      authority: provider.wallet.publicKey,
    })
    .instruction();
  tx.add(ix);
  await executeTransaction(provider.connection, tx, provider.wallet);
  const stakeEntry = await fetchIdlAccount(
    provider.connection,
    stakeEntryId,
    "stakeEntry"
  );
  expect(stakeEntry.parsed.stakeMint.toString()).toBe(mintId.toString());
  expect(stakeEntry.parsed.pool.toString()).toBe(stakePoolId.toString());
  expect(stakeEntry.parsed.multiplierBasisPoints?.toNumber()).toBe(
    multiplierBasisPoints
  );
  expect(stakeEntry.parsed.multiplierStakeSeconds).toBe(null);
});

test("Set multiplier fail", async () => {
  const stakePoolId = findStakePoolId(stakePoolIdentifier);
  const stakeEntryId = findStakeEntryId(stakePoolId, mintId);
  const ix = await rewardsCenterProgram(provider.connection, provider.wallet)
    .methods.setStakeEntryMultiplier(new BN(multiplierBasisPoints))
    .accountsStrict({
      stakeEntry: stakeEntryId,
      stakePool: stakePoolId,
      authority: nonAuthority.publicKey,
    })
    .instruction();
  await expect(
    executeTransaction(
      provider.connection,
      new Transaction().add(ix),
      new Wallet(nonAuthority),
      { silent: true }
    )
  ).rejects.toThrow();
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

test("Update total stake seconds", async () => {
  const stakePoolId = findStakePoolId(stakePoolIdentifier);
  const stakeEntryId = findStakeEntryId(stakePoolId, mintId);
  const stakeEntryBefore = await fetchIdlAccount(
    provider.connection,
    stakeEntryId,
    "stakeEntry"
  );

  await new Promise((r) => setTimeout(r, 2000));
  const tx = new Transaction();
  const ix = await rewardsCenterProgram(provider.connection, provider.wallet)
    .methods.updateTotalStakeSeconds()
    .accounts({
      stakeEntry: stakeEntryId,
      updater: provider.wallet.publicKey,
    })
    .instruction();
  tx.add(ix);
  await executeTransaction(provider.connection, tx, provider.wallet);

  const stakeEntryAfter = await fetchIdlAccount(
    provider.connection,
    stakeEntryId,
    "stakeEntry"
  );
  expect(stakeEntryAfter.parsed.stakeMint.toString()).toBe(mintId.toString());
  expect(stakeEntryAfter.parsed.lastStaker.toString()).toBe(
    stakeEntryBefore.parsed.lastStaker.toString()
  );
  expect(Number(stakeEntryAfter.parsed.lastStakedAt)).toBe(
    Number(stakeEntryBefore.parsed.lastStakedAt)
  );
  expect(Number(stakeEntryAfter.parsed.lastUpdatedAt)).toBeGreaterThan(
    Number(stakeEntryBefore.parsed.lastUpdatedAt)
  );
  expect(Number(stakeEntryAfter.parsed.totalStakeSeconds)).toBeGreaterThan(
    Number(stakeEntryBefore.parsed.totalStakeSeconds)
  );
  expect(Number(stakeEntryAfter.parsed.multiplierStakeSeconds)).toBe(
    Math.floor(
      Number(stakeEntryAfter.parsed.totalStakeSeconds) *
        (multiplierBasisPoints / BASIS_POINTS_DIVISOR)
    )
  );
  expect(Number(stakeEntryAfter.parsed.multiplierStakeSeconds)).toBe(
    Number(
      stakeEntryAfter.parsed.totalStakeSeconds
        .mul(new BN(multiplierBasisPoints))
        .div(new BN(BASIS_POINTS_DIVISOR))
    )
  );
});

test("Unstake", async () => {
  const stakePoolId = findStakePoolId(stakePoolIdentifier);
  const stakeEntryId = findStakeEntryId(stakePoolId, mintId);
  const stakeEntryBefore = await fetchIdlAccount(
    provider.connection,
    stakeEntryId,
    "stakeEntry"
  );

  await new Promise((r) => setTimeout(r, 2000));
  await executeTransactions(
    provider.connection,
    await unstake(provider.connection, provider.wallet, stakePoolIdentifier, [
      { mintId },
    ]),
    provider.wallet
  );

  const stakeEntryAfter = await fetchIdlAccount(
    provider.connection,
    stakeEntryId,
    "stakeEntry"
  );
  expect(stakeEntryAfter.parsed.stakeMint.toString()).toBe(mintId.toString());
  expect(stakeEntryAfter.parsed.lastStaker.toString()).toBe(
    PublicKey.default.toString()
  );
  expect(Number(stakeEntryAfter.parsed.lastStakedAt)).toBe(
    Number(stakeEntryBefore.parsed.lastStakedAt)
  );
  expect(Number(stakeEntryAfter.parsed.lastUpdatedAt)).toBeGreaterThan(
    Number(stakeEntryBefore.parsed.lastUpdatedAt)
  );
  expect(Number(stakeEntryAfter.parsed.totalStakeSeconds)).toBeGreaterThan(
    Number(stakeEntryBefore.parsed.totalStakeSeconds)
  );
  expect(Number(stakeEntryAfter.parsed.multiplierStakeSeconds)).toBe(
    Number(stakeEntryBefore.parsed.multiplierStakeSeconds) +
      Math.floor(
        (Number(stakeEntryAfter.parsed.totalStakeSeconds) -
          Number(stakeEntryBefore.parsed.totalStakeSeconds)) *
          (multiplierBasisPoints / BASIS_POINTS_DIVISOR)
      )
  );
  expect(Number(stakeEntryAfter.parsed.multiplierStakeSeconds)).toBe(
    Number(
      stakeEntryBefore.parsed.multiplierStakeSeconds?.add(
        stakeEntryAfter.parsed.totalStakeSeconds
          .sub(stakeEntryBefore.parsed.totalStakeSeconds)
          .mul(new BN(multiplierBasisPoints))
          .div(new BN(BASIS_POINTS_DIVISOR))
      )
    )
  );

  const userAtaId = getAssociatedTokenAddressSync(
    mintId,
    provider.wallet.publicKey
  );
  const userAta = await getAccount(provider.connection, userAtaId);
  expect(parseInt(userAta.amount.toString())).toBe(1);
  const activeStakeEntries = await rewardsCenterProgram(
    provider.connection,
    provider.wallet
  ).account.stakeEntry.all([
    {
      memcmp: {
        offset: 82,
        bytes: provider.wallet.publicKey.toString(),
      },
    },
  ]);
  expect(activeStakeEntries.length).toBe(0);
});
