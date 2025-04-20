const user = require('../modals/login_schema');
// const {addJobToQueue} = require('../utils/producer')
const { addtoqueue } = require('../utils/axiosRequest');
const sendmail = require('../utils/sendemail');
const verificationTemplate = require('../templates/verification');

const emailmiddleware = async (req, res, next) => {
  try {
    const query = await user.findOne({ email: req.body.email });
    // console.log("email auth",query);
    if (!query) {
      return next({ status: 400, message: "User not found" });
    }
    if (query.isverified) {
      next();
    } else {
      const message = verificationTemplate(query.name, query._id)
      await addtoqueue(query.email, 'Email Verification || BattleFiesta', message)
      // await addJobToQueue(query.email, 'Email Verification || BattleFiesta', message)
      // await sendmail(query.email, 'Email Verification || BattleFiesta', message) ;
      return res.status(201).json({
        message: "Email Sent",
      })
    }
  } catch (error) {
    console.log(error);
    return next({ status: 500, message: error });
  }
}



module.exports = emailmiddleware;