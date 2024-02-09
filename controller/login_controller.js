const user = require('../modals/login_schema')
const NodeCache = require("node-cache");
const myCache = new NodeCache();
const bcrypt = require('bcrypt');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler')

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
        const dfg = await generateToken(result);
        const fbf = result._id.toString();
        result.password = undefined;
        result.createdAt = undefined;
        result._id = undefined;
        result.phone = undefined;
        return res.status(200).json({
            msg: "Login Successful",
            token: dfg,
            userId: fbf
        });

    } else {
        return next({ status: 400, message: "Incorrect Password" });
    }
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
    if (result) {
        myCache.del("allusers");
        res.status(201).json({
            msg: "Signup Successsfully"
        })
    }
})

const verify = async (req, res) => {
    try {
        const query = await user.findByIdAndUpdate({ _id: req.query.id }, { isverified: true });

        if (!query) {
            return next({ status: 400, message: "UserId is Not Valid" });
        }
        return res.status(201).send(`<html><h2> Hi ${query.name} , Email Verified Successfully, <button onclick="location.href = 'https://esport-bgmi.vercel.app';">Login Now</button> </h2></html>`)
    } catch (error) {
        return res.status(500).json({
            msg: "User Email not  verified",
            error: error
        })
    }
}



module.exports = { signup, login,verify };