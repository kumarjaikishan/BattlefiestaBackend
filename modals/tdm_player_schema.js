const mongo = require('mongoose');

const playerschema = new mongo.Schema({
    userid: {
        type: mongo.Schema.Types.ObjectId,
        ref: 'user',
    },
    tournament_id: {
        type: mongo.Schema.Types.ObjectId,
        ref: 'tournament',
    },
    name: {
        type: String,
        required: true
    },
    InGameId: {
        type: String,
        required: false
    },
    email: {
        type: String,
        default: "",
        required: false
    },
    mobile: {
        type: Number,
        default: "",
        required: false
    },
    utrno: {
        type: Number,
        default: "",
        required: false
    },
    os: {
        type: String,
        default: "",
        required: false
    },
    discord: {
        type: String,
        default: "",
        required: false
    },
    fps: {
        type: String,
        default: "",
        required: false
    },
    device: {
        type: String,
        default: "",
        required: false
    },
    paymentss: {
        type: String,
        default: "",
        required: false
    },
    category: {
        type: Number,
        required: true
    },
    logo: {
        type: String,
        default: "",
        required: false
    },
    status: {
        type: String,
        required: false,
        default: "pending",
        enum: ["pending", "approved", "rejected"],
    },
    reason: {
        type: String,
        default: "",
        required: false
    }
}, { timestamps: true });

const player = new mongo.model("tdm_entry", playerschema);
module.exports = player;
