import type { Wallet } from "@coral-xyz/anchor";
import { BN } from "@coral-xyz/anchor";
import type { Connection } from "@solana/web3.js";
import { PublicKey, Transaction } from "@solana/web3.js";
import { executeTransaction } from "@solana-nft-programs/common";

import { findPaymentInfoId, rewardsCenterProgram } from "../../sdk";

export const commandName = "createPaymentInfo";
export const description = "Create a payment info object";
export const getArgs = (_connection: Connection, wallet: Wallet) => ({
  identifier: "test", // test test-wsol default
  authority: wallet.publicKey,
  paymentAmount: 0,
  paymentMint: PublicKey.default,
  paymentShares: [
    {
      address: new PublicKey("cteamyte8zjZTeexp3qTzvpb24TKRSL3HFad9SzNaNJ"),
      basisPoints: 10000,
    },
  ],
});

export type InitPaymentInfoIx = {
  authority: PublicKey;
  identifier: string;
  paymentAmount: number;
  paymentMint: PublicKey;
  paymentShares: { address: PublicKey; basisPoints: number }[];
};

export const handler = async (
  connection: Connection,
  wallet: Wallet,
  args: InitPaymentInfoIx
) => {
  const transaction = new Transaction();
  const paymentInfoId = findPaymentInfoId(args.identifier);
  const program = rewardsCenterProgram(connection, wallet);

  transaction.add(
    await program.methods
      .initPaymentInfo({
        authority: args.authority,
        identifier: args.identifier,
        paymentAmount: new BN(args.paymentAmount),
        paymentMint: args.paymentMint,
        paymentShares: args.paymentShares,
      })
      .accounts({ paymentInfo: paymentInfoId, payer: wallet.publicKey })
      .instruction()
  );
  await new Promise((r) => setTimeout(r, 200));
  await executeTransaction(connection, transaction, wallet);
  console.log(
    `Created payment manager ${args.identifier} [${paymentInfoId.toString()}]`,
    args
  );
};
