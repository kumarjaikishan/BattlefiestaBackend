const razorpay = require('./razorpay_config');
const crypto = require("crypto");

const Membership = require("../modals/membership_schema");
const Payment = require("../modals/payment_schema");
const User = require("../modals/login_schema");
const Plan = require("../modals/plans_schema");
const Coupon = require("../modals/coupon_schema");
const { addtoqueue } = require('../utils/axiosRequest');


// 🧾 CREATE ORDER
const Create_Order = async (req, res) => {
    try {
        const { plan_detail, couponCode } = req.body;
        // console.log(plan_detail)

        let planId = plan_detail._id

        const plan = await Plan.findById(planId);
        if (!plan) return res.status(404).json({ message: "Plan not found" });


        let couponPercent = 0;

        // ✅ Coupon check
        if (couponCode) {
            const coupon = await Coupon.findOne({ coupon: couponCode.toLowerCase() });

            if (!coupon || !coupon.isactive) {
                return res.status(400).json({ message: "Invalid/Expired Coupon" });
            }

            couponPercent = coupon.percent;
        }

        const discount = Math.ceil((plan.price * couponPercent) / 100);
        const finalAmount = plan.price - discount;

        // 🔹 Razorpay expects paise
        const amountInPaise = finalAmount * 100;

        const order = await razorpay.orders.create({
            amount: amountInPaise,
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
            notes: {
                userId: req.userid.toString(),
                planId: plan._id.toString(),
                forsite: "battlefiesta",
            }
        });

        // 🔹 Create Membership (PENDING)
        const membership = await Membership.create({
            userid: req.userid,
            planid: plan._id,
            amount: amountInPaise,
            orderId: order.id,
            coupon: couponCode || '',
            finalpricepaid: finalAmount,
            status: "PENDING",
            durationInDays: plan.durationInDays || 30
        });

        // 🔹 Create Payment
        await Payment.create({
            userId: req.userid,
            membershipId: membership._id,
            orderId: order.id,
            amount: amountInPaise,
            status: "CREATED"
        });

        return res.json(order);

    } catch (err) {
        console.error("❌ CREATE ORDER ERROR:", err);
        res.status(500).json({ error: "Order creation failed" });
    }
};


// 🔐 VERIFY PAYMENT (Frontend Callback)
const verify_payment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const generated_signature = crypto
            .createHmac("sha256", process.env.RAZORPAY_SECRET)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest("hex");

        if (generated_signature !== razorpay_signature) {
            return res.status(400).json({ success: false });
        }

        const membership = await Membership.findOne({ orderId: razorpay_order_id });

        if (!membership) {
            return res.status(404).json({ success: false });
        }

        // ✅ Only update if not already ACTIVE
        if (membership.status !== "ACTIVE") {

            const startDate = new Date();
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + membership.durationInDays);

            membership.status = "ACTIVE";
            membership.paymentId = razorpay_payment_id;
            membership.startDate = startDate;
            membership.endDate = endDate;
            membership.conf_type = "FRONTEND";

            await membership.save();

            await Payment.updateOne(
                { orderId: razorpay_order_id },
                {
                    paymentId: razorpay_payment_id,
                    status: "SUCCESS"
                }
            );

            await User.updateOne(
                { _id: membership.userid },
                { membership: membership._id }
            );

            // 🔥 SEND NOTIFICATION
            const user = await User.findById(membership.userid);
            await sendMembershipSuccess(membership, user);
        }

        res.json({ success: true });

    } catch (err) {
        console.error("❌ VERIFY ERROR:", err);
        res.status(500).json({ success: false });
    }
};

// 📡 WEBHOOK (FINAL SOURCE OF TRUTH)
const webhook = async (req, res) => {
    try {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
        const signature = req.headers["x-razorpay-signature"];

        const expected = crypto
            .createHmac("sha256", secret)
            .update(req.body)
            .digest("hex");

        if (expected !== signature) {
            return res.status(400).send("Invalid signature");
        }

        const body = JSON.parse(req.body.toString());
        const event = body.event;

        console.log("📩 EVENT:", event);

        if (event === "payment.captured") {
            const payment = body.payload.payment.entity;

            console.log("✅ Payment notes:", payment.notes);

            if (payment.notes.forsite !== "battlefiesta") return;

            const membership = await Membership.findOne({ orderId: payment.order_id });

            if (membership && membership.status !== "ACTIVE") {

                const startDate = new Date();
                const endDate = new Date(startDate);
                endDate.setDate(endDate.getDate() + membership.durationInDays);

                membership.status = "ACTIVE";
                membership.conf_type = "WEBHOOK";
                membership.paymentId = payment.id;
                membership.startDate = startDate;
                membership.endDate = endDate;

                await membership.save();

                await Payment.updateOne(
                    { orderId: payment.order_id },
                    {
                        paymentId: payment.id,
                        status: "SUCCESS"
                    }
                );

                await User.updateOne(
                    { _id: membership.userid },
                    { membership: membership._id }
                );
                const user = await User.findById(membership.userid);
                await sendMembershipSuccess(membership, user);
            }
        }

        if (event === "payment.failed") {
            const payment = body.payload.payment.entity;

            await Membership.updateOne(
                { orderId: payment.order_id },
                { status: "CANCELLED" }
            );

            await Payment.updateOne(
                { orderId: payment.order_id },
                { status: "FAILED" }
            );
        }

        res.status(200).json({ received: true });

    } catch (err) {
        console.error("❌ WEBHOOK ERROR:", err);
        res.status(500).send("Server Error");
    }
};

// 🔄 CRON / MANUAL CHECK
const checkstatus = async (req, res) => {
    try {
        const pending = await Membership.find({ status: "PENDING" });

        for (const m of pending) {
            if (!m.paymentId) continue;

            const payment = await razorpay.payments.fetch(m.paymentId);

            if (payment.status === "captured") {
                const startDate = new Date();
                const endDate = new Date(startDate);
                endDate.setDate(endDate.getDate() + m.durationInDays);

                m.status = "ACTIVE";
                m.conf_type = "NODECRON";
                m.startDate = startDate;
                m.endDate = endDate;

                await m.save();
            }
        }

        res.json({ message: "Checked" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
};

const sendMembershipSuccess = async (membership, user) => {
    const message = `Hey ${user.name}, 

🎉 Your payment was successful!

Your membership is now ACTIVE.

📦 Plan: ${membership.planid}
💰 Amount Paid: ₹${membership.finalpricepaid}
📅 Valid Till: ${membership.endDate.toDateString()}

Thanks for choosing BattleFiesta 🚀`;

    // 📧 Email
    await addtoqueue(
        user.email,
        "Payment Successful | BattleFiesta",
        message
    );
};

module.exports = {
    Create_Order,
    verify_payment,
    webhook,
    checkstatus
};