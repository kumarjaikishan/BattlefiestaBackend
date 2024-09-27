const asyncHandler = require('../utils/asyncHandler');
const manualmember = require('../modals/manual_member_schema');
const coupon = require('../modals/coupon_schema');
const plans = require('../modals/plans_schema')
// const {addJobToQueue}  = require('../utils/producer')
const { addtoqueue } = require('../utils/axiosRequest');
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
        couponapplied = findcoupon.percent;
    }
    const plane = await plans.findOne({ _id: body.plan_id });
    const discount = Math.ceil((plane.price * couponapplied) / 100);
    const finalpricepaid = plane.price - discount;

    const query = new manualmember({
        user: req.user._id, plan_id: plane._id, txn_no: body.txn_id,
        coupon: body.coupon, discount, finalpricepaid
    });
    const result = await query.save();
    if (!result) {
        return next({ status: 400, message: "Error Occured" });
    }
    const message = `Hey Admin, ${req.user.name} has applied for ${plane.plan_name} membership for Rs.${finalpricepaid}`
    // await addJobToQueue('kumar.jaikishan0@gmail.com','New Membership Request', message)
    await addtoqueue('kumar.jaikishan0@gmail.com', 'New Membership Request', message)

    const mes = {
        title: 'Membership Request',
        body: `Hi, ${req.user.name} has applied for ${plane.plan_name} membership for Rs.${finalpricepaid}`,
    }
    await push_notification('6610dda9415f8a39b7d77480', mes)

    return res.status(201).json({
        message: 'Request Submited'
    })
})

const checkcoupon = asyncHandler(async (req, res, next) => {
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