<template>
  <div class="followup-page">
    <van-nav-bar
      title="故事补充提问"
      left-text="返回"
      left-arrow
      @click-left="goBack"
    />

    <div class="page-content">
      <div class="hero-card">
        <div class="hero-badge">STEP 2</div>
        <div class="hero-title">围绕刚才的故事，再补充一点细节</div>
        <div class="hero-desc">
          先收集 2 个自由提问，再让讲述者用语音回答。补充后的内容会一起用于生成图片。
        </div>
      </div>

      <div class="story-card">
        <div class="card-title">原始故事</div>
        <div class="story-text">{{ originalStoryText || '暂无故事内容' }}</div>
      </div>

      <div class="qa-card">
        <div class="card-head">
          <div>
            <div class="card-title">第一步：自由提问</div>
            <div class="card-subtitle">最多收集 2 个小问题，尽量围绕画面细节来问。</div>
          </div>
          <div class="step-tag">提问</div>
        </div>

        <div
          v-for="(item, index) in qaList"
          :key="`question-${index}`"
          class="qa-item"
        >
          <div class="qa-no">问题 {{ index + 1 }}</div>

          <div class="qa-question-box">
            <div class="qa-label">已识别问题</div>
            <div class="qa-value">
              {{ item.questionText || '还没有录入问题' }}
            </div>
          </div>

          <van-button
            type="primary"
            block
            class="voice-btn"
            :loading="questionRecordingIndex === index && questionVoiceStatus === 'recognizing'"
            :disabled="questionButtonDisabled(index)"
            @click="toggleQuestionRecord(index)"
          >
            <template v-if="questionRecordingIndex !== index || questionVoiceStatus === 'idle'">
              🎙️ 录入问题 {{ index + 1 }}
            </template>
            <template v-else-if="questionVoiceStatus === 'recording'">
              ⏹️ 停止录音并识别
            </template>
            <template v-else>
              🧠 识别中…
            </template>
          </van-button>
        </div>
      </div>

      <div class="qa-card">
        <div class="card-head">
          <div>
            <div class="card-title">第二步：讲述者回答</div>
            <div class="card-subtitle">请围绕上面的问题，用语音逐个补充回答。</div>
          </div>
          <div class="step-tag green">回答</div>
        </div>

        <div
          v-for="(item, index) in qaList"
          :key="`answer-${index}`"
          class="qa-item"
        >
          <div class="qa-no">回答 {{ index + 1 }}</div>

          <div class="qa-question-box">
            <div class="qa-label">对应问题</div>
            <div class="qa-value">
              {{ item.questionText || '请先录入上方问题' }}
            </div>
          </div>

          <div class="qa-answer-box">
            <div class="qa-label">已识别回答</div>
            <div class="qa-value">
              {{ item.answerText || '还没有录入回答' }}
            </div>
          </div>

          <van-button
            type="success"
            block
            class="voice-btn"
            :loading="answerRecordingIndex === index && answerVoiceStatus === 'recognizing'"
            :disabled="answerButtonDisabled(index, item)"
            @click="toggleAnswerRecord(index)"
          >
            <template v-if="answerRecordingIndex !== index || answerVoiceStatus === 'idle'">
              🎤 录入回答 {{ index + 1 }}
            </template>
            <template v-else-if="answerVoiceStatus === 'recording'">
              ⏹️ 停止录音并识别
            </template>
            <template v-else>
              🧠 识别中…
            </template>
          </van-button>
        </div>
      </div>

      <div class="summary-card">
        <div class="card-title">增强后的生图文本预览</div>
        <pre class="merged-text">{{ mergedStoryText }}</pre>
      </div>

      <div class="bottom-actions">
        <van-button
          type="primary"
          block
          :loading="submitting"
          :disabled="!canSubmit"
          @click="submitMergedStory"
        >
          生成图片并开始拼图
        </van-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Toast } from 'vant'
import axios from 'axios'
import { uploadStoryText } from '@/utils/api/story'
import { apiUrl, normalizeAssetUrl } from '@/utils/api/base'

const router = useRouter()
const route = useRoute()

const normalizeImageUrl = (url) => {
  return normalizeAssetUrl(url)
}

const roomCode = ref(route.query.roomCode || '')
const playerName = ref(route.query.playerName || '玩家')
const originalStoryText = ref(route.query.storyText || '')

