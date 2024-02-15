const user = require('../modals/contact_schema')
const login = require('../modals/login_schema')
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
            msg: "Message registered"
        })
    } catch (error) {
        return next({ status: 500, message: error });
    }
}
const profile = async (req, res, next) => {
    return res.status(200).json({ data: req.user })
}

const updateprofile = async (req, res, next) => {
    const { name, username, email, phone, bio, publicemail, publicphone, sociallinks } = req.body;
    try {
        const query = await login.findByIdAndUpdate({ _id: req.userid }, { name, username, email, phone, bio, publicemail, publicphone, sociallinks })
        if (!query) {
            return next({ status: 400, message: "something wrong" });
        }
        return res.status(200).json({
            msg: "Update Successfully"
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

    try {
        req.file && await cloudinary.uploader.upload(req.file.path, async (error, result) => {
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
                msg: "Upload Successfully",
                url: imageurl
            })
        })
    } catch (error) {
        console.log(error);
        return next({ status: 500, message: error });
    }
}


module.exports = { contact, profile, updateprofile, updateprofilepic };