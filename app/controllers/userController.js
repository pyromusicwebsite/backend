const User = require("../models/users"),
  jwt = require("jsonwebtoken"),
  Joi = require("@hapi/joi"),
  lowerCase = require("lodash.lowercase"),
  bcrypt = require("bcrypt-nodejs"),
  mongoose = require("mongoose"),
  mailer =  require("../../helpers/mailFunctions");

// const { generateHash } = new User();

// Admin Authentication
class userAuth {
  
  async signup(req, res) {
    try {
      let schema = Joi.object().keys({
        mail: Joi.string().trim().label("mail").required(),
        password: Joi.string().trim().label("password").required(),
        profilePhoto: Joi.string().trim().label("profilePhoto").allow(""),
        role: Joi.string().trim().label("role").required(),
        userName: Joi.string().trim().label("userName").allow("")
      });
      
      let { value, error } = Joi.validate(req.body, schema, {
        abortEarly: true,
      });
      
      if (error){
        return res.status(500).json({
          status: 0,
          message: error.map((error) => error.message),
        });
      }
      console.log("value", JSON.stringify(value));

      let userData = await User.findOne({
        userName: value.mail,
        role: { $in: ['admin', 'artist', 'user'] },
        status: 1
      });

      if (userData) {
        return res.status(400).json({
          status: 400,
          message: "user already exists",
        });
      } else {
        console.log("value.mail", req.body.mail);

        let dataToSet = {
          email: req.body.mail,
          password: hashPassword(req.body.password),
          role: req.body.role,
          profilePhoto: req.body.profilePhoto,
          status: 0,
          userName: req.body.userName,
      }

        var userDataCheck = await User.findOne({
          "email": req.body.mail,
        }).lean();

        if(userDataCheck == null){
      
          let userData = new User(dataToSet);

          await userData.save();

          userData = {
            ...userData,
            "verifyUrl" : process.env.SERVER_BASEURL +'user/verifyUser/' + userData._id
          }

          await mailer.signUpEmail(userData, "pyro verification mail");

          return res.status(201).json({
            status: 1,
            message: "User created sucesfully",
            data: userData._doc
          });

        } else {
          return res.status(422).json({
            "status": 422,
            message: "User already exist"
          });
        }
   
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        status: 500,
        message: error,
      });
    }
  }
  

  async login(req, res) {
    try {
      let schema = Joi.object().keys({
        mail: Joi.string().trim().label("mail").required(),
        password: Joi.string().trim().label("password").allow(""),
      });

      let { value, error } = Joi.validate(req.body, schema, {
        abortEarly: true,
      });

      if (error)
        return res.status(500).json({
          status: 0,
          message: error.map((error) => error.message),
        });

      let userData = await User.findOne({
        email: value.mail
      });

      if (!userData) {
        return res.status(400).json({
          status: 400,
          message: "Invalid Email",
        });
      } else if (!userData.validPassword(value.password)) {
        return res.status(400).json({
          status: 400,
          message: "Invalid password",
        });
      } else if (userData) {
        let data = {
          email: userData.email,
          id: userData._id,
          role: userData.role,
        };

        let token = jwt.sign(data, process.env.API_KEY, { expiresIn: "2h" });

        return res.status(200).json({
          status: 1,
          message: "You are logged in Successfully !",
          token: "Bearer " + token,
        });
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        status: 500,
        message: error,
      });
    }
  }

  async logout(req, res) {
    try {
      let data = await User.findOneAndUpdate(
        {
          _id: req.user._id,
        },
        {
          new: true,
        }
      );

      if (data) {
        return res.status(200).json({
          status: 1,
          message: "You are logged out Successfully !",
        });
      }
    } catch (error) {
      return res.status(500).json({
        status: 500,
        message: error,
      });
    }
  }

  // change password
  async changepassword(req, res) {
    try {
      let admin = await User.findOne({ _id: req.user._id });

      if (admin) {
        let newpassword = hashPassword(req.body.newpassword);
        let currentpassword = admin.password;
        let compare = bcrypt.compareSync(req.body.newpassword, currentpassword);

        let validPassword = admin.validPassword(req.body.oldpassword);

        if (compare === true && validPassword === true) {
          return res.status(422).json({
            status: 422,
            message: "Your Password shouldn't be same as your old password",
          });
        } else if (validPassword === false) {
          return res.status(422).json({
            status: 422,
            message: "Old password doesn't match",
          });
        } else {
          await User.findOneAndUpdate(
            { _id: req.user._id },
            { password: newpassword }
          );
          return res.status(200).json({
            status: 200,
            message: "Password has changed successfully",
          });
        }
      } else {
        return res.status(500).json({
          status: 500,
          message: "admin is not found",
        });
      }
    } catch (error) {
      console.log(error);

      return res.status(500).json({
        status: 500,
        message: error,
      });
    }
  }

  async verifyUser(req, res) {
    try {

      let userId = req.params.userId;
      let data = await User.findOne({
        _id: mongoose.Types.ObjectId(userId),
      }).lean();

      if (data != null) {

        if (data.status === 1) {
          return res.status(422).json({
            status: 422,
            message: "Already Verified, Please signin",
          });
        } else if(data.status === 0) {
          await User.findOneAndUpdate(
            { _id: userId },
            { status: 1 }
          );
          return res.status(200).json({
            status: 200,
            message: "User Account activated successfully",
          });
        } else if (data.status == 2){
          return res.status(500).json({
            status: 500,
            message: "User account deleted",
          });
        } else {
          return res.status(500).json({
            status: 500,
            message: "Contact the Administrator",
          });
        }
      } else {
        return res.status(500).json({
          status: 500,
          message: "User not found",
        });
      }
    } catch (error) {
      console.log(error);

      return res.status(500).json({
        status: 500,
        message: error,
      });
    }
  }


}

function hashPassword(password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);

}
userAuth = new userAuth();
module.exports = userAuth;
