const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },

    publicemail: {
      type: String,
      default: "",
    },

    // 🔑 Google login (OPTIONAL + UNIQUE only when exists)
    googleId: {
      type: String,
    },

    city: {
      type: String,
      default: "",
    },

    bluetick: {
      type: Boolean,
      default: false,
    },

    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
    ],

    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
    ],

    state: {
      type: String,
      default: "",
    },

    phone: {
      type: Number,
      unique: true,
      sparse: true, // allows multiple null values
    },

    publicphone: {
      type: Number,
      default: "",
    },

    tourn_created: {
      type: Number,
      default: 0,
    },

    password: {
      type: String,
    },

    username: {
      type: String,
      unique: true,
      sparse: true, // allows null usernames
      trim: true,
    },

    imgsrc: {
      type: String,
      default: "",
    },

    coversrc: {
      type: String,
      default: "",
    },

    notification_token: {
      type: String,
      default: "",
    },

    bio: {
      type: String,
      default: "",
    },

    temptoken: {
      type: String,
      default: "",
    },

    sociallinks: {
      type: Array,
      default: [],
    },

    isadmin: {
      type: Boolean,
      default: false,
    },

    isverified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

/**
 * ✅ UNIQUE Google ID only if present
 * Prevents duplicate null index error
 */
userSchema.index(
  { googleId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      googleId: { $exists: true, $ne: null },
    },
  }
);

/**
 * 🔐 Hash password before save
 */
userSchema.pre("save", async function (next) {
  if (!this.password) return next();
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

/**
 * 🔑 JWT Token
 */
userSchema.methods.generateToken = function () {
  return jwt.sign(
    {
      userId: this._id.toString(),
      email: this.email,
      isAdmin: this.isadmin,
    },
    process.env.jwt_token,
    { expiresIn: "30d" }
  );
};

/**
 * 🔐 Compare password
 */
userSchema.methods.checkpassword = async function (password) {
  if (!this.password) return false;
  return bcrypt.compare(password, this.password);
};

const User = mongoose.model("user", userSchema);
module.exports = User;
