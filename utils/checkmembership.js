const membership = require('../modals/membership_schema')

const checkmembership = async (req, res, next) => {
    try {
        const whichmembershipactive = await membership.find({ userid: req.userid }).sort({ createdAt: -1 }).populate({
            path: 'planid',
            select: 'create_limit plan_name'
        }).populate({
            path: 'userid',
            select: 'tourn_created'
        });
        let latestmembership = whichmembershipactive[0];
        console.log(latestmembership);
        let today_date = new Date();
        let expire_date = new Date(latestmembership.expire_date);
        console.log(today_date);
        if (expire_date < today_date) {
            return next({ status: 429, message: "Membership Expired" });
        }
        if (latestmembership.planid.create_limit <= latestmembership.userid.tourn_created) {
            return next({ status: 429, message: "Credit Exhaust" });
        }
        next();
    } catch (error) {
        throw error;
    }
};

module.exports = checkmembership;
