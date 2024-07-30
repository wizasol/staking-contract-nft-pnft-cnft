/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable eslint-comments/no-duplicate-disable */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable consistent-return */
// @ts-nocheck
// note this is not cool to see :()

import crypto from 'crypto';
import nacl from 'tweetnacl';
import { PublicKey } from '@solana/web3.js';
import User from '../models/user';
import BigPromise from '../middlewares/bigPromise';
import { cookieToken, veryfyJwtToken } from '../utils/tokenHelper';

// eslint-disable-next-line no-unused-vars
// import mailHelper from '../utils/emailHelper';
import { WhereClauseUser } from '../utils/WhereClause';
import { CustomError } from '../utils/customError';

export const signup = BigPromise(async (req, res, next) => {
  const { name, email, password } = req.body;

  if (!email || !name || !password) {
    return next(new CustomError('Name, email and password are required', 400));
  }

  const user = await User.create({
    name,
    email,
    password,
  });

  cookieToken(user, res);
});

export const generateNonce = BigPromise(async (req, res, next) => {
  const nonce = crypto.randomUUID();
  res.status(200).json({
    success: true,
    nonce,
  });
});

export const login = BigPromise(async (req, res, next) => {
  const { wallet, signature, nonce } = req.body;
  /*   console.log('wallet', wallet);
  console.log('signature', signature); */
  if (!wallet || !signature) {
    return next(new CustomError('Wallet address missing', 400));
  }

  // verification of signature
  const pubKey = new PublicKey(wallet);
  const message = new TextEncoder().encode(nonce);
  const sigbuffer = Uint8Array.from(Buffer.from(signature));
  const verified = nacl.sign.detached.verify(
    message,
    sigbuffer,
    pubKey.toBytes()
  );

  if (!verified) {
    return next(new CustomError('Unable to verify the signature', 400));
  }

  // get user from DB
  const user = await User.findOneAndUpdate(
    { wallet },
    { wallet },
    {
      new: true,
      upsert: true,
    }
  );
  // if all goes good and we send the token
  cookieToken(user, res);
});

export const logout = BigPromise(async (_req, res) => {
  // clear the cookie, just set to Date.now()
  res.cookie('token', null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });
  // send JSON response for success
  res.status(200).json({
    succes: true,
    message: 'Logout success',
  });
});

// forgot password with db solution
/* export const forgotPassword = BigPromise(async (req, res, next) => {
  // collect email
  const { email } = req.body;

  // find user in database
  const user = await User.findOne({ email });

  // if user not found in database
  if (!user) {
    return next(new CustomError('Email not found as registered', 400));
  }

  // get token from user model methods
  const forgotToken = user.getForgotPasswordToken();

  // save user fields in DB,
  // we need to do this because we are just setting the fields and not saving
  // also note we don't want re-run the validations for fields to avoid errors.
  // set validateBeforeSave: false
  await user.save({ validateBeforeSave: false });

  // create a URL, it depends on the frontend guy how he want to manage it.
  // may ask him which url you have to put here
  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}/password/reset/${forgotToken}`;

  // craft a message, simple as this
  // eslint-disable-next-line no-unused-vars
  // const message = `Copy paste this link in your URL and hit enter \n\n ${resetUrl}`;

  // attempt to send email, it depends how you want to send it
  try {
    // like so with sendEmailSendGrid
    // await mailHelper.sendEmailSendGrid(..args)
    // or any other service that
    // nodemailer
    // await mailHelper.sendEmailNodeMailer({
    //   email: user.email,
    //   subject: 'Password reset link',
    //   message,
    // });

    // for now console log
    // console.log(message);

    // json reponse if email is success
    res.status(200).json({
      succes: true,
      message: 'Email sent successfully',
    });
  } catch (error) {
    // reset user fields if things goes wrong
    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;
    await user.save({ validateBeforeSave: false });

    // send error response
    return next(new CustomError(error.message, 500));
  }
}); */

