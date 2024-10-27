const membership = require('../modals/membership_schema');

const trialmembership = async (userid, planid) => {
    const today = new Date();
    const currentTime = new Date(today.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));

    const threeMonthsLater = new Date(currentTime);
    threeMonthsLater.setMonth(currentTime.getMonth() + 3);

    try {
        const query = new membership({
            userid, planid, txn_no: "Free Trial",
            buy_date: currentTime,
            expire_date: threeMonthsLater,
            coupon: "",
            finalpricepaid: 0
        });
        const result = await query.save();
        if (result) {
            // console.log('Free Trial created Successfully');
            return true;
        }
    } catch (error) {
        console.log('create trial membership', error);
        return false;
    }
}
module.exports = trialmembership;