import multer from 'multer';
import path from 'path';
const storage = multer.memoryStorage();

function checkFileType(file, cb) {
  const filetypes = /jpeg|jpg|png/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb('Images only!');
  }
}

const upload = multer({
  storage,
  limits: {
    fileSize: 2000000,
  },
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

export default upload;
