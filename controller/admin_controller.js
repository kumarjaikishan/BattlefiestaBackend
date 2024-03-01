const asyncHandler = require('../utils/asyncHandler');
const manualmember = require('../modals/manual_member_schema');
const membership = require('../modals/membership_schema');

const allmembershipentry = asyncHandler(async (req, res, next) => {
    // console.log('yaha par');
    const query = await manualmember.find().populate({
        path: 'user',
        select: 'name username'
    });
    // console.log(query);
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
const createmembership = asyncHandler(async (req, res, next) => {
    console.log(req.body);
    let body = req.body;

    if (body.status == 'pending' || body.status == 'rejected') {
        const query = await manualmember.findByIdAndUpdate({ _id: body._id }, { status: body.status, remarks:body.remarks })
        if (!query) {
            return next({ status: 400, message: "Error Occured" });
        }
        return res.status(200).json({
            msg: "Status Updated"
        })
    }

    if (body.status == 'success') {
        const query = new membership({
            userid: body.user._id, plan_name: body.plan_name, txn_no: body.txn_no,
            buy_date: body.buydate, expire_date: body.expiredate, coupon: body.coupon, city: body.city,
            price: body.price, finalpricepaid: body.finalpricepaid
        });
        const result = await query.save();
        if (!result) {
            return next({ status: 400, message: "Error Occured" });
        }
        return res.status(201).json({
            msg: 'Membership Created'
        })
    }

})



module.exports = { allmembershipentry, falsee, createmembership };