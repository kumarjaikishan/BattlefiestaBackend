const User = require('../modals/login_schema');

const adminmiddleware = async (req, res, next) => {
    // console.log('admin check',req.user);
    if(!req.user.isAdmin){
        return next({ status: 403, message: "Forbidden: You are not an Admin" });
    }else{
        next();
    }
}

module.exports = adminmiddleware;