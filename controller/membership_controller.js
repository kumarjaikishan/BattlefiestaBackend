const asyncHandler = require('../utils/asyncHandler');
const manualmember = require('../modals/manual_member_schema');
const coupon = require('../modals/coupon_schema');
const plans = require('../modals/plans_schema')
const {addJobToQueue}  = require('../utils/producer')
const push_notification = require('../utils/push_notification')

const manualcheck = asyncHandler(async (req, res, next) => {
    const body = req.body;
    let couponapplied = 0;
    if (body.coupon != '') {
        let couponname = body.coupon.trim().toLowerCase();
        const findcoupon = await coupon.findOne({ coupon: couponname });
        if (!findcoupon.isactive) {
            return next({ status: 400, message: "Coupon Expired" });
        }
        couponapplied= findcoupon.percent;
    }
    const plane = await plans.findOne({ _id: body.plan_id });

    // const finalpricepaid = Math.floor(plane.price * ((100 - couponapplied) / 100));
    const finalpricepaid = plane.price - Math.ceil((plane.price * couponapplied) / 100);
    // console.log("final-",finalpricepaid);

    const query = new manualmember({
        user: req.user._id, plan_id: plane._id, txn_no: body.txn_id,
        coupon: body.coupon, finalpricepaid
    });
    const result = await query.save();
    if (!result) {
        return next({ status: 400, message: "Error Occured" });
    }
    const message = `Hey Admin, ${req.user.name} has applied for membership for Rs.${finalpricepaid}`
    await addJobToQueue('kumar.jaikishan0@gmail.com','New Membership Request', message)
    
    const mes = {
        title: 'Membership Request',
        body: `Hi, ${req.user.name} has applied for membership for Rs.${finalpricepaid}`,
    }
    await push_notification('65fc5697cec618fb1dcbd692', mes)
    
    return res.status(201).json({
        message: 'Request Submited'
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
        message: 'Entry Deleted'
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