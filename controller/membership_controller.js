const asyncHandler = require('../utils/asyncHandler');
const manualmember = require('../modals/manual_member_schema');
const coupon = require('../modals/coupon_schema');
const membership = require('../modals/membership_schema');
const plans = require('../modals/plans_schema')
const sendemail = require('../utils/sendemail')

const manualcheck = asyncHandler(async (req, res, next) => {
    // console.log(req.user);
    // console.log(req.body);

    const body = req.body;
    let couponapplied = 0;
    if (body.coupon != '') {
        // console.log('yaha par aaya');
        const findcoupon = await coupon.findOne({ coupon: body.coupon });
        if (!findcoupon.isactive) {
            return next({ status: 400, message: "Coupon Expired" });
        }
    }
    const plane = await plans.findOne({ _id: body.plan_id });

    const finalpricepaid = plane.price * ((100 - couponapplied) / 100);
    // console.log("final-",finalpricepaid);

    const query = new manualmember({
        user: req.user._id, plan_id: plane._id, txn_no: body.txn_id,
        coupon: body.coupon, finalpricepaid
    });
    const result = await query.save();
    if (!result) {
        return next({ status: 400, message: "Error Occured" });
    }
    await sendemail('kumar.jaikishan0@gmail.com', 'New Membership Request');

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
    if (!query.isactive) {
        return next({ status: 400, message: "Expired" });
    }
    return res.status(200).json({
        data: query
    })
})

const auto = asyncHandler(async (req, res, next) => {
    // console.log(req.body);
})
const delmemberentry = asyncHandler(async (req, res, next) => {
    const query = await manualmember.findByIdAndDelete({ _id: req.body.ide });
    if (!query) {
        return next({ status: 400, message: "Unable to delete Entry" });
    }
    // console.log(query);
    return res.status(200).json({
        msg: 'Entry Deleted'
    })
})

const plan = asyncHandler(async (req, res, next) => {
    const query = await plans.find({ visible: true });
    if (!query) {
        return next({ status: 400, message: "Unable to delete Entry" });
    }
    // console.log(query);
    return res.status(200).json({
        plans: query
    })
})



module.exports = { manualcheck, auto, checkcoupon, delmemberentry, plan };