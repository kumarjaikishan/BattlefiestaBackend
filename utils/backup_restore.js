const { exec } = require('child_process');
const sendemail= require('./nodemail')
const path = require('path');
const fs = require('fs');

// Directory where backups will be stored
// const baseDir = path.join(__dirname, '..');
const backupDir = path.join(__dirname, 'backups');

// Ensure backup directory exists
if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
}

// Function to perform a backup using mongodump
const databaseBackup = async (databaseName) => {
    console.log("enter into mongo database backup")
    const uri = `mongodb+srv://jai:Jai%404880@cluster0.4ntduoo.mongodb.net`;
    try {
        const backupPath = path.join(backupDir, `${databaseName}_backup`);
         // const command = `mongodump --uri="${uri}"`; // to backup all database into dump folder
        // const command = `mongodump --uri="${uri}" --out="${backupPath}"`;  //for backup create custom folder name
        // const command = `mongodump --uri="${uri}" --db=${databaseName} --out="${backupPath}"`;  //for specific db backup create custom folder name
        // const command = `mongodump --uri="${uri}" --db=${databaseName} --gzip `; // for specific database, in dump folder
        // const command = `mongodump --uri="${uri}" --db=${databaseName} --gzip --archive="${backupPath}.gz"`; // for specific database
        const command = `mongodump --uri="${uri}" --db=goodnaturetest --gzip --archive="${backupPath}.gz"`; // for specific database

        exec(command, async (error, stdout, stderr) => {
            if (error) {
                console.error('Error during backup:', error.message);
                console.error('stderr:', stderr); // Log stderr to see more details
                return;
            }
            await sendemail();
            console.log(`Backup of database "${databaseName}" completed successfully and saved to ${backupPath}.gz`);
        });
    } catch (error) {
        console.error('Error during backup:', error);
    }
};

// Function to restore a database using mongorestore
const databaseRestore = async (databaseName) => {
    console.log("enter into mongo database restore")
    const uri = `mongodb+srv://jai:Jai%404880@cluster0.4ntduoo.mongodb.net`;
    try {
        const backupPath = path.join(backupDir, `${databaseName}_backup`);
         // const command = `mongorestore --uri="${uri}" dump/`; // for simple folder json and bson backup data
        // const command = `mongorestore --uri="${uri}" --gzip --dir="dump/"`; // for gzip folder json and bson backup data
        // const command = `mongorestore --uri="${uri}" --db=${databaseName} --gzip --archive="${backupPath}.gz" --drop`; // specific ot without specific works
        const command = `mongorestore --uri="${uri}" --gzip --archive="${backupPath}.gz" --drop`; // Added quotes around the archive path

       exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error('Error during restore:', error.message);
                console.error('stderr:', stderr); // Log stderr to see more details
                return;
            }
            console.log(`Database "${databaseName}" restored successfully from ${backupPath}.gz`);
        });
    } catch (error) {
        console.error('Error during restore:', error);
    }
};

module.exports = { databaseBackup, databaseRestore };
