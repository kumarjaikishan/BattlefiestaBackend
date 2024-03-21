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
        index:true
    },
    publicemail: {
        type: String,
        required: false,
        default:""
    },
    city: {
        type: String,
        required: false,
        default:""
    },
    state: {
        type: String,
        required: false,
        default:""
    },
    phone: {
        type: Number,
        required: false,
        unique: true
    },
    publicphone: {
        type: Number,
        required: false,
        default:""
    },
    tourn_created: {
        type: Number,
        required: false,
        default:0
    },
    password: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: false,
        default:""
    },
    imgsrc: {
        type: String,
        default:""
    },
    bio: {
        type: String,
        default:""
    },
    sociallinks: {
        type: Array,
        default:[]
    },
    isadmin: {
        type: Boolean,
        default: false
    },
    isverified: {
        type: Boolean,
        default: false
    },
    createdAt: { type: Date, expires: '2d', default: Date.now },
})


log.index({ createdAt: 1 }, { expireAfterSeconds: 0, partialFilterExpression: { isverified: false } });

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


log.methods.checkpassword = async function (hello) {
    try {
        return bcrypt.compare(hello, this.password);
    } catch (error) {
        console.error(error);
    }
};

const user = new mongo.model("user", log);
module.exports = user;