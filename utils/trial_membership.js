const membership = require('../modals/membership_schema');
const plan = require('../modals/plans_schema');

const trialmembership = async (userid) => {


    const today = new Date();

    // ✅ 3 months trial
    const threeMonthsLater = new Date(today);
    threeMonthsLater.setMonth(today.getMonth() + 3);

    try {

        let gettrialplan = await plan.findOne({plan_name:'Trial'});
        gettrialplan= gettrialplan?._id.toString()
       
        // ❗ check if user already has membership for this plan
        const alreadymembership = await membership.findOne({ userid, gettrialplan });

        if (alreadymembership) {
            return { success: false, message: "Trial plan already exists" };
        }

        const query = new membership({
            userid,
            planid:gettrialplan,
            gettrialplan,

            // ✅ status directly ACTIVE (trial doesn't need payment)
            status: "ACTIVE",

            // 💰 free trial
            amount: 0,
            finalpricepaid: 0,

            currency: "INR",

            // ✅ no payment yet
            orderId: null,
            paymentId: null,

            // ✅ trial confirmation type
            conf_type: "NODECRON", // or "FRONTEND" if instant

            startDate: today,
            endDate: threeMonthsLater,

            durationInDays: 90,

            coupon: ""
        });

        const result = await query.save();

        if (result) {
            console.log("✅ Free Trial created successfully");
            return { success: true };
        }

    } catch (error) {
        console.log("❌ create trial membership error:", error);
        return { success: false, message: "Server error" };
    }
};


module.exports = trialmembership;