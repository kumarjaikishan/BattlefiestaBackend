const mongo = require('mongoose');

const contactschema = new mongo.Schema({
    name: {
        type: String
    },
    email: {
        type: String
    },
    message: {
        type: String
    },
    resolve: {
        type: Boolean,
        default:false
    },
    resolvemsg: {
        type: String,
        default:''
    }
}, { timestamps: true })

const contact = new mongo.model("contact", contactschema);
module.exports = contact;