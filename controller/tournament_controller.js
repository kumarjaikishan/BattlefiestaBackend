const tournament = require('../modals/tournament_schema');
const Tournament = require('../modals/classic_player_schema.js');
const tdm = require('../modals/tdm_player_schema.js');
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
    let slotCategory = [{
        category: "All",
        slots: parseInt(slots)
    }]

    // 2. Find the latest tournament ID for the current financial year
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    const financialYear = `${currentYear.toString().slice(-2)}${nextYear.toString().slice(-2)}`; // "2425"

    const latestTournament = await tournament.findOne({ tournid: { $regex: `^${financialYear}` } })
        .sort({ tournid: -1 })
        .select('tournid');

    const tournid = newIdGenertor(latestTournament)

    const query = new tournament({ userid: req.userid, title: name, tournid, type, slots, organiser, slotCategory })
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

const newIdGenertor = (prev) => {
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    const financialYear = `${currentYear.toString().slice(-2)}${nextYear.toString().slice(-2)}`; // "2425"

    let newTournId;
    if (prev) {
        // const lastId = latestTournament.tournid;
        const lastId = prev.toString();
        const sequence = parseInt(lastId.slice(-4)) + 1; // Extract the last 4 digits and increment
        newTournId = `${financialYear}${sequence.toString().padStart(4, '0')}`; // Ensure it's 8 digits
    } else {
        newTournId = `${financialYear}0001`; // Start with 0001 if no tournaments exist for the year
    }
    return newTournId
}


const gettournament = asyncHandler(async (req, res, next) => {
    try {
        // Step 1: Fetch the tournaments for the user
        const tournaments = await tournament.find({ userid: req.userid }).sort({ createdAt: -1 });

        if (!tournaments) {
            return next({ status: 400, message: "Error Occurred" });
        }

        // Step 2: For each tournament, fetch the count of registered teams with "pending" or "approved" status
        const tournamentData = await Promise.all(
            tournaments.map(async (tournament) => {
                let totalTeamsRegistered;
                if (tournament.type == 'classic') {
                    totalTeamsRegistered = await Tournament.countDocuments({
                        tournament_id: tournament._id,
                        status: { $in: ["pending", "approved"] }
                    });

                } else {
                    totalTeamsRegistered = await tdm.countDocuments({
                        tournament_id: tournament._id,
                        status: { $in: ["pending", "approved"] }
                    });

                }

                // Step 3: Attach the totalTeamsRegistered count to the tournament object
                return {
                    ...tournament.toObject(), // Convert Mongoose document to plain object
                    totalTeamsRegistered
                };
            })
        );
        // Step 4: Return the final result with tournaments and registered teams count
        return res.status(201).json({ message: "success", data: tournamentData });
    } catch (error) {
        // Handle errors properly
        return next({ status: 500, message: "Server Error", error });
    }
});


const getontournament = asyncHandler(async (req, res, next) => {
    const query = await tournament.findOne({ _id: req.body.tid, userid: req.userid })
    if (!query) {
        return next({ status: 400, message: "Either Tid or UserID wrong" });
    } else {
        return res.status(201).json({ message: "success", data: query })
    }
})

const classicseen = asyncHandler(async (req, res, next) => {
    const { tid } = req.body;

    if (!tid) {
        return res.status(400).json({ message: "Tournament ID is required" });
    }

    await Resgistered.updateMany({ tournament_id: tid }, { newEntry: false });
    await tournament.findByIdAndUpdate(tid, { newEntry: false });

    res.status(200).json({
        message: "Seen status updated successfully"
    });

});

const getclassic = asyncHandler(async (req, res, next) => {
    const query1 = await tournament.findOne({ _id: req.body.tid });
    if (req.userid != query1.userid) {
        return res.status(403).json({ isowner: false })
    }
    const query2 = await registrationformsetting.findOne({ tournament_id: req.body.tid });
    const query3 = await Resgistered.find({ tournament_id: req.body.tid });

    res.status(200).json({
        tournament: query1,
        settings: query2,
        players: query3,
        isowner: true
    })
})

