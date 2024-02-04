const errorHandle =(err,req,res,next)=>{
    const status = err.status || 500;
    const msg = err.message || "Backend Error";

    return res.status(status).json({ msg:msg });
};
module.exports = errorHandle;