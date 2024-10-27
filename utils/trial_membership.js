const membership = require('../modals/membership_schema');

const trialmembership = async (userid, planid) => {
    const today = new Date();
    const istOffset = 5 * 60 + 30; // IST is UTC+5:30
    const todayIST = new Date(today.getTime() + istOffset * 60 * 1000);

    // Calculate three months later in IST
    const threeMonthsLater = new Date(todayIST);
    threeMonthsLater.setMonth(todayIST.getMonth() + 3);

    try {
        const query = new membership({
            userid, planid, txn_no: "Free Trial",
            buy_date: todayIST,
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