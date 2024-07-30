import type { Connection } from '@solana/web3.js';

import { getProgramIdlAccounts } from './sdk';

export const checkStakeEntries = async (connection: Connection) => {
  const programAccounts = await getProgramIdlAccounts(connection, 'stakeEntry');
  const nulledAccounts = programAccounts.filter((acc) => !acc.parsed);
  const entries = programAccounts.filter(
    (acc) => acc.parsed?.amount.toNumber() === 1
  );
  console.log(`Found ${entries.length} pools`);
  console.log(
    `[success] [${nulledAccounts.length}]`,
    nulledAccounts.map((acc) => acc.pubkey.toString()).join(',')
  );
  return entries;
};
