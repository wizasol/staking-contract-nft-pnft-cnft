import type { Wallet } from "@coral-xyz/anchor";
import type { Connection } from "@solana/web3.js";

import { getProgramIdlAccounts } from "../../sdk";

export const commandName = "checkStakeEntries";
export const description = "Check and deserialize all stake entries";

export const getArgs = (_connection: Connection, _wallet: Wallet) => ({});

export const handler = async (
  connection: Connection,
  _wallet: Wallet,
  _args: ReturnType<typeof getArgs>
) => {
  const programAccounts = await getProgramIdlAccounts(connection, "stakeEntry");
  const nulledAccounts = programAccounts.filter((acc) => !acc.parsed);
  const multiplierEntries = programAccounts.filter(
    (acc) => !!acc.parsed?.multiplierBasisPoints
  );
  console.log(
    "Multipliers ",
    multiplierEntries.length,
    multiplierEntries.map((acc) => acc.pubkey.toString()).join(",")
  );
  console.log(
    `[success] [${nulledAccounts.length}]`,
    nulledAccounts.map((acc) => acc.pubkey.toString()).join(",")
  );
};
