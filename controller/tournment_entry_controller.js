const cloudinary = require('cloudinary').v2;
const Tournament = require('../modals/register_form');
const asyncHandler = require('../utils/asyncHandler');
const fs = require('fs');
const removePhotoBySecureUrl = require('../utils/cloudinaryremove');

cloudinary.config({
    cloud_name: 'dusxlxlvm',
    api_key: process.env.api_key  ,
    api_secret: process.env.api_secret
});

const register = async (req, res, next) => {
    const { tid, userid, teamName, email, mobile, discordID } = req.body;
    if (!teamName || !tid || !userid) {
        return next({ status: 400, message: "All Fields are Required" });
    }
    // console.log(req.files);
    let teamLogoFile, paymentScreenshotFile;

    if (req.files['teamLogo']) {
        teamLogoFile = req.files['teamLogo'][0];
    }

    if (req.files['paymentScreenshot']) {
        paymentScreenshotFile = req.files['paymentScreenshot'][0];
    }

    try {
        const query = new Tournament({ tournament_id: tid, userid: userid, teamName, email, mobile, discordID });
        // Save the tournament to the database
        // console.log(query);
        const savedTournament = await query.save();
        // console.log(savedTournament);
        if (savedTournament) {

            teamLogoFile && await cloudinary.uploader.upload(teamLogoFile.path, { folder: 'battlefiesta/teamlogo' }, async (error, result) => {
                
                // console.log(error, result);
                if (error) {
                    return next({ status: 500, message: "File not Uploaded" });
                }

                const imageurl = result.secure_url;
                // console.log("photo upload ho gaya", imageurl);

                teamLogoFile && fs.unlink(teamLogoFile.path, (err => {
                    if (err) {
                        console.log(err);
                        return next({ status: 500, message: "Error occured while deleting file" });
                    }
                }));

                const query = await Tournament.findByIdAndUpdate({ _id: savedTournament._id }, { teamLogo: imageurl })
            })

            paymentScreenshotFile && await cloudinary.uploader.upload(paymentScreenshotFile.path, { folder: 'battlefiesta/paymentss' }, async (error, result) => {
                
                if (error) {
                    return next({ status: 500, message: "File not Uploaded" });
                }

                const imageurl = result.secure_url;
                // console.log("photo upload ho gaya", imageurl);

                paymentScreenshotFile && fs.unlink(paymentScreenshotFile.path, (err => {
                    if (err) {
                        console.log(err);
                        return next({ status: 500, message: "Error occured while deleting file" });
                    }
                    //   getFilesInDirectory(); 
                    // }
                }));

                const query = await Tournament.findByIdAndUpdate({ _id: savedTournament._id }, { screenss: imageurl })
            })

            res.status(201).json({
                message: "Team created",
                teamid: savedTournament._id
            })
        }
    } catch (error) {
        return next({ status: 500, message: error });
    }
}


const playerregister = async (req, res, next) => {
    const { teamid, inGameName, inGameID, playerId } = req.body;
    let imageurl = "";
    try {
        req.file && await cloudinary.uploader.upload(req.file.path, { folder: 'battlefiesta/playerlogo' }, async (error, result) => {
            
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
        })

        const query = await Tournament.findByIdAndUpdate(
            { _id: teamid },
            { $push: { player: { inGameName, inGameID, playerLogo: imageurl, playerId } } },
            { new: true }
        );

        res.status(201).json({
            message: "Team Created indivisual players",
        })
    } catch (error) {
        console.log(error);
        return next({ status: 500, message: error });
    }

}

const updateteamstatus = asyncHandler(async (req, res, next) => {
    const teamId = req.body.teamID;
    const value = req.body.value;
    const reason = req.body.reasone;
    // console.log(req.body);

    const query = await Tournament.findByIdAndUpdate({ _id: teamId }, { status: value, reason })

    if (!query) {
        return next({ status: 400, message: "Team Id not valid" });
    }
    return res.status(200).json({
        message: `${value} Successfully`
    })

})

