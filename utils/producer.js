const { Queue } = require('bullmq');
const IORedis = require('ioredis');

const emailQueue = new Queue('battlefiesta_queue', {
    connection: new IORedis(process.env.REDIS_URIfulle),
    limiter: {
        max: 100,
        duration: 1000 * 60 * 60,
    },
});
const sendnotify = new Queue('firebase_push_notification', {
    connection: new IORedis(process.env.REDIS_URIfulle),
    limiter: {
        max: 100,
        duration: 1000 * 60 * 60,
    },
});

async function addJobToQueue(email, subject, body) {
    const res = await emailQueue.add('battlefiesta_queue', {
        email,
        subject,
        body
    },
    {delay:500, attempts:1}
    )
    console.log("Email job added to queue", res.id);
}
async function sendNotification(registeredToken, mes) {
    const res = await sendnotify.add('firebase notification', {
        registeredToken, mes
    },
    {delay:100, attempts:1}
    )
    console.log("Push job added to queue", res.id);
}

module.exports = {addJobToQueue,sendNotification};
