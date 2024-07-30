import { chunkArray, findMintMetadataId } from "@solana-nft-programs/common";
import type { Wallet } from "@coral-xyz/anchor/dist/cjs/provider";
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import type { Connection } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";
import fetch from "node-fetch";

import { fetchIdlAccountDataById } from "../../sdk";
import type { MetadataJSON } from "../metadata";

export const commandName = "attributeFilter";
export const description = "Filter mint list by attributes";

export const getArgs = (_connection: Connection, _wallet: Wallet) => ({
  // array of mints and multipliers to set
  entryDatas: [] as { mintId: PublicKey }[],
  // file to read entry mints from
  entryFile: "tools/data/knittables-all.json",
  // attribute filter
  traitType: "Tribe",
  traitValue: "Neo",
  // number of entries to fetch in parallel
  batchSize: 5,
  // whether to skip execution
  dryRun: false,
});

export const handler = async (
  connection: Connection,
  _wallet: Wallet,
  args: ReturnType<typeof getArgs>
) => {
  const { entryDatas: mintList } = args;
  let entryDatas = mintList;

  if (args.entryFile && entryDatas.length === 0) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment
    const file = require("fs").readFileSync(args.entryFile, {
      encoding: "utf-8",
    }) as string;
    // entryDatas = file.split(",\n").map((v) => ({ mintId: new PublicKey(v) }));
    const json = JSON.parse(file) as { mint_address: string; name: string }[];
    entryDatas = json.map((v) => ({ mintId: new PublicKey(v.mint_address) }));
  }

  const chunkData = entryDatas.map((e) => ({
    ...e,
    mintMetadataId: findMintMetadataId(e.mintId),
  }));

  console.log(`\n1/3 Fetching (${chunkData.length}) data...`);
  const mintMetadatas = await fetchIdlAccountDataById(
    connection,
    chunkData.map((i) => i.mintMetadataId)
  );

  console.log(`\n2/3 Fetching attributes transactions...`);
  const mintIds = [];
  const chunks = chunkArray(chunkData, args.batchSize);
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]!;
    console.log(`> ${i}/${chunks.length}`);
    const mints = await Promise.all(
      chunk.map(async ({ mintId, mintMetadataId }) => {
        try {
          const mintMetadata = mintMetadatas[mintMetadataId.toString()];
          if (mintMetadata) {
            const metadata = Metadata.deserialize(mintMetadata.data)[0];
            const response = await fetch(metadata.data.uri);
            const json = (await response.json()) as MetadataJSON;
            if (
              json.attributes.some(
                (attr) =>
                  attr.trait_type === args.traitType &&
                  attr.value === args.traitValue
              )
            ) {
              console.log(
                `>> ${mintId.toString()}, ${args.traitType}=${args.traitValue}`
              );
              return mintId;
            }
          }
          return null;
        } catch (e) {
          console.log(`>> ${mintId.toString()} error=`, e);
          return null;
        }
      })
    );
    mintIds.push(mints.filter((v): v is PublicKey => !!v));
  }
  console.log(`Found mints \n`, mintIds.map((v) => v.toString()).join(",\n"));

  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment
  require("fs").writeFileSync(
    `tools/data/knittables-neo-2.csv`,
    mintIds.map((o) => o.toString()).join(",\n"),
    {
      encoding: "utf-8",
    }
  ) as string;
};
