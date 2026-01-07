const mongo = require('mongoose');

mongo.set('strictQuery', false);

const connectDB = async () => {
    try {
        // mongo.connect(process.env.db).then(() => {
        //     console.log("connection to Mongodb successful");
        // }).catch((e) => {
        //     console.log(e)
        // })
       await  mongo.connect(process.env.db);
        console.log("✅ MongoDB connected");
    } catch (error) {
        console.error("❌ MongoDB connection failed");
        throw err;
    }
}

module.exports = connectDB;