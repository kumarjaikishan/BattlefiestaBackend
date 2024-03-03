const membership = require('../modals/membership_schema');


const trialmembership = async (userid, planid) => {
    const today = new Date();
    try {
        const query = new membership({
            userid, planid, txn_no: "Free Trial",
            buy_date: today, expire_date: '2050-01-01', coupon: "",
            finalpricepaid: 0
        });
        const result = await query.save();
        if(result){
            console.log('Free Trial created Successfully');
            return true;
        }
    } catch (error) {
        console.log('create trial membership', error);
    }
}
module.exports = trialmembership;