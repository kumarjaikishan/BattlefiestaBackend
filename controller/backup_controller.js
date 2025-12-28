const BackupSchedule = require('../modals/backupschema')
const cron = require("node-cron");
const { databaseDumpAutoMation } = require('../utils/backup_restore');
const { getMongoClient } = require('../conn/MongoAdmin');


const jobs = new Map(); // in-memory job store


const getSchedules = async (req, res, next) => {
  const schedules = await BackupSchedule.find();
  const client = await getMongoClient();
  const databasesList = await client.db().admin().listDatabases();

  res.json({ success: true, schedules, database: databasesList.databases });
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

  // createCronJob(schedule);

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

function createCronJob(schedule) {

  const task = cron.schedule(
    schedule.cron,
    // '*/15 * * * * *',
    async () => {
      if (schedule?.emailNotification?.enabled) {
        // console.log("email hai", schedule?.emailNotification?.email)
        await databaseDumpAutoMation(schedule.databases, schedule?.emailNotification?.email);
      } else {
        // console.log("email nahi hai")
        await databaseDumpAutoMation(schedule.databases);
      }
    },
    {
      timezone: schedule.timezone
    }
  );

  jobs.set(schedule._id.toString(), task);
}

async function loadAllCronJobs() {
  console.log('loadAllCronJobs called')
  const schedules = await BackupSchedule.find({ enabled: true });

  schedules.forEach(createCronJob);
}

// call this once when server starts
loadAllCronJobs();

module.exports = { getSchedules, createSchedules, editSchedules, deleteSchedules };