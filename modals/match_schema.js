const mongo = require('mongoose');

const match = new mongo.Schema({
    userid: {
        type: mongo.Schema.Types.ObjectId,
        ref: 'user',
    },
    tournament_id: {
        type: mongo.Schema.Types.ObjectId,
        ref: 'tournament',
    },
    map:{
        type: String,
        required: false,
        default:""
    },
    points:{
        type: Array,
        required: true
    }
}, { timestamps: true });

const matches = new mongo.model("match", match);
module.exports = matches;
