const multer = require('multer')
const { v4: uuidv4 } = require('uuid')
const path = require('path')

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/images/uploads/');   // file upload destination
    },

    filename: function (req, file, cb) {
        const uniqueFilename = uuidv4();
        cb(null, uniqueFilename+path.extname(file.originalname));   // unique filename for each uploaded file with extension name
    }
});

const upload = multer({ storage: storage });

module.exports = upload;