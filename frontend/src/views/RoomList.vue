<template>
    <div class="room-list-page">
      <h2>请选择房间加入</h2>
      <div v-if="rooms.length === 0">暂无可加入的房间</div>
      <div v-for="room in rooms" :key="room.roomCode" class="room-card">
        <p>房间码：{{ room.roomCode }}</p>
        <p>主持人：{{ room.hostName }}</p>
        <p>玩家数：{{ room.playerCount }}</p>
        <van-button type="primary" block @click="joinRoom(room.roomCode)">
          加入房间
        </van-button>
      </div>
      <div class="create-room">
        <van-button type="success" block @click="createRoom">创建新房间</van-button>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { io } from 'socket.io-client'
  import { API_ORIGIN } from '@/utils/api/base'
  
  const router = useRouter()
  const rooms = ref([])
  
  const BACKEND_ORIGIN = API_ORIGIN
  const socket = io(BACKEND_ORIGIN)
  
  onMounted(() => {
    socket.emit('get_rooms')
    socket.on('rooms_list', (list) => {
      rooms.value = list
    })
  })
  
  const joinRoom = (roomCode) => {
    const playerName = prompt('请输入昵称') || '玩家'
    router.push({ name: 'PlayerMobile', query: { roomCode, playerName } })
  }
  
  const createRoom = () => {
    const playerName = prompt('请输入昵称') || '玩家'
    socket.emit('create_room', { playerName }, (roomCode) => {
      router.push({ name: 'PlayerMobile', query: { roomCode, playerName } })
    })
  }
  </script>
  
  <style scoped>
  .room-card {
    padding: 12px;
    border: 1px solid #ccc;
    border-radius: 12px;
    margin-bottom: 10px;
    background: #fff;
  }
  .create-room {
    margin-top: 20px;
  }
  </style>
