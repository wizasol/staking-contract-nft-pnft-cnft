import Stripe from 'stripe';
import BigPromise from '../middlewares/bigPromise';

const stripe = new Stripe(process.env.STRIPE_SECRET as string, {
  apiVersion: '2020-08-27',
});
export const sendStripeKey = BigPromise(async (req, res) => {
  res.status(200).json({
    stripekey: process.env.STRIPE_API_KEY as string,
  });
});

export const captureStripePayment = BigPromise(async (req, res) => {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: req.body.amount,
    currency: 'EUR',

    // optional
    metadata: { integration_check: 'accept_a_payment' },
  });

  res.status(200).json({
    success: true,
    amount: req.body.amount,
    client_secret: paymentIntent.client_secret,
    // you can optionally send id as well
  });
});
