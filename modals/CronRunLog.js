// models/CronRunLog.js
const mongoose = require("mongoose");

const cronRunLogSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },

  cron: String,

  startedAt: {
    type: Date,
    required: true
  },

  finishedAt: Date,

  durationMs: Number,

  status: {
    type: String,
    enum: ["RUNNING", "SUCCESS", "FAILED"],
    default: "RUNNING"
  },

  error: String
}, { timestamps: true });

module.exports = mongoose.model("CronRunLog", cronRunLogSchema);
