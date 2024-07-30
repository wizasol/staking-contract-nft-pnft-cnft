import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const logSchema: mongoose.Schema = new mongoose.Schema(
  {
    level: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    hostname: {
      type: String,
      required: true,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  { timestamps: true, collection: 'log' }
);
logSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Log', logSchema);
