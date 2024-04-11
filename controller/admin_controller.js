const asyncHandler = require('../utils/asyncHandler');
const manualmember = require('../modals/manual_member_schema');
const register = require('../modals/classic_player_schema.js');
const membership = require('../modals/membership_schema');
const contactus = require('../modals/contact_schema');
const tournament = require('../modals/tournament_schema');
const voucher = require('../modals/coupon_schema')
const users = require('../modals/login_schema')
const sendemail = require('../utils/sendemail')
const push_notification = require('../utils/push_notification')
// const { addJobToQueue } = require('../utils/producer')
const {addtoqueue} = require('../utils/axiosRequest');

const allmembershipentry = asyncHandler(async (req, res, next) => {
    // console.log('yaha par');
    const query = await manualmember.find().populate({
        path: 'user',
        select: 'name username'
    }).populate({
        path: 'plan_id',
        select: 'plan_name price'
    }).sort({ createdAt: -1 });
    // console.log(query);
    return res.status(200).json({
        data: query
    })

})
const falsee = async (req, res, next) => {
    return res.status(200).json({
        message: 'ok'
    })
}
const createmembership = asyncHandler(async (req, res, next) => {
    // console.log(req.body);
    let body = req.body;

    if (body.flag == 'pending' || body.flag == 'rejected') {
        const query = await manualmember.findByIdAndUpdate({ _id: body.id }, { status: body.flag, remarks: body.remarks }).populate({
            path: 'plan_id',
            select: 'duration plan_name'
        }).populate({
            path: 'user',
            select: 'name email'
        });
        //    console.log(query);
        if (!query) {
            return next({ status: 400, message: "Error Occured" });
        }
        const message = ` Hey ${query.user.name}, Your Membership request for plan-${query.plan_id.plan_name} of Rs.${query.finalpricepaid} txn no-${query.txn_no} has been ${body.flag}😔, Reason-${body.remarks}`
        const mes = {
            title: `Membership Request ${body.flag}`,
            body: message,
        }
        await push_notification(query.user._id, mes)
        // await addJobToQueue(query.user.email, "Customer Support || BattleFiesta", message)
        await addtoqueue(query.user.email, "Customer Support || BattleFiesta", message)
       
        return res.status(200).json({
            message: "Status Updated"
        })
    }

    if (body.flag == 'success') {
// console.log("success me aaya");
        const whichone = await manualmember.findOne({ _id: body.id }).populate({
            path: 'plan_id',
            select: 'duration plan_name'
        }).populate({
            path: 'user',
            select: 'name email'
        });
        // console.log(whichone);
        let { todayDate, expiryDate } = calculateDate(whichone.plan_id.duration)


        const query = new membership({
            userid: whichone.user, planid: whichone.plan_id._id, txn_no: whichone.txn_no,
            buy_date: todayDate, expire_date: expiryDate, coupon: whichone.coupon,
            finalpricepaid: whichone.finalpricepaid
        });

        const result = await query.save();
        // console.log(result);
        if (!result) {
            return next({ status: 400, message: "Error Occured" });
        }
        await manualmember.findByIdAndUpdate({ _id: whichone._id }, { membershipId: query._id, status: body.flag })
        await users.findByIdAndUpdate({ _id: whichone._id }, { $set: { tourn_created: 0 } })

        const message = ` Hey ${whichone.user.name}, Your Membership request for ${whichone.plan_id.plan_name} of Rs.${whichone.finalpricepaid} has been Approved having Txn Id- ${whichone.txn_no}.Thanks for Choosing BattleFiesta.👍`
        const mes = {
            title: 'Membership Request Approved',
            body: message,
        }
        await push_notification(whichone.user._id,mes,'https://battlefiesta.vercel.app/profile')
        // await addJobToQueue(whichone.user.email, "Customer Support || BattleFiesta", message)
        await addtoqueue(whichone.user.email, "Customer Support || BattleFiesta", message)
        return res.status(201).json({
            message: 'Membership Created',
            membershipid: query._id
        })
    }
})
const calculateDate = (membershipType) => {
    let startDate = new Date(); // Current date
    let endDate = new Date(); // Initialize end date as current date

    switch (membershipType) {
        case "1 Week":
            endDate.setDate(startDate.getDate() + 7); // Add 7 days
            break;
        case "1 Month":
            endDate.setMonth(startDate.getMonth() + 1); // Add 1 month
            break;
        case "3 Month":
            endDate.setMonth(startDate.getMonth() + 3); // Add 3 months
            break;
        case "6 Month":
            endDate.setMonth(startDate.getMonth() + 6); // Add 6 months
            break;
        default:
            throw new Error("Invalid membership type.");
    }
    // console.log(startDate, endDate);
    return {
        todayDate: startDate,
        expiryDate: endDate
    };
};

