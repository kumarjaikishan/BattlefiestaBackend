const mongo = require('mongoose');

const memberschema = new mongo.Schema({
    userid: {
        type: mongo.Schema.Types.ObjectId,
        ref: 'user',
        required:true
    },
    planid: {
        type: mongo.Schema.Types.ObjectId,
        ref: 'plan',
        required:true
    },
    status: {
        type: String,
        enum: ["PENDING", "ACTIVE", "EXPIRED", "CANCELLED"],
        default: "PENDING",
    },
    amount: {
        type: Number, // in paise
        required: true,
    },
    currency: {
        type: String,
        default: "INR",
    },
    conf_type: {
        type: String,
        enum: ["FRONTEND", "WEBHOOK", "NODECRON", "NOT_CONFIRMED"],
        default: "NOT_CONFIRMED",
    },
    orderId: {
        type: String, // Razorpay order_id
    }, paymentId: {
        type: String, // Razorpay payment_id
    },
    startDate: {
        type: Date,
    },
    endDate: {
        type: Date,
    },
    durationInDays: {
        type: Number,
        default: 30,
    },
    coupon: {
        type: String,
        default: '',
        required: false
    },
    finalpricepaid: {
        type: Number,
        required: true
    }

}, { timestamps: true });

const membership = new mongo.model("membership", memberschema);
module.exports = membership;
