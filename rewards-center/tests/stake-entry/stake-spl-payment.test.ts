import { beforeAll, expect, test } from "@jest/globals";
import {
  getAccount,
  getAssociatedTokenAddressSync,
  NATIVE_MINT,
} from "@solana/spl-token";
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
  withWrapSol,
} from "@solana-nft-programs/common";

import {
  fetchIdlAccount,
  findStakeEntryId,
  findStakePoolId,
  rewardsCenterProgram,
  stake,
  unstake,
  WRAPPED_SOL_PAYMENT_INFO,
} from "../../sdk";
import { getTestProvider } from "../../tools/utils";
import { createMasterEditionTx } from "../utils";

const stakePoolIdentifier = `test-${Math.random()}`;
let provider: SolanaProvider;
const STARTING_AMOUNT = LAMPORTS_PER_SOL * 2;
let mintId: PublicKey;
let paymentMintId: PublicKey;

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
      stakePaymentInfo: WRAPPED_SOL_PAYMENT_INFO,
      unstakePaymentInfo: WRAPPED_SOL_PAYMENT_INFO,
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
    WRAPPED_SOL_PAYMENT_INFO.toString()
  );
});

test("Stake", async () => {
  const program = rewardsCenterProgram(provider.connection, provider.wallet);
  const userPaymentAta = await getAccount(
    provider.connection,
    getAssociatedTokenAddressSync(paymentMintId, provider.wallet.publicKey)
  );
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

  const paymentInfo = await fetchIdlAccount(
    provider.connection,
    WRAPPED_SOL_PAYMENT_INFO,
    "paymentInfo"
  );
  const userPaymentAtaAfter = await getAccount(
    provider.connection,
    getAssociatedTokenAddressSync(paymentMintId, provider.wallet.publicKey)
  );
  expect(
    Number(userPaymentAta.amount) - Number(userPaymentAtaAfter.amount)
  ).toBe(Number(paymentInfo.parsed.paymentAmount));
});

test("Unstake", async () => {
  const program = rewardsCenterProgram(provider.connection, provider.wallet);
  const userPaymentAta = await getAccount(
    provider.connection,
    getAssociatedTokenAddressSync(paymentMintId, provider.wallet.publicKey)
  );

  await new Promise((r) => setTimeout(r, 2000));
  await executeTransactions(
    provider.connection,
    await unstake(provider.connection, provider.wallet, stakePoolIdentifier, [
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

  const paymentInfo = await fetchIdlAccount(
    provider.connection,
    WRAPPED_SOL_PAYMENT_INFO,
    "paymentInfo"
  );
  const userPaymentAtaAfter = await getAccount(
    provider.connection,
    getAssociatedTokenAddressSync(paymentMintId, provider.wallet.publicKey)
  );
  expect(
    Number(userPaymentAta.amount) - Number(userPaymentAtaAfter.amount)
  ).toBe(Number(paymentInfo.parsed.paymentAmount));
});
