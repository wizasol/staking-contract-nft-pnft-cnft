import express from 'express';
// import { check } from 'express-validator';

import { login, logout, generateNonce } from '../controllers/userController';
/* import { validatedFields } from '../middlewares/fieldsValidation';
import { isLoggedIn, customRole } from '../middlewares/user'; */

const router = express.Router();

/* router
  .route('/user/signup')
  .post(
    [
      check('name').not().isEmpty().withMessage('Name must be provided'),
      check('email')
        .not()
        .isEmpty()
        .withMessage('Name must be provided')
        .isEmail()
        .withMessage('Email must be in valid format'),
      check('password')
        .not()
        .isEmpty()
        .withMessage('Password must be provided')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    ],
    validatedFields,
    signup
  ); */
router.route('/user/login').post(login);
router.route('/user/getNonce').get(generateNonce);
router.route('/user/logout').get(logout);

/*
 // jwt reset pass
router.route('/user/forgotpasswordjwt').post(forgotPasswordJwt);
router.route('/user/password/resetjwt/:token').post(passwordResetJwtToken);
// db reset pass
router.route('/user/forgotpassword').post(forgotPassword);
router.route('/user/password/reset/:token').post(passwordReset);

router.route('/user/userdashboard').get(isLoggedIn, getLoggedInUserDetails);
router.route('/user/password/update').post(isLoggedIn, changePassword);
router.route('/user/userdashboard/update').post(isLoggedIn, updateUserDetails);

// admin only routes
router
  .route('/user/admin/users')
  .get(isLoggedIn, customRole('admin'), adminAllUser);
router
  .route('/user/admin/user/:id')
  .get(isLoggedIn, customRole('admin'), admingetOneUser)
  .delete(isLoggedIn, customRole('admin'), adminDeleteOneUser); */

export = router;
