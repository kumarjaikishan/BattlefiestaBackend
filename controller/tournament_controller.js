const tournament = require('../modals/tournament_schema');
const registrationformsetting = require('../modals/registration-form-setting_schema');
const Resgistered = require('../modals/classic_player_schema.js');
const user = require('../modals/login_schema')
const Tdm_form = require('../modals/tdm_form_schema')
const match = require('../modals/match_schema');
const membership = require('../modals/membership_schema')
const asyncHandler = require('../utils/asyncHandler');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const removePhotoBySecureUrl = require('../utils/cloudinaryremove');


cloudinary.config({
    cloud_name: 'dusxlxlvm',
    api_key: process.env.api_key,
    api_secret: process.env.api_secret
});

// *--------------------------------------
// * Add new Tournament
// *--------------------------------------
const addtournament = asyncHandler(async (req, res, next) => {
    const { name, type, slots, organiser } = req.body;
    if (!name || !type || !slots || !organiser) {
        return next({ status: 400, message: "All Fields are Required" });
    }

    const query = new tournament({ userid: req.userid, title: name, type, slots, organiser })
    const result = await query.save();

    if (type == 'tdm') {
        const query = new Tdm_form({ userid: req.userid, tournament_id: result._id })
        await query.save();
    } else {
        const query = new registrationformsetting({ userid: req.userid, tournament_id: result._id })
        await query.save();
    }
    await user.findByIdAndUpdate(
        { _id: req.userid },
        { $inc: { tourn_created: 1 } }, // Use $inc operator to increment the field
        { new: true } // To return the updated document
    );

    return res.status(201).json({ message: "Tournament Created" })
})


const gettournament = asyncHandler(async (req, res, next) => {
    const query = await tournament.find({ userid: req.userid }).sort({ createdAt: -1 })
    if (!query) {
        return next({ status: 400, message: "Error Occured" });
    } else {
        return res.status(201).json({ message: "success", data: query })
    }
})

const getontournament = asyncHandler(async (req, res, next) => {
    const query = await tournament.findOne({ _id: req.body.tid, userid: req.userid })
    if (!query) {
        return next({ status: 400, message: "Either Tid or UserID wrong" });
    } else {
        return res.status(201).json({ message: "success", data: query })
    }
})
const getclassic = asyncHandler(async (req, res, next) => {
    const query1 = await tournament.findOne({ _id: req.body.tid });
    const query2 = await registrationformsetting.findOne({ tournament_id: req.body.tid });
    const query3 = await Resgistered.find({ tournament_id: req.body.tid });
    // console.log(query2);
    res.status(200).json({
        tournament: query1,
        settings: query2,
        players: query3
    })
})

const getonetournament = asyncHandler(async (req, res, next) => {
    // console.log(req.body);
    let query = await tournament.findOne({ _id: req.body.tid }).select('title slots tournment_banner organiser status createdAt type');
    let query2;
    // console.log(query);
    if (query.type == 'tdm') {
        query2 = await Tdm_form.findOne({ tournament_id: req.body.tid }).select('isopen links publicpost');
    }
    if (query.type == 'classic') {
        query2 = await registrationformsetting.findOne({ tournament_id: req.body.tid }).select('isopen links publicpost');
    }
    if (!query) {
        return next({ status: 400, message: "Error Occurred: Tournament not found" });
    }
    return res.status(201).json({ data: query, data2: query2 })

})
const getalltournament = asyncHandler(async (req, res, next) => {
    const query = await tournament.find({ visibility: true }).sort({ createdAt: -1 })
    if (!query) {
        return next({ status: 400, message: "Error Occured" });
    } else {
        res.status(201).json({ message: "success", data: query })
    }
})


const settournament = asyncHandler(async (req, res, next) => {
    const { tid, title, organiser, slots, type, status, visibility, label } = req.body;

    const query = await tournament.findByIdAndUpdate({ _id: tid }, { title, organiser, slots, type, status, visibility, label })
    if (!query) {
        return next({ status: 400, message: "Error Occured" });
    } else {
        res.status(201).json({ message: "Successfully Updated", data: query })
    }
})
const settournamentlogos = async (req, res, next) => {
    // console.log(req.body);
    const oldurl = req.body.oldimage;
    const tid = req.body.tid;

    await cloudinary.uploader.upload(req.file.path, { folder: 'battlefiesta/tournlogo' }, async (error, result) => {
        // console.log(error, result);
        if (error) {
            return next({ status: 500, message: "File not Uploaded" });
        }

        const imageurl = result.secure_url;
        // console.log("photo upload ho gaya", result.public_id);

        fs.unlink(req.file.path, (err => {
            if (err) {
                console.log(err);
                return next({ status: 500, message: "Error occured while deleting file" });
            }
            //   getFilesInDirectory(); 
            // }
        }));
        if (req.body.filed == "tournbanner") {
            const query = await tournament.findByIdAndUpdate({ _id: tid }, { tournment_banner: imageurl })
        } else {
            const query = await tournament.findByIdAndUpdate({ _id: tid }, { tournment_logo: imageurl })
        }

        if (oldurl != "") {
            let arraye = [];
            arraye.push(oldurl);
            await removePhotoBySecureUrl(arraye);
        }
        res.status(201).json({
            message: "photo updated",
            url: imageurl
        })
    })
}

