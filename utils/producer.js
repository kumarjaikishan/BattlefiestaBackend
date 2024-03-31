const { Queue } = require('bullmq');
const IORedis = require('ioredis');
// const worker = require('./worker')

const emailQueue = new Queue('battlefiesta_queue', {
    connection: new IORedis(process.env.REDIS_URIfulle),
    limiter: {
        max: 100,
        duration: 1000 * 60 * 60,
    },
});

async function addJobToQueue(email, subject, body) {
    const res = await emailQueue.add('email to retail', {
        email,
        subject,
        body
    })
    console.log("job added to queue", res.id);
}

module.exports = addJobToQueue;
