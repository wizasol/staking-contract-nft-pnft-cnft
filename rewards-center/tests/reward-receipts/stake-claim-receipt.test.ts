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
import BN from "bn.js";

import {
  claimRewardReceipt,
  fetchIdlAccount,
  findReceiptManagerId,
  findRewardReceiptId,
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
const RECEIPT_MANAGER_IDENTIFIER = "receipt-manager-1";
const STARTING_AMOUNT = 100;
const PAYMENT_AMOUNT = 10;
const STAKE_SECONDS_TO_USE = 2;
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
});

test("Create receipt manager", async () => {
  const program = rewardsCenterProgram(provider.connection, provider.wallet);
  const tx = new Transaction();
  const stakePoolId = findStakePoolId(stakePoolIdentifier);
  const receiptManagerId = findReceiptManagerId(
    stakePoolId,
    RECEIPT_MANAGER_IDENTIFIER
  );

  const ix = await program.methods
    .initReceiptManager({
      name: RECEIPT_MANAGER_IDENTIFIER,
      authority: provider.wallet.publicKey,
      requiredStakeSeconds: new BN(0),
      stakeSecondsToUse: new BN(STAKE_SECONDS_TO_USE),
      paymentMint: paymentMintId,
      paymentAmount: new BN(PAYMENT_AMOUNT),
      paymentShares: [{ address: paymentRecipientId, basisPoints: 10000 }],
      requiresAuthorization: false,
      maxClaimedReceipts: null,
      claimActionPaymentInfo: SOL_PAYMENT_INFO,
    })
    .accounts({
      receiptManager: receiptManagerId,
      stakePool: stakePoolId,
      payer: provider.wallet.publicKey,
    })
    .instruction();
  tx.add(ix);
  await executeTransaction(provider.connection, tx, provider.wallet);
  const receiptManager = await fetchIdlAccount(
    provider.connection,
    receiptManagerId,
    "receiptManager"
  );
  expect(receiptManager.parsed.authority.toString()).toBe(
    provider.wallet.publicKey.toString()
  );
  expect(receiptManager.parsed.paymentMint.toString()).toBe(
    paymentMintId.toString()
  );
  expect(receiptManager.parsed.requiresAuthorization).toBe(false);
  expect(receiptManager.parsed.stakeSecondsToUse.toString()).toBe(
    STAKE_SECONDS_TO_USE.toString()
  );
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

test("Claim receipt", async () => {
  const program = rewardsCenterProgram(provider.connection, provider.wallet);
  await new Promise((r) => setTimeout(r, 4000));
  const receiptManagerId = findReceiptManagerId(
    findStakePoolId(stakePoolIdentifier),
    RECEIPT_MANAGER_IDENTIFIER
  );

  const userPaymentAta = await getAccount(
    provider.connection,
    getAssociatedTokenAddressSync(paymentMintId, provider.wallet.publicKey)
  );
  const amountBefore = Number(userPaymentAta.amount);
  expect(amountBefore).toBe(STARTING_AMOUNT);

  await executeTransaction(
    provider.connection,
    await claimRewardReceipt(
      provider.connection,
      provider.wallet,
      stakePoolIdentifier,
      { mintId },
      receiptManagerId
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
  expect(Number(entry.parsed.usedStakeSeconds)).toBe(STAKE_SECONDS_TO_USE);

  // check reward receipt
  const rewardReceiptId = findRewardReceiptId(receiptManagerId, stakeEntryId);
  const rewardReceipt = await fetchIdlAccount(
    provider.connection,
    rewardReceiptId,
    "rewardReceipt"
  );
  expect(rewardReceipt.parsed.stakeEntry.toString()).toBe(
    stakeEntryId.toString()
  );
  expect(rewardReceipt.parsed.target.toString()).toBe(
    provider.wallet.publicKey.toString()
  );

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

  // check payment
  const userPaymentAtaAfter = await getAccount(
    provider.connection,
    getAssociatedTokenAddressSync(paymentMintId, provider.wallet.publicKey)
  );
  const amountAfter = Number(userPaymentAtaAfter.amount);
  expect(amountAfter).toBe(STARTING_AMOUNT - PAYMENT_AMOUNT);
});
