import mongoose from 'mongoose';

const activitySchema: mongoose.Schema = new mongoose.Schema(
  {
    operation: {
      type: String,
      enum: ['stake', 'unstake'],
      required: true,
      trim: true,
    },
    nft: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Nft',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lastUpdatePoints: {
      type: Date,
      default: Date.now,
      // required: true,
    },
  },
  { timestamps: true, collection: 'activities' }
);

export = mongoose.model('Activity', activitySchema);
