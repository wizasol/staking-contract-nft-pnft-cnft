import { beforeAll, expect, test } from "@jest/globals";
import { NATIVE_MINT } from "@solana/spl-token";
import type { PublicKey } from "@solana/web3.js";
import { Keypair, SystemProgram, Transaction } from "@solana/web3.js";
import type { SolanaProvider } from "@solana-nft-programs/common";
import { executeTransaction, withWrapSol } from "@solana-nft-programs/common";
import { BN } from "bn.js";

import {
  BASIS_POINTS_DIVISOR,
  fetchIdlAccount,
  findStakeBoosterId,
  findStakePoolId,
  rewardsCenterProgram,
  SOL_PAYMENT_INFO,
} from "../../sdk";
import { getTestProvider } from "../../tools/utils";

const stakePoolIdentifier = `test-${Math.random()}`;
let provider: SolanaProvider;
const PAYMENT_AMOUNT = 10;
let paymentMintId: PublicKey;
let paymentRecipientId: PublicKey;

beforeAll(async () => {
  provider = await getTestProvider();

  await executeTransaction(
    provider.connection,
    await withWrapSol(
      new Transaction(),
      provider.connection,
      provider.wallet,
      PAYMENT_AMOUNT
    ),
    provider.wallet
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
      boostSeconds: new BN(2),
      startTimeSeconds: new BN(0),
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
  expect(Number(stakeBooster.parsed.boostSeconds)).toBe(2);
  expect(Number(stakeBooster.parsed.paymentAmount)).toBe(PAYMENT_AMOUNT);
});

test("Update stake booster", async () => {
  const program = rewardsCenterProgram(provider.connection, provider.wallet);
  const tx = new Transaction();
  const stakePoolId = findStakePoolId(stakePoolIdentifier);
  const stakeBoosterId = findStakeBoosterId(stakePoolId);

  const ix = await program.methods
    .updateStakeBooster({
      paymentAmount: new BN(PAYMENT_AMOUNT),
      paymentMint: paymentMintId,
      paymentShares: [
        { address: paymentRecipientId, basisPoints: BASIS_POINTS_DIVISOR },
      ],
      boostSeconds: new BN(4),
      startTimeSeconds: new BN(4),
      boostActionPaymentInfo: SOL_PAYMENT_INFO,
    })
    .accounts({
      stakeBooster: stakeBoosterId,
      stakePool: stakePoolId,
      authority: provider.wallet.publicKey,
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
  expect(Number(stakeBooster.parsed.boostSeconds)).toBe(4);
  expect(Number(stakeBooster.parsed.startTimeSeconds)).toBe(4);
  expect(Number(stakeBooster.parsed.paymentAmount)).toBe(PAYMENT_AMOUNT);
});
