const User = require('../modals/login_schema');

const adminmiddleware = async (req, res, next) => {
    // console.log(req.user);
    if(!req.user.isadmin){
        return next({ status: 403, message: "You are not Admin" });
    }else{
        next();
    }
}

module.exports = adminmiddleware;