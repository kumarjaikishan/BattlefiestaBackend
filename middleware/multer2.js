const multer = require("multer");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // cb(null, "./uploads");
        return cb(null, "/tmp");
    },
    filename: function (req, file, cb) {
        const uniquename = `${Date.now()}-${file.originalname}`;
        cb(null, uniquename);
    },
})

const fileFilter = (req, file, cb) => {
    if (file.fieldname === "teamLogo" || file.fieldname === "paymentScreenshot") {
        cb(null, true);
    } else {
        cb(null, false);
    }
};

const upload2 = multer({ 
    storage: storage,
    fileFilter: fileFilter
});

module.exports = upload2;
