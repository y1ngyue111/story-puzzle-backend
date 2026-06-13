const fs = require('fs');
const path = require('path');
const config = require('../config');
const logger = require('./logger');

// 确保存储目录存在
const initDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    logger.info(`创建存储目录: ${dirPath}`);
  }
};

// 初始化所有存储目录
initDir(config.storage.imagePath);
initDir(config.storage.recordPath);

// 保存图像文件（示例：从URL下载到本地）
exports.saveImage = async (imageUrl, roomCode) => {
  const axios = require('axios');
  const imageName = `${roomCode}_${Date.now()}.png`;
  const imagePath = path.join(config.storage.imagePath, imageName);
  
  const response = await axios({ url: imageUrl, responseType: 'stream' });
  response.data.pipe(fs.createWriteStream(imagePath));
  
  return new Promise((resolve, reject) => {
    response.data.on('end', () => resolve(`/uploads/images/${imageName}`));
    response.data.on('error', (err) => reject(err));
  });
};

// 保存录音文件
exports.saveRecord = (file, roomCode) => {
  const recordName = `${roomCode}_${Date.now()}.mp3`;
  const recordPath = path.join(config.storage.recordPath, recordName);
  const writeStream = fs.createWriteStream(recordPath);
  
  return new Promise((resolve, reject) => {
    file.pipe(writeStream);
    writeStream.on('finish', () => resolve(`/uploads/records/${recordName}`));
    writeStream.on('error', (err) => reject(err));
  });
};