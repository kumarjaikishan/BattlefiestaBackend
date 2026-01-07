const BackupSchedule = require('../modals/backupschema')
const cron = require("node-cron");
const CronRunLog = require("../modals/CronRunLog");
const { databaseDumpAutoMation } = require('../utils/backup_restore');
const { getMongoClient } = require('../conn/MongoAdmin');


const jobs = new Map(); // in-memory job store


const getSchedules = async (req, res, next) => {
  try {
    const schedules = await BackupSchedule.aggregate([
      {
        $lookup: {
          from: "cronrunlogs", // Mongo collection name
          localField: "_id",
          foreignField: "jobId",
          as: "logs"
        }
      },
      {
        $addFields: {
          logs: {
            $slice: [
              {
                $sortArray: {
                  input: "$logs",
                  sortBy: { startedAt: -1 }
                }
              },
              10
            ]
          }
        }
      }
    ]);

    const client = await getMongoClient();
    const databasesList = await client.db().admin().listDatabases();

    res.json({
      success: true,
      schedules,
      database: databasesList.databases
    });

  } catch (err) {
    next(err);
  }
};


const createSchedules = async (req, res, next) => {

  const { databases, cron, timezone, enabled, emailNotification } = req.body;
  // console.log(req.body)

  const schedule = await BackupSchedule.create({
    databases,
    cron,
    timezone,
    enabled,
    emailNotification
  });

  createCronJob(schedule);

  res.json({ success: true, schedule });
};

const editSchedules = async (req, res, next) => {
  const { id } = req.params;

  const { databases, cron, timezone, enabled, emailNotification } = req.body;

  const schedule = await BackupSchedule.findByIdAndUpdate(id, { databases, cron, timezone, enabled, emailNotification }, { new: true })

  // console.log(schedule)
  const existingJob = jobs.get(id);

  if (!enabled) {
    if (existingJob) {
      existingJob.stop();
      jobs.delete(id)
    }
  } else {
    if (existingJob) {
      existingJob.stop();
      jobs.delete(id);
    }

    createCronJob(schedule);
  }

  res.json({ success: true });
};

const deleteSchedules = async (req, res, next) => {

  const { id } = req.params;
  // console.log("delete", id);

  const schedule = await BackupSchedule.findByIdAndDelete(id);
  const existingJob = jobs.get(id);
  if (existingJob) {
    existingJob.stop();
    jobs.delete(id)
  }

  res.json({ success: true });
};

const getJobStatus = (req, res) => {
  const jobStatuses = [];

  for (const [jobId, job] of jobs.entries()) {
    jobStatuses.push({
      jobId,
    });
  }
  // console.log(jobStatuses)

  res.json({
    success: true,
    jobs: jobStatuses
  });
};

function createCronJob(schedule) {
  if (!cron.validate(schedule.cron)) {
    console.log(`Invalid cron: ${schedule.cron}`);
    return;
  }

  const jobId = schedule._id.toString();

  if (jobs.has(jobId)) {
    const oldJob = jobs.get(jobId);
    oldJob.stop();
    jobs.delete(jobId);
  }

  const task = cron.schedule(
    schedule.cron,
    async () => {
      let log;

      try {
        // ⏱️ LOG START
        log = await startCronLog({
          jobId: schedule._id,
          cron: schedule.cron
        });

        await databaseDumpAutoMation(schedule.databases, schedule?.emailNotification?.enabled && schedule.emailNotification.email)
        // console.log("hey..........")

        // ✅ LOG SUCCESS
        await finishCronLog(log, "SUCCESS");
        await keepLast10Logs(schedule._id);

      } catch (err) {
        console.error("Cron job failed:", err);

        // ❌ LOG FAILURE
        if (log) {
          await finishCronLog(log, "FAILED", err.message);
        }
      }

    },
    {
      timezone: schedule.timezone,
      scheduled: false
    }
  );

  task.start();
  jobs.set(jobId, task);
}

async function loadAllCronJobs() {
  console.log('loadAllCronJobs called')
  const schedules = await BackupSchedule.find({ enabled: true });
  if(!schedules) return console.log("No Active Scheduled Jobs Found")

    // console.log(schedules)
  schedules.forEach(createCronJob);
}



async function startCronLog({ jobId, cron }) {
  return CronRunLog.create({
    jobId,
    cron,
    startedAt: new Date(),
    status: "RUNNING"
  });
}

async function finishCronLog(log, status, error = null) {
  const finishedAt = new Date();

  await CronRunLog.findByIdAndUpdate(log._id, {
    finishedAt,
    durationMs: finishedAt - log.startedAt,
    status,
    error
  });
}

async function keepLast10Logs(jobId) {
  const logs = await CronRunLog
    .find({ jobId })
    .sort({ startedAt: -1 })
    .skip(10) // keep newest 10
    .select("_id");

  if (logs.length > 0) {
    await CronRunLog.deleteMany({
      _id: { $in: logs.map(l => l._id) }
    });
  }
}


module.exports = { getSchedules, createSchedules, editSchedules, deleteSchedules, getJobStatus,loadAllCronJobs };