const contactformlist = asyncHandler(async (req, res, next) => {
    const query = await contactus.find().sort({ createdAt: -1 });

    return res.status(200).json({
        data: query
    })

})
const emailreply = asyncHandler(async (req, res, next) => {
   console.log(req.body);
    // const response = await sendemail(req.body.email, 'Customer Support || BattleFiesta', req.body.reply);
    // await addJobToQueue(req.body.email, 'Customer Support || BattleFiesta', req.body.reply)
    await addtoqueue(req.body.email, 'Customer Support || BattleFiesta', req.body.reply)

    // console.log('email sent check:', response);
    // if (!response) {
    //     return next({ status: 400, message: "Email not Sent" });
    // }
    const dfdf = await contactus.findByIdAndUpdate({ _id: req.body.contactid }, { resolve: true, resolvemsg: req.body.reply })
    return res.status(200).json({
        message: "Email Sent"
    })

})
const contactusdelete = asyncHandler(async (req, res, next) => {
    if (req.body.id == '') {
        return next({ status: 400, message: "Please send Id to delete" });
    }
    const query = await contactus.findByIdAndDelete({ _id: req.body.id })
    if (!query) {
        return next({ status: 400, message: "Entry not Deleted" });
    }
    return res.status(200).json({
        message: "Deleted Successfully"
    })
})

const deletevoucher = asyncHandler(async (req, res, next) => {
    if (req.body.id == '') {
        return next({ status: 400, message: "Please send Id to delete" });
    }
    // console.log(req.body.id);
    const query = await voucher.findByIdAndDelete({ _id: req.body.id })

    if (!query) {
        return next({ status: 400, message: "Entry not Deleted" });
    }
    return res.status(200).json({
        message: "Deleted Successfully"
    })
})

const createvoucher = asyncHandler(async (req, res, next) => {
    let planname = req.body.name.trim().toLowerCase();
    // console.log(req.body);
    const query = new voucher({
        coupon: planname, percent: req.body.percent, isactive: true
    })
    const hai = await query.save();
    if (!hai) {
        return next({ status: 400, message: "Voucher not added" });
    }
    return res.status(200).json({
        message: "Voucher Created"
    })

})
const getvoucher = asyncHandler(async (req, res, next) => {
    const query = await voucher.find();
    // console.log(query);
    if (!query) {
        return next({ status: 400, message: "Voucher not found" });
    }
    return res.status(200).json({
        data: query
    })
})
const editvoucher = asyncHandler(async (req, res, next) => {
    // console.log(req.body);
    const query = await voucher.findByIdAndUpdate({ _id: req.body.id }, { coupon: req.body.name, percent: req.body.percent, isactive: req.body.isactive });
    // console.log(query);
    if (!query) {
        return next({ status: 400, message: "Voucher not Edited" });
    }
    return res.status(200).json({
        message: 'Voucher Edited Successfully'
    })
})
const getmembership = asyncHandler(async (req, res, next) => {
    // console.log(req.body);
    const query = await membership.find().populate({
        path: 'planid',
        select: 'plan_name price'
    }).populate({
        path: 'userid',
        select: 'name username'
    });
    // console.log(query);
    if (!query) {
        return next({ status: 400, message: "Memberships not found" });
    }
    return res.status(200).json({
        data: query
    })
})
const getusers = asyncHandler(async (req, res, next) => {
    // console.log(req.body);
    const query = await users.find().sort({ createdAt: -1 })
    // console.log(query);
    if (!query) {
        return next({ status: 400, message: "users not found" });
    }
    return res.status(200).json({
        data: query
    })
})
const deleteuser = asyncHandler(async (req, res, next) => {
    // console.log(req.body);
    const query = await users.findByIdAndDelete({_id:req.body.userid})
    const deletemembership =await membership.deleteMany({userid:req.body.userid})
    const tournamentdelete = await tournament.deleteMany({userid:req.body.userid})
    const deleteregister = await register.deleteMany({userid:req.body.userid})
    const detetememberrequest = await manualmember.deleteMany({user:req.body.userid})
    if (!query) {
        return next({ status: 400, message: "users not found" });
    }
    return res.status(200).json({
        message: "User Deleted"
    })
})



module.exports = { deleteuser,getvoucher, getusers, getmembership, editvoucher, createvoucher, deletevoucher, contactusdelete, emailreply, allmembershipentry, falsee, createmembership, contactformlist };