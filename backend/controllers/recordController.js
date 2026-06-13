const recordService = require('../../services/recordService');
const logger = require('../../utils/logger');
const roomService = require('../../services/roomService');

// 上传录音
exports.uploadRecord = async (req, res) => {
  try {
    const { roomCode } = req.params;
    const recordFile = req.file;
    
    // 1. 检查文件是否存在
    if (!recordFile) return res.status(400).json({ code: 400, message: '请上传录音文件' });
    
    // 2. 检查房间是否存在
    if (!roomService.checkRoomExists(roomCode)) {
      return res.status(404).json({ code: 404, message: '房间不存在' });
    }
    
    // 3. 调用服务保存录音
    const recordUrl = await recordService.saveAndLinkRecord(roomCode, recordFile);
    logger.info(`房间 ${roomCode} 上传录音: ${recordUrl}`);
    
    // 4. 返回结果
    res.status(200).json({
      code: 200,
      message: '录音上传成功',
      data: { recordUrl }
    });
  } catch (error) {
    logger.error('录音上传失败:', error.message);
    res.status(500).json({ code: 500, message: error.message });
  }
};

// 提取关键词
exports.extractKeywords = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ code: 400, message: '请传入叙事内容' });
    
    // 调用服务提取关键词
    const keywords = recordService.extractKeywords(content);
    
    res.status(200).json({
      code: 200,
      data: { keywords }
    });
  } catch (error) {
    logger.error('关键词提取失败:', error.message);
    res.status(500).json({ code: 500, message: '关键词提取失败' });
  }
};