// password reset for db solution
export const passwordReset = BigPromise(async (req, res, next) => {
  // get token from params
  const { token } = req.params; // you can also use body, change the route

  // hash the token as db also stores the hashed version
  const encryToken = crypto.createHash('sha256').update(token).digest('hex');

  // find user based on hased on token and time in future
  const user = await User.findOne({
    encryToken,
    forgotPasswordExpiry: { $gt: Date.now() },
  });

  if (!user) {
    return next(new CustomError('Token is invalid or expired', 400));
  }

  // check if password and conf password matched
  if (req.body.password !== req.body.confirmPassword) {
    return next(
      new CustomError('password and confirm password do not match', 400)
    );
  }

  // update password field in DB
  user.password = req.body.password;

  // reset token fields
  user.forgotPasswordToken = undefined;
  user.forgotPasswordExpiry = undefined;

  // save the user
  await user.save();

  // send a JSON response OR send token
  cookieToken(user, res);
});
// forgot password with Jwt solution
/* export const forgotPasswordJwt = BigPromise(async (req, res, next) => {
  // collect email
  const { email } = req.body;

  // find user in database
  const user = await User.findOne({ email });

  // if user not found in database
  if (!user) {
    return next(new CustomError('Email not found as registered', 400));
  }

  // get token from user model methods this time jwt
  const forgotToken = user.getForgotPasswordJwtToken();

  // save user fields in DB,
  // we need to do this because we are just setting the fields and not saving
  // also note we don't want re-run the validations for fields to avoid errors.
  // set validateBeforeSave: false
  await user.save({ validateBeforeSave: false });

  // create a URL, it depends on the frontend guy how he want to manage it.
  // may ask him which url you have to put here
  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}/password/reset/${forgotToken}`;

  // craft a message, simple as this
  // eslint-disable-next-line no-unused-vars
  // const message = `Copy paste this link in your URL and hit enter \n\n ${resetUrl}`;

  // attempt to send email, it depends how you want to send it
  try {
    // like so with sendEmailSendGrid
    // await mailHelper.sendEmailSendGrid(..args)
    // or any other service that
    // nodemailer
    // await mailHelper.sendEmailNodeMailer({
    //   email: user.email,
    //   subject: 'Password reset link',
    //   message,
    // });

    // for now console log
    // console.log(message);

    // json reponse if email is success
    res.status(200).json({
      succes: true,
      message: 'Email sent successfully',
    });
  } catch (error) {
    // reset user fields if things goes wrong
    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;
    await user.save({ validateBeforeSave: false });

    // send error response
    return next(new CustomError(error.message, 500));
  }
}); */

// password reset for JwtTokenb solution
export const passwordResetJwtToken = BigPromise(async (req, res, next) => {
  // get token from params
  const { token } = req.params; // you can also use body, change the route

  // hash the token as db also stores the hashed version
  const encryToken = veryfyJwtToken(token);

  if (!encryToken.isValid) {
    // please check encryToken.err for better message
    return next(new CustomError('Token is invalid or expired', 400));
  }
  // find user based on hased on token and time in future
  const user = await User.findOne({
    _id: encryToken.decoded.id,
    email: encryToken.decoded.email,
  });

  if (!user) {
    return next(new CustomError('Token is invalid or expired', 400));
  }

  // check if password and conf password matched
  if (req.body.password !== req.body.confirmPassword) {
    return next(
      new CustomError('password and confirm password do not match', 400)
    );
  }

  // update password field in DB
  user.password = req.body.password;

  // reset token fields
  user.forgotPasswordToken = undefined;
  user.forgotPasswordExpiry = undefined;

  // save the user
  await user.save();

  // send a JSON response OR send token
  cookieToken(user, res);
});
export const getLoggedInUserDetails = BigPromise(async (req, res) => {
  // req.user will be added by middleware
  // find user by id
  const user = await User.findById(req.user.id);

  // send response and user data
  res.status(200).json({
    success: true,
    user,
  });
});

export const changePassword = BigPromise(async (req, res, next) => {
  // get user from middleware
  const userId = req.user.id;

  // get user from database
  const user = await User.findById(userId).select('+password');

  // check if old password is correct
  const isCorrectOldPassword = await user.isValidatedPassword(
    req.body.oldPassword
  );

  if (!isCorrectOldPassword) {
    return next(new CustomError('old password is incorrect', 400));
  }

  // allow to set new password
  user.password = req.body.password;

  // save user and send fresh token
  await user.save();
  cookieToken(user, res);
});

export const updateUserDetails = BigPromise(async (req, res) => {
  // add a check for email and name in body

  // collect data from body
  const newData = {
    name: req.body.name,
    email: req.body.email,
  };

  // update the data in user
  const user = await User.findByIdAndUpdate(req.user.id, newData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
    user,
  });
});

export const adminAllUser = BigPromise(async (req, res) => {
  /* const totalcountUser = await User.countDocuments();

  const usersObj = new WhereClauseUser(User.find(), req.query)
    .search()
    .filter();

  let users = await usersObj.base;
  const filteredUsersNumber = users.length;

  usersObj.pager();
  // https://stackoverflow.com/a/69430142/16580493 for why .clone
  users = await usersObj.base.clone(); */

  // or jus do like this
  const usersObj = new WhereClauseUser(req.query);
  const result = await usersObj.exec();
  res.status(200).json({
    success: true,
    ...result,
  });
});

export const admingetOneUser = BigPromise(async (req, res, next) => {
  // get id from url and get user from database
  const user = await User.findById(req.params.id);

  if (!user) {
    next(new CustomError('No user found', 400));
  }
  // send user
  res.status(200).json({
    success: true,
    user,
  });
});

export const adminDeleteOneUser = BigPromise(async (req, res, next) => {
  // get user from url
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new CustomError('No Such user found', 401));
  }

  // remove user from databse
  await user.remove();

  res.status(200).json({
    success: true,
  });
});
