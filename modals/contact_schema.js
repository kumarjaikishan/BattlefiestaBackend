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
    }
}, { timestamps: true })

const contact = new mongo.model("contact", contactschema);
module.exports = contact;