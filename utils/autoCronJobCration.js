const cron = require("node-cron");

const jobs = new Map(); // in-memory job store

function timeToCron(time) {
  const [hour, minute] = time.split(":");
  return `${minute} ${hour} * * *`;
}


function createCronJob(schedule) {
  const cronExp = timeToCron(schedule.time);

  const task = cron.schedule(
    cronExp,
    async () => {
      await databaseDump(schedule.databases);
    },
    {
      timezone: schedule.timezone
    }
  );

  jobs.set(schedule._id.toString(), task);
}

// api post call cretaion
app.post("/api/backup/schedule", async (req, res) => {
  const { databases, time, timezone } = req.body;

  const schedule = await BackupSchedule.create({
    databases,
    time,
    timezone
  });

  createCronJob(schedule);

  res.json({ success: true, schedule });
});


async function loadAllCronJobs() {
  const schedules = await BackupSchedule.find({ enabled: true });

  schedules.forEach(createCronJob);
}

// call this once when server starts
loadAllCronJobs();
