const uploader = require("../../utilities/singleUploader");

const avatarUpload = (req, res, next) => {
  const upload = uploader(
    "avatars",
    ["image/jpeg", "image/jpg", "image/png"],
    1 * 1024 * 1024, // 1MB
    "Only .jpg, .jpeg, or .png formats are allowed!"
  );

  upload.single("avatar")(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        errors: {
          avatar: {
            message: err.message,
          },
        },
      });
    }
    next();
  });
};

module.exports = avatarUpload;
