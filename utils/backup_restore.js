const { exec } = require('child_process');
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
    const uri = `mongodb+srv://jai:Jai%404880@cluster0.4ntduoo.mongodb.net/${databaseName}?retryWrites=true&w=majority`;
    try {
        const backupPath = path.join(backupDir, `${databaseName}_backup`);
        const command = `mongodump --uri="${uri}" --db=${databaseName} --gzip --archive="${backupPath}.gz"`; // Added quotes around the archive path

        // console.log('Executing command:', command); // Log the command for debugging

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error('Error during backup:', error.message);
                console.error('stderr:', stderr); // Log stderr to see more details
                return;
            }
            console.log(`Backup of database "${databaseName}" completed successfully and saved to ${backupPath}.gz`);
        });
    } catch (error) {
        console.error('Error during backup:', error);
    }
};

// Function to restore a database using mongorestore
const databaseRestore = async (databaseName) => {
    const uri = `mongodb+srv://jai:Jai%404880@cluster0.4ntduoo.mongodb.net/exptest?retryWrites=true&w=majority`;
    try {
        const backupPath = path.join(backupDir, `${databaseName}_backup`);
        const command = `mongorestore --uri="${uri}" --db=${databaseName} --gzip --archive="${backupPath}.gz" --drop`; // Added quotes around the archive path

        // console.log('Executing command:', command); // Log the command for debugging

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