const qaList = ref([
  { questionText: '', answerText: '' },
  { questionText: '', answerText: '' }
])

const submitting = ref(false)

let mediaRecorder = null
let mediaStream = null
let audioChunks = []

const questionRecordingIndex = ref(null)
const answerRecordingIndex = ref(null)
const questionVoiceStatus = ref('idle')
const answerVoiceStatus = ref('idle')

const cleanupMic = () => {
  try {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop()
    }
  } catch (_) {}

  mediaRecorder = null
  audioChunks = []

  if (mediaStream) {
    mediaStream.getTracks().forEach((t) => t.stop())
    mediaStream = null
  }
}

onBeforeUnmount(() => {
  cleanupMic()
})

const canSubmit = computed(() => {
  return (
    originalStoryText.value.trim() &&
    qaList.value.every(item => item.questionText.trim() && item.answerText.trim())
  )
})

const mergedStoryText = computed(() => {
  const lines = [
    `原始故事：${originalStoryText.value || ''}`,
    '',
    '补充提问与回答：'
  ]

  qaList.value.forEach((item, index) => {
    lines.push(`问题${index + 1}：${item.questionText || '（未填写）'}`)
    lines.push(`回答${index + 1}：${item.answerText || '（未填写）'}`)
  })

  return lines.join('\n')
})

const questionButtonDisabled = (index) => {
  if (questionRecordingIndex.value === index && questionVoiceStatus.value === 'recording') {
    return false
  }
  if (questionRecordingIndex.value === index && questionVoiceStatus.value === 'recognizing') {
    return true
  }
  if (answerRecordingIndex.value !== null) {
    return true
  }
  if (questionRecordingIndex.value !== null && questionRecordingIndex.value !== index) {
    return true
  }
  return false
}

const answerButtonDisabled = (index, item) => {
  if (!item.questionText) return true
  if (answerRecordingIndex.value === index && answerVoiceStatus.value === 'recording') {
    return false
  }
  if (answerRecordingIndex.value === index && answerVoiceStatus.value === 'recognizing') {
    return true
  }
  if (questionRecordingIndex.value !== null) {
    return true
  }
  if (answerRecordingIndex.value !== null && answerRecordingIndex.value !== index) {
    return true
  }
  return false
}

const startRecord = async () => {
  mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
  audioChunks = []
  mediaRecorder = new MediaRecorder(mediaStream)

  mediaRecorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      audioChunks.push(e.data)
    }
  }

  mediaRecorder.start()
}

const stopRecordAndRecognize = async () => {
  if (!mediaRecorder) {
    throw new Error('录音器不存在')
  }

  const blob = await new Promise((resolve) => {
    mediaRecorder.onstop = () => {
      const b = new Blob(audioChunks, { type: mediaRecorder.mimeType || 'audio/webm' })
      resolve(b)
    }
    mediaRecorder.stop()
  })

  cleanupMic()

  const formData = new FormData()
  formData.append('audio', blob, 'record.webm')

  const res = await axios.post(apiUrl('/api/asr'), formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000
  })

  const text = res?.data?.data?.text
  if (res?.data?.code === 200 && text) return text
  throw new Error(res?.data?.message || '语音识别失败')
}

const toggleQuestionRecord = async (index) => {
  try {
    if (questionRecordingIndex.value === index && questionVoiceStatus.value === 'recording') {
      questionVoiceStatus.value = 'recognizing'
      const text = await stopRecordAndRecognize()
      qaList.value[index].questionText = text
      Toast.success(`问题 ${index + 1} 识别成功`)
      questionRecordingIndex.value = null
      questionVoiceStatus.value = 'idle'
      return
    }

    if (questionRecordingIndex.value !== null || answerRecordingIndex.value !== null) {
      return
    }

    await startRecord()
    questionRecordingIndex.value = index
    questionVoiceStatus.value = 'recording'
    Toast('开始录入问题，再点一次结束')
  } catch (err) {
    console.error('录入问题失败：', err)
    Toast.fail(err?.message || '录入问题失败')
    questionRecordingIndex.value = null
    questionVoiceStatus.value = 'idle'
    cleanupMic()
  }
}

