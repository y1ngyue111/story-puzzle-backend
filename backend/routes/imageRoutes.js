const express = require('express');
const router = express.Router();
const imageController = require('../controllers/imageController');

// 生成图像
router.post('/generate', imageController.generateImage);
// 获取房间图像列表
router.get('/room/:roomCode', imageController.getRoomImages);

module.exports = router;