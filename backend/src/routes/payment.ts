import express from 'express';
// import { check } from 'express-validator';

import { isLoggedIn } from '../middlewares/user';
import {
  sendStripeKey,
  captureStripePayment,
} from '../controllers/paymentController';

const router = express.Router();

router.route('/stripe/stripekey').get(isLoggedIn, sendStripeKey);
router.route('/stripe/capturestripe').post(isLoggedIn, captureStripePayment);

export = router;
