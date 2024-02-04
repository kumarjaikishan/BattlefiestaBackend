const mongo = require('mongoose');

const tournaform = new mongo.Schema({
    userid: {
        type: mongo.Schema.Types.ObjectId,
        ref: 'user',
    },
    tournament_id: {
        type: mongo.Schema.Types.ObjectId,
        ref: 'tournament',
    },
    teamName:{
        type: String,
        required: true
    },
    email:{
        type: String,
        default:"",
        required: false
    },
    mobile:{
        type: Number,
        default:"",
        required: false
    },
    discordID:{
        type: String,
        default:"",
        required: false
    },
    teamLogo:{
        type: String,
        default:"",
        required: false
    },
    screenss:{
        type: String,
        default:"",
        required: false
    },
    player: {
        type: Array,
        required: false
    },
     status:{
        type: String,
        required: false,
        default:"pending",
        enum: ["pending", "approved", "rejected"],
    },
    reason:{
        type: String,
        default:"",
        required: false
    }
}, { timestamps: true });

const Tournament_form = new mongo.model("tourn_entry", tournaform);
module.exports = Tournament_form;
