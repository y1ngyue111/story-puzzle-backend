// src/utils/api/room.js
import { http } from './http'

// 创建房间：对接真实后端接口
export function createRoom (hostName) {
  // 后端：POST /room/create   body: { hostName }
  return http.post('/room/create', { hostName })
}

// 加入房间：对接真实后端接口
export function joinRoom (roomCode, playerName) {
  // 后端：POST /room/join    body: { roomCode, playerName }
  return http.post('/room/join', { roomCode, playerName })
}

// 获取房间信息：对接真实后端接口
export function getRoomInfo (roomCode) {
  // 后端：GET /room/:roomCode
  return http.get(`/room/${roomCode}`)
}

// 启动游戏（目前先做“前端假动作”，后端还没路由的话，这个不会发请求）
export function startGame (roomCode) {
  console.log('【前端模拟】游戏开始：房间', roomCode)
  return Promise.resolve({ success: true })
}