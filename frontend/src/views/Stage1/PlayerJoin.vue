<template>
  <div class="player-join-page">
    <h2>请选择要加入的房间</h2>

    <van-field v-model="playerName" label="昵称" placeholder="输入你的昵称" />

    <div class="room-list">
      <div
        v-for="room in rooms"
        :key="room.roomCode"
        class="room-card"
        @click="joinRoom(room.roomCode)"
      >
        <p>房间码: {{ room.roomCode }}</p>
        <p>主持人: {{ room.hostName }}</p>
        <p>当前发言人: {{ room.currentSpeaker || '未分配' }}</p>
        <p>人数: {{ room.players.length }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { Toast } from 'vant'
import { apiUrl } from '@/utils/api/base'

const router = useRouter()
const playerName = ref('')
const rooms = ref([])

const fetchRooms = async () => {
  try {
    const res = await axios.get(apiUrl('/api/rooms'))
    if (res.data.code === 200) rooms.value = res.data.data
  } catch (err) {
    console.error('获取房间列表失败:', err)
    Toast.fail('获取房间列表失败，请稍后重试')
  }
}

const joinRoom = (roomCode) => {
  if (!playerName.value.trim()) {
    Toast.fail('请先输入昵称')
    return
  }
  router.push({ 
    path: '/player-mobile', 
    query: { roomCode, playerName: playerName.value.trim() } 
  })
}

onMounted(fetchRooms)
</script>

<style scoped>
.room-list { display: flex; flex-direction: column; gap: 12px; margin-top: 16px; }
.room-card { padding: 12px; background: #f4f8f3; border-radius: 12px; cursor: pointer; }
.room-card:hover { background: #e0f0e2; }
</style>
