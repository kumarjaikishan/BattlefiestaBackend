const { exec } = require('child_process');
const sendemail = require('./backupmail')
const path = require('path');
const fs = require('fs');

// Directory where backups will be stored
const baseDir = path.join(__dirname, '..');
const backupDir = path.join(baseDir, 'backups');

// Ensure backup directory exists
if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
}

// Function to perform a backup using mongodump
const databaseBackup = async (databaseName) => {
    console.log("enter into mongo database backup")
    const uri = process.env.basemongo;
    try {
        const backupPath = path.join(backupDir, `${databaseName}_backup`);
        // const command = `mongodump --uri="${uri}"`; // to backup all database into dump folder
        // const command = `mongodump --uri="${uri}" --db=${databaseName}`; // to backup specific one database into default dump folder
        // const command = `mongodump --uri="${uri}" --out="${backupPath}"`;  //for backup create custom folder name
        // const command = `mongodump --uri="${uri}" --db=${databaseName} --out="${backupPath}"`;  //for specific db backup create custom folder name
        // const command = `mongodump --uri="${uri}" --db=${databaseName} --gzip `; // for specific database, in dump folder
        const command = `mongodump --uri="${uri}" --db=${databaseName} --gzip --archive="${backupPath}.gz"`; // for specific database

        exec(command, async (error, stdout, stderr) => {
            if (error) {
                console.error('Error during backup:', error.message);
                console.error('stderr:', stderr); // Log stderr to see more details
                return;
            }
            console.log(`Backup of database "${databaseName}" completed successfully and saved to ${backupPath}.gz ✅`);
            await sendemail(databaseName);
        });
    } catch (error) {
        console.error('Error during backup:', error);
    }
};

// Function to restore a database using mongorestore
const databaseRestore = async (databaseName) => {
    console.log("enter into mongo database restore")
    const uri = process.env.basemongo;
    try {
        const backupPath = path.join(backupDir, `${databaseName}_backup`);
        // const command = `mongorestore --uri="${uri}" dump/`; //working for simple folder json and bson backup data
        // const command = `mongorestore --uri="${uri}" --gzip --dir="dump/"`; //working for gzip folder json and bson backup data
        // const command = `mongorestore --uri="${uri}" --gzip --archive="${backupPath}.gz"`; //working for gzip folder json and bson backup data
        const command = `mongorestore --uri="${uri}" --db=${databaseName} --gzip --archive="${backupPath}.gz"`; //--drop working for specific from all database restoration specific ot without specific works
        // const command = `mongorestore --archive="${backupPath}.gz" --gzip --nsFrom="${databaseName}.*" --nsTo="switchtest.*"` //works offline community mongodb 

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error('Error during restore:', error.message);
                console.error('stderr:', stderr); // Log stderr to see more details
                return;
            }
            console.log(`Database "${databaseName}" restored successfully from ${backupPath}.gz ✅`);
        });
    } catch (error) {
        console.error('Error during restore:', error);
    }
};

module.exports = { databaseBackup, databaseRestore };