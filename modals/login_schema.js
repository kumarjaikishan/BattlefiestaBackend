const mongo = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')

const log = new mongo.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        index: true
    },
    publicemail: {
        type: String,
        required: false,
        default: ""
    },
    city: {
        type: String,
        required: false,
        default: ""
    },
    followers: [{
        type: mongo.Schema.Types.ObjectId,
        ref: "user"
    }],
    state: {
        type: String,
        required: false,
        default: ""
    },
    phone: {
        type: Number,
        required: false,
        unique: true
    },
    publicphone: {
        type: Number,
        required: false,
        default: ""
    },
    tourn_created: {
        type: Number,
        required: false,
        default: 0
    },
    password: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: false,
        unique: true
    },
    imgsrc: {
        type: String,
        default: ""
    },
    coversrc: {
        type: String,
        default: ""
    },
    notification_token: {
        type: String,
        default: "",
        required: false,
    },
    bio: {
        type: String,
        default: ""
    },
    temptoken: {
        type: String,
        default: ""
    },
    sociallinks: {
        type: Array,
        default: []
    },
    isadmin: {
        type: Boolean,
        default: false
    },
    isverified: {
        type: Boolean,
        default: false
    },
}, { timestamps: true })


// secure the password
log.pre("save", async function () {
    const user = this;
    if (!user.isModified("password")) {
        return next();
    }
    try {
        const saltRound = await bcrypt.genSalt(10);
        const hash_password = await bcrypt.hash(user.password, saltRound);
        user.password = hash_password;
    } catch (error) {
        console.log(error);
        next(error);
    }
})

log.methods.generateToken = async function () {
    try {
        return jwt.sign({
            userId: this._id.toString(),
            email: this.email,
            isAdmin: this.isadmin
        },
            process.env.jwt_token,
            {
                expiresIn: "30d",
            }
        );
    } catch (error) {
        console.error(error);
    }
};


log.methods.checkpassword = async function (pass) {
    try {
        return await bcrypt.compare(pass, this.password);
    } catch (error) {
        console.error(error);
    }
};

const user = new mongo.model("user", log);
module.exports = user;