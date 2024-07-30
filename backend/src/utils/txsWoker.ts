const { Connection } = require('@solana/web3.js');
const { parentPort, workerData } = require('worker_threads');

const SERVER_IP =
  'https://aged-virulent-diamond.solana-devnet.quiknode.pro/ea6908325ad1b0b0362002596491887dcd01844a/';

const connection = new Connection(SERVER_IP);

(async () => {
  const { serialized } = workerData;
  try {
    if (!serialized || serialized.length === 0) {
      throw new Error('No serialized tx');
    }
    const signatures = [];
    for (let i = 0; i < serialized.length; i += 1) {
      const signedTx = serialized[i];
      const txid = await connection.sendRawTransaction(signedTx);
      signatures.push(txid);
      const blockHash = await connection.getLatestBlockhash();
      await connection.confirmTransaction(
        {
          blockhash: blockHash.blockhash,
          lastValidBlockHeight: blockHash.lastValidBlockHeight,
          signature: txid,
        },
        'confirmed'
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log(`sended ${i + 1} of ${serialized.length}`);
    }

    parentPort?.postMessage({ success: true, data: signatures });
  } catch (err) {
    console.log(err);
    parentPort?.postMessage({ success: false, data: err });
  }
})();
