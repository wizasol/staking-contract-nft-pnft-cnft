import type { SolanaProvider } from "@solana-nft-programs/common";
import {
  chunkArray,
  connectionFor,
  getTestConnection,
  logError,
  newAccountWithLamports,
} from "@solana-nft-programs/common";
import { utils, Wallet } from "@coral-xyz/anchor";
import type { Wallet as IWallet } from "@coral-xyz/anchor/dist/cjs/provider";
import {
  ConfirmOptions,
  Connection,
  Signer,
  Transaction,
} from "@solana/web3.js";
import {
  Keypair,
  PublicKey,
  sendAndConfirmRawTransaction,
} from "@solana/web3.js";

export async function getTestProvider(): Promise<SolanaProvider> {
  const connection = getTestConnection(); /* connectionFor("devnet"); */ /* new Connection(
    'https://solana-devnet.g.alchemy.com/v2/1QKOHoHW1nxMIn8VwXWjmd4nKgY43UYq',
    "recent"
  ) */
  // const keypair = await newAccountWithLamports(connection);
  //const wallet = new Wallet(keypair);
  const wallet: Wallet = new Wallet(Keypair.fromSecretKey(new Uint8Array(
    [237,26,119,194,182,78,220,246,42,51,60,98,83,56,108,101,196,196,4,106,165,137,190,168,6,103,18,99,64,36,15,118,161,1,146,97,141,105,28,215,177,161,244,250,179,25,61,112,254,56,85,124,30,143,22,167,121,110,17,13,35,245,4,240])))

  return {
    connection,
    wallet,
  };
}

export const keypairFrom = (s: string, n?: string): Keypair => {
  try {
    if (s.includes("[")) {
      return Keypair.fromSecretKey(
        Buffer.from(
          s
            .replace("[", "")
            .replace("]", "")
            .split(",")
            .map((c) => parseInt(c))
        )
      );
    } else {
      return Keypair.fromSecretKey(utils.bytes.bs58.decode(s));
    }
  } catch (e) {
    try {
      return Keypair.fromSecretKey(
        Buffer.from(
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          JSON.parse(
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-var-requires
            require("fs").readFileSync(s, {
              encoding: "utf-8",
            })
          )
        )
      );
    } catch (e) {
      process.stdout.write(`${n ?? "keypair"} is not valid keypair`);
      process.exit(1);
    }
  }
};

export const publicKeyFrom = (s: string, n?: string): PublicKey => {
  try {
    return new PublicKey(s);
  } catch (e) {
    process.stdout.write(`${n ?? "publicKey"} is not valid publicKey`);
    process.exit(1);
  }
};

export async function executeTransactionBatches<T = null>(
  connection: Connection,
  txs: Transaction[],
  wallet: IWallet,
  config?: {
    signers?: Signer[];
    batchSize?: number;
    successHandler?: (
      txid: string,
      ix: { i: number; j: number; it: number; jt: number }
    ) => void;
    errorHandler?: (
      e: unknown,
      ix: { i: number; j: number; it: number; jt: number }
    ) => T;
    confirmOptions?: ConfirmOptions;
  }
): Promise<(string | null | T)[]> {
  const batchedTxs = chunkArray(txs, config?.batchSize ?? txs.length);
  const txids: (string | T | null)[] = [];
  for (let i = 0; i < batchedTxs.length; i++) {
    const batch = batchedTxs[i];
    if (batch) {
      const latestBlockhash = (await connection.getLatestBlockhash()).blockhash;
      const batchSignedTxs = await wallet.signAllTransactions(
        batch.map((tx) => {
          tx.recentBlockhash = latestBlockhash;
          tx.feePayer = wallet.publicKey;
          if (config?.signers) {
            tx.partialSign(...(config?.signers ?? []));
          }
          return tx;
        })
      );
      const batchTxids = await Promise.all(
        batchSignedTxs.map(async (tx, j) => {
          try {
            const txid = await sendAndConfirmRawTransaction(
              connection,
              tx.serialize(),
              config?.confirmOptions
            );
            if (config?.successHandler) {
              config?.successHandler(txid, {
                i,
                it: batchedTxs.length,
                j,
                jt: batchSignedTxs.length,
              });
            }
            return txid;
          } catch (e) {
            if (config?.errorHandler) {
              return config?.errorHandler(e, {
                i,
                it: batchedTxs.length,
                j,
                jt: batchSignedTxs.length,
              });
            }
            logError(e);
            return null;
          }
        })
      );
      txids.push(...batchTxids);
    }
  }
  return txids;
}
