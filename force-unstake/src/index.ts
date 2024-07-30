import { BN, Wallet } from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import * as dotenv from 'dotenv';
import { keypairFrom } from './utils';
import { checkStakeEntries } from './checkStakeEntries';
import { unstake } from './sdk';
import { sendTxs } from './sendTx';

dotenv.config();

const stakePoolIdentifier = "test-0.15774236139258568";

const main = async () => {
  const authorityPrvKey = process.env.UPDATE_AUTHORTY_PRV_KEY;
  console.log(`Starting force unstake by updateAuthority`);
  if (!authorityPrvKey) return;

  const authority = new Wallet(keypairFrom(authorityPrvKey));
  console.log('Loaded authority:', authority.publicKey.toBase58());
  const rpcUrl = process.env.RPC_URL || 'https://api.mainnet-beta.solana.com';
  console.log('RPC Url:', rpcUrl);
  const connection = new Connection(rpcUrl, 'recent');

  // const entries = await checkStakeEntries(connection);
  const entries = [
    {
      pubkey: new PublicKey('ERWJ7cCbWQQBJfM7UEdZN81G5QWYnKoavZwsZ7UYvnSz'),
      parsed: {
        kind: 0,
        pool: new PublicKey('99HZqfd4DtKMUQFf58KjzEbK4PUgF69z4hKMg69gBpvp'),
        amount: new BN(1),
        stakeMint: new PublicKey(
          'CiDYdpSMufPamvXHCpKdJ9hjoXEHJGC9WjWwYG2QVUoj'
        ),
        lastStaker: new PublicKey(
          'B74FE1oMixhXDVjhW8A9DaLjMCj6AyZNCrrtoRgCkmVs'
        ),
      },
    },
  ];
  // console.log('Entries:');
  // console.log(entries);
  const mappedMints = entries.map((entry) => {
    return { mintId: entry.parsed.stakeMint, staker: entry.parsed.lastStaker };
  });

  const chunkSize = 10;
  const toBeSigned = [];
  for (let i = 0; i < mappedMints.length; i += chunkSize) {
    toBeSigned.push(
      ...(await unstake(
        connection,
        authority,
        stakePoolIdentifier,
        mappedMints.slice(i, i + chunkSize)
      ))
    );
    if (i % 3 === 0) {
      console.log('waiting 1 second', i, mappedMints.length);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  return sendTxs(toBeSigned, authority, connection, true);
};

main();
