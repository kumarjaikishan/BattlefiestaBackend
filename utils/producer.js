const { Queue } = require('bullmq');
const IORedis = require('ioredis');

const emailQueue = new Queue('battlefiesta_queue', {
    connection: new IORedis(process.env.REDIS_URIfulle, {
        maxmemoryPolicy: 'noeviction'
    }),
    limiter: {
        max: 100,
        duration: 1000 * 60 * 60,
    },
    defaultJobOptions: {
        delay: 2000,
        attempts:2,
        removeOnComplete: true,
        backoff:{
            type:'exponential',
            delay:2000
        }
    }
});

async function addJobToQueue(email, subject, body) {
    const res = await emailQueue.add('battlefiesta_queue', {
        email,
        subject,
        body
    })
    console.log("Email job added to queue", res.id);
}

async function clearQueue() {
    await emailQueue.clean(0, 'completed'); // Remove all completed jobs
    await emailQueue.clean(0, 'failed');    // Remove all failed jobs
    console.log("All jobs cleared from the queue.");
}
// clearQueue().catch(console.error);


module.exports = { addJobToQueue };
