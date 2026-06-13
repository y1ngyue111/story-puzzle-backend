const Room = require('../models/Room')

// 创建房间
exports.createRoom = async (req, res) => {
  try {
    const { hostName } = req.body || {}
    const name = (hostName || '').trim()
    if (!name) {
      return res.status(400).json({ code: 400, message: '主持人昵称不能为空' })
    }

    // 尝试多次生成不重复的 6 位房间号
    const tryMake = async (times = 3) => {
      for (let i = 0; i < times; i++) {
        const roomCode = Math.floor(100000 + Math.random() * 900000).toString()
        try {
          await Room.create({
            roomCode,
            hostName: name,
            players: [],
            gameStatus: 'waiting'
          })
          console.log(`房间创建成功：${roomCode}（主持人：${name}）`)
          return roomCode
        } catch (e) {
          if (e?.code === 11000 && i < times - 1) continue // 房间码重复，重试
          throw e
        }
      }
      throw new Error('无法生成唯一房间码')
    }

    const roomCode = await tryMake()
    return res.status(200).json({
      code: 200,
      message: '房间创建成功',
      data: { roomCode, hostName: name }
    })
  } catch (err) {
    console.error('创建房间失败：', err.message)
    return res.status(500).json({ code: 500, message: '创建房间失败', error: err.message })
  }
}

// 玩家加入房间
exports.joinRoom = async (req, res) => {
  try {
    const { roomCode, playerName } = req.body || {}
    const name = (playerName || '').trim()
    if (!roomCode || !name) {
      return res.status(400).json({ code: 400, message: '房间码和玩家昵称不能为空' })
    }

    const room = await Room.findOne({ roomCode })
    if (!room) {
      return res.status(404).json({ code: 404, message: '房间不存在' })
    }

    if (room.players.some(p => p.playerName === name)) {
      return res.status(400).json({ code: 400, message: '该昵称已在房间内' })
    }

    // 添加玩家到房间
    room.players.push({ playerName: name, progress: 0, joinedAt: new Date() })
    await room.save()

    console.log(`玩家加入房间：${name} → ${roomCode}`)

    // 👇 新增：通过 Socket.io 通知主持人
    const io = req.app.get('io') // 从 app 中获取 io 实例
    if (io) {
      io.to(roomCode).emit('playerJoined', {
        playerName: name,
        roomCode,
        players: room.players, // 最新的玩家列表
        timestamp: new Date().toISOString()
      })
      console.log(`[WS] 通知房间 ${roomCode} 的主持人：玩家 ${name} 已加入`)
    }

    return res.status(200).json({
      code: 200,
      message: '加入房间成功',
      data: { roomCode, playerName: name, roomStatus: room.gameStatus }
    })
  } catch (err) {
    console.error('加入房间失败：', err.message)
    return res.status(500).json({ code: 500, message: '加入房间失败', error: err.message })
  }
}

// 获取房间信息
exports.getRoomInfo = async (req, res) => {
  try {
    const { roomCode } = req.params
    const room = await Room.findOne({ roomCode })
    if (!room) {
      return res.status(404).json({ code: 404, message: '房间不存在' })
    }

    return res.status(200).json({
      code: 200,
      data: {
        roomCode: room.roomCode,
        hostName: room.hostName,
        puzzleConfig: room.puzzleConfig,
        players: room.players,
        gameStatus: room.gameStatus,
        createdAt: room.createdAt,
        updatedAt: room.updatedAt
      }
    })
  } catch (err) {
    console.error('获取房间信息失败：', err.message)
    return res.status(500).json({ code: 500, message: '获取房间信息失败', error: err.message })
  }
}

// 👇 新增：更新游戏状态（开始游戏）
exports.updateGameStatus = async (req, res) => {
  try {
    const { roomCode, status } = req.body || {}
    if (!roomCode || !['waiting', 'playing', 'finished'].includes(status)) {
      return res.status(400).json({ code: 400, message: '无效的房间码或状态' })
    }

    const room = await Room.findOne({ roomCode })
    if (!room) {
      return res.status(404).json({ code: 404, message: '房间不存在' })
    }

    room.gameStatus = status
    await room.save()

    console.log(`房间 ${roomCode} 状态更新为：${status}`)

    // 通过 Socket.io 通知所有玩家
    const io = req.app.get('io')
    if (io) {
      io.to(roomCode).emit('gameStatusUpdated', {
        roomCode,
        status,
        timestamp: new Date().toISOString()
      })
      console.log(`[WS] 通知房间 ${roomCode} 的所有玩家：游戏状态已更新为 ${status}`)
    }

    return res.status(200).json({
      code: 200,
      message: '游戏状态更新成功',
      data: { roomCode, status }
    })
  } catch (err) {
    console.error('更新游戏状态失败：', err.message)
    return res.status(500).json({ code: 500, message: '更新游戏状态失败', error: err.message })
  }
}

// 👇 新增：更新玩家拼图进度
exports.updatePlayerProgress = async (req, res) => {
  try {
    const { roomCode, playerName, progress } = req.body || {}
    const name = (playerName || '').trim()
    if (!roomCode || !name || progress === undefined || progress < 0 || progress > 100) {
      return res.status(400).json({ code: 400, message: '无效的参数' })
    }

    const room = await Room.findOne({ roomCode })
    if (!room) {
      return res.status(404).json({ code: 404, message: '房间不存在' })
    }

    const player = room.players.find(p => p.playerName === name)
    if (!player) {
      return res.status(404).json({ code: 404, message: '玩家不在房间内' })
    }

    player.progress = progress
    await room.save()

    console.log(`房间 ${roomCode} 玩家 ${name} 进度更新为：${progress}%`)

    // 通过 Socket.io 通知主持人
    const io = req.app.get('io')
    if (io) {
      io.to(roomCode).emit('playerProgressUpdated', {
        roomCode,
        playerName: name,
        progress,
        players: room.players, // 最新的所有玩家进度
        timestamp: new Date().toISOString()
      })
      console.log(`[WS] 通知房间 ${roomCode} 的主持人：玩家 ${name} 进度已更新为 ${progress}%`)
    }

    return res.status(200).json({
      code: 200,
      message: '进度更新成功',
      data: { roomCode, playerName: name, progress }
    })
  } catch (err) {
    console.error('更新玩家进度失败：', err.message)
    return res.status(500).json({ code: 500, message: '更新玩家进度失败', error: err.message })
  }
}