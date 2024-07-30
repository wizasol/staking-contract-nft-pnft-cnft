"use client";
import WalletButton from "@/components/dashboard/WalletButton";
import { WalletContext, useWallet } from "@solana/wallet-adapter-react";
import { WalletContextState } from "@solana/wallet-adapter-react";
import {
  IDL,
  SolanaNftProgramsRewardsCenter,
} from "../../../utils/pnftStaking/sdk/idl/solana_nft_programs_rewards_center";

import {
  PublicKey,
  ConfirmOptions,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  Keypair,
  Connection,
} from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
import {
  createProgrammableAsset,
  executeTransaction,
  executeTransactions,
  getTestConnection,
} from "@solana-nft-programs/common";
import {
  SOL_PAYMENT_INFO,
  findStakePoolId,
  stake,
  unstake,
} from "@/utils/pnftStaking/sdk";
import { asWallet } from "./Wallets";
import type { Wallet } from "@coral-xyz/anchor/dist/cjs/provider";
import { stakeNfts, unstakeNfts } from "@/utils/pnftStaking/lib";
import { GenericRequestNoAuth, genericRequestNoAuth } from "@/utils/request";

export default function Test() {
  // const stakePoolIdentifier = `test-${Math.random()}`;
  const connection = new Connection(
    "https://api.devnet.solana.com"
  ); /* getTestConnection(); */
  const wallet = useWallet();
  const stakerWallet = asWallet(wallet);
  const programId = "ox64uWcbrhaXBMACS3jpfzxnwxNWQd9J8ozT7PhZA5t";
  const stakePoolIdentifier = "test-0.5628066502435303";
  const mintId = new PublicKey("1gbWoCDS2MHRrvwFFxkbm58z5ffnRLyaodsP3Qpzeyj");
  const mintIDs = [
    "9UToQq9q3MMb7pPgRucMuCVfdu5a7e19M25qfgneJp6E",
    "4HJqm7U5bDn1obbAoAuFh5ExquFLdmn8J1TQixFHJFQW",
    "GhrGaxmojtbLmwmCsUgeotmXbjoy1bSnzQScwMngxMFD",
    "8YWNNuMpu99KsRVdWPeNDQqGG1vUDSzJcXzT1AmY4JAB",
    "5oKVGxx91dNjoEhCjEVgdz5qsXCjx59GfHmMDDB9wXvT",
    "F1JQdutUqUwfbGGtvivmGC7bAmh8UisGPJPMRcNGVi2s",
    "7Y2cLCFdnuyNxoDT7zX8dVygsL6JjrAN78wXx4KvSMYD",
    "HKkPZ7U5HNeSjbBfTER1vA2hgfgCsdouk8EUKNPRCN5L",
    "B15MFVRok7Ms7Yp5iusdo9akCbiQmBSK1dboAG8fv6Jf",
    "5H6KN22tvF3izhux81u4cvsaS48JgAbWfFpj9KdweFF5",
    "AgMAdHqrqt6TRQAigwnQZo59D8Aq9AyRmc2h7vRk3oQ4",
    "3Hpb4jkfmcf2suGW2FvgM5PXorTU3XeaPKmmrpUpFSEa",
    "AXaiaSLW7nrt1v1wEsymnYANHqRePS6QTb32s5KVjUmn",
    "5Tvf9FaTbryvhf66x8FnzWoY5ruu7jPUpUur2xSFaidZ",
    "3VC4CeQbZWFSX9PcZcQS7TnJyXsfrKB5m8tb56XTvtG2",
    "GkNCGPykjz3FRicGKJhonUSxT3EomCyWW8q5Dg3zUYNS",
    "hCAieAPadwVMwrmTukamAArsaKYVuVZQERK7baeoRNN",
    "8UwMsBwjaCxPr83JgakYss4ivQ7hjRUjwUBhET7Y8ipZ",
    "BrGAPN3voCiHjiUSU9yfvrJC4dUi9AXxGEx5r4x2f6pN",
    "37KNqBofHZrKVznUaKGY25GDXw5zN41XEzToftpHka8M",
    "Eb2JS9EnFvPQv8ACBgPeECEc8TN4VY6QfGZ3Adjq7x9G",
    "3GekBd64kb4hdnL1ymShAsK3YFCFdS1hK7MyzfRYPVKw",
    /*"7J28EH9UK85YdwJkn7Vqhov6d3DyzLCPiUKLEG9THVb9",
    "HoybejJjVZ8LnCQf5iSVeosXiU3S8N7YBtFpTM6qSqet",
    "CXP3ad3wu22LnCjz56M6jnc5XGZeUNVimp9AxYQfwa7R",
    "EDMPehZXpwkBEWEkLkPTLsxVzZmF6WJXrTMJECvU89Lb",
    "6WUfdb7WgvGoZ129VvKKk8hHCtq9PY43ZXi5Vii7KK4p",
    "3w7zeLbDczZpuKZnFUGd1QJvpyiG9ZCzS6Fm8kU8L7Ei",
    "Hh1P1bH86u53RnyUqk8xC9UvT1MBCdKCNm77qzpxLuMR",
    "4KBwKKtQQ1hb4oRj6CuffexaKHV6iqXUVzFW43JKfFdK",
    "6ksMRVi8AYo2aaEMvuUDmD3978BAawCsDRc6oxyeMdoQ",
    "CYN2tQRAH8KP3RK79evL6iyqqfBHzEeaCELz1Kos8C8S",
    "74DgquJRWeqEtVDM24o6oS7i3rXLx7hk7FjUmioTWwAX",
    "3a6imk2BiWhH6ToD2X9n3qhP2qVMuPvn8Pasoo1S4hPG",
    "AXjdopmvWMYn1zHcuHz5FuU6T88AMBjP57swfq4QGZDk",
    "ETwT4oQxJcPcU5V22Shwn8w51vuNHdqBqSqEV7pCRnEe",
    "8zuF2aMMjskjiXMqmfUqvmPxSxPjtGvDUovYCjEFnQHp",
    "AD8aVp3hV8RBFUaNNnopjaTYpQFoksKtEUt8JigELxhM",
    "BXJVX6AcyiD6kTQV6gv7jLYGzRZ4C65KhbbMkqmmajwz",
    "7x4mdq4WukJWuKCyRUifykKvP4cyCGGA58WUBMy2tkzc",
    "BiYuvHtPN3JGSZmUTy6EPWaEmeZvXfdqEug4kiFZeWnH",
    "376wNLcSkUtJesWT9G9Wxm83gREi4JVPs4U7h37dSXr6",
    "2HrLvMRQonPYaQGASy4A4gC1dmDZmUu8HrcUDSSBmgdk",
    "2LJTUo2pCVhNz4Jfgx61MtGCqmCFSzv98espAcn7rC3W",
    "CQmPA4iNfksw7aWxaDWZeUHbtSP5N5D9i4NsCRbBopvp",
    "5P7h4Qm8DWvTESRyC6Zk6BdkwS2B6zkbGjbuNz2qBWwu",
    "2tRFtJGR4vQrjiPmhqDRWh5qzKF32J86ChDW7Y6nGG6B",
    "EQVWMyo1DsDkup2xnMzNc3qgz7odcf1KAc8mbrNFqqYF",
    "8wkK2w9dQt6U74eKXW4JLe9fdBzoK688Z8nZp5Z3K7TC",
    "9Xpj78EuMnG4kZzC2Mwq96JNqj9txsiqWuQYYsES934y",
    "aaKSE5LDPZbcuvuXDBYrh1FRYjmAhrK6frrRWVL89wu",
    "BteT6HZzxGGn3rLVxkXqFh5951A3PeRqKG1zfbzsA85D",
    "26LX7ddPtqJBgLapDtDSBGNTMSJaLuCLaMaPKFws4ydt",
    "12KJQd5WiDKBoseGZomsGcCZuAkYxzVaJB9jDTXL1qxC",
    "G51EPJEXvHEG2iYgurUY5yQ33p4NPpM4aZi1boW1HhwD", */
  ];

  let provider: anchor.AnchorProvider;
  let program: anchor.Program<SolanaNftProgramsRewardsCenter>;

  const getAnchorProvider = async (wallet: Wallet) => {
    const opts: ConfirmOptions = {
      preflightCommitment: "confirmed",
    };

    if (provider) {
      return provider;
    }

    provider = new anchor.AnchorProvider(connection, wallet, opts);
    return provider;
  };

  const getAnchorProgram = async (wallet: Wallet) => {
    if (!provider) {
      provider = await getAnchorProvider(wallet);
    }
    if (program) {
      return program;
    }
    program = new anchor.Program(IDL, programId, provider);
    return program;
  };

  const init = async () => {
    const program = await getAnchorProgram(stakerWallet);
    const stakePoolId = findStakePoolId(stakePoolIdentifier);
    const tx = new Transaction();
    const ix = await program.methods
      .initPool({
        identifier: stakePoolIdentifier,
        allowedCollections: [],
        allowedCreators: [],
        requiresAuthorization: false,
        authority: stakerWallet.publicKey!,
        resetOnUnstake: false,
        cooldownSeconds: null,
        minStakeSeconds: null,
        endDate: null,
        stakePaymentInfo: SOL_PAYMENT_INFO,
        unstakePaymentInfo: SOL_PAYMENT_INFO,
      })
      .accounts({
        stakePool: stakePoolId,
        payer: stakerWallet.publicKey!,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    /*  tx.add(ix);

    const txres = await executeTransaction(
      provider.connection,
      tx,
      // @ts-ignore
      stakerWallet
    ); */
    console.log(ix);
  };
  let stakerTokenAccountId: PublicKey;

  /*  const pre = async () => {
    const airdropStaker = await provider.connection.requestAirdrop(
      stakerWallet.publicKey,
      5 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropStaker);

    [stakerTokenAccountId, mintId] = await createProgrammableAsset(
      provider.connection,
      stakerWallet
    );
    console.log("MINT", mintId.toBase58());
  }; */

  const stakeWrapper = async () => {
    const program = await getAnchorProgram(stakerWallet);

    /*     await pre();
     */
    const tx = await executeTransactions(
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
    );
    console.log(tx);
  };

  const unstakeWrapper = async () => {
    const tx = await executeTransactions(
      provider.connection,
      await unstake(provider.connection, stakerWallet, stakePoolIdentifier, [
        { mintId },
      ]),
      stakerWallet
    );

    console.log(tx);
  };

  const stakeLib = async () => {
    const local = false;
    const transactions = await stakeNfts(
      mintIDs.map((mintId) => new PublicKey(mintId)),
      wallet,
      local
    );

    console.log(JSON.stringify(transactions));

    if (!local) {
      const nftsRequest: GenericRequestNoAuth = {
        method: "POST",
        url: "/nft/stake",
        data: {
          mints: mintIDs,
          transactions,
          wallet: "BqW2i4jG6h2nzynWyiDm989YKwTWTme4g8cfawYgtcFH",
        },
      };

      const response = await genericRequestNoAuth(nftsRequest);
      console.log(response);
      if (!response.success) {
        throw new Error("error staking back");
      }
    }
  };

  const unstakeLib = async () => {
    await unstakeNfts(
      mintIDs.map((mintId) => new PublicKey(mintId)),
      wallet,
      true
    );
  };

  return (
    <>
      <WalletButton />
      <div>
        <button onClick={() => {}}>Init</button>
        <br></br>
        <button onClick={stakeWrapper}>Stake</button>
        <br></br>
        <button onClick={unstakeWrapper}>Unstake</button>
        <br></br>
        <button onClick={stakeLib}>stakeLib</button>
        <br></br>
        <button onClick={unstakeLib}>unstakeLib</button>
      </div>
    </>
  );
}
