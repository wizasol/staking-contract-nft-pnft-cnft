import { chunkArray, findMintMetadataId } from "@solana-nft-programs/common";
import type { Wallet } from "@coral-xyz/anchor/dist/cjs/provider";
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import type { Connection } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";
import fetch from "node-fetch";

import { fetchIdlAccountDataById } from "../../sdk";
import type { MetadataJSON } from "../metadata";

export const commandName = "attributeBreakdown";
export const description = "Breakdown mints by an attribute";

export const getArgs = (_connection: Connection, _wallet: Wallet) => ({
  // array of mints and multipliers to set
  entryDatas: [] as { mintId: PublicKey }[],
  // file to read entry mints from
  entryFile: "tools/data/knittables-all.json",
  // attribute filter
  traitType: "Tribe",
  backupTraitType: "Legendary",
  // number of entries to fetch in parallel
  batchSize: 2,
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
  const mintIdByTraitValue: { [k: string]: string[] } = {};
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
            let attribute = json.attributes.find(
              (v) => v.trait_type === args.traitType
            );
            if (!attribute) {
              attribute = json.attributes.find(
                (v) => v.trait_type === args.backupTraitType
              );
            }
            console.log(
              `>> ${mintId.toString()}, ${metadata.data.name} ${
                attribute?.trait_type ?? ""
              }=${attribute?.value ?? ""}`
            );
            return { attribute: attribute, mintId: mintId };
          }
          return { mintId };
        } catch (e) {
          console.log(`>> ${mintId.toString()} error=`, e);
          return { mintId };
        }
      })
    );
    mints.reduce((acc, { mintId, attribute }) => {
      const k = attribute?.value
        ? `${attribute.trait_type}-${attribute.value}`
        : "-";
      const v = acc[k] ?? [];
      v.push(mintId.toString());
      acc[k] = v;
      return acc;
    }, mintIdByTraitValue);
  }
  console.log(`Found mints \n`, JSON.stringify(mintIdByTraitValue, null, 2));

  for (const [traitValue, mintIds] of Object.entries(mintIdByTraitValue)) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment
    require("fs").writeFileSync(
      `tools/data/knittables-${traitValue}.csv`,
      mintIds.join(",\n"),
      {
        encoding: "utf-8",
      }
    ) as string;
  }
};
