const mongo = require('mongoose');

const couponschema = new mongo.Schema({
    coupon: {
        type: String,
        required: true,
        unique:true
    },
    percent: {
        type: Number,
        required: true
    },
    isactive: {
        type: Boolean,
        default:true,
        required: true
    },
}, { timestamps: true });

const coupon = new mongo.model("coupon", couponschema);
module.exports = coupon;
