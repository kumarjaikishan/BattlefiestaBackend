const user = require('../modals/login_schema')
const membership = require('../modals/membership_schema')
const NodeCache = require('node-cache');
const myCache = new NodeCache();
const bcrypt = require('bcrypt');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler')
const trialmembership = require('../utils/trial_membership')
// const {addJobToQueue} = require('../utils/producer');
const { addtoqueue } = require('../utils/axiosRequest');
const success = require('../templates/success')

cloudinary.config({
  cloud_name: 'dusxlxlvm',
  api_key: process.env.api_key,
  api_secret: process.env.api_secret
});


// *--------------------------------------
// * User Login 1st method with nodecache Logic
// *--------------------------------------
const login = async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next({ status: 400, message: "All Fields are Required" });
  }
  try {
    let usersdata;
    if (myCache.has("allusers")) {
      usersdata = JSON.parse(myCache.get("allusers"));
    } else {
      usersdata = await user.find({});
      myCache.set("allusers", JSON.stringify(usersdata));
    }

    const result = await usersdata.find((hel) => {
      return hel.email == req.body.email
    });
    // console.log("result", result);
    if (!result) {
      return next({ status: 400, message: "User not found" });
    }
    // console.log("password match: ", await bcrypt.compare(password, result.password));
    const generateToken = async (result) => {
      try {
        return jwt.sign({
          userId: result._id.toString(),
          email: result.email,
          isAdmin: result.isadmin
        },
          process.env.jwt_token,
          {
            expiresIn: "30d",
          }
        );
      } catch (error) {
        console.error(error);
      }
    }

    if (await bcrypt.compare(password, result.password)) {
      const newToken = await generateToken(result);
      const userIdString = result._id.toString();
      result.password = undefined;
      result.createdAt = undefined;
      result._id = undefined;
      result.phone = undefined;
      return res.status(200).json({
        message: "Login Successful",
        token: newToken,
        userId: userIdString,
        isadmin: result.isadmin
      });

    } else {
      return next({ status: 400, message: "Incorrect Password" });
    }
  } catch (error) {
    console.log(error);
  }

}

const test = async (req, res, next) => {

}
// *--------------------------------------
// * User SignUp Logic
// *--------------------------------------
const signup = asyncHandler(async (req, res, next) => {
  // console.log(req.body);
  const { name, email, phone, password } = req.body;
  if (!name || !email || !phone || !password) {
    return next({ status: 400, message: "all fields are required" });
  }
  const checkemail = await user.findOne({ email });
  if (checkemail) {
    return next({ status: 400, message: "Email Already Exists" });
  }
  const username = email.split('@')[0];
  // console.log(username);
  const query = new user({ name, email, phone, password, username });
  const result = await query.save();
  if (!result) {
    return next({ status: 400, message: "Something went wrong" });
  }
  myCache.del("allusers");
  next();
  // res.status(201).json({
  //   message: "Verify you Email"
  // })
})

const random = async (len) => {
  const rand = 'abcdefghijklmnopqrstuvwxyz123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < len; i++) {
    const randomIndex = Math.floor(Math.random() * rand.length);
    result += rand[randomIndex];
  }
  return result;
};

const passreset = async (req, res, next) => {

  try {
    const temptoken = await random(20);
    const query = await user.findByIdAndUpdate(req.user._id, { temptoken: temptoken });
    if (!query) {
      return next({ status: 400, message: "UserId is Not Valid" });
    }
    const msg = `Hi <b>${req.user.name}</b>,
    <br>
    This mail is regards to your password reset request. 
    <br><br>
    <a href="https://battlefiesta.in/resetpassword/${temptoken}" style="display: inline-block; padding: 4px 20px; background-color: #007bff; color: #fff; text-decoration: none; letter-spacing: 1px;; border-radius: 5px;">Reset Password</a>
    `
    // await sendemail(req.user.email, 'Password Reset', msg);
    // await addJobToQueue(req.user.email, 'Password Reset || BattleFiesta', msg)
    await addtoqueue(req.user.email, 'Password Reset || BattleFiesta', msg)

    return res.status(200).json({
      message: 'Email sent',
      extramessage: `Email sent successfully to ${req.user.email}, Kindly check inbox or spam to proceed further. Thankyou`
    })
  } catch (error) {
    console.log(error);
    return next({ status: 500, message: error });
  }
}

