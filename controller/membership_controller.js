const asyncHandler = require('../utils/asyncHandler');
const manualmember = require('../modals/manual_member_schema');
const coupon = require('../modals/coupon_schema');

const manualcheck = asyncHandler(async (req, res, next) => {
    console.log(req.user);
    console.log(req.body);

    const body = req.body;
    const finalpricepaid = body.price * ((100 - body.coupon) / 100);
    // console.log("final-",body.price);

    const query = new manualmember({
        userid: req.user._id, plan_name: body.duration, txn_no: body.txn_no,
        coupon: body.coupon, city: body.city, price: body.price, finalpricepaid
    });
    const result = await query.save();
    if (!result) {
        return next({ status: 400, message: "Error Occured" });
    }
    return res.status(201).json({
        msg: 'Request Submited'
    })
})

const checkcoupon = asyncHandler(async (req, res, next) => {
    console.log(req.body);
    const query = await coupon.findOne({ coupon: req.body.coupon });
    if (!query) {
        return next({ status: 400, message: "No coupon Found" });
    }
    return res.status(200).json({
        data: query
    })
})

const auto = asyncHandler(async (req, res, next) => {
    console.log(req.body);
})



module.exports = { manualcheck, auto, checkcoupon };