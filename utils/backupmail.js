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

    // Options for formatting with specific time zone (Asia/Kolkata)
    const options = {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
    };

    // Format the date to IST
    const formattedDate = new Intl.DateTimeFormat('en-GB', options).format(date);

    return formattedDate.replace(',', ''); // Remove the comma between date and time
};


const sendemail = async (databaseName) => {
    const currentDate = getCurrentDate();
    const backupFilePath = path.join(__dirname, '..', 'backups', `${databaseName}_backup.gz`); // Adjust the path as necessary

    const mailOptions = {
        from: 'BattleFiesta <battlefiesta07@gmail.com>',
        to: 'kumar.jaikishan0@gmail.com',
        subject: `${databaseName} Backup - ${currentDate}`,
        html: "Backup",
        attachments: [
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
                console.log("Email sent - ", info.response)
                // Resolve the promise with true
                resolve(true);
            }
        });
    });
}

module.exports = sendemail;