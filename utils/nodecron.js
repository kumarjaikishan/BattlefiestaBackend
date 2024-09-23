var cron = require('node-cron');
const membership = require('../modals/membership_schema');
const { databaseBackup, databaseRestore } = require('./backup_restore');

// '40 * * * * *'   --run every second at 40second with actual time 
// ' */5 * * * *'   --run every 5 minutes 
// '10 5 * * *'   --run on 5 min & 10 second every day 


// Schedule the task to run every day at 1:00 AM
cron.schedule('0 1 * * *', async () => {
    console.log('Running a task at 1:00 AM every day');

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
});

cron.schedule('1 1 * * *', async () => {
    databaseBackup('exp');
})
cron.schedule('5 1 * * *', async () => {
    databaseBackup('battlefiesta');
})


// cron.schedule('*/20 * * * * *', async () => {
//     // databaseBackup('switch');
//     // databaseRestore('switch')
// })