const tournamentform = asyncHandler(async (req, res, next) => {
    //    console.log(req.body.tid);
    const tid = req.body.tid;
    if (tid == "") {
        return next({ status: 400, message: "Tournament Id not found" });
    }

    const isformexists = await registrationformsetting.findOne({ tournament_id: tid });
    const entries = await Resgistered.find({ tournament_id: tid })
    // const entries = await Resgistered.find({ tournament_id: tid })
    if (!isformexists) {
        const query = new registrationformsetting({ userid: req.userid, tournament_id: tid })
        const result = await query.save();
        return res.status(201).json({
            message: "success",
            data: result,
            entry: entries
        })
    } else {
        return res.status(201).json({
            message: "success",
            data: isformexists,
            entry: entries
        })
    }
})


const gettournamentform = asyncHandler(async (req, res, next) => {
    //    console.log(req.body.tid);
    const tid = req.body.tid;
    const isformexists = await registrationformsetting.findOne({ tournament_id: tid });
    const enteries = await Resgistered.find({ tournament_id: tid }).select('player reason status teamLogo teamName');
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
const getenteries = asyncHandler(async (req, res, next) => {
    //    console.log(req.body.tid);
    const tid = req.body.tid;
    const enteries = await Resgistered.find({ tournament_id: tid })

    res.status(201).json({
        message: "success",
        enteries
    })
})


const updatetournamentform = asyncHandler(async (req, res, next) => {
    const { tid, id, isopen, description, success_msg, ask_email, ask_phone,
        ask_discord, ask_team_logo, ask_player_logo,
        ask_payment_ss, show_payment, amount, upi_id, min_player, max_player } = req.body;

    const query = await registrationformsetting.findByIdAndUpdate({ _id: id }, {
        isopen, description, success_message: success_msg, ask_email, ask_phone,
        ask_discord, ask_teamlogo: ask_team_logo, ask_playerlogo: ask_player_logo,
        ask_payment_ss, show_payment, amount, upi_id, minimum_players: min_player, maximum_players: max_player
    })
    if (!query) {
        return next({ status: 400, message: "Tournament Id not Valid" });
    } else {
        res.status(201).json({
            message: "Updated Successfully"
        })
    }
})

const updatetournamentformcontacts = asyncHandler(async (req, res, next) => {
    const { tid, links, publicpost } = req.body;
    try {
        const query = await registrationformsetting.findOneAndUpdate({ tournament_id: tid }, { links, publicpost })
        if (!query) {
            return next({ status: 400, message: "Tournament Id not Valid" });
        } else {
            res.status(201).json({
                message: "Updated Successfully"
            })
        }
    } catch (error) {
        return next({ status: 500, message: error });
    }
})

const pointsystem = asyncHandler(async (req, res, next) => {
    const { tid, tieprefer, killpoints, placepoint } = req.body;

    const query = await tournament.findByIdAndUpdate({ _id: tid }, { tiepreference: tieprefer, killpoints, pointsystem: placepoint })

    if (query) {
        return res.status(200).json({
            message: "Updated Success"
        })
    } else {
        return next({ status: 500, message: "Tournament Id not Valid" });
    }
})

const torunadelete = async (req, res, next) => {
    const { tournaid } = req.body;
    try {
        let arraye = [];
        const logos = await tournament.findOne({ _id: tournaid }, { 'tournment_banner': 1, 'tournment_logo': 1 });
        // console.log(logos);
        if (logos) {
            if (logos.tournment_banner) {
                arraye.push(logos.tournment_banner);
            }
            if (logos.tournment_logo) {
                arraye.push(logos.tournment_logo);
            }
        }


        const entry = await Resgistered.find({ tournament_id: tournaid }, { 'teamLogo': 1, 'screenss': 1, 'player': 1 })
        if (entry) {
            entry && entry.map((val) => {
                if (val.teamLogo) {
                    arraye.push(val.teamLogo);
                }
                if (val.screenss) {
                    arraye.push(val.screenss);
                }
                val.player && val.player.map((each) => {
                    if (each.playerLogo) {
                        arraye.push(each.playerLogo);
                    }
                })
            })
        }


        await tournament.deleteOne({ _id: tournaid })
        await registrationformsetting.deleteOne({ tournament_id: tournaid })
        await match.deleteMany({ tournament_id: tournaid })
        await Resgistered.deleteMany({ tournament_id: tournaid })

        arraye.length > 0 && await removePhotoBySecureUrl(arraye)
        // console.log(arraye);
        res.status(200).json({
            message: "Tournament Deleted"
        })
    } catch (error) {
        console.log(error);
        return next({ status: 500, message: error });
    }
}


module.exports = {getclassic, pointsystem, addtournament, getonetournament, getontournament, getalltournament, torunadelete, gettournament, getenteries, settournament, settournamentlogos, tournamentform, updatetournamentform, updatetournamentformcontacts, gettournamentform };