const asyncHandler = require('../utils/asyncHandler');
const manualmember = require('../modals/manual_member_schema');
const coupon = require('../modals/coupon_schema');

const manualcheck = asyncHandler(async (req, res, next) => {
    // console.log(req.user);
    // console.log(req.body);

    const body = req.body;
    let couponapplied =0;
    if(body.couponname != ''){
        console.log(body.couponname);
        const findcoupon = await coupon.findOne({ coupon: body.couponname });
        console.log(findcoupon);
        couponapplied = findcoupon.percent;
    }

    const finalpricepaid = body.price * ((100 - couponapplied) / 100);
    // console.log("final-",body.price);

    const query = new manualmember({
        user: req.user._id, plan_name: body.duration, txn_no: body.txn_no,
        coupon: body.couponname, city: body.city, price: body.price, finalpricepaid
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
    // console.log(req.body);
    const query = await coupon.findOne({ coupon: req.body.coupon });
    if (!query) {
        return next({ status: 400, message: "Not Found" });
    }
    if(query.status=='expired'){
        return next({ status: 400, message: "Expired" });
    }
    return res.status(200).json({
        data: query
    })
})

const auto = asyncHandler(async (req, res, next) => {
    console.log(req.body);
})



module.exports = { manualcheck, auto, checkcoupon };