require('dotenv').config();
const express = require('express');
const app = express();
require('./conn/conn')
require('./utils/nodecron.js')
// require('./utils/worker')
const limiter = require('./config/ratelimiter.js')
const port = process.env.PORT || 5002;
const cors = require('cors');
const route = require('./router/route');
const errorHandle = require('./utils/error_util');

app.use(express.json());
app.use(cors());
app.use(limiter);
app.use("/api", route);
app.use(errorHandle);


app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found, kindly Re-Check api End point' });
});

app.listen(port, () => {
  console.log(`server listening at ${port}`);
})
