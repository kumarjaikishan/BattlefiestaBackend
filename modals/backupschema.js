const mongoose = require("mongoose");

const BackupScheduleSchema = new mongoose.Schema(
  {
    /* ---------- Databases ---------- */
    databases: {
      type: [String],
      required: true,
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: "At least one database must be selected"
      }
    },


    /* ---------- Timezone ---------- */
    timezone: {
      type: String,
      default: "Asia/Kolkata"
    },

   
    /* ---------- Cron Expression ---------- */
    cron: {
      type: String,
      required: true
    },

    /* ---------- Enabled ---------- */
    enabled: {
      type: Boolean,
      default: true
    },

    /* ---------- Email Notification ---------- */
    emailNotification: {
      enabled: {
        type: Boolean,
        default: false
      },
      email: {
        type: String,
        lowercase: true,
        trim: true,
        required: function () {
          return this.emailNotification?.enabled === true;
        },
        match: [
          /^\S+@\S+\.\S+$/,
          "Please provide a valid email address"
        ]
      }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("BackupSchedule", BackupScheduleSchema);
