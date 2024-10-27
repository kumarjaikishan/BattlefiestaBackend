const membership = require('../modals/membership_schema');

const trialmembership = async (userid, planid) => {
    const today = new Date();
    const threeMonthsLater = new Date(today);
    
    // Convert to IST
    const ISTOffset = 330; // IST is UTC+5:30
    const offset = ISTOffset * 60 * 1000; // Convert offset to milliseconds
    
    const todayIST = new Date(today.getTime() + offset);
    const threeMonthsLaterIST = new Date(threeMonthsLater.getTime() + offset);
    
    threeMonthsLaterIST.setMonth(threeMonthsLaterIST.getMonth() + 3);

    console.log("today IST",todayIST)
    console.log("3months later IST",threeMonthsLaterIST)
    
    try {
        const query = new membership({
            userid, planid, txn_no: "Free Trial",
            buy_date: todayIST,
            expire_date: threeMonthsLaterIST,
            coupon: "",
            finalpricepaid: 0
        });
        const result = await query.save();
        if (result) {
            console.log('Free Trial created Successfully');
            return true;
        }
    } catch (error) {
        console.log('create trial membership', error);
    }
};

module.exports = trialmembership;
