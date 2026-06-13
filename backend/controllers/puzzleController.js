const puzzleService = require('../../services/puzzleService');
const logger = require('../../utils/logger');
const roomService = require('../../services/roomService');

// 生成并分配拼图
exports.generateAndAssignPuzzle = async (req, res) => {
  try {
    const { roomCode } = req.params;
    
    // 1. 检查房间是否存在
    if (!roomService.checkRoomExists(roomCode)) {
      return res.status(404).json({ code: 404, message: '房间不存在' });
    }
    
    // 2. 获取房间图像（取最后一张生成拼图）
    const roomInfo = roomService.getRoomInfo(roomCode);
    if (roomInfo.images.length === 0) {
      return res.status(400).json({ code: 400, message: '房间暂无图像，无法生成拼图' });
    }
    const lastImageUrl = roomInfo.images[roomInfo.images.length - 1];
    
    // 3. 生成拼图碎片
    const pieces = puzzleService.generatePuzzlePieces(lastImageUrl);
    // 4. 分配给玩家
    const playerPieces = puzzleService.assignPiecesToPlayers(roomInfo.players, pieces);
    logger.info(`房间 ${roomCode} 生成并分配拼图`);
    
    // 5. 返回结果
    res.status(200).json({
      code: 200,
      data: { playerPieces, totalPieces: pieces.length }
    });
  } catch (error) {
    logger.error('拼图生成失败:', error.message);
    res.status(500).json({ code: 500, message: error.message });
  }
};

// 验证拼图完成状态
exports.checkPuzzleComplete = async (req, res) => {
  try {
    const { pieces } = req.body;
    if (!pieces || !Array.isArray(pieces)) {
      return res.status(400).json({ code: 400, message: '请传入拼图碎片列表' });
    }
    
    // 验证是否完成
    const isComplete = puzzleService.checkPuzzleComplete(pieces);
    
    res.status(200).json({
      code: 200,
      data: { isComplete }
    });
  } catch (error) {
    logger.error('拼图验证失败:', error.message);
    res.status(500).json({ code: 500, message: '拼图验证失败' });
  }
};