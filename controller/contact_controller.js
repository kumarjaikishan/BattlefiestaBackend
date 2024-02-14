const user = require('../modals/contact_schema')

const contact = async (req, res, next) => {
    const { name, email, message } = req.body;

    try {
        const query = new user({ name, email, message });
        const result = await query.save();

        return res.status(201).json({
            msg: "Message registered"
        })
    } catch (error) {
        return next({ status: 400, message: error });
    }
}
const profile=async(req,res,next)=>{
    return  res.status(200).json({data:req.user})
}


module.exports = { contact,profile };