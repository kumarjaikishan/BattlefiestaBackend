const { exec } = require('child_process');
const { sendemail } = require('./backupmail')
const path = require('path');
const fs = require('fs');
const util = require('util');

// Promisify exec for async/await support
const execPromise = util.promisify(exec);

// Directory where backups will be stored
const baseDir = path.join(__dirname, '..');
const backupDir = path.join(baseDir, 'backups');

// Ensure backup directory exists
if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
}

// const execute = async (command, success, mail = null) => {
//     try {
//         exec(command, async (error, stdout, stderr) => {
//             if (error) {
//                 console.error(`Error: ${error.message}`);
//                 return;
//             }
//             if (stderr) {
//                 console.error(`Stderr: ${stderr}`);
//             }
//             // console.log(`Stdout: ${stdout}`);
//             mail && await sendemail(mail);
//             console.log(success);
//         });
//     } catch (error) {
//         console.error('Error during restore:', error);
//     }
// }

const execute = async (command, successMessage, email = null) => {
    try {
        const { stdout, stderr } = await execPromise(command);
        if (stdout) console.log(`✅stdout: ${stdout}`);
        if (stderr) console.error(`Stderr: ${stderr}`);

        // Send email if email parameter is provided
        if (email) await sendemail(email);
        console.log(successMessage);
    } catch (error) {
        console.error(`Error executing command: ${command}\nError: ${error.message}`);
    }
};


// Function to perform a backup using mongodump
const databaseBackup = async (databaseName) => {
    console.log("enter into mongo database backup")
    const uri = process.env.basemongo;

    const backupPath = path.join(backupDir, `${databaseName}_backup`);
    // const command = `mongodump --uri="${uri}"`; // to backup all database into dump folder
    // const command = `mongodump --uri="${uri}" --db=${databaseName}`; // to backup specific one database into default dump folder
    // const command = `mongodump --uri="${uri}" --out="${backupPath}"`;  //for backup create custom folder name
    // const command = `mongodump --uri="${uri}" --db=${databaseName} --out="${backupPath}"`;  //for specific db backup create custom folder name
    // const command = `mongodump --uri="${uri}" --db=${databaseName} --gzip `; // for specific database, in dump folder
    const command = `mongodump --uri="${uri}" --db=${databaseName} --gzip --archive="${backupPath}.gz"`; // for specific database

    execute(command, `Backup of database "${databaseName}" completed → ${backupPath}.gz ✅`, databaseName)
};

const execute1 = async (command, successMessage) => {
    try {
        const { stdout, stderr } = await execPromise(command);
        if (stdout) console.log(`✅stdout: ${stdout}`);
        // if (stderr) console.error(`Stderr: ${stderr}`);

        console.log(successMessage);
    } catch (error) {
        console.error(`Error executing command: ${command}\nError: ${error.message}`);
        throw error;
    }
};
// Function to perform a backup using mongodump
const databaseDump = async (databasesName) => {
    console.log("🔄 Starting MongoDB backup...");

    const uri = process.env.basemongo;
    if (!uri) throw new Error("MongoDB URI not found in env");

    for (const databaseName of databasesName) {
        const backupPath = path.join(backupDir, `${databaseName}_backup`);
        const command = `mongodump --uri="${uri}" --db=${databaseName} --gzip --archive="${backupPath}.gz"`; // for specific database

        execute1(command,
            `✅ Backup of database "${databaseName}" completed → ${backupPath}.gz `)
    }
    console.log(`🎉 All database backups completed - ${databasesName.join(', ')}`);
};

const databaseDumpInParallel = async (databasesName) => {
    const uri = process.env.basemongo;

    const tasks = databasesName.map(databaseName => {
        const backupPath = path.join(backupDir, `${databaseName}_backup.gz`);
        const command = `mongodump --uri="${uri}" --db="${databaseName}" --gzip --archive="${backupPath}"`;

        return execute1(
            command,
            `✅ Backup of "${databaseName}" completed`
        );
    });

    await Promise.all(tasks);
};


// Function to restore a database using mongorestore
const databaseRestore = async (databaseName, newname = null) => {
    console.log("enter into mongo database restore")
    const uri = process.env.basemongo;
    let command = '';

    const backupPath = path.join(backupDir, `${databaseName}_backup`);
    if (newname) {
        command = `mongorestore --uri="${uri}" --gzip --archive="${backupPath}.gz" --nsFrom="${databaseName}.*" --nsTo="${newname}.*"`
    } else {
        //  command = `mongorestore --uri="${uri}" dump/`; //working for simple folder json and bson backup data
        //  command = `mongorestore --uri="${uri}" --gzip --dir="dump/"`; //working for gzip folder json and bson backup data
        //  command = `mongorestore --uri="${uri}" --gzip --archive="${backupPath}.gz"`; //working for gzip folder json and bson backup data
        command = `mongorestore --uri="${uri}" --db=${databaseName} --gzip --archive="${backupPath}.gz"`; //--drop working for specific from all database restoration specific ot without specific works
    }

    execute(command, `Database "${databaseName}" restored successfully✅`)

};



module.exports = { databaseBackup, databaseRestore, databaseDump, databaseDumpInParallel };