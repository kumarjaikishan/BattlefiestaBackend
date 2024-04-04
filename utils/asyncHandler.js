const asyncHandler = (func)=>{
    return (req,res,next)=>{
        func(req,res,next).catch(err=> {
            console.log("error log from asynchandler:",err.message);
            next(err)});
    }
}
module.exports = asyncHandler;