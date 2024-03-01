const asyncHandler = require('../utils/asyncHandler');
const manualmember = require('../modals/manual_member_schema');

const allmembershipentry = asyncHandler(async (req, res, next) => {
    // console.log('yaha par');
    const query = await manualmember.find();

    return res.status(200).json({
        msg: "ok",
        data: query
    })

})
const falsee = async (req, res, next) => {
    return res.status(200).json({
        msg: 'ok'
    })
}



module.exports = { allmembershipentry, falsee };