const express = require('express');
const router = express.Router();
const recordController = require('../controllers/recordController');
const multer = require('multer');

// 配置multer（处理文件上传）
const upload = multer({ storage: multer.memoryStorage() });

// 上传录音
router.post('/upload/:roomCode', upload.single('record'), recordController.uploadRecord);
// 提取关键词
router.post('/keywords', recordController.extractKeywords);

module.exports = router;