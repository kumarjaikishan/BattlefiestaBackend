const asyncHandler = require('../utils/asyncHandler');
const manualmember = require('../modals/manual_member_schema');
const membership = require('../modals/membership_schema');
const contactus = require('../modals/contact_schema')
const sendemail = require('../utils/sendemail')

const allmembershipentry = asyncHandler(async (req, res, next) => {
    // console.log('yaha par');
    const query = await manualmember.find().populate({
        path: 'user',
        select: 'name username'
    }).populate({
        path: 'plan_id',
        select: 'plan_name price'
    });;
    // console.log(query);
    return res.status(200).json({
        data: query
    })

})
const falsee = async (req, res, next) => {
    return res.status(200).json({
        msg: 'ok'
    })
}
const createmembership = asyncHandler(async (req, res, next) => {
    // console.log(req.body);
    let body = req.body;

    if (body.flag == 'pending' || body.status == 'rejected') {
        const query = await manualmember.findByIdAndUpdate({ _id: body.id }, { status: body.flag, remarks: body.remarks })
        if (!query) {
            return next({ status: 400, message: "Error Occured" });
        }
        return res.status(200).json({
            msg: "Status Updated"
        })
    }

    if (body.flag == 'success') {
        const whichone = await manualmember.findOne({ _id: body.id }).populate({
            path: 'plan_id'
        });
        // console.log(whichone);
        let { todayDate, expiryDate } = calculateDate(whichone.plan_id.duration)


        const query = new membership({
            userid: whichone.user, planid: whichone.plan_id._id, txn_no: whichone.txn_no,
            buy_date: todayDate, expire_date: expiryDate, coupon: whichone.coupon,
            finalpricepaid: whichone.finalpricepaid
        });
        const result = await query.save();
        console.log(result);
        if (!result) {
            return next({ status: 400, message: "Error Occured" });
        }
        const memberidsave = await manualmember.findByIdAndUpdate({ _id: whichone._id }, { membershipId: query._id, status: body.flag })
        return res.status(201).json({
            msg: 'Membership Created',
            membershipid: query._id
        })
    }

})
const calculateDate = (offset) => {
    const currentDate = new Date();
    const targetDate = new Date(currentDate.getTime()); // Make a copy of currentDate

    if (offset === '1 Week') {
        targetDate.setDate(targetDate.getDate() + 7); // Add 7 days to targetDate
    } else if (offset === '1 Month') {
        targetDate.setMonth(targetDate.getMonth() + 1); // Add 1 month to targetDate
    } else if (offset === '3 Month') {
        targetDate.setMonth(targetDate.getMonth() + 3); // Add 3 months to targetDate
    } else if (offset === '6 Month') {
        targetDate.setMonth(targetDate.getMonth() + 6); // Add 6 months to targetDate
    }

    targetDate.setDate(targetDate.getDate() - 1); // Subtract one day from the targetDate

    const day = padZero(currentDate.getDate());
    const month = padZero(currentDate.getMonth() + 1);
    const year = currentDate.getFullYear();
    const todayDate = `${year}-${month}-${day}`;

    const targetDay = padZero(targetDate.getDate());
    const targetMonth = padZero(targetDate.getMonth() + 1);
    const targetYear = targetDate.getFullYear();
    const expiryDate = `${targetYear}-${targetMonth}-${targetDay}`;

    return { todayDate, expiryDate };
};

const padZero = (value) => {
    return value < 10 ? `0${value}` : value;
};
const contactformlist = asyncHandler(async (req, res, next) => {
    const query = await contactus.find().sort({ createdAt: -1 });

    return res.status(200).json({
        data: query
    })

})
const emailreply = asyncHandler(async (req, res, next) => {

    const response = await sendemail(req.body.email, req.body.reply);

    // console.log('email sent', response);
    if (!response) {
        return next({ status: 400, message: "Email not Sent" });
    }
    return res.status(200).json({
        msg: "Email Sent"
    })

})



module.exports = { emailreply, allmembershipentry, falsee, createmembership, contactformlist };