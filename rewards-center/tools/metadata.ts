import {
  findMintMetadataId,
  getBatchedMultipleAccounts,
} from "@solana-nft-programs/common";
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import type { Connection, PublicKey } from "@solana/web3.js";
import fetch from "node-fetch";

export type MetadataJSON = {
  name: string;
  symbol: string;
  description: string;
  seller_fee_basis_points: number;
  image: string;
  external_url: string;
  edition: number;
  attributes: { trait_type: string; value: string }[];
};

export const fetchMetadata = async (
  connection: Connection,
  mintIds: PublicKey[]
): Promise<
  [MetadataJSON[], { [mintId: string]: { pubkey: PublicKey; uri: string } }]
> => {
  console.log(`> fetchMetadata (${mintIds.length})`);
  console.log(`>> metaplexData (${mintIds.length})`);
  const metaplexIds = mintIds.map((mint) => findMintMetadataId(mint));
  const metaplexAccountInfos = await getBatchedMultipleAccounts(
    connection,
    metaplexIds
  );
  const metaplexData = metaplexAccountInfos.reduce(
    (acc, accountInfo, i) => {
      try {
        if (accountInfo?.data) {
          const metaplexMintData = Metadata.deserialize(accountInfo?.data)[0];
          acc[mintIds[i]!.toString()] = {
            pubkey: metaplexIds[i]!,
            uri: metaplexMintData.data.uri,
          };
        }
      } catch (e) {
        console.log("Error desirializing metaplex data");
      }
      return acc;
    },
    {} as {
      [mintId: string]: {
        pubkey: PublicKey;
        uri: string;
      };
    }
  );

  console.log(`>> offChain metadata (${mintIds.length})`);
  const metadata = await Promise.all(
    Object.values(metaplexData).map((data) =>
      fetch(data.uri).then(async (res) => (await res.json()) as MetadataJSON)
    )
  );
  return [metadata, metaplexData];
};
