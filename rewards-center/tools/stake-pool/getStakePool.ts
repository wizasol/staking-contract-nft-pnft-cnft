import type { Wallet } from "@coral-xyz/anchor";
import type { Connection } from "@solana/web3.js";

import { decodeIdlAccount, findStakePoolId } from "../../sdk";

export const commandName = "getStakePool";
export const description = "Get a stake pool";

export type Args = {
  identifier: string;
};

export const getArgs = (_connection: Connection, _wallet: Wallet) => ({
  identifier: "knittables-proto",
});

export const handler = async (
  connection: Connection,
  _wallet: Wallet,
  args: Args
) => {
  const stakePoolId = findStakePoolId(args.identifier);
  const stakePool = await connection.getAccountInfo(stakePoolId);
  if (!stakePool) throw "Stake pool not found";
  const parsed = decodeIdlAccount(stakePool, "stakePool");
  console.log(
    `[success] ${args.identifier} [${stakePoolId.toString()}]`,
    JSON.stringify(parsed, null, 2)
  );
};
