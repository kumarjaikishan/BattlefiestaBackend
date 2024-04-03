const mongo = require('mongoose');

const defaultpoint = {
    1: "25", 2: "14", 3: "10", 4: "8",
    5: "7", 6: "6", 7: "5", 8: "4", 9: "3",
    10: "2", 11: "1", 12: "1", 13: "1", 14: "1", 15: "1", 16: "1"
};
const tourna = new mongo.Schema({
    userid: {
        type: mongo.Schema.Types.ObjectId,
        ref: 'user',
    },
    tournamet_id: {
        type: String,
        // required: true,
        unique:true
    },
    title: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ["classic", "tdm"]
    },
    eachkillcount: {
        type: Boolean,
        default:true,
        required: false
    },
    slots: {
        type: Number,
        required: false,
        default: 1
    },
    tournment_banner: {
        type: String,
        required: false,
        default: ""
    },
    tournment_logo: {
        type: String,
        required: false,
        default: ""
    },
    organiser: {
        type: String,
        required: false,
        default: ""
    },
    status: {
        type: String,
        required: false,
        default: "upcoming"
    },
    visibility: {
        type: Boolean,
        required: false,
        default: false
    },
    label: {
        type: String,
        required: false,
        default: ""
    },
    pointsystem: {
        type: Object,
        required: false,
        default: defaultpoint
    },
    tiepreference:{
        type:Boolean,
        default:true,
        required:false
    },
    killpoints:{
        type:Number,
        default:1,
        required:false
    }
}, { timestamps: true })
const Tournament = new mongo.model("tournament", tourna);
module.exports = Tournament;