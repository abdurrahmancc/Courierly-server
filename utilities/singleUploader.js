const multer = require("multer");
const path = require("path");
const fs = require("fs");
const createError = require("http-errors");

const uploader = (subfolder_path, allowed_file_types, max_file_size, error_msg) => {
  const UPLOADS_FOLDER = path.join(__dirname, `/../../public/images/${subfolder_path}/`);

  // ensure folder exists
  if (!fs.existsSync(UPLOADS_FOLDER)) {
    fs.mkdirSync(UPLOADS_FOLDER, { recursive: true });
  }

  // define storage strategy
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, UPLOADS_FOLDER);
    },
    filename: (req, file, cb) => {
      const fileExt = path.extname(file.originalname);
      const fileName =
        file.originalname.replace(fileExt, "").toLowerCase().split(" ").join("-") +
        "-" +
        Date.now();
      cb(null, fileName + fileExt);
    },
  });

  // create multer upload object
  const upload = multer({
    storage,
    limits: {
      fileSize: max_file_size,
    },
    fileFilter: (req, file, cb) => {
      if (allowed_file_types.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(createError(error_msg));
      }
    },
  });

  return upload;
};

module.exports = uploader;
