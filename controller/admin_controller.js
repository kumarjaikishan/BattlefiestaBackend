const asyncHandler = require('../utils/asyncHandler');
const manualmember = require('../modals/manual_member_schema');
const register = require('../modals/classic_player_schema.js');
const membership = require('../modals/membership_schema');
const contactus = require('../modals/contact_schema');
const tournament = require('../modals/tournament_schema');
const voucher = require('../modals/coupon_schema')
const users = require('../modals/login_schema')
const sendemail = require('../utils/sendemail')
const trialmembership = require('../utils/trial_membership')
const { MongoClient } = require('mongodb');
const push_notification = require('../utils/push_notification')
// const { addJobToQueue } = require('../utils/producer')
const { addtoqueue } = require('../utils/axiosRequest');
const { exec } = require('child_process');
const sendemaile = require('../utils/backupmail.js')
const path = require('path');

const allmembershipentry = asyncHandler(async (req, res, next) => {
    const query = await manualmember.find().populate({
        path: 'user',
        select: 'name username'
    }).populate({
        path: 'plan_id',
        select: 'plan_name price'
    }).sort({ createdAt: -1 });
    return res.status(200).json({
        data: query
    })

})




const databaseList = asyncHandler(async (req, res, next) => {
    const uri = process.env.basemongo;
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const databasesList = await client.db().admin().listDatabases();

        return res.status(200).json({
            database: databasesList.databases
        })
    } catch (error) {
        console.error(error);
    } finally {
        await client.close();
    }
})
const dbbackup = asyncHandler(async (req, res, next) => {
    let { dbname } = req.body;
    const uri = process.env.basemongo;

    const baseDir = path.join(__dirname, '..');
    const backupDir = path.join(baseDir, 'backups');
    try {
        const backupPath = path.join(backupDir, `${dbname}_backup`);
        // const command = `mongodump --uri="${uri}"`; // to backup all database into dump folder
        // const command = `mongodump --uri="${uri}" --db=${databaseName}`; // to backup specific one database into default dump folder
        // const command = `mongodump --uri="${uri}" --out="${backupPath}"`;  //for backup create custom folder name
        // const command = `mongodump --uri="${uri}" --db=${databaseName} --out="${backupPath}"`;  //for specific db backup create custom folder name
        // const command = `mongodump --uri="${uri}" --db=${databaseName} --gzip `; // for specific database, in dump folder
        const command = `mongodump --uri="${uri}" --db=${dbname} --gzip --archive="${backupPath}.gz"`; // for specific database

        exec(command, async (error, stdout, stderr) => {
            if (error) {
                console.error('Error during backup:', error.message);
                console.error('stderr:', stderr); // Log stderr to see more details
                return;
            }
            console.log(`Backup of database "${dbname}" completed successfully and saved to ${backupPath}.gz ✅`);
            await sendemaile.sendemail(dbname);
            return res.status(200).json({
                message: "Backup Created"
            })
        });
    } catch (error) {
        console.error('Error during backup:', error);
    }
})

