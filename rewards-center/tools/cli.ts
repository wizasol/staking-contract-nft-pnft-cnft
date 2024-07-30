import { Wallet } from "@coral-xyz/anchor";
import type { Cluster } from "@solana/web3.js";
import { Connection } from "@solana/web3.js";
import * as dotenv from "dotenv";
import * as readline from "readline";
import type { ArgumentsCamelCase, CommandModule } from "yargs";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import * as authorizeMints from "./admin-actions/authorizeMints";
import * as deauthorizeMints from "./admin-actions/deauthorizeMints";
import * as resetAllEntries from "./admin-actions/resetAllEntries";
import * as setStakeEntryMultipliers from "./admin-actions/setStakeEntryMultipliers";
import * as attributeBreakdown from "./mint-tools/attributeBreakdown";
import * as attributeFilter from "./mint-tools/attributeFilter";
import * as createPaymentInfo from "./payment/createPaymentInfo";
import * as updatePaymentInfo from "./payment/updatePaymentInfo";
import * as checkStakeEntries from "./stake-entry/checkStakeEntries";
import * as getStakeEntry from "./stake-entry/getStakeEntry";
import * as resizeStakeEntries from "./stake-entry/resizeStakeEntries";
import * as stakeEntriesFillZeros from "./stake-entry/stakeEntriesFillZeros";
import * as getStakePool from "./stake-pool/getStakePool";
import * as initPool from "./stake-pool/initPool";
import * as updatePool from "./stake-pool/updatePool";
import { keypairFrom } from "./utils";

dotenv.config();

export type ProviderParams = {
  cluster: string;
  wallet: string;
};

const networkURLs: { [key in Cluster | "mainnet" | "localnet"]: string } = {
  ["mainnet-beta"]:
    process.env.MAINNET_PRIMARY_URL ?? "https://solana-api.projectserum.com",
  mainnet:
    process.env.MAINNET_PRIMARY_URL ?? "https://solana-api.projectserum.com",
  devnet: "https://api.devnet.solana.com/",
  testnet: "https://api.testnet.solana.com/",
  localnet: "http://localhost:8899/",
};

export const connectionFor = (
  cluster: Cluster | "mainnet" | "localnet",
  defaultCluster = "mainnet"
) => {
  return new Connection(
    process.env.RPC_URL || networkURLs[cluster || defaultCluster],
    "recent"
  );
};

const commandBuilder = <T>(command: {
  commandName: string;
  description: string;
  getArgs: (c: Connection, w: Wallet) => T;
  handler: (c: Connection, w: Wallet, a: T) => Promise<void>;
}): CommandModule<ProviderParams, ProviderParams> => {
  return {
    command: command.commandName,
    describe: command.description,
    handler: async ({
      cluster,
      wallet,
    }: ArgumentsCamelCase<ProviderParams>) => {
      const clusterString = process.env.CLUSTER || cluster;
      const c = connectionFor(clusterString as Cluster);
      const w = new Wallet(keypairFrom(process.env.WALLET || wallet, "wallet"));
      const a = command.getArgs(c, w);
      console.log(command.description);
      console.log(
        `[cluster=${clusterString}] [wallet=${w.publicKey.toString()}]`
      );
      console.log(`\n(modify args in ${command.commandName}.ts)`);
      console.log(JSON.stringify(a, null, 2));
      await question("\nExecute... [enter]");
      await command.handler(c, w, a);
    },
  };
};

export const question = async (query: string) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans);
    })
  );
};

void yargs(hideBin(process.argv))
  .positional("wallet", {
    describe: "Wallet to use - default to WALLET environment variable",
    default: "process.env.WALLET",
  })
  .positional("cluster", {
    describe:
      "Solana cluster moniker to use [mainnet, devnet] - ovverride url with RPC_URL environment variable or mainnet moniker with MAINNET_PRIMARY environment variable",
    default: "devnet",
  })
  .command(commandBuilder(initPool))
  .command(commandBuilder(updatePool))
  .command(commandBuilder(getStakePool))
  .command(commandBuilder(createPaymentInfo))
  .command(commandBuilder(updatePaymentInfo))
  .command(commandBuilder(getStakeEntry))
  .command(commandBuilder(checkStakeEntries))
  .command(commandBuilder(resizeStakeEntries))
  .command(commandBuilder(stakeEntriesFillZeros))
  .command(commandBuilder(authorizeMints))
  .command(commandBuilder(deauthorizeMints))
  .command(commandBuilder(setStakeEntryMultipliers))
  .command(commandBuilder(resetAllEntries))
  .command(commandBuilder(attributeFilter))
  .command(commandBuilder(attributeBreakdown))
  .strict()
  .demandCommand()
  .help("h")
  .alias({ h: "help" }).argv;
