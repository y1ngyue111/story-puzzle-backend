// src/services/wsService.js
import WebSocket from 'ws';

const wss = new WebSocket.Server({ port: 8080 });
const roomClients = new Map(); // 房间码 → 客户端连接列表

// 处理新连接
wss.on('connection', (ws, req) => {
  const roomCode = new URL(req.url, 'http://localhost').searchParams.get('roomCode');
  if (!roomCode) return ws.close();

  // 加入房间连接列表
  if (!roomClients.has(roomCode)) {
    roomClients.set(roomCode, new Set());
  }
  roomClients.get(roomCode).add(ws);

  // 转发进度更新
  ws.on('message', (data) => {
    const { playerName, progress } = JSON.parse(data);
    roomClients.get(roomCode).forEach(client => {
      if (client !== ws) { // 不发给自己
        client.send(JSON.stringify({ playerName, progress }));
      }
    });
  });

  // 断开连接清理
  ws.on('close', () => {
    roomClients.get(roomCode).delete(ws);
    if (roomClients.get(roomCode).size === 0) {
      roomClients.delete(roomCode);
    }
  });
});

// 对外暴露发送进度的方法
export const sendProgressUpdate = (roomCode, playerName, progress) => {
  if (roomClients.has(roomCode)) {
    roomClients.get(roomCode).forEach(ws => {
      ws.send(JSON.stringify({ playerName, progress }));
    });
  }
};
