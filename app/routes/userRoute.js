let express = require("express"),
  userRouter = new express.Router(),
  userController = require("../controllers/userController.js"),
  passport = require("passport"),
  __ = require("../../helpers/globalFunctions"),
  jwt = require("jsonwebtoken"),
  multer = require("multer"),
  middleware = require("../middleware/index");
//  validation = require('../middleware/validation');

const storage = multer.diskStorage({
  destination: "./public/manager_img",
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

// WITHOUT AUTHENTICATION ROUTES

userRouter.post("/signup", userController.signup);
userRouter.post("/login", userController.login);
userRouter.get('/verifyUser/:userId', userController.verifyUser);

/**
 * AUTHENTICATION
**/

userRouter.use(
  passport.authenticate("jwt", {
    session: false,
  }),
  function (req, res, next) {
    if (req.user) next();
    else
      return res.status(401).json({
        status: 0,
        message: res,
      });
  }
);

userRouter.post("/logout", userController.logout);
userRouter.post("/changepassword", userController.changepassword);



module.exports = userRouter;
