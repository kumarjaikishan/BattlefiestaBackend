const membership = require('../modals/membership_schema');

const trialmembership = async (userid, planid) => {
    const today = new Date();
    const threeMonthsLater = new Date(today);
    threeMonthsLater.setMonth(today.getMonth() + 3);

    // console.log("today",today)
    // console.log("3 months later",threeMonthsLater)

    try {
        const query = new membership({
            userid, planid, txn_no: "Free Trial",
            buy_date: today, expire_date: threeMonthsLater, coupon: "",
            finalpricepaid: 0
        });
        const result = await query.save();
        if (result) {
            console.log('Free Trial created Successfully');
            return true;
        }
    } catch (error) {
        console.log('create trial membership', error);
        return false;
    }
}
module.exports = trialmembership;