const teamdelete = async (req, res, next) => {
    const { teamid } = req.body;
    const query = await Tournament.findOne({ _id: teamid });
    let arraye = [];

    query.teamLogo && arraye.push(query.teamLogo);
    query.screenss && arraye.push(query.screenss);

    query.player.map((each, ind) => {
        each.playerLogo && arraye.push(each.playerLogo);
    })

    // console.log(arraye.length);
    try {
        arraye.length > 0 && await removePhotoBySecureUrl(arraye)
        const deletee = await Tournament.findByIdAndDelete({ _id: teamid });
        return res.status(200).json({
            message: "Team Deleted",
        })
        // console.log(check);
    } catch (error) {
        return next({ status: 500, message: error });
    }
}

const Teamupdate = async (req, res, next) => {
    const { id, teamName, email, mobile, discordID } = req.body;
    if (!teamName) {
        return next({ status: 400, message: "All Fields are Required" });
    }
    try {
        const query = await Tournament.findByIdAndUpdate({ _id: id }, { teamName, email, mobile, discordID })
        let fdf = [];
        fdf.push(query.teamLogo);

        req.file &&  await cloudinary.uploader.upload(req.file.path, { folder: 'battlefiesta/teamlogo' }, async (error, result) => {
           
            if (error) {
                return next({ status: 500, message: "File not Uploaded" });
            }

            const imageurl = result.secure_url;

            req.file && fs.unlink(req.file.path, (err => {
                if (err) {
                    console.log(err);
                    return next({ status: 500, message: "Error occured while deleting file" });
                }
            }));

            const cdsdf = await removePhotoBySecureUrl(fdf);
            console.log(cdsdf);

            await Tournament.findByIdAndUpdate({ _id: id }, { teamLogo: imageurl })
        })

        res.status(201).json({
            message: "Team Updated"
        })

    } catch (error) {
        return next({ status: 500, message: error });
    }
}

const playerupdate = async (req, res, next) => {
    const { id, index, inGameName, inGameID } = req.body;
    const vdfvdf = await Tournament.findById({ _id: id });


    let currentlogo = vdfvdf.player[index] && vdfvdf.player[index].playerLogo;
    let playerId = vdfvdf.player[index] && vdfvdf.player[index].playerId;
    let fdf = [];
    currentlogo && fdf.push(currentlogo);

    try {
        if (req.file) {
                await cloudinary.uploader.upload(req.file.path, { folder: 'battlefiesta/playerlogo' }, async (error, result) => {
                if (error) {
                    return next({ status: 500, message: "File not Uploaded" });
                }

                const imageurl = result.secure_url;

                req.file && fs.unlink(req.file.path, (err => {
                    if (err) {
                        console.log(err);
                        return next({ status: 500, message: "Error occured while deleting file" });
                    }
                }));

                fdf.length > 0 && await removePhotoBySecureUrl(fdf);

                const updatedPlayerData = {
                    inGameName: inGameName,
                    inGameID: inGameID,
                    playerLogo: imageurl,
                    playerId: playerId
                };

                await Tournament.findByIdAndUpdate({ _id: id }, { $set: { [`player.${index}`]: updatedPlayerData } }, { new: true });
                res.status(200).json({
                    message: "Updated Successfull"
                })
            })
        } else {
            const updatedPlayerData = {
                inGameName: inGameName,
                inGameID: inGameID,
                playerLogo: currentlogo,
                playerId: playerId
            };

            !req.file && await Tournament.findByIdAndUpdate({ _id: id }, { $set: { [`player.${index}`]: updatedPlayerData } }, { new: true });
            res.status(200).json({
                message: "Updated Successfull"
            })
        }
    } catch (error) {
        return next({ status: 500, message: error });
    }
}

module.exports = { register, playerregister, updateteamstatus, teamdelete, Teamupdate, playerupdate }