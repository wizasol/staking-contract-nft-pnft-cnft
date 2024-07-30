/* eslint no-await-in-loop: 0 */
/* eslint no-continue: 0 */
/* eslint @typescript-eslint/ban-ts-comment: 0 */
/* eslint no-underscore-dangle : 0 */

import { Connection } from '@metaplex/js';

// @ts-ignore
import { Metadata } from '@metaplex-foundation/mpl-token-metadata';
import dayjs from 'dayjs';
import Nft from '../models/nft';
import Activity from '../models/activity';

const connection = new Connection(process.env.SERVER_IP as string);
const bozoKey = process.env.BOZO_KEY as string;

const allowedMints = [
  'FoYStpPtgrJ37RWhvhqU3dKU3SmVfQdH7V4BwDpdcGri',
  '6CnfzYw12RdHvy2eEhMX3MJv1Egd8MMfcRvpTf7yNXoT',
  'JcKjy4PrDi7DiEStpFEBgF243FrX4UBK496NywfU1zo',
  'Q6h1GMH5iCPZWH6cnyRSJhrnD2ARpKLgBA84TfLE4ro',
  'FFQjaPFb2Z5p9jvjdXYxoCJjsSm26aNhdK1j5norvWJa',
  '91XeuNSrs9zr2HGj2KVJntpUuQmfXe9AoCeMnZApfVSi',
  'AsfcmHnDudxPDKU6nTtMoPQHeq4WCLoADXribMTxk3Nb',
  'BrXQEB8mAV8smC1yPyN5khxFBmbsqs7aybn5hpDLzdpL',
];

const getNftFromWallet = async (wallet: string, userId: string) => {
  const nftsmetadata = await Metadata.findDataByOwner(connection, wallet);
  const mints = new Map();
  for (let i = 0; i < nftsmetadata.length; i += 1) {
    const allowed =
      nftsmetadata[i].collection?.key === bozoKey ||
      allowedMints.includes(nftsmetadata[i].mint);
    if (!allowed) {
      continue;
    }
    // eslint-disable-next-line no-await-in-loop
    const nft = await Nft.findOne({ mint: nftsmetadata[i].mint });
    if (!nft) {
      // console.log(nftsmetadata[i].data.uri);
      try {
        const response = await fetch(nftsmetadata[i].data.uri);
        if (!response) {
          console.log('error fetching image');
          continue;
        }

        const image = await response.json();

        if (!image || !image.image) {
          console.log('error fetching image');
          continue;
        }

        const newNft = new Nft({
          mint: nftsmetadata[i].mint,
          image: image.image,
          owner: userId,
        });

        await newNft.save();

        mints.set(nftsmetadata[i].mint, {
          mint: nftsmetadata[i].mint,
          image: image.image,
          staked: false,
          updatedAt: newNft.updatedAt,
        });
      } catch (err) {
        console.log(err);
        continue;
      }
    } else {
      mints.set(nft.mint, {
        mint: nft.mint,
        image: nft.image,
        staked: nft.staked,
        updatedAt: nft.updatedAt,
      });
      // if exists and owner is not the same, update owner
      if (nft.owner !== userId) {
        nft.owner = userId;
        await nft.save();
      }
    }
  }

  // delete all nfts staked false that are not in mints maybe they are sold
  const allNfts = await Nft.find({ owner: userId }).sort({ updatedAt: 1 });
  for (let j = 0; j < allNfts.length; j += 1) {
    if (!mints.has(allNfts[j].mint)) {
      if (allNfts[j].staked) {
        mints.set(allNfts[j].mint, {
          mint: allNfts[j].mint,
          image: allNfts[j].image,
          staked: allNfts[j].staked,
          updatedAt: allNfts[j].updatedAt,
        });
      } else {
        // if there are not unstaked activity in the last 1 min delete it
        const nftActivity = await Activity.find({
          nft: allNfts[j]._id,
          operation: 'unstake',
          createdAt: { $gte: dayjs().subtract(1, 'minute') },
        });
        if (nftActivity.length === 0) {
          await allNfts[j].delete();
        } else {
          mints.set(allNfts[j].mint, {
            mint: allNfts[j].mint,
            image: allNfts[j].image,
            staked: allNfts[j].staked,
            updatedAt: allNfts[j].updatedAt,
          });
        }
      }
    }
  }

  return Array.from(mints.values()).sort((a, b) => {
    if (a.updatedAt < b.updatedAt) {
      return -1;
    }
    if (a.updatedAt > b.updatedAt) {
      return 1;
    }
    return 0;
  });
};

/*
24 punti al giorno per uno solo nft
1 punto all'ora
1/60 punti al minuto


5 hai il x2 sul singolo nft
10 hai il x2.5 sul singolo nft
ecc...
*/
const calculatePoints = async (userId: string) => {
  const staked = await Nft.find({ owner: userId, staked: true });
  let totalPoints = 0;

  for (let i = 0; i < staked.length; i += 1) {
    const activity = await Activity.find({
      nft: staked[i]._id,
      operation: 'stake',
    })
      .sort({ createdAt: -1 })
      .limit(1);

    if (!activity) {
      continue;
    }

    const lastStake = dayjs(activity[0].createdAt);
    let lastUpdate = dayjs(activity[0].lastUpdatePoints);
    const now = dayjs();
    // set second to 0
    // lastStake = lastStake.set('second', 0);
    lastUpdate = lastUpdate.set('second', lastStake.second());
    // now = now.set('second', 0);

    // set millisecond to 0
    // lastStake = lastStake.set('millisecond', 0);
    lastUpdate = lastUpdate.set('millisecond', lastStake.millisecond());
    // now = now.set('millisecond', 0);

    let diff;
    // use always the most recent date
    if (lastUpdate.isBefore(lastStake)) {
      // console.log('last stake');
      diff = now.diff(lastStake, 'minute'); // amount of minutes between now and last stake
      // console.log(now.toDate(), lastStake.toDate(), diff);
    } else {
      // console.log('last update');
      diff = now.diff(lastUpdate, 'minute'); // amount of minutes between now and last update
      // console.log(now.toDate(), lastUpdate.toDate(), diff);
    }
    let points = diff / 60; // amount of points to add
    // points = Math.trunc(points * 100) / 100;
    if (points !== 0) {
      await activity[0].updateOne({ lastUpdatePoints: now });
    }
    if ((i + 1) % 5 === 0) {
      const multiplier = 2 + ((i + 1) / 5 - 1) * 0.5; // 2, 2.5, 3, 3.5, 4, 4.5, 5
      // console.log('MULTIPLIER', multiplier);
      points *= multiplier;
    }
    totalPoints += points;
  }
  // troncate to 2 decimal
  // totalPoints = Math.trunc(totalPoints * 100) / 100;
  return totalPoints;
};

const sendTx = async (serialized: any) => {
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
  }
  return signatures;
};

/* const findForSignature = async (signature: string) => {
  const retry = 10;
  while (retry > 0) {
    const transaction = await connection.getParsedTransaction(
      signature,
      'finalized'
    );

    if (transaction) {
      return transaction;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}; */

export { getNftFromWallet, calculatePoints, sendTx /* findForSignature */ };
