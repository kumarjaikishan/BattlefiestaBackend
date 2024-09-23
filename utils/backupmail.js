const nodemailer = require('nodemailer');
const path = require('path');

// Create a transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'battlefiesta07@gmail.com',
        pass: process.env.gmail_password
    }
});

const getCurrentDate = () => {
    const date = new Date();
    
    // Date
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const year = date.getFullYear();

    // Time
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    // Convert 24-hour to 12-hour format
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 hour should be 12
    
    const time = `${hours}:${minutes} ${ampm}`;
    
    return `${day}/${month}/${year} ${time}`;
};

// console.log(getCurrentDate());

const currentDate = getCurrentDate();

const sendemail = async (databaseName) => {
    const backupFilePath = path.join(__dirname,'..', 'backups', `${databaseName}_backup.gz`); // Adjust the path as necessary

    const mailOptions = {
        from: 'BattleFiesta <battlefiesta07@gmail.com>',
        to: 'kumar.jaikishan0@gmail.com',
        subject: `${databaseName} Backup - ${currentDate}`,
        html: "Backup",
        attachments:[
            {
                filename: `${databaseName}_backup.gz`, // The name the file will have in the email
                path: backupFilePath // Path to the backup file
            }
        ]
    };

    // Return a promise
    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                // Reject the promise with the error
                reject(error);
            } else {
                console.log(info.response)
                // Resolve the promise with true
                resolve(true);
            }
        });
    });
}

module.exports = sendemail;