const matches = require('../modals/match_schema')
const Tournament = require('../modals/tournament_schema')
const teams = require('../modals/classic_player_schema.js');
const asyncHandler = require('../utils/asyncHandler');

const addmatches = asyncHandler(async (req, res, next) => {
    const { tid, userid, map, points } = req.body;

    const query = new matches({ tournament_id: tid, userid, map, points });
    const result = await query.save();
    
    if (!result) {
        return next({ status: 400, message: "Tournament Id not valid" });
    }

    return res.status(201).json({
        message: "Match Added",
        data: result
    })


})

const getmatches = asyncHandler(async (req, res, next) => {
    const { tid } = req.body;
    if (!tid) {
        return next({ status: 400, message: "Please Pass Tournament Id" });
    }
    const query = await matches.find({ tournament_id: tid }).sort({ "created_at": 1 });
    const teame = await teams.find({ tournament_id: tid ,status:"approved"});
    const pointsystem = await Tournament.findOne({ _id: tid }).select({
        "pointsystem": 1, "type": 1, "title":1,
        "killpoints": 1, "tiepreference": 1, "tournment_banner": 1, "tournment_logo": 1, "organiser": 1, "_id": 0
    });
    return res.status(201).json({
        matches: query,
        rules: pointsystem,
        teamdeatil: teame
    })
})

const deletematch = asyncHandler(async (req, res, next) => {
    const { matchid } = req.body;
    if (!matchid) {
        return next({ status: 400, message: "Please Pass Match Id" });
    }

    const query = await matches.findByIdAndDelete({ _id: matchid });
    if (!query) {
        return next({ status: 400, message: "Match Id not valid" });
    }
    return res.status(200).json({
        message: "Match Deleted"
    })
})

module.exports = { addmatches, getmatches, deletematch };