const getonetournament = asyncHandler(async (req, res, next) => {
    let query = await tournament.findOne({ _id: req.body.tid }).populate({
        path: 'userid',
        select: 'name username'
    }).select('title slots tournment_banner organiser status createdAt type');
    let query2;
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
const tournamnetsearch = asyncHandler(async (req, res, next) => {
    const { tournid } = req.body;
    let query = await tournament.findOne({ tournid }).select(
        'title visibility tournid slots tournment_banner tournment_logo organiser status createdAt type'
    );
    if (!query) {
        return next({ status: 400, message: "No Tournament Found" });
    }
    if (!query.visibility) {
        return next({ status: 400, message: "This Tournament is Private" });
    }

    let totalTeamsRegistered;

    if (query.type === 'classic') {
        totalTeamsRegistered = await Tournament.countDocuments({
            tournament_id: query._id,
            status: { $in: ["pending", "approved"] }
        });
    } else {
        totalTeamsRegistered = await tdm.countDocuments({
            tournament_id: query._id,
            status: { $in: ["pending", "approved"] }
        });
    }

   const result = {
        ...query.toObject(),
        totalTeamsRegistered
    };

    return res.status(201).json({query: result});
});


const getalltournament = asyncHandler(async (req, res, next) => {
    const query = await tournament.find({ visibility: true }).sort({ createdAt: -1 })
        .select('title status tournid createdAt slots type organiser label tournment_logo userid')
    if (!query) {
        return next({ status: 400, message: "Error Occured" });
    }

    const tournamentData = await Promise.all(
        query.map(async (tournament) => {
            let totalTeamsRegistered;
            if (tournament.type == 'classic') {
                totalTeamsRegistered = await Tournament.countDocuments({
                    tournament_id: tournament._id,
                    status: { $in: ["pending", "approved"] }
                });

            } else {
                totalTeamsRegistered = await tdm.countDocuments({
                    tournament_id: tournament._id,
                    status: { $in: ["pending", "approved"] }
                });

            }

            // Step 3: Attach the totalTeamsRegistered count to the tournament object
            return {
                ...tournament.toObject(), // Convert Mongoose document to plain object
                totalTeamsRegistered
            };
        })
    );

    res.status(201).json({ message: "success", data: tournamentData })
})

const settournament = asyncHandler(async (req, res, next) => {
    const { tid, title, organiser, slots, type, status, visibility, label, slotCategory } = req.body;

    const query = await tournament.findByIdAndUpdate({ _id: tid }, { title, organiser, slots, slotCategory, type, status, visibility, label })
    if (!query) {
        return next({ status: 400, message: "Error Occured" });
    } else {
        res.status(201).json({ message: "Settings Updated", data: query })
    }
})

const settournamentlogos = async (req, res, next) => {
    const oldurl = req.body.oldimage;
    const tid = req.body.tid;
    const folderName = req.body.filed === "tournbanner" ? "battlefiesta/tournbanner" : "battlefiesta/tournlogo";
    // await cloudinary.uploader.upload(req.file.path, { folder: 'battlefiesta/tournlogo' }, async (error, result) => {
    await cloudinary.uploader.upload(req.file.path, { folder: folderName }, async (error, result) => {

        if (error) {
            return next({ status: 500, message: "File not Uploaded" });
        }

        const imageurl = result.secure_url;

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
    const tid = req.body.tid;
    const isformexists = await registrationformsetting.findOne({ tournament_id: tid });
    const enteries = await Resgistered.find({ tournament_id: tid }).sort({createdAt:-1}).select('player reason status teamLogo teamName');
    const tournamente = await tournament.findOne({ _id: tid }).populate({
        path: 'userid',
        select: 'name username'
    }).select('label organiser slots title visibility');

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
    const tid = req.body.tid;
    const enteries = await Resgistered.find({ tournament_id: tid }).sort({createdAt:-1})

    res.status(201).json({
        message: "success",
        enteries
    })
})


const updatetournamentform = asyncHandler(async (req, res, next) => {
    const { _id, isopen, description, success_message, ask_email, ask_phone,
        ask_discord, ask_teamlogo, ask_playerlogo, notification,
        ask_payment_ss, show_payment, amount, upi_id, minimum_players, maximum_players } = req.body;

    const query = await registrationformsetting.findByIdAndUpdate({ _id }, {
        isopen, description, success_message, ask_email, ask_phone,
        ask_discord, ask_teamlogo, ask_playerlogo,
        ask_payment_ss, show_payment, amount, upi_id, notification, minimum_players, maximum_players
    })
    if (!query) {
        return next({ status: 400, message: "Tournament Id not Valid" });
    } else {
        res.status(201).json({
            message: "Details Updated"
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
                message: "Details Updated"
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
        res.status(200).json({
            message: "Tournament Deleted"
        })
    } catch (error) {
        console.log(error);
        return next({ status: 500, message: error });
    }
}


module.exports = { getclassic, pointsystem, classicseen, addtournament, getonetournament, tournamnetsearch, getontournament, getalltournament, torunadelete, gettournament, getenteries, settournament, settournamentlogos, tournamentform, updatetournamentform, updatetournamentformcontacts, gettournamentform };