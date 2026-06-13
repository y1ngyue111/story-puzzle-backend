const axios = require('axios');
const config = require('../config');
const logger = require('./logger');

// 调用AI接口生成图像
exports.generateImage = async (content) => {
  try {
    const response = await axios.post(
      config.ai.apiUrl,
      { prompt: content, size: '512x512' },
      {
        headers: {
          'Authorization': `Bearer ${config.ai.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data.data[0].url; // 假设AI返回的图像URL在该路径
  } catch (error) {
    logger.error('AI图像生成失败:', error.message);
    throw new Error('图像生成失败，请重试');
  }
};
