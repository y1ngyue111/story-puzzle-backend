// 内存存储房间数据（后续可替换为数据库）
let rooms = {}; // 结构：{ roomCode: { hostName, players, isStart, stage, images, records } }

// 生成6位房间号
exports.generateRoomCode = () => {
  let code;
  do {
    code = Math.floor(100000 + Math.random() * 900000).toString();
  } while (rooms[code]); // 确保房间号唯一
  return code;
};

// 创建房间
exports.createRoom = (hostName) => {
  const roomCode = this.generateRoomCode();
  rooms[roomCode] = {
    hostName,
    players: [], // 结构：[{ name, socketId }]
    isStart: false, // 游戏是否开始
    stage: 1, // 当前游戏阶段（1-7）
    images: [], // 存储图像URL
    records: [] // 存储录音URL
  };
  return roomCode;
};

// 验证房间是否存在
exports.checkRoomExists = (roomCode) => !!rooms[roomCode];

// 加入房间
exports.joinRoom = (roomCode, playerName) => {
  const room = rooms[roomCode];
  // 检查房间是否已开始
  if (room.isStart) throw new Error('游戏已开始，无法加入');
  // 检查昵称是否重复
  if (room.players.some(p => p.name === playerName)) throw new Error('该昵称已存在');
  
  room.players.push({ name: playerName });
  return {
    playerCount: room.players.length,
    players: room.players.map(p => p.name)
  };
};

// 获取房间信息
exports.getRoomInfo = (roomCode) => {
  const room = rooms[roomCode];
  return {
    roomCode,
    hostName: room.hostName,
    playerCount: room.players.length,
    players: room.players.map(p => p.name),
    isStart: room.isStart,
    stage: room.stage
  };
};

// 开始游戏
exports.startGame = (roomCode) => {
  const room = rooms[roomCode];
  if (!room) throw new Error('房间不存在');
  room.isStart = true;
  room.stage = 2; // 进入阶段2：语音叙事
  return { stage: room.stage };
};

// 切换游戏阶段
exports.changeStage = (roomCode, stage) => {
  const room = rooms[roomCode];
  if (!room) throw new Error('房间不存在');
  if (stage < 1 || stage > 7) throw new Error('无效的阶段');
  
  room.stage = stage;
  return { stage: room.stage };
};

// 存储房间图像
exports.addRoomImage = (roomCode, imageUrl) => {
  const room = rooms[roomCode];
  if (!room) throw new Error('房间不存在');
  room.images.push(imageUrl);
  return room.images;
};

// 存储房间录音
exports.addRoomRecord = (roomCode, recordUrl) => {
  const room = rooms[roomCode];
  if (!room) throw new Error('房间不存在');
  room.records.push(recordUrl);
  return room.records;
};