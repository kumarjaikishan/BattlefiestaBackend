const mongo = require('mongoose');

const tournaform_setting = new mongo.Schema({
    userid: {
        type: mongo.Schema.Types.ObjectId,
        ref: 'user',
    },
    tournament_id: {
        type: mongo.Schema.Types.ObjectId,
        ref: 'tournament',
        required: true
    },
    description: {
        type: String,
        default: "",
        required: false
    },
    success_message: {
        type: String,
        default: "",
        required: false
    },
    isopen:{
        type: Boolean,
        default: true,
        required: false
    },
    ask_payment_ss: {
        type: Boolean,
        default:false,
        required: false
    },
    ask_email: {
        type: Boolean,
        default:false,
        required: false
    },
    ask_phone: {
        type: Boolean,
        default:false,
        required: false
    },
    ask_discord: {
        type: Boolean,
        default:false,
        required: false
    },
    ask_teamlogo: {
        type: Boolean,
        default:false,
        required: false
    },
    ask_playerlogo: {
        type: Boolean,
        default:false,
        required: false
    },
    minimum_players: {
        type: Number,
        default:1,
        required: false
    },
    maximum_players: {
        type: Number,
        default:5,
        required: false
    },
    links: {
        type: Array,
        default:[],
        required: false
    },
    publicpost: {
        type: String,
        default: "",
        required: false
    }
}, { timestamps: true });

const Tournament_form_setting = new mongo.model("tourn_setting", tournaform_setting);
module.exports = Tournament_form_setting;
