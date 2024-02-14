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
        return next({ status: 500, message: error });
    }
}
const profile = async (req, res, next) => {
    return res.status(200).json({ data: req.user })
}
const updateprofile = async (req, res, next) => {
    const { name, username, email, phone, bio, publicemail, publicphone, sociallinks } = req.body;
    try {
        const query = user.findByIdAndUpdate({ _id: req.userid }, { name, username, email, phone, bio, publicemail, publicphone, sociallinks })
          if(!query){
            return next({ status: 400, message: "something wrong" });
          }
          return res.status(200).json({
            msg:"ok"
          })
    } catch (error) {
    return next({ status: 500, message: error });
}
}


module.exports = { contact, profile, updateprofile };