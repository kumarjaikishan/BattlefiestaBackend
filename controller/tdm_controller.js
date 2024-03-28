const asyncHandler = require('../utils/asyncHandler');
const Tdm_form = require('../modals/tdm_form_schema')
const tournament = require('../modals/tournament_schema')
const Registered = require('../modals/register_form')
const player = require('../modals/tdm_player_schema')
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

const gettdm = asyncHandler(async (req, res, next) => {
    // console.log(req.body);
    const query1 = await tournament.findOne({ _id: req.body.tid });
    const query2 = await Tdm_form.findOne({ tournament_id: req.body.tid });
    // console.log(query2);
    res.status(200).json({
        tournament: query1,
        settings: query2
    })

})
const gettdmtournamentform = asyncHandler(async (req, res, next) => {
    //    console.log(req.body.tid);
    const tid = req.body.tid;
    const isformexists = await Tdm_form.findOne({ tournament_id: tid });
    const enteries = await Registered.find({ tournament_id: tid })
    const tournamente = await tournament.findOne({ _id: tid });

    if (!isformexists) {
        return next({ status: 400, message: "Tournament Id not Valid" });
    } else {
        res.status(201).json({
            message: "success",
            data: isformexists,
            data2: tournamente,
            enteries
        })
    }
})
const updateTdmTournamentForm = asyncHandler(async (req, res, next) => {
    //    console.log(req.body);

    const query = await Tdm_form.findByIdAndUpdate({ _id: req.body._id }, req.body)
    if (!query) {
        return next({ status: 400, message: "Tournament Id not Valid" });
    } else {
        res.status(201).json({
            message: "Updated Successfully"
        })
    }
})
const TdmTeamregister = async (req, res, next) => {
    // console.log(req.body);

    const { tid, userid, name, InGameId, mobile, email, os, discord, utrno,fps, device } = req.body;
    if (!name || !tid || !userid) {
        return next({ status: 400, message: "All Fields are Required" });
    }
    // console.log(req.files);
    let logo, paymentss;

    if (req.files['logo']) {
        logo = req.files['logo'][0];
    }

    if (req.files['paymentss']) {
        paymentss = req.files['paymentss'][0];
    }

    try {
        const query = new player({ tournament_id: tid, userid: userid, name, InGameId, mobile, email, os, discord, utrno,fps, device });
        const savedTournament = await query.save();
        // console.log(savedTournament);
        if (savedTournament) {

            logo && await cloudinary.uploader.upload(logo.path, { folder: 'battlefiesta/tdm' }, async (error, result) => {

                // console.log(error, result);
                if (error) {
                    return next({ status: 500, message: "File not Uploaded" });
                }

                const imageurl = result.secure_url;

                 fs.unlink(logo.path, (err => {
                    if (err) {
                        console.log(err);
                        return next({ status: 500, message: "Error occured while deleting file" });
                    }
                }));

                const query = await player.findByIdAndUpdate({ _id: savedTournament._id }, { logo: imageurl })
            })

            paymentss && await cloudinary.uploader.upload(paymentss.path, { folder: 'battlefiesta/paymentss' }, async (error, result) => {

                if (error) {
                    return next({ status: 500, message: "File not Uploaded" });
                }

                const imageurl = result.secure_url;

                paymentss && fs.unlink(paymentss.path, (err => {
                    if (err) {
                        console.log(err);
                        return next({ status: 500, message: "Error occured while deleting file" });
                    }
                }));

                const query = await player.findByIdAndUpdate({ _id: savedTournament._id }, { paymentss: imageurl })
            })

            res.status(201).json({
                message: "Registered Successfully"
            })
        }
    } catch (error) {
        console.log(error);
        return next({ status: 500, message: error });
    }
}

module.exports = { gettdm, gettdmtournamentform, updateTdmTournamentForm, TdmTeamregister }