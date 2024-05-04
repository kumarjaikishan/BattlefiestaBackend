const user = require('../modals/contact_schema')
const login = require('../modals/login_schema')
const membership = require('../modals/membership_schema')
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const removePhotoBySecureUrl = require('../utils/cloudinaryremove');

cloudinary.config({
    cloud_name: 'dusxlxlvm',
    api_key: process.env.api_key,
    api_secret: process.env.api_secret
});

const contact = async (req, res, next) => {
    const { name, email, message } = req.body;

    try {
        const query = new user({ name, email, message });
        const result = await query.save();

        return res.status(201).json({
            message: "Message registered"
        })
    } catch (error) {
        return next({ status: 500, message: error });
    }
}
const profile = async (req, res, next) => {
    const query = await membership.find({ userid: req.userid }).sort({ createdAt: -1 }).populate({
        path: 'planid',
        select: 'plan_name price create_limit' // Specify the fields you want to select
    });
    let latestmembership = '';
    if (query.length > 0) {
        latestmembership = query[0];
    }
    // console.log('profile', latestmembership);
    return res.status(200).json({ data: req.user, member:latestmembership })
}

const updateprofile = async (req, res, next) => {
    const { name, username, email, phone,city,state, bio, publicemail, publicphone, sociallinks } = req.body;
    try {
        const query = await login.findByIdAndUpdate({ _id: req.userid }, { name, username, email, phone,city,state, bio, publicemail, publicphone, sociallinks })
        if (!query) {
            return next({ status: 400, message: "something wrong" });
        }
        return res.status(200).json({
            message: "Update"
        })
    } catch (error) {
        console.log(error);
        return next({ status: 500, message: error });
    }
}

const updateprofilepic = async (req, res, next) => {
    // console.log(req.user);
    let arraye = [];
    let oldimage = req.user.imgsrc;
    oldimage != "" && arraye.push(oldimage);
    // console.log("old image path",oldimage);

    try {
        req.file && await cloudinary.uploader.upload(req.file.path, { folder: 'battlefiesta/profilepic' }, async (error, result) => {
            // console.log(error, result);
            if (error) {
                return next({ status: 500, message: "File not Uploaded" });
            }

            imageurl = result.secure_url;
            // console.log("photo upload ho gaya", result);

            req.file && fs.unlink(req.file.path, (err => {
                if (err) {
                    console.log(err);
                    return next({ status: 500, message: "Error occured while deleting file" });
                }
                //   getFilesInDirectory(); 
                // }
            }));
            arraye.length > 0 && await removePhotoBySecureUrl(arraye)

            await login.findByIdAndUpdate({ _id: req.userid }, { imgsrc: imageurl })

            return res.status(200).json({
                message: "Profile Uploaded",
                url: imageurl
            })
        })
    } catch (error) {
        console.log(error);
        return next({ status: 500, message: error });
    }
}


module.exports = { contact, profile, updateprofile, updateprofilepic };