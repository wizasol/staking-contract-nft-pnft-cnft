/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable no-param-reassign */
import { Response } from 'express';

import jwt from 'jsonwebtoken';

const cookieToken = (user: any, res: Response) => {
  const token = user.getJwtToken();

  const options = {
    expires: new Date(
      Date.now() +
        parseInt(process.env.COOKIE_TIME as string, 10) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  user.password = undefined;
  res.status(200).cookie('token', token, options).json({
    success: true,
    token,
    user,
  });
};

const veryfyJwtToken = (token: string) => {
  try {
    return {
      isValid: true,
      // this can be syng as there are no performance diff in async and sync
      // https://github.com/auth0/node-jsonwebtoken/issues/566
      decoded: jwt.verify(token, process.env.JWT_SECRET as string),
    };
  } catch (err) {
    return {
      isValid: false,
      err,
    };
  }
};

export { cookieToken, veryfyJwtToken };
