const cloudinaryImageUploadMethod = async (file, folder) => {
  return new Promise((resolve) => {
    cloudinary.uploader.upload(file, { folder }, (error, result) => {
      if (error) {
        return res
          .status(401)
          .json({ success: false, message: "Hình ảnh bị lỗi" });
      }
      resolve({
        url: result.url,
        id: result.public_id,
        folder: result.folder,
      });
    });
  });
};

module.exports = cloudinaryImageUploadMethod;
