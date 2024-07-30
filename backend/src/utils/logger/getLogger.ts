import { createLogger, format, transports } from 'winston';

import { MongoDB } from 'winston-mongodb';

const { combine, timestamp } = format;
// modify this method to get more complex logger
const getLogger = () =>
  createLogger({
    level: 'debug',
    format: combine(
      timestamp({ format: 'DD/MM/YYYY HH:mm:ss' }),
      format.json()
    ),
    transports: [
      new MongoDB({
        db: process.env.DATABASE_URL as string,
        storeHost: true,
        options: { useUnifiedTopology: true },
        expireAfterSeconds: 10520000, // 4 months in seconds,
        metaKey: 'meta',
        capped: true,
      }),
      new transports.Console({
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      }),
    ],
  });

export = getLogger;
