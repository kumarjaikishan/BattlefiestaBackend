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
const addJobToQueue = require('../utils/producer');

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
  //    console.log("result",result);
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
}

const test = async (req,res,next)=>{

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
  const query = new user({ name, email, phone, password });
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
    <a href="https://battlefiesta.vercel.app/resetpassword/${temptoken}" style="display: inline-block; padding: 4px 20px; background-color: #007bff; color: #fff; text-decoration: none; letter-spacing: 1px;; border-radius: 5px;">Reset Password</a>
    `
    // await sendemail(req.user.email, msg);
    await addJobToQueue(req.user.email, 'Password Reset', msg)

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
    // console.log(hash_password);
    await user.updateOne({ _id: query._id }, { password: hash_password, temptoken: '' })

    return res.status(200).json({
      message: 'Password Updated Successfully'
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
    <a href="https://battlefiesta.vercel.app/resetpassword/${temptoken}" style="display: inline-block; padding: 4px 20px; background-color: #007bff; color: #fff; text-decoration: none; letter-spacing: 1px;; border-radius: 5px;">Reset Password</a>
    `
    // await sendemail(query.email, msg);
    await addJobToQueue(query.email, 'Forget Password', msg);

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
      send(`<!DOCTYPE html>
      <html lang="en">
      
      <head>
        <meta charset="UTF-8" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Signup Successful</title>
      
        <meta name="author" content="Codeconvey" />
        <style>
          @import url('https://fonts.googleapis.com/css?family=Raleway:400,500,600,700,800,900');
      
      
      
          html {
            box-sizing: border-box;
          }
      
          *,
          *:before,
          *:after {
            box-sizing: inherit;
            padding: 0;
            margin: 0;
          }
      
          article,
          header,
          section,
          aside,
          details,
          figcaption,
          figure,
          footer,
          header,
          hgroup,
          main,
          nav,
          section,
          summary {
            display: block;
          }
      
          body {
            background: #e5e5e5 none repeat scroll 0 0;
            color: #222;
            font-size: 100%;
            line-height: 24px;
            margin: 0;
            padding: 0;
            font-family: "Raleway", sans-serif;
          }
      
          a {
            font-family: "Raleway", sans-serif;
            text-decoration: none;
            outline: none;
          }
      
          a:hover,
          a:focus {
            color: #373e18;
          }
      
          section {
            float: left;
            width: 100%;
            padding-bottom: 3em;
          }
      
          h2 {
            color: #1a0e0e;
            font-size: 26px;
            font-weight: 700;
            margin: 0;
            line-height: normal;
            text-transform: uppercase;
          }
      
          h2 span {
            display: block;
            padding: 0;
            font-size: 18px;
            opacity: 0.7;
            margin-top: 5px;
            text-transform: uppercase;
          }
      
          #float-right {
            float: right;
          }
      
      
          .ScriptHeader {
            float: left;
            width: 100%;
            padding: 1em 0;
          }
      
          .rt-heading {
            margin: 0 auto;
            text-align: center;
          }
      
          .Scriptcontent {
            line-height: 24px;
          }
      
          .ScriptHeader h1 {
            font-family: "brandon-grotesque", "Brandon Grotesque", "Source Sans Pro", "Segoe UI", Frutiger, "Frutiger Linotype", "Dejavu Sans", "Helvetica Neue", Arial, sans-serif;
            text-rendering: optimizeLegibility;
            -webkit-font-smoothing: antialiased;
            color:  #2f1c6a;
            letter-spacing: 1px;
            font-size: 26px;
            font-weight: 700;
            margin: 0;
            line-height: normal;
      
          }
      
          .ScriptHeader h2 {
            color:  #2f1c6a;
            font-size: 20px;
            font-weight: 400;
            margin: 5px 0 0;
            line-height: normal;
      
          }
      
          .ScriptHeader h1 span {
            display: block;
            padding: 0;
            font-size: 22px;
            opacity: 0.7;
            margin-top: 5px;
      
          }
      
          .ScriptHeader span {
            display: block;
            padding: 0;
            font-size: 22px;
            opacity: 0.7;
            margin-top: 5px;
          }
      
      
      
          .rt-container {
            margin: 0 auto;
            padding-left: 12px;
            padding-right: 12px;
          }
      
          .rt-row:before,
          .rt-row:after {
            display: table;
            line-height: 0;
            content: "";
          }
      
          .rt-row:after {
            clear: both;
          }
      
          [class^="col-rt-"] {
            box-sizing: border-box;
            -webkit-box-sizing: border-box;
            -moz-box-sizing: border-box;
            -o-box-sizing: border-box;
            -ms-box-sizing: border-box;
            padding: 0 15px;
            min-height: 1px;
            position: relative;
          }
      
          #card {
            position: relative;
            width: 320px;
            display: block;
            margin: 40px auto;
            text-align: center;
            font-family: 'Source Sans Pro', sans-serif;
          }
      
          #upper-side {
            padding: 2em;
            background-color: #8BC34A;
            background-color: #2f1c6a;
            display: block;
            color: #fff;
            border-top-right-radius: 8px;
            border-top-left-radius: 8px;
          }
      
          #checkmark {
            font-weight: lighter;
            fill: #fff;
            margin: -3.5em auto auto 20px;
          }
      
          #status {
            font-weight: lighter;
            text-transform: uppercase;
            letter-spacing: 2px;
            font-size: 1em;
            font-weight: 700;
            margin-top: -.2em;
            margin-bottom: 0;
          }
      
          #lower-side {
            padding: 2em 2em 5em 2em;
            background: #fff;
            display: block;
            border-bottom-right-radius: 8px;
            border-bottom-left-radius: 8px;
          }
      
          #message {
            margin-top: -.5em;
            color: #757575;
            letter-spacing: 1px;
          }
      
          #contBtn {
            position: relative;
            top: 1.5em;
            text-decoration: none;
            background: #8bc34a;
            background:  #2f1c6a;
            color: #fff;
            margin: auto;
            padding: .8em 3em;
            -webkit-box-shadow: 0px 15px 30px rgba(50, 50, 50, 0.21);
            -moz-box-shadow: 0px 15px 30px rgba(50, 50, 50, 0.21);
            box-shadow: 0px 15px 30px rgba(50, 50, 50, 0.21);
            border-radius: 25px;
            -webkit-transition: all .4s ease;
            -moz-transition: all .4s ease;
            -o-transition: all .4s ease;
            transition: all .4s ease;
          }
      
          #contBtn:hover {
            -webkit-box-shadow: 0px 15px 30px rgba(50, 50, 50, 0.41);
            -moz-box-shadow: 0px 15px 30px rgba(50, 50, 50, 0.41);
            box-shadow: 0px 15px 30px rgba(50, 50, 50, 0.41);
            -webkit-transition: all .4s ease;
            -moz-transition: all .4s ease;
            -o-transition: all .4s ease;
            transition: all .4s ease;
          }
      
      
          @media (min-width: 768px) {
            .rt-container {
              width: 750px;
            }
      
            [class^="col-rt-"] {
              float: left;
              width: 49.9999999999%;
            }
      
            .col-rt-6,
            .col-rt-12 {
              width: 100%;
            }
      
          }
      
          @media (min-width: 1200px) {
            .rt-container {
              width: 1170px;
            }
      
            .col-rt-1 {
              width: 16.6%;
            }
      
            .col-rt-2 {
              width: 30.33%;
            }
      
            .col-rt-3 {
              width: 50%;
            }
      
            .col-rt-4 {
              width: 67.664%;
            }
      
            .col-rt-5 {
              width: 83.33%;
            }
          }
      
          @media only screen and (min-width:240px) and (max-width: 768px) {
      
      
            .ScriptHeader h1,
            .ScriptHeader h2,
            .scriptnav ul {
              text-align: center;
            }
      
            .scriptnav ul {
              margin-top: 12px;
            }
      
            #float-right {
              float: none;
            }
      
          }
        </style>
      
      </head>
      
      <body>
      
        <header class="ScriptHeader">
          <div class="rt-container">
            <div class="col-rt-12">
              <div class="rt-heading">
                <h1>BattleFiesta</h1>
              </div>
            </div>
          </div>
        </header>
      
        <section>
          <div class="rt-container">
            <div class="col-rt-12">
              <div class="Scriptcontent">
                <div id='card' class="animated fadeIn">
                  <div id='upper-side'>
                    <?xml version="1.0" encoding="utf-8"?>
                    <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
                    <svg version="1.1" id="checkmark" xmlns="http://www.w3.org/2000/svg"
                      xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" xml:space="preserve">
                      <path d="M131.583,92.152l-0.026-0.041c-0.713-1.118-2.197-1.447-3.316-0.734l-31.782,20.257l-4.74-12.65
        c-0.483-1.29-1.882-1.958-3.124-1.493l-0.045,0.017c-1.242,0.465-1.857,1.888-1.374,3.178l5.763,15.382
        c0.131,0.351,0.334,0.65,0.579,0.898c0.028,0.029,0.06,0.052,0.089,0.08c0.08,0.073,0.159,0.147,0.246,0.209
        c0.071,0.051,0.147,0.091,0.222,0.133c0.058,0.033,0.115,0.069,0.175,0.097c0.081,0.037,0.165,0.063,0.249,0.091
        c0.065,0.022,0.128,0.047,0.195,0.063c0.079,0.019,0.159,0.026,0.239,0.037c0.074,0.01,0.147,0.024,0.221,0.027
        c0.097,0.004,0.194-0.006,0.292-0.014c0.055-0.005,0.109-0.003,0.163-0.012c0.323-0.048,0.641-0.16,0.933-0.346l34.305-21.865
        C131.967,94.755,132.296,93.271,131.583,92.152z" />
                      <circle fill="none" stroke="#ffffff" stroke-width="5" stroke-miterlimit="10" cx="109.486" cy="104.353"
                        r="32.53" />
                    </svg>
                    <h3 id='status'>
                      Email Successfully Verified
                    </h3>
                  </div>
                  <div id='lower-side'>
                    <p id='message'>
                      Congratulations, your account has been successfully Verified.
                    </p>
                    <a href="#" id="contBtn">Continue SignIn</a>
                  </div>
                </div>
      
              </div>
            </div>
          </div>
        </section>
      
      
      </body>
      
      </html>`)
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "User Email not  verified",
      error: error
    })
  }
}



module.exports = {test, signup, notificationToken, checkmail, login, verify, passreset, setpassword };