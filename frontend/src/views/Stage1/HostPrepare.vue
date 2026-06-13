<!-- frontend/src/views/Stage1/HostPrepare.vue（整文件替换） -->
<template>
  <div class="host-prepare-page">
    <van-nav-bar title="主持人准备页" left-text="返回" @click-left="goBack" />

    <van-field
      v-model="hostName"
      label="主持人昵称"
      placeholder="请输入你的昵称"
      class="input-item"
    />

    <van-field
      v-model="roomCode"
      label="房间码 (可选)"
      placeholder="输入房间码进入已有房间，留空则创建新房间"
      maxlength="6"
      type="digit"
      class="input-item"
    />

    <div class="button-group">
      <van-button type="primary" block class="action-btn" @click="handleCreateOrJoinRoom">
        <span v-if="!roomCode.trim()">创建新房间</span>
        <span v-else>进入房间</span>
      </van-button>

      <van-button type="default" block class="action-btn" @click="clearRoomInfo">
        清空房间信息
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { Toast } from 'vant'
import { createRoom, getRoomInfo } from '@/utils/api/room'
import { API_ORIGIN } from '@/utils/api/base'
import io from 'socket.io-client'

const router = useRouter()
const hostName = ref('')
const roomCode = ref('')
const socket = ref(null)

/**
 * ✅ 后端地址：优先用 VITE_API_BASE（和你 http.js 一致）
 * 没配就默认本地 3000
 */
const BACKEND_ORIGIN = API_ORIGIN

const disconnectSocket = () => {
  if (socket.value) {
    socket.value.disconnect()
    socket.value = null
  }
}

// ✅ 只在“房间验证通过/创建成功”之后再连接 socket
const connectToSocket = (code) => {
  disconnectSocket()
  socket.value = io(BACKEND_ORIGIN, {
    transports: ['websocket', 'polling']
  })

  socket.value.on('connect', () => {
    console.log('Socket connected:', socket.value.id)
    socket.value.emit('hostJoinRoom', code)
  })

  socket.value.on('disconnect', () => console.log('Socket disconnected'))

  socket.value.on('connect_error', (err) => {
    console.error('Socket connect_error:', err)
    Toast.fail('Socket 连接失败（请确认后端已启动）')
  })
}

// 页面加载：恢复本地存储（但不自动连 socket，避免旧房间号失效导致报错）
onMounted(() => {
  const storedHostName = localStorage.getItem('hostName')
  const storedRoomCode = localStorage.getItem('hostRoomCode')
  if (storedHostName) hostName.value = storedHostName
  if (storedRoomCode) roomCode.value = storedRoomCode
})

onBeforeUnmount(() => disconnectSocket())

const createAndEnter = async (name) => {
  Toast.loading({ message: '正在创建房间…', forbidClick: true, duration: 0 })
  const res = await createRoom(name)
  Toast.clear()

  const { code, data, message } = res.data || {}
  if (code === 200 && data?.roomCode) {
    const newCode = String(data.roomCode)
    roomCode.value = newCode
    Toast.success(`房间创建成功：${newCode}`)
    connectToSocket(newCode)
    navigateToRoomManage(newCode)
  } else {
    Toast.fail(message || '房间创建失败')
  }
}

// 创建或进入房间（统一入口）
const handleCreateOrJoinRoom = async () => {
  const name = hostName.value.trim()
  const code = roomCode.value.trim()

  if (!name) {
    Toast.fail('请输入主持人昵称')
    return
  }

  try {
    // 1) 输入了房间码：先验证房间是否存在
    if (code) {
      Toast.loading({ message: '正在校验房间…', forbidClick: true, duration: 0 })
      const res = await getRoomInfo(code)
      Toast.clear()

      const { code: apiCode, data, message } = res.data || {}

      if (apiCode === 200 && data) {
        // 可选：严格校验主持人身份（不想限制就删掉这段）
        if (data.hostName && data.hostName !== name) {
          Toast.fail('你不是该房间的主持人')
          return
        }

        Toast.success(`成功进入房间：${code}`)
        connectToSocket(code)
        navigateToRoomManage(code)
        return
      }

      // 2) 房间不存在：自动创建新房间并进入（避免卡住）
      if (apiCode === 404) {
        Toast('房间不存在，已为你创建新房间')
        return await createAndEnter(name)
      }

      Toast.fail(message || '进入房间失败')
      return
    }

    // 3) 没输入房间码：创建新房间
    await createAndEnter(name)
  } catch (e) {
    Toast.clear()
    console.error('操作失败：', e)
    Toast.fail(e?.message || '网络错误，请重试')
  }
}

// 跳转到房间管理页
const navigateToRoomManage = (roomCodeVal) => {
  localStorage.setItem('hostName', hostName.value.trim())
  localStorage.setItem('hostRoomCode', roomCodeVal)

  router.push({
    name: 'RoomManage',
    query: { roomCode: roomCodeVal, hostName: hostName.value.trim() }
  })
}

// 清空本地存储 + 断开 socket
const clearRoomInfo = () => {
  localStorage.removeItem('hostName')
  localStorage.removeItem('hostRoomCode')
  hostName.value = ''
  roomCode.value = ''
  disconnectSocket()
  Toast.success('房间信息已清空')
}

const goBack = () => {
  if (window.history.length > 1) router.back()
  else router.push({ path: '/host' })
}
</script>

<style scoped>
.host-prepare-page {
  padding: 16px;
  min-height: 100vh;
  background: #f9fafb;
}
.input-item {
  margin: 16px 0;
}
.button-group {
  margin-top: 20px;
}
.action-btn {
  margin-bottom: 12px;
}
</style>