const falsee = async (req, res, next) => {
    return res.status(200).json({
        message: 'ok'
    })
}
const createmembership = asyncHandler(async (req, res, next) => {
    let body = req.body;

    if (body.flag == 'pending' || body.flag == 'rejected') {
        const query = await manualmember.findByIdAndUpdate({ _id: body.id }, { status: body.flag, remarks: body.remarks }).populate({
            path: 'plan_id',
            select: 'duration plan_name'
        }).populate({
            path: 'user',
            select: 'name email'
        });
        if (!query) {
            return next({ status: 400, message: "Error Occured" });
        }
        const message = ` Hey ${query.user.name}, Your Membership request for plan-${query.plan_id.plan_name} of Rs.${query.finalpricepaid} txn no-${query.txn_no} has been ${body.flag}😔, Reason-${body.remarks}`
        const mes = {
            title: `Membership Request ${body.flag}`,
            body: message,
        }


        await push_notification(query.user._id, mes, `${process.env.baseUrl}`);

        // await addJobToQueue(query.user.email, "Customer Support || BattleFiesta", message)
        await addtoqueue(query.user.email, "Customer Support || BattleFiesta", message)

        res.status(200).json({
            message: "Status Updated"
        })
    }

    if (body.flag == 'success') {
        const whichone = await manualmember.findOne({ _id: body.id }).populate({
            path: 'plan_id',
            select: 'duration plan_name'
        }).populate({
            path: 'user',
            select: 'name email'
        });
        let { todayDate, expiryDate } = calculateDate(whichone.plan_id.duration)


        const query = new membership({
            userid: whichone.user, planid: whichone.plan_id._id, txn_no: whichone.txn_no,
            buy_date: todayDate, expire_date: expiryDate, coupon: whichone.coupon,
            finalpricepaid: whichone.finalpricepaid
        });

        const result = await query.save();
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
        await push_notification(whichone.user._id, mes, 'https://battlefiesta.in/profile')
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
    // const response = await sendemail(req.body.email, 'Customer Support || BattleFiesta', req.body.reply);
    // await addJobToQueue(req.body.email, 'Customer Support || BattleFiesta', req.body.reply)
    await addtoqueue(req.body.email, 'Customer Support || BattleFiesta', req.body.reply)


    // if (!response) {
    //     return next({ status: 400, message: "Email not Sent" });
    // }
    const dfdf = await contactus.findByIdAndUpdate({ _id: req.body.contactid }, { resolve: true, resolvemsg: req.body.reply })
    return res.status(200).json({
        message: "Email Sent"
    })

})
const emailsend = asyncHandler(async (req, res, next) => {
    await addtoqueue(req.body.email, 'Customer Support || BattleFiesta', req.body.reply)

    return res.status(200).json({
        message: "Email Sent"
    })

})
const contactusdelete = asyncHandler(async (req, res, next) => {
    if (req.body.id == '') {
        return next({ status: 400, message: "Id is Empty" });
    }
    const query = await contactus.findByIdAndDelete({ _id: req.body.id })
    if (!query) {
        return next({ status: 400, message: "Entry not Deleted" });
    }
    return res.status(200).json({
        message: "Entry Deleted"
    })
})

const deletevoucher = asyncHandler(async (req, res, next) => {
    if (req.body.id == '') {
        return next({ status: 400, message: "Please send Id to delete" });
    }
    const query = await voucher.findByIdAndDelete({ _id: req.body.id })

    if (!query) {
        return next({ status: 400, message: "Entry not Deleted" });
    }
    return res.status(200).json({
        message: "Deleted"
    })
})

const createvoucher = asyncHandler(async (req, res, next) => {
    let planname = req.body.name.trim().toLowerCase();
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
    if (!query) {
        return next({ status: 400, message: "Voucher not found" });
    }
    return res.status(200).json({
        data: query
    })
})
const editvoucher = asyncHandler(async (req, res, next) => {
    const query = await voucher.findByIdAndUpdate({ _id: req.body.id }, { coupon: req.body.name, percent: req.body.percent, isactive: req.body.isactive });
    if (!query) {
        return next({ status: 400, message: "Voucher not Edited" });
    }
    return res.status(200).json({
        message: 'Voucher Edited'
    })
})
const getmembership = asyncHandler(async (req, res, next) => {
    const query = await membership.find().sort({ createdAt: -1 }).populate({
        path: 'planid',
        select: 'plan_name price'
    }).populate({
        path: 'userid',
        select: 'name username'
    });
    if (!query) {
        return next({ status: 400, message: "Memberships not found" });
    }
    return res.status(200).json({
        data: query
    })
})

const getusers = asyncHandler(async (req, res, next) => {
    try {
        let usersList = await users.find().sort({ createdAt: -1 });

        // Map through the users and fetch the latest membership for each user
        const usersWithMembership = await Promise.all(usersList.map(async (user) => {
            let latestMembership = await membership.find({ userid: user._id }).sort({ createdAt: -1 }).select({ isActive: 1 });

            // Convert the Mongoose user document to a plain JS object
            let userObj = user.toObject();

            if (latestMembership.length > 0) {
                userObj.membership = latestMembership[0]; // Attach the latest membership
            }
            return userObj;
        }));


        if (!usersWithMembership || usersWithMembership.length === 0) {
            return next({ status: 400, message: "users not found" });
        }

        return res.status(200).json({
            data: usersWithMembership
        });
    } catch (error) {
        return next({ status: 500, message: "Error fetching users or memberships" });
    }
});



const editUser = asyncHandler(async (req, res, next) => {
    const { id, name, phone, isverified, isadmin } = req.body;
    const query = await users.findByIdAndUpdate({ _id: id }, { name, phone, isverified, isadmin })

    if (!query) {
        return next({ status: 400, message: "users not found" });
    }

    if (isverified) {
        const alreadymembership = await membership.findOne({ planid: '65fe7ad58a04a25de33f45b1', userid: id });
        if (!alreadymembership) {
            await trialmembership(id, '65fe7ad58a04a25de33f45b1');

            return res.status(200).json({
                message: "User Updated & Membership Created"
            })
        }
    }
    return res.status(200).json({
        message: "User Updated"
    })
})

const deleteuser = asyncHandler(async (req, res, next) => {
    const query = await users.findByIdAndDelete({ _id: req.body.userid })
    const deletemembership = await membership.deleteMany({ userid: req.body.userid })
    const tournamentdelete = await tournament.deleteMany({ userid: req.body.userid })
    const deleteregister = await register.deleteMany({ userid: req.body.userid })
    const detetememberrequest = await manualmember.deleteMany({ user: req.body.userid })

    if (query.following && query.following.length > 0) {
        await Promise.all(query.following.map(async (ch) => {
            await users.findByIdAndUpdate(ch, {
                $pull: { followers: req.body.userid }
            });
        }));
    }
    if (!query) {
        return next({ status: 400, message: "users not found" });
    }
    return res.status(200).json({
        message: "User Deleted"
    })
})



module.exports = { editUser, deleteuser, dbbackup, getvoucher, databaseList, emailsend, getusers, getmembership, editvoucher, createvoucher, deletevoucher, contactusdelete, emailreply, allmembershipentry, falsee, createmembership, contactformlist };