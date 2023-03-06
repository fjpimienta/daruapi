const multer = require('multer');

function uploadFile() {
  const storage = multer.diskStorage({
    destination: './uploads/files',
    filename: function (_req, file, cb) {
      const extension = file.originalname.slice(file.originalname.lastIndexOf('.'));
      cb(null, Date.now() + extension);
    }
  })

  const upload = multer({
    storage,
    limits: { fileSize: 1048576, files: 4 },
    fileFilter: function (_req, file, cb) {
      const type = file.mimetype.startsWith('image/');
      type ? cb(null, true) : cb(new Error('No es un archivo de tipo imagen'));
    }
  }).array('files');

  return upload;
}

module.exports = uploadFile;