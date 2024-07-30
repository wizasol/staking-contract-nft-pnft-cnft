import mongoose from 'mongoose';

const nftSchema: mongoose.Schema = new mongoose.Schema(
  {
    mint: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    /*  owner: {
      type: String,
      required: true,
      trim: true,
    }, */
    staked: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  { timestamps: true, collection: 'nfts' }
);

export = mongoose.model('Nft', nftSchema);
