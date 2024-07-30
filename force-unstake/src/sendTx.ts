import { Wallet } from '@coral-xyz/anchor';
import { Connection, SystemProgram, Transaction } from '@solana/web3.js';

export const sendTxs = async (
  txs: Transaction[],
  wallet: Wallet,
  connection: Connection,
  local?: boolean
) => {
  const latestBlockhash = (await connection.getLatestBlockhash()).blockhash;

  // @ts-ignore
  const signedTxs = await wallet.signAllTransactions(
    txs.map((tx) => {
      tx.recentBlockhash = latestBlockhash;
      tx.feePayer = wallet.publicKey!;
      return tx;
    })
  );
  const sendedTxs = [];
  for (let i = 0; i < signedTxs.length; i++) {
    const signedTx = signedTxs[i];
    try {
      const txid = await connection.sendRawTransaction(signedTx.serialize());
      sendedTxs.push(txid);
      const blockHash = await connection.getLatestBlockhash();
      await connection.confirmTransaction(
        {
          blockhash: blockHash.blockhash,
          lastValidBlockHeight: blockHash.lastValidBlockHeight,
          signature: txid,
        },
        'confirmed'
      );
      // await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log(`sended ${i + 1} of ${signedTxs.length}`);
    } catch (e) {
      console.log(e);
      //await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log(`sended ${i + 1} of ${signedTxs.length}`);
    }
    //}
  }
};
