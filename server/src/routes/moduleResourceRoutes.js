const express = require('express');
const router = express.Router();
const moduleResourceController = require('../controller/moduleResourceController');
const { upload } = require('../middleware/uploadModuleResource');

function handleMulterError(err, req, res, next) {
  if (!err) return next();
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large (max 25 MB)' });
  }
  return res.status(400).json({ error: err.message || 'Upload failed' });
}

router.get('/:id/download', moduleResourceController.download);

router.get('/', moduleResourceController.listByModule);

router.post(
  '/',
  (req, res, next) => {
    const ct = req.headers['content-type'] || '';
    if (ct.includes('multipart/form-data')) {
      upload.single('document')(req, res, (err) => {
        if (err) return handleMulterError(err, req, res, next);
        moduleResourceController.create(req, res);
      });
    } else {
      next();
    }
  },
  moduleResourceController.create
);

router.put(
  '/:id',
  (req, res, next) => {
    const ct = req.headers['content-type'] || '';
    if (ct.includes('multipart/form-data')) {
      upload.single('document')(req, res, (err) => {
        if (err) return handleMulterError(err, req, res, next);
        moduleResourceController.update(req, res);
      });
    } else {
      next();
    }
  },
  moduleResourceController.update
);

router.delete('/:id', moduleResourceController.destroy);

module.exports = router;
