const cron = require('node-cron');
const membership = require('../modals/membership_schema');
const { databaseBackup, databaseRestore } = require('./backup_restore');

// Schedule the task to run every day at 1:00 AM IST
cron.schedule('0 1 * * *', async () => {
    console.log('Running a task at 1:00 AM IST every day');

    try {
        let memberships = await membership.find();
        const today = new Date();

        // Filter out expired memberships
        const expiredMemberships = memberships.filter(item => new Date(item.expire_date) < today);

        // Update all expired memberships in bulk
        const updatePromises = expiredMemberships.map(item => {
            return membership.findByIdAndUpdate({ _id: item._id }, { isActive: false });
        });

        // Wait for all updates to complete
        await Promise.all(updatePromises);

        console.log("Membership status update done.");
    } catch (error) {
        console.error("Error updating memberships:", error);
    }
}, {
    timezone: "Asia/Kolkata"
});


cron.schedule('1 1 * * *', async () => {
    await Promise.all([
        databaseBackup('exp'),
        databaseBackup('battlefiesta')
    ]);
    // await databaseBackup('exp');
    // await databaseBackup('battlefiesta');
}, {
    timezone: "Asia/Kolkata"
});

// cron.schedule('5 1 * * *', async () => {
//     databaseBackup('battlefiesta');
// }, {
//     timezone: "Asia/Kolkata"
// });

// Uncomment and adjust the following if needed
// cron.schedule('*/20 * * * * *', async () => {
//     // databaseBackup('switch');
//     // databaseRestore('switch')
//     // databaseRestore('switch',"switchtest")
// }, {
//     timezone: "Asia/Kolkata"
// });
