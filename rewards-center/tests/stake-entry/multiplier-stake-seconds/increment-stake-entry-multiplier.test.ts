import { beforeAll, expect, test } from "@jest/globals";
import type { PublicKey } from "@solana/web3.js";
import { Keypair, SystemProgram, Transaction } from "@solana/web3.js";
import type { SolanaProvider } from "@solana-nft-programs/common";
import {
  executeTransaction,
  executeTransactions,
  findMintMetadataId,
} from "@solana-nft-programs/common";
import { BN } from "bn.js";

import {
  fetchIdlAccount,
  findStakeEntryId,
  findStakePoolId,
  rewardsCenterProgram,
  SOL_PAYMENT_INFO,
  stake,
} from "../../../sdk";
import { getTestProvider } from "../../../tools/utils";
import { createMasterEditionTx } from "../../utils";

const stakePoolIdentifier = `test-${Math.random()}`;
const stakeEntryMultiplierSeconds = 10000;
let provider: SolanaProvider;
let mintId: PublicKey;

beforeAll(async () => {
  provider = await getTestProvider();
  const mintKeypair = Keypair.generate();
  mintId = mintKeypair.publicKey;
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

test("Stake", async () => {
  await executeTransactions(
    provider.connection,
    await stake(provider.connection, provider.wallet, stakePoolIdentifier, [
      { mintId },
    ]),
    provider.wallet
  );
});

test("Increment multiplier stake seconds", async () => {
  const tx = new Transaction();
  await new Promise((r) => setTimeout(r, 4000));
  const stakePoolId = findStakePoolId(stakePoolIdentifier);
  const stakeEntryId = findStakeEntryId(stakePoolId, mintId);
  const ix = await rewardsCenterProgram(provider.connection, provider.wallet)
    .methods.incrementStakeEntryMultiplierStakeSeconds(
      new BN(stakeEntryMultiplierSeconds)
    )
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
  expect(stakeEntry.parsed.multiplierBasisPoints?.toNumber()).toBe(10000);
  expect(stakeEntry.parsed.multiplierStakeSeconds?.toNumber()).toBeGreaterThan(
    stakeEntryMultiplierSeconds + 2
  );
});
