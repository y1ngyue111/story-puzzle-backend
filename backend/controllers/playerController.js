import Room from '../src/models/Room';

exports.joinRoom = async (req, res, next) => {
  try {
    const { roomCode, playerName } = req.body;
    if (!playerName || playerName.trim() === '') {
      return res.status(400).json({ success: false, message: '昵称不能为空' });
    }

    const room = await Room.findOne({ roomCode });
    if (!room) {
      return res.status(404).json({ success: false, message: '房间不存在' });
    }

    // 避免重复加入
    const isDuplicate = room.players.some(p => p.playerName === playerName);
    if (isDuplicate) {
      return res.status(400).json({ success: false, message: '该昵称已在房间内' });
    }

    // 添加玩家并初始化进度
    room.players.push({
      playerName,
      progress: 0,
      joinedAt: new Date()
    });
    await room.save();

    res.json({
      success: true,
      roomConfig: room.puzzleConfig,
      playerName
    });
  } catch (err) {
    next(err);
  }
};