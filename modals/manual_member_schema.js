const mongo = require('mongoose');

const manualmemberschema = new mongo.Schema({
    user: {
        type: mongo.Schema.Types.ObjectId,
        ref: 'user',
    },
    plan_name: {
        type: String,
        required: true
    },
    txn_no: {
        type: String,
        required: true
    },
    coupon: {
        type: String,
        default:'',
        required: false
    },
    city: {
        type: String,
        default:'',
        required: false
    },
    status: {
        type: String,
        default:'pending',
        required: false,
        enum: ["pending", "approved", "rejected"],
    },
    remarks: {
        type: String,
        default:'',
        required: false
    },
    price: {
        type: Number,
        required: true
    },
    finalpricepaid: {
        type: Number,
        required: true
    }
}, { timestamps: true });

const manulamembership = new mongo.model("membershipentry", manualmemberschema);
module.exports = manulamembership;
