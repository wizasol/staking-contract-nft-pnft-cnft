/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable promise/no-callback-in-promise */
/* eslint-disable max-len */
import type { Request, Response, NextFunction } from 'express';
import { CustomError } from '../utils/customError';

// method can be optimized with more effective error messages
type CustomFunction = (
  req: Request,
  res: Response,
  next: NextFunction,
  ...args: any | undefined
) => void;
// NOTE THIS IS NO LONGER NEED IN EXPRESS 5
// from docs :
// Starting with Express 5,
// route handlers and middleware that return a Promise will call next(value)
// automatically when they reject or throw an error.
export = (func: CustomFunction) =>
  (req: Request, res: Response, next: NextFunction, ...args: any) =>
    Promise.resolve(func(req, res, next, ...args)).catch((e) => {
      console.log(e);
      if (e.name === 'MongoServerError') {
        if (e.code === 11000) {
          return next(
            new CustomError(
              `Value already exist in our system, value :${JSON.stringify(
                e.keyValue
              )}`,
              422
            )
          );
        }
        return next(
          new CustomError(
            'Something went wrong with our database, we will be back soon',
            500
          )
        );
      }
      next(new CustomError('Internal server error.', 500));
    });