const setpassword = async (req, res, next) => {
  const token = req.query.token;
  const password = req.body.password;
  //  console.log(token,password);
  try {
    const query = await user.findOne({ temptoken: token });

    if (!query) {
      return next({ status: 400, message: 'This link has been Expired' });
    }

    const saltRound = await bcrypt.genSalt(10);
    const hash_password = await bcrypt.hash(password, saltRound);
    console.log("hash password:", hash_password);
    console.log("user id:", query._id);
    const passupdated = await user.updateOne({ _id: query._id }, { password: hash_password, temptoken: '' })

    if (!passupdated) {
      return next({ status: 400, message: 'something went wrong' });
    }
    return res.status(200).json({
      message: 'Password Updated'
    })
  } catch (error) {
    console.log(error);
    return next({ status: 500, message: error });
  }
}
const checkmail = async (req, res, next) => {
  // console.log(req.body);
  if (req.body.email == "") {
    return next({ status: 400, message: 'Please send Email' });
  }
  try {
    const query = await user.findOne({ email: req.body.email });
    if (!query) {
      return next({ status: 400, message: 'Email not Found' });
    }
    const temptoken = await random(20);
    await user.findByIdAndUpdate(query._id, { temptoken: temptoken });
    const msg = `Hi <b>${query.name}</b>,
    <br>
    This mail is regards to your Forget password request. 
    <br><br>
    <a href="https://battlefiesta.in/resetpassword/${temptoken}" style="display: inline-block; padding: 4px 20px; background-color: #007bff; color: #fff; text-decoration: none; letter-spacing: 1px;; border-radius: 5px;">Reset Password</a>
    `
    // await sendemail(query.email, 'Forget Password || Battlefiesta', msg);
    // await addJobToQueue(query.email, 'Forget Password || Battlefiesta', msg);
    await addtoqueue(query.email, 'Forget Password', msg)

    return res.status(200).json({
      message: 'Reset Link sent to Email'
    })
  } catch (error) {
    console.log(error);
    return next({ status: 500, message: error });
  }
}

const notificationToken = async (req, res, next) => {
  // console.log(req.body);
  try {
    if (!req.body.notificationtoken) {
      return next({ status: 400, message: "Notification Token is empty" });
    }
    const query = await user.findByIdAndUpdate({ _id: req.userid }, { notification_token: req.body.notificationtoken })
    if (!query) {
      return next({ status: 400, message: "Something went wrong" });
    }
    return res.status(200).json({
      message: "Token Registered"
    })
  } catch (error) {
    console.log(error.message);
    return next({ status: 500, message: error });
  }
}

const verify = async (req, res, next) => {
  if (!req.query.id) {
    return next({ status: 400, message: "Please Provide Id" });
  }
  try {
    const query = await user.findByIdAndUpdate({ _id: req.query.id }, { isverified: true });
    if (!query) {
      return next({ status: 400, message: "UserId is Not Valid" });
    }
    if (query.isverified) {
      return next({ status: 400, message: "Already verified" });
    }
    const alreadymembership = await membership.findOne({ planid: '65fe7ad58a04a25de33f45b1', userid: req.query.id });
    if (alreadymembership) {
      return next({ status: 400, message: "Trial plan already Exists" });
    }
    await trialmembership(req.query.id, '65fe7ad58a04a25de33f45b1');
    // return res.status(201).send(`<html><h2> Hi ${query.name} , Email Verified Successfully, <button onclick="location.href = 'https://esport-bgmi.vercel.app';">Login Now</button> </h2></html>`)
    return res.status(201).
      send(success)
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      message: "User Email not  verified",
      error: error
    })
  }
}



module.exports = { test, signup, notificationToken, checkmail, login, verify, passreset, setpassword };