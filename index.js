require('dotenv').config();
const express = require('express');
const app = express();
const connectDB = require('./conn/conn');
require('./utils/nodecron.js')
// require('./utils/worker')
const limiter = require('./config/ratelimiter.js')
const port = process.env.PORT || 5002;
const cors = require('cors');
const route = require('./router/route');
const errorHandle = require('./utils/error_util');
const { loadAllCronJobs } = require('./controller/backup_controller.js');
const { webhook } = require('./services/payment.js');

app.use(cors());

app.post(
  "/api/webhook",
  express.raw({ type: "application/json" }),
  webhook
);

app.use(express.json());
// app.use(limiter);
app.use("/api", route);
app.use(errorHandle);


app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found, kindly Re-Check api End point' });
});


(async () => {
  try {
    await connectDB();
    app.listen(port, () => {
      console.log(`server listening at ${port}`);
      // call this once when server starts
      loadAllCronJobs();
    })
  } catch (error) {
    console.error("🔥 Server NOT started due to DB failure");
    process.exit(1);
  }
})()
