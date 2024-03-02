const mongo = require('mongoose');

const manualmemberschema = new mongo.Schema({
    user: {
        type: mongo.Schema.Types.ObjectId,
        ref: 'user',
    },
    plan_id: {
        type: mongo.Schema.Types.ObjectId,
        ref: 'plan',
    },
    membershipId: {
        type: String,
        required: false,
        default: ''
    },
    txn_no: {
        type: String,
        required: true
    },
    coupon: {
        type: String,
        default: '',
        required: false
    },
    status: {
        type: String,
        default: 'pending',
        required: false,
        enum: ["pending", "approved", "rejected"],
    },
    remarks: {
        type: String,
        default: '',
        required: false
    },
    finalpricepaid: {
        type: Number,
        required: true
    }
}, { timestamps: true });

const manulamembership = new mongo.model("membershipentry", manualmemberschema);
module.exports = manulamembership;
