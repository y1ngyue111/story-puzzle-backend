<template>
    <div class="room-manage-page">
      <van-nav-bar title="房间管理" left-text="退出" @click-left="handleQuit" />
  
      <!-- 房间信息卡片 -->
      <div class="room-info-card">
        <h2 class="room-title">当前房间</h2>
  
        <!-- 房间码大字体展示（核心） -->
        <div class="room-code-container">
          <span class="code-label">房间码</span>
          <div class="room-code">{{ roomCode }}</div>
          <p class="code-tip">玩家输入上方6位房间码加入游戏</p>
        </div>
  
        <!-- 主持人信息 -->
        <div class="host-info">
          <span class="label">主持人：</span>
          <span class="value">{{ hostName }}</span>
        </div>
  
        <!-- 玩家列表 -->
        <div class="players-section">
          <h3 class="section-title">已加入玩家（{{ players.length }}人）</h3>
          <div class="players-list" v-if="players.length > 0">
            <div class="player-item" v-for="(player, idx) in players" :key="idx">
              <van-icon name="user-o" class="player-icon" />
              <span class="player-name">{{ player.playerName }}</span>
              <span class="player-status">
                {{ gameStarted ? '游戏中' : '等待游戏开始' }}
              </span>
            </div>
          </div>
          <div class="no-players" v-else>
            暂无玩家加入，等待玩家输入房间码...
          </div>
        </div>
  
        <!-- 开始游戏按钮（只有有玩家时才能点） -->
        <van-button
          type="primary"
          block
          class="start-game-btn"
          @click="handleStartGame"
          :loading="isStarting"
          :disabled="players.length === 0"
        >
          开始游戏
        </van-button>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { Toast } from 'vant'
  import { getRoomInfo } from '@/utils/api/room'
  
  const router = useRouter()
  const route = useRoute()
  
  // 从路由获取房间码和主持人昵称
  const roomCode = ref(route.query.roomCode || '')
  const hostName = ref(route.query.hostName || '主持人')
  
  const players = ref([])        // 玩家列表
  const isLoading = ref(false)   // 拉房间信息 loading
  const isStarting = ref(false)  // 开始游戏按钮 loading
  const gameStarted = ref(false) // 标记游戏是否已开始（先本地状态）
  
  // ① 获取房间信息（包括玩家列表）
  const fetchRoomInfo = async () => {
    if (!roomCode.value) return
    try {
      isLoading.value = true
      const res = await getRoomInfo(roomCode.value)
      console.log('getRoomInfo 返回：', res)
  
      // axios 返回的是 res.data.code / res.data.data
      if (res.data?.code === 200 && res.data.data) {
        const data = res.data.data
        players.value = data.players || []
        if (data.hostName) {
          hostName.value = data.hostName
        }
      } else {
        Toast.fail(res.data?.message || '获取房间信息失败')
      }
    } catch (err) {
      console.error('获取房间信息出错：', err)
      Toast.fail('获取房间信息失败')
    } finally {
      isLoading.value = false
    }
  }
  
  // ② 开始游戏：主持人自己也跳到拼图页，并带 isHost 标记
  const handleStartGame = () => {
    if (!players.value.length) {
      Toast.fail('至少需要一名玩家才能开始游戏')
      return
    }
  
    isStarting.value = true
    try {
      gameStarted.value = true
      Toast.success('游戏开始，跳转到拼图页面～')
  
      console.log('开始游戏：roomCode =', roomCode.value)
  
      router.push({
        name: 'PlayerMobile',  // 对应 router/index.js 里定义的名字
        query: {
          roomCode: roomCode.value,
          playerName: hostName.value || '主持人',
          isHost: '1'          // ⭐ 关键：告诉 PlayerMobile“我是主持人”
        }
      })
    } finally {
      isStarting.value = false
    }
  }
  
  // ③ 退出房间
  const handleQuit = () => {
    if (confirm('确定退出房间吗？退出后玩家将无法继续游戏')) {
      router.push('/host')
    }
  }
  
  // ④ 初始化：进入页面时拉一次房间信息 + 定时刷新（临时方案）
  onMounted(() => {
    if (!roomCode.value) {
      Toast.fail('房间码无效')
      router.push('/host')
      return
    }
    fetchRoomInfo()
    // 每隔5秒刷新一次玩家列表（后续可以用 WebSocket 替代）
    setInterval(fetchRoomInfo, 5000)
  })
  </script>
  
  <style scoped>
  .room-manage-page {
    padding: 20px;
    min-height: 100vh;
    background: #f9fafb;
  }
  
  .room-info-card {
    background: #fff;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  }
  
  .room-title {
    font-size: 20px;
    font-weight: 600;
    color: #333;
    margin-bottom: 24px;
    text-align: center;
  }
  
  .room-code-container {
    text-align: center;
    margin-bottom: 32px;
  }
  
  .code-label {
    font-size: 16px;
    color: #666;
    margin-bottom: 8px;
    display: block;
  }
  
  .room-code {
    font-size: 48px;
    font-weight: 700;
    color: #1989fa;
    letter-spacing: 8px;
    margin: 12px 0;
    font-family: 'Arial', sans-serif;
  }
  
  .code-tip {
    font-size: 14px;
    color: #999;
  }
  
  .host-info {
    font-size: 16px;
    color: #333;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid #f0f0f0;
  }
  
  .label {
    color: #666;
    margin-right: 8px;
  }
  
  .section-title {
    font-size: 18px;
    font-weight: 600;
    color: #333;
    margin-bottom: 16px;
  }
  
  .players-list {
    margin-bottom: 24px;
  }
  
  .player-item {
    display: flex;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #f5f5f5;
  }
  
  .player-icon {
    font-size: 20px;
    color: #1989fa;
    margin-right: 12px;
  }
  
  .player-name {
    font-size: 16px;
    color: #333;
    flex: 1;
  }
  
  .player-status {
    font-size: 14px;
    color: #999;
  }
  
  .no-players {
    text-align: center;
    padding: 24px;
    color: #999;
    font-size: 16px;
    background: #fafafa;
    border-radius: 8px;
    margin-bottom: 24px;
  }
  
  .start-game-btn {
    height: 52px;
    font-size: 18px;
    border-radius: 12px;
    background: #1989fa;
    border: none;
  }
  
  .start-game-btn:disabled {
    background: #e0e0e0;
    cursor: not-allowed;
  }
  </style>
  