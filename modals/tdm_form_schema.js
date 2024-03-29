const mongo = require('mongoose');

const tdm_setting = new mongo.Schema({
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
    ask_playerlogo: {
        type: Boolean,
        default:true,
        required: false
    },
    ask_devicename: {
        type: Boolean,
        default:false,
        required: false
    },
    ask_os: {
        type: Boolean,
        default:true,
        required: false
    },
    ask_fps: {
        type: Boolean,
        default:true,
        required: false
    },
    show_payment: {
        type: Boolean,
        default:false,
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
    },
    amount: {
        type: Number,
        default: "",
        required: false
    },
    upi_id: {
        type: String,
        default: "",
        required: false
    }
}, { timestamps: true });

const Tdm_form_setting = new mongo.model("tdm_setting", tdm_setting);
module.exports = Tdm_form_setting;
