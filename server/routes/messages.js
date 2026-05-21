const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { getMessages, getFiles } = require('../db');
const { requireAuth } = require('../auth');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.docx', '.xlsx', '.jpg', '.jpeg', '.png', '.mp3', '.mp4', '.webm'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

router.get('/project/:projectId', (req, res) => {
  const messages = getMessages.all(req.params.projectId);
  res.json(messages);
});

router.get('/files/:projectId', (req, res) => {
  const files = getFiles.all(req.params.projectId);
  res.json(files);
});

router.post('/upload', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file or invalid type' });
  res.json({
    fileName: req.file.originalname,
    filePath: req.file.filename,
    fileSize: req.file.size,
    mimeType: req.file.mimetype,
  });
});

module.exports = { router, upload };
