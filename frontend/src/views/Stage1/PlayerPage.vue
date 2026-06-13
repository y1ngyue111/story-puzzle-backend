<template>
  <div class="player-page">
    <van-nav-bar
      title="加入拼图游戏"
      left-text="返回"
      left-arrow
      @click-left="goBackToHome"
    />

    <div class="page-content">
      <div class="hero-card">
        <div class="hero-badge">多人协作</div>
        <div class="hero-title">输入房间号，进入拼图挑战</div>
        <div class="hero-desc">
          和房间里的其他玩家一起完成拼图，后面还会进入轻量提问环节。
        </div>
      </div>

      <div class="join-form-card">
        <div class="section-title">房间信息</div>

        <van-field
          v-model="roomCode"
          label="房间号"
          placeholder="请输入6位数字房间号"
          maxlength="6"
          type="digit"
          class="custom-field"
        />

        <van-field
          v-model="playerName"
          label="你的昵称"
          placeholder="请输入你的游戏昵称"
          maxlength="8"
          class="custom-field"
        />

        <div class="tips-row">
          <span>房间号需为 6 位数字</span>
          <span>昵称建议 2-8 个字</span>
        </div>

        <van-button
          type="primary"
          block
          class="join-btn"
          :disabled="!roomCode || !playerName"
          @click="handleJoinRoom"
        >
          加入游戏
        </van-button>
      </div>

      <div v-if="joinSuccess" class="success-card">
        <div class="success-icon-wrap">
          <van-icon name="success" color="#4cd964" size="42" />
        </div>
        <div class="success-title">加入房间成功</div>
        <div class="success-desc">
          你已进入房间 {{ roomCode }}，可以开始进入拼图游戏了。
        </div>

        <div class="success-info">
          <div class="info-item">
            <span class="info-label">房间号</span>
            <span class="info-value">{{ roomCode }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">昵称</span>
            <span class="info-value">{{ playerName }}</span>
          </div>
        </div>

        <van-button
          type="success"
          block
          class="enter-game-btn"
          @click="goToGamePuzzle"
        >
          进入拼图游戏
        </van-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Toast } from 'vant'
import { joinRoom } from '@/utils/api/room'

const roomCode = ref('')
const playerName = ref('')
const joinSuccess = ref(false)
const router = useRouter()

watch(roomCode, (v) => {
  if (v) roomCode.value = v.replace(/\D+/g, '')
})

const handleJoinRoom = async () => {
  if (!/^\d{6}$/.test(roomCode.value)) {
    Toast.fail('请输入6位数字房间号')
    return
  }

  if (!playerName.value.trim()) {
    Toast.fail('请输入昵称')
    return
  }

  try {
    await joinRoom(roomCode.value, playerName.value)
    joinSuccess.value = true
    Toast.success('加入房间成功！')
  } catch (err) {
    Toast.fail(err?.message || '加入房间失败，请重试')
  }
}

const goToGamePuzzle = () => {
  router.push({
    path: '/game-puzzle',
    query: {
      roomCode: roomCode.value,
      playerName: playerName.value,
      isHost: 'false',
    },
  })
}

const goBackToHome = () => {
  router.push({ name: 'HostPrepare' })
}
</script>

<style scoped>
.player-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f7f8fa 0%, #eef3ff 100%);
  padding-bottom: 32px;
}

.page-content {
  padding: 16px;
}

.hero-card {
  background: linear-gradient(135deg, #5b8cff 0%, #7aa8ff 100%);
  color: #fff;
  border-radius: 18px;
  padding: 18px 16px;
  box-shadow: 0 10px 24px rgba(91, 140, 255, 0.22);
  margin-bottom: 16px;
}

.hero-badge {
  display: inline-block;
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  margin-bottom: 10px;
}

.hero-title {
  font-size: 20px;
  font-weight: 700;
  line-height: 1.4;
  margin-bottom: 8px;
}

.hero-desc {
  font-size: 13px;
  line-height: 1.7;
  opacity: 0.95;
}

.join-form-card {
  background: #fff;
  border-radius: 18px;
  padding: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #222;
  margin-bottom: 12px;
}

.custom-field {
  margin-bottom: 10px;
  border-radius: 12px;
  overflow: hidden;
  background: #fafbff;
}

.tips-row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 12px;
  color: #888;
  margin-top: 4px;
  margin-bottom: 18px;
}

.join-btn {
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 12px;
}

.success-card {
  margin-top: 16px;
  background: #fff;
  border-radius: 18px;
  padding: 20px 16px;
  text-align: center;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
}

.success-icon-wrap {
  margin-bottom: 12px;
}

.success-title {
  font-size: 20px;
  font-weight: 700;
  color: #222;
  margin-bottom: 8px;
}

.success-desc {
  font-size: 14px;
  color: #666;
  line-height: 1.7;
  margin-bottom: 16px;
}

.success-info {
  background: #f7f8fa;
  border-radius: 14px;
  padding: 12px 14px;
  margin-bottom: 16px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}

.info-item + .info-item {
  margin-top: 10px;
}

.info-label {
  color: #888;
}

.info-value {
  color: #222;
  font-weight: 600;
}

.enter-game-btn {
  height: 46px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
}
</style>