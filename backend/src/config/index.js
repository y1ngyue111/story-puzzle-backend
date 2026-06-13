require('dotenv').config();
const path = require('path');

module.exports = {
  // 服务器配置
  server: {
    port: process.env.PORT || 3000,
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
  },
  // AI配置
  ai: {
    apiUrl: process.env.AI_API_URL,
    apiKey: process.env.AI_API_KEY
  },
  // 存储配置
  storage: {
    imagePath: path.resolve(__dirname, '../', process.env.IMAGE_SAVE_PATH || './uploads/images/'),
    recordPath: path.resolve(__dirname, '../', process.env.RECORD_SAVE_PATH || './uploads/records/')
  }
};