const toggleAnswerRecord = async (index) => {
  try {
    if (!qaList.value[index].questionText) {
      Toast.fail('请先录入对应问题')
      return
    }

    if (answerRecordingIndex.value === index && answerVoiceStatus.value === 'recording') {
      answerVoiceStatus.value = 'recognizing'
      const text = await stopRecordAndRecognize()
      qaList.value[index].answerText = text
      Toast.success(`回答 ${index + 1} 识别成功`)
      answerRecordingIndex.value = null
      answerVoiceStatus.value = 'idle'
      return
    }

    if (answerRecordingIndex.value !== null || questionRecordingIndex.value !== null) {
      return
    }

    await startRecord()
    answerRecordingIndex.value = index
    answerVoiceStatus.value = 'recording'
    Toast('开始录入回答，再点一次结束')
  } catch (err) {
    console.error('录入回答失败：', err)
    Toast.fail(err?.message || '录入回答失败')
    answerRecordingIndex.value = null
    answerVoiceStatus.value = 'idle'
    cleanupMic()
  }
}

const submitMergedStory = async () => {
  try {
    if (!canSubmit.value) {
      Toast.fail('请先完成 2 个问题和 2 个回答')
      return
    }

    submitting.value = true
    Toast.loading({ message: '正在生成图片…', forbidClick: true, duration: 0 })

    const mergedText = mergedStoryText.value

    const res = await uploadStoryText({
      roomCode: roomCode.value,
      playerName: playerName.value,
      storyText: mergedText
    })

    Toast.clear()

    const rawUrl = res.data?.data?.imageUrl
    if (res.data?.code === 200 && rawUrl) {
      const finalImageUrl = normalizeImageUrl(rawUrl)

      router.push({
        path: '/player-mobile',
        query: {
          roomCode: roomCode.value,
          playerName: playerName.value,
          generatedImageUrl: finalImageUrl,
          mergedStoryText: mergedText,
          fromFollowUp: 'true'
        }
      })
    } else {
      Toast.fail(res.data?.message || '生成图片失败')
    }
  } catch (err) {
    console.error('提交增强故事失败：', err)
    Toast.clear()
    Toast.fail(err?.response?.data?.message || err?.message || '生成图片失败')
  } finally {
    submitting.value = false
  }
}

const goBack = () => {
  router.back()
}
</script>

<style scoped>
.followup-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f7f9f6 0%, #eef3ee 100%);
}

.page-content {
  padding: 16px;
}

.hero-card {
  background: linear-gradient(135deg, #5d8c6d 0%, #7aa487 100%);
  color: #fff;
  border-radius: 20px;
  padding: 18px 16px;
  box-shadow: 0 10px 24px rgba(75, 127, 91, 0.22);
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
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 8px;
}

.hero-desc {
  font-size: 13px;
  line-height: 1.7;
  opacity: 0.95;
}

.story-card,
.qa-card,
.summary-card {
  background: #fff;
  border-radius: 18px;
  padding: 18px 16px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06);
  margin-bottom: 16px;
}

.card-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.card-title {
  font-size: 17px;
  font-weight: 700;
  color: #3f5646;
  margin-bottom: 6px;
}

.card-subtitle {
  font-size: 13px;
  color: #78867d;
  line-height: 1.6;
}

.step-tag {
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 700;
  color: #6f7d74;
  background: #f2f5f3;
  border-radius: 999px;
  padding: 6px 10px;
  height: fit-content;
}

.step-tag.green {
  color: #4b7f5b;
  background: #eef7f0;
}

.story-text,
.qa-value {
  font-size: 14px;
  color: #425149;
  line-height: 1.8;
  white-space: pre-wrap;
  word-break: break-word;
}

.qa-item + .qa-item {
  margin-top: 16px;
}

.qa-no {
  font-size: 12px;
  color: #7c897f;
  margin-bottom: 8px;
}

.qa-question-box,
.qa-answer-box {
  background: #f7faf7;
  border: 1px solid #e5eee6;
  border-radius: 14px;
  padding: 12px;
  margin-bottom: 10px;
}

.qa-label {
  font-size: 12px;
  color: #7b867f;
  margin-bottom: 6px;
}

.voice-btn {
  margin-top: 2px;
}

.merged-text {
  margin: 0;
  padding: 12px;
  background: #f7faf7;
  border-radius: 14px;
  border: 1px solid #e5eee6;
  font-size: 13px;
  color: #425149;
  line-height: 1.8;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: inherit;
}

.bottom-actions {
  margin-bottom: 24px;
}
</style>
