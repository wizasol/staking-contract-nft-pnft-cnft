import { validationResult } from 'express-validator';
import BigPromise from './bigPromise';

export const validatedFields = BigPromise(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      status: 'fail',
      message: errors.array()[0].msg,
      error: errors.array()[0].msg,
    });
  }
  next();
});
