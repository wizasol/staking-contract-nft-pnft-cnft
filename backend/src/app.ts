/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable @typescript-eslint/no-var-requires */
import express from 'express';
import cookieParser from 'cookie-parser';
import fileUpload from 'express-fileupload';
import cors from 'cors';
import 'dotenv/config';

// for swagger documentation
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

// import all routes here
import { rateLimit } from 'express-rate-limit';
import user from './routes/user';
import payment from './routes/payment';
import nft from './routes/nft';
import errorHandler from './middlewares/errorHanlder';

const app: express.Application = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 200, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // store: ... , // Use an external store for more precise rate limiting
});

// Apply the rate limiting middleware to all requests
/* app.use(limiter); */

const swaggerDocument = YAML.load('./swagger.yaml');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// regular middleware
app.use(express.json({ limit: '50mb' }));
app.use(
  express.urlencoded({
    extended: true,
    limit: '50mb',
  })
);
// cookies and file middleware
app.use(cookieParser());
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: '/tmp/',
  })
);
// cors middleware
const whitelist = [
  'http://localhost:3000',
  'http://localhost:3222',
  'https://bozo.avrean.net',
  'https://bozo.network',
  'https://domain.net',
];

const corsOptions: cors.CorsOptions = {
  credentials: true,
  origin: whitelist,
};
app.use(cors(corsOptions));
// router middleware
app.use('/api/v1', user);
app.use('/api/v1', payment);
app.use('/api/v1', nft);

// error handler middleware
app.use(errorHandler);
// export app js
export = app;
