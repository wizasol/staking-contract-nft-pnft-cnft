import * as anchor from "@project-serum/anchor";
import { utils } from "@project-serum/anchor";
import * as token from "@solana/spl-token";
import {
  PublicKey,
  ConfirmOptions,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { IDL, NftStakeVault } from "./idl/nft_stake_vault";
import {
  connection,
  metaplex,
  stakeDetails,
  programId,
  nftAuthority,
  stakeTokenVault,
  rewardMint,
  tokenAuthority,
  bozoPK,
} from "./constant";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { asWallet } from "@/app/dashboard/test2/Wallets";

let provider: anchor.AnchorProvider | undefined;
let program: anchor.Program<NftStakeVault> | undefined;

//return metadata and edition of the nft
const getNftInfo = async (mint: PublicKey) => {
  let metadata: string;
  let edition: string;
  const nft = await metaplex.nfts().findByMint({
    mintAddress: mint,
  });
  if (!nft) {
    throw new Error("NFT not found");
  }
  // @ts-ignore
  edition = nft.edition?.address?.toBase58();

  // @ts-ignore
  metadata = nft.metadataAddress?.toBase58();
  if (!metadata || !edition) {
    throw new Error("NFT not found");
  }

  return {
    metadata,
    edition,
  };
};

//return or a transaction to create the token account if it does not exist or the associated token address
const getOrCreateTokenAccount = async (mint: PublicKey, owner: PublicKey) => {
  const associatedToken = await token.getAssociatedTokenAddress(
    mint, // mint of the token
    owner // owner of this token account
  );
  /*   
  const accountInfo = await connection.getAccountInfo(associatedToken); */
  const accountInfo = false;
  if (!accountInfo) {
    // console.log("creating associated token account");
    const tx = new Transaction().add(
      token.createAssociatedTokenAccountInstruction(
        owner, //payer
        associatedToken,
        owner, //owner
        mint
      )
    );
    let blockhash = (await connection.getLatestBlockhash("finalized"))
      .blockhash;
    tx.recentBlockhash = blockhash;
    tx.feePayer = owner;
    return {
      associatedToken,
      tx,
    };
  }

  return {
    associatedToken,
    tx: null,
  };
};

// TODO: some variables can be stored in a map to avoid recomputing them
const buildNftDependencies = async (mint: PublicKey, owner: PublicKey) => {
  const { metadata: nftMetadata, edition: nftEdition } = await getNftInfo(mint);
  const [nftRecord] = PublicKey.findProgramAddressSync(
    [
      utils.bytes.utf8.encode("nft-record"),
      stakeDetails.toBytes(),
      mint.toBytes(),
    ],
    new PublicKey(programId)
  );

  const nftCustody = token.getAssociatedTokenAddressSync(
    mint,
    nftAuthority,
    true
  );

  const { associatedToken: nftToken, tx: nftTokenTx } =
    await getOrCreateTokenAccount(mint, owner);

  if (!nftRecord || !nftCustody || !nftToken) {
    throw new Error("Cannot build NFT dependencies");
  }

  return {
    nftMetadata,
    nftEdition,
    nftRecord,
    nftCustody,
    nftToken,
    nftTokenTx,
  };
};

const getAnchorProvider = async (wallet: WalletContextState) => {
  const opts: ConfirmOptions = {
    preflightCommitment: "confirmed",
  };

  if (!wallet.connected || !wallet) {
    wallet.connect();
  }
  if (!provider)
    provider = new anchor.AnchorProvider(connection, asWallet(wallet), opts);
  return provider;
};

const getAnchorProgram = async (wallet: WalletContextState) => {
  const provider = await getAnchorProvider(wallet);
  if (!program) program = new anchor.Program(IDL, programId, provider);
  return program;
};

const sendTxs = async (
  txs: Transaction[],
  wallet: WalletContextState,
  local?: boolean
) => {
  const feeTX = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: wallet.publicKey!,
      toPubkey: bozoPK,
      lamports: LAMPORTS_PER_SOL / 100,
    })
  );

  let blockhash = (await connection.getLatestBlockhash("finalized")).blockhash;
  feeTX.recentBlockhash = blockhash;
  feeTX.feePayer = wallet.publicKey!;

  txs.push(feeTX);

  // @ts-ignore
  const signedTxs = await wallet.signAllTransactions(txs);
  const serialized = [];
  for (let i = 0; i < signedTxs.length; i++) {
    const signedTx = signedTxs[i];
    if (!local) {
      serialized.push(signedTx.serialize());
    } else {
      const txid = await connection.sendRawTransaction(signedTx.serialize());
      serialized.push(txid);
      const blockHash = await connection.getLatestBlockhash();
      await connection.confirmTransaction(
        {
          blockhash: blockHash.blockhash,
          lastValidBlockHeight: blockHash.lastValidBlockHeight,
          signature: txid,
        },
        "confirmed"
      );
    }
  }
  return serialized;
};

const stake = async (
  mints: PublicKey[],
  wallet: WalletContextState,
  local?: boolean
) => {
  const program = await getAnchorProgram(wallet);
  const toBeSigned = [];

  for (const mint of mints) {
    const {
      nftMetadata,
      nftEdition,
      nftRecord,
      nftCustody,
      nftToken,
      nftTokenTx,
    } = await buildNftDependencies(mint, wallet.publicKey!);
    if (nftTokenTx) toBeSigned.push(nftTokenTx);

    // console.log(nftToken.toBase58());

    const stakeIx = await program.methods
      .stake()
      .accounts({
        stakeDetails,
        nftRecord,
        nftMint: mint,
        nftToken,
        nftMetadata,
        nftAuthority,
        nftEdition,
        nftCustody,
        signer: wallet.publicKey?.toBase58(),
      })
      .rpc();

    /* const tx = new Transaction().add(stakeIx);
    let blockhash = (await connection.getLatestBlockhash("finalized"))
      .blockhash;
    tx.recentBlockhash = blockhash;
    tx.feePayer = wallet.publicKey!;
    toBeSigned.push(tx); */
  }
  return sendTxs(toBeSigned, wallet, local);
};

const unstake = async (
  mints: PublicKey[],
  wallet: WalletContextState,
  local?: boolean
) => {
  const program = await getAnchorProgram(wallet);
  const toBeSigned = [];

  for (const mint of mints) {
    const { nftRecord, nftCustody, nftToken, nftTokenTx } =
      await buildNftDependencies(mint, wallet.publicKey!);

    //nft token
    if (nftTokenTx) toBeSigned.push(nftTokenTx);

    //reward token
    const { associatedToken: tokenAccount, tx: tokenTx } =
      await getOrCreateTokenAccount(rewardMint, wallet.publicKey!);
    if (tokenTx) toBeSigned.push(tokenTx);

    const unstakeIx = await program.methods
      .unstake()
      .accounts({
        stakeDetails,
        nftRecord,
        rewardMint,
        rewardReceiveAccount: tokenAccount,
        tokenAuthority,
        nftAuthority,
        nftCustody,
        nftMint: mint,
        nftReceiveAccount: nftToken,
        stakeTokenVault,
      })
      .instruction();

    const tx = new Transaction().add(unstakeIx);
    let blockhash = (await connection.getLatestBlockhash("finalized"))
      .blockhash;
    tx.recentBlockhash = blockhash;
    tx.feePayer = wallet.publicKey!;
    toBeSigned.push(tx);
  }
  return sendTxs(toBeSigned, wallet, local);
};

const getTx = async (signature: string) => {
  return await connection.getParsedTransaction(signature);
};

export { stake, unstake, getTx };
