/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { RolesType } from 'src/utils/typesAndInterfaces';
import User from '../models/user';
import { CustomError } from '../utils/customError';
import BigPromise from './bigPromise';

export const isLoggedIn = BigPromise(async (req, res, next) => {
  // const token = req.cookies.token || req.header("Authorization").replace("Bearer ", "");

  // check token first in cookies
  // @ts-ignore
  let { token } = req.cookies;

  // if token not found in cookies, check if header contains Auth field
  // Header couldnt be there and the replace will fail...
  // that's why there first line is commented out
  // @ts-ignore
  if (!token && req.header('Authorization')) {
    // @ts-ignore
    token = req.header('Authorization').replace('Bearer ', '');
  }

  if (!token) {
    return next(
      new CustomError(
        'You are not logged in, login first to access the page',
        401
      )
    );
  }

  const decoded: string | JwtPayload = jwt.verify(
    token,
    process.env.JWT_SECRET as string
  );
  // @ts-ignore
  req.user = await User.findById(decoded.id);
  next();
});

// example customRole("admin","staff",5,1);
export const customRole =
  (...roles: RolesType) =>
  (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore
    if (!roles.includes(req.user.role)) {
      return next(
        new CustomError('You are not allowed to access this resource', 403)
      );
    }
    next();
  };
// same as above but the custom role will work with multiple roles
// it depends on the preference
// export const isAdmin = bigPromise(async (req, res, next) => {
//   if (req.user.role !== 5) {
//     return next(new CustomError('You are not allowed to access this resource', 403));
//   }
//   next();
// });
