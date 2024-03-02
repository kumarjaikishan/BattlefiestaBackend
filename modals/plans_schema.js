const mongo = require('mongoose');

const planschema = new mongo.Schema({
    plan_name:{
        type: String,
        required: true,
    },
    baseprice: {
        type: Number,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    into: {
        type: Number,
        required: true
    },
    create_limit: {
        type: Number,
        required: true
    },
    duration: {
        type: String,
        default:'',
        required: false
    },
    notation: {
        type: String,
        default:'',
        required: false
    },
    visible: {
        type: Boolean,
        default:true,
        required: false
    }
}, { timestamps: true });

const plan = new mongo.model("plan", planschema);
module.exports = plan;
