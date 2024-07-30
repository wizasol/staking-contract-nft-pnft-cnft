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
const stakerWallet: Wallet = new Wallet(Keypair.generate());

beforeAll(async () => {
  provider = await getTestProvider();

  const airdropStaker = await provider.connection.requestAirdrop(
    stakerWallet.publicKey,
    5 * LAMPORTS_PER_SOL
  );
  await provider.connection.confirmTransaction(airdropStaker);
  [stakerTokenAccountId, mintId] = await createProgrammableAsset(
    provider.connection,
    stakerWallet,
    null
  );
});

test("Init pool", async () => {
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
  await executeTransaction(provider.connection, tx, stakerWallet);
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
});

test("Stake", async () => {
  const program = rewardsCenterProgram(provider.connection, stakerWallet);
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
  expect(activeStakeEntries.length).toBe(1);

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
  const program = rewardsCenterProgram(provider.connection, stakerWallet);
  await new Promise((r) => setTimeout(r, 2000));
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
