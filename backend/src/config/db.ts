/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable no-console */

import mongoose from 'mongoose';

const connectWithDb = () => {
  mongoose
    .connect(process.env.DATABASE_URL as string)
    .then(() => console.log('DB GOT CONNECTED'))
    .catch((error: Error) => {
      console.log('DB CONNECTION ISSUES');
      console.log(error);
      process.exit(1);
    });
};

export = connectWithDb;
