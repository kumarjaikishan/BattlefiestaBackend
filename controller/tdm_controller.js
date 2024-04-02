const asyncHandler = require('../utils/asyncHandler');
const Tdm_form = require('../modals/tdm_form_schema')
const tournament = require('../modals/tournament_schema')
const player = require('../modals/tdm_player_schema')
const cloudinary = require('cloudinary').v2;
const removePhotoBySecureUrl = require('../utils/cloudinaryremove')
const fs = require('fs');
const push_notification = require('../utils/push_notification')

const gettdm = asyncHandler(async (req, res, next) => {
    // console.log(req.body);
    const query1 = await tournament.findOne({ _id: req.body.tid });
    const query2 = await Tdm_form.findOne({ tournament_id: req.body.tid });
    const query3 = await player.find({ tournament_id: req.body.tid });
    // console.log(query2);
    res.status(200).json({
        tournament: query1,
        settings: query2,
        players: query3
    })

})
const gettdmtournamentform = asyncHandler(async (req, res, next) => {
    //    console.log(req.body.tid);
    const tid = req.body.tid;
    const isformexists = await Tdm_form.findOne({ tournament_id: tid });
    const enteries = await player.find({ tournament_id: tid }).select('InGameId logo name os status reason');
    const tournamente = await tournament.findOne({ _id: tid }).select('label organiser slots title visibility');

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
const updatetdmtournamentformcontacts = asyncHandler(async (req, res, next) => {
    const { tournament_id, links, publicpost } = req.body;
    try {
        const query = await Tdm_form.findOneAndUpdate({ tournament_id }, { links, publicpost })
        if (!query) {
            return next({ status: 400, message: "Tournament Id not Valid" });
        } else {
            res.status(201).json({
                message: "Updated Successfully"
            })
        }
    } catch (error) {
        console.log(error);
        return next({ status: 500, message: error });
    }
})
const TdmTeamregister = async (req, res, next) => {
    // console.log(req.body);
    const { tid, userid, name, InGameId, mobile, email, os, discord, utrno, fps, device } = req.body;
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
        const query = new player({ tournament_id: tid, userid: userid, name, InGameId, mobile, email, os, discord, utrno, fps, device });
        const savedTournament = await query.save();
       
        // console.log("getting info", savedTournament);
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
            const mes = {
                title: 'New Player Registered',
                body: `Hey Creator ${name} has registerd for the tournament`,
            }
            push_notification(savedTournament.userid,mes,`${process.env.FrontUrl}/tdmsetting/${tid}`)
            return res.status(201).json({
                message: "Registered Successfully"
            })
        }
    } catch (error) {
        console.log(error);
        return next({ status: 500, message: error });
    }
}
const updateplayerstatus = asyncHandler(async (req, res, next) => {
    const teamId = req.body.teamID;
    const value = req.body.value;
    const reason = req.body.reasone;
    // console.log(req.body);

    const query = await player.findByIdAndUpdate({ _id: teamId }, { status: value, reason })

    if (!query) {
        return next({ status: 400, message: "Team Id not valid" });
    }
    return res.status(200).json({
        message: `${value} Successfully`
    })

})
const playerdelete = async (req, res, next) => {
    const { playerid } = req.body;
    const query = await player.findOne({ _id: playerid });
    // console.log(query);
    let arraye = [];

    query.logo && arraye.push(query.logo);
    query.paymentss && arraye.push(query.paymentss);

    // console.log(arraye.length);
    try {
        arraye.length > 0 && await removePhotoBySecureUrl(arraye)
        const deletee = await player.findByIdAndDelete({ _id: playerid });
        return res.status(200).json({
            message: "Team Deleted",
        })
        // console.log(check);
    } catch (error) {
        console.log(error);
        return next({ status: 500, message: error });
    }
}
const playerupdate = async (req, res, next) => {
    const { id, name, InGameId, email, mobile, discord, device, os, fps, utrno } = req.body;
    if (!name) {
        return next({ status: 400, message: "All Fields are Required" });
    }
    try {
        const query = await player.findByIdAndUpdate({ _id: id }, { name, InGameId, email, mobile, discord, device, os, fps, utrno })

        res.status(201).json({
            message: "Player Updated"
        })

    } catch (error) {
        return next({ status: 500, message: error });
    }
}
const getplayerenteries = asyncHandler(async (req, res, next) => {
    //    console.log(req.body.tid);
    const tid = req.body.tid;
    const enteries = await player.find({ tournament_id: tid })

    if (!isformexists) {
        return next({ status: 400, message: "Tournament Id not Valid" });
    } else {
        res.status(201).json({
            message: "success",
            enteries
        })
    }
})


module.exports = { gettdm, getplayerenteries, gettdmtournamentform, updateTdmTournamentForm, updatetdmtournamentformcontacts, TdmTeamregister, updateplayerstatus, playerdelete, playerupdate }