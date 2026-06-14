<template>
  <div class="emotion-rebuild-page">
    <svg class="filter-defs" aria-hidden="true">
      <defs>
        <filter id="hand-drawn-filter">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>

    <div class="app">
      <FlowBar />
      <FloatingNav />
      <SecondaryPage v-if="secondary" />

      <TinySparkleIcon class="decor-a" decorative />
      <span class="confetti decor-b"></span>

      <main class="layout">
        <section class="main-card">
          <header class="status-head">
            <div class="avatar icon-avatar">
              <IconRoomMembers compact />
            </div>
            <div>
              <h2>正在玩家 · 玩家</h2>
              <p>{{ step === 5 ? '移动 1 块拼图，让画面更完整' : '先完成右侧引导，生成本轮拼图' }}</p>
            </div>
            <div class="task-pill">当前任务：{{ flow[step - 1][1] }}</div>
          </header>

          <div class="board-wrap">
            <div
              class="puzzle-grid"
              :class="{ 'image-grid': step >= 5, solved: puzzleSolved, 'near-complete': puzzleNearComplete }"
              :style="{ '--puzzle-image': `url(${activePuzzleImage})`, '--puzzle-ratio': puzzleImageRatio }"
            >
              <div
                v-for="piece in puzzlePieces"
                :key="piece.slot"
                class="cell"
                :class="{
                  selected: selectedPuzzleSlot === piece.slot,
                  correct: step >= 5 && piece.source === piece.slot,
                  pending: puzzleNearComplete && piece.source !== piece.slot
                }"
                :style="step >= 5 ? getPuzzlePieceStyle(piece.source) : null"
                @click="step >= 5 && handlePuzzlePieceClick(piece.slot)"
              ></div>
            </div>

            <div v-if="step < 5" class="center-notice">
              <ListeningSprite v-if="step === 2" label="帕托 · 倾听陪伴" />
              <CuriousSprite v-else-if="step === 3" label="啵啵 · 协作提问" />
              <BloomSprite v-else label="朵朵 · 完成回看" />
              <h3>拼图预览即将生成</h3>
              <p>帕托已经准备好，先完成右侧第 1 步，讲一件最近的小事吧。</p>
              <button type="button" @click="go('startVoice')">去完成第 1 步 →</button>
            </div>

            <div class="progress-card"></div>
            <template v-if="step === 5">
              <div class="board-corner-sprite">
                <BloomSprite label="朵朵 · 完成回看" decorative />
              </div>
              <IconCanvasBound class="canvas-bound-anchor" decorative />
              <IconSparklePop class="board-sparkle" tile decorative />
              <span class="confetti board-confetti"></span>
              <div v-if="puzzleSolved" class="puzzle-celebration" aria-hidden="true">
                <span class="celebration-glow"></span>
                <BloomSprite label="朵朵 · 拼好啦" decorative />
                <span class="celebration-text">拼好啦</span>
                <span class="celebration-confetti c1"></span>
                <span class="celebration-confetti c2"></span>
                <span class="celebration-confetti c3"></span>
                <span class="celebration-confetti c4"></span>
                <span class="celebration-confetti c5"></span>
                <span class="celebration-confetti c6"></span>
              </div>
            </template>
          </div>
        </section>

        <aside class="right-panel">
          <div class="player-box">
            <div class="avatar icon-avatar">
              <IconRoomMembers compact />
            </div>
            <div>
              <h3>玩家</h3>
              <p>{{ step === 5 ? '正在完成 4×4 拼图' : '放轻松玩家' }}</p>
            </div>
            <div class="heart"><IconHugHeart tiny />022/4</div>
          </div>

          <StoryCard v-if="step === 2" />
          <FollowCard v-else-if="step === 3" />
          <StyleCard v-else-if="step === 4" />
          <PuzzleCard v-else-if="step === 5" />
          <StoryCard v-else />
        </aside>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, defineComponent, h, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Toast } from 'vant'
import axios from 'axios'
import { apiUrl, normalizeAssetUrl, publicAssetUrl } from '@/utils/api/base'

const flow = [
  ['1', '创建房间', '1 min'],
  ['2', '分享小事', '1-2 min/人'],
  ['3', '同伴提问', '30s/人'],
  ['4', 'AI生成碎片', '10s/人'],
  ['5', '轮流拼图', '3 min/人']
]

const step = ref(2)
const mode = ref('idle')
const secondary = ref(null)
const story = ref('春风拂岸，草木吐新，繁花沿路盛放。漫步郊野，暖风拂面，鸟鸣声声入耳，春光温柔漫溢，尽揽山野清新与春日闲逸。')
const storyInputText = ref('')
const storyInputEl = ref(null)
const route = useRoute()
const router = useRouter()
const roomCode = ref(route.query.roomCode || 'single')
const playerName = ref(route.query.playerName || '玩家')
const detailQuestion = ref('')
const emotionDetail = ref('')
const narratorDetail = ref('')
const detailDraft = ref('')
const companionRounds = ref([])
const savedDetailCount = ref(0)
const puzzleStyle = ref('healing')
const puzzleImageUrl = ref('')
const recordStatus = ref('idle')
const voiceStatus = ref('idle')
const voiceHint = ref('')
const activeVoiceTarget = ref(null)
const fallbackPuzzleImage = 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=900&auto=format&fit=crop&q=80'
const activePuzzleImage = computed(() => puzzleImageUrl.value || fallbackPuzzleImage)
const puzzleImageRatio = ref('4 / 3')
const orderedPuzzlePieces = Array.from({ length: 16 }, (_, index) => ({ slot: index, source: index }))
const puzzlePieces = ref([...orderedPuzzlePieces])
const selectedPuzzleSlot = ref(null)
const correctPuzzleCount = computed(() => puzzlePieces.value.filter((piece) => piece.source === piece.slot).length)
const puzzleTotalCount = computed(() => puzzlePieces.value.length)
const remainingPuzzleCount = computed(() => Math.max(puzzleTotalCount.value - correctPuzzleCount.value, 0))
const puzzleProgressPercent = computed(() => (
  puzzleTotalCount.value ? Math.round((correctPuzzleCount.value / puzzleTotalCount.value) * 100) : 0
))
const puzzleSolved = computed(() => step.value >= 5 && puzzleTotalCount.value > 0 && remainingPuzzleCount.value === 0)
const puzzleNearComplete = computed(() => step.value >= 5 && remainingPuzzleCount.value > 0 && remainingPuzzleCount.value <= 4)
const companionContext = computed(() => ({
  visual: detailQuestion.value.trim() || detailDraft.value.trim(),
  emotion: emotionDetail.value.trim(),
  narrator: narratorDetail.value.trim() || detailDraft.value.trim(),
  rounds: companionRounds.value.map((round, index) => ({
    index: index + 1,
    visual: round.visual,
    emotion: round.emotion,
    narrator: round.narrator
  }))
}))
const canConfirmStory = computed(() => mode.value === 'confirm' || Boolean(storyInputText.value.trim()))

const focusStoryInput = async () => {
  if (mode.value === 'recording' || mode.value === 'recognizing') return
  await nextTick()
  storyInputEl.value?.focus()
}

const getCurrentDetailText = () => (
  detailDraft.value.trim() ||
  narratorDetail.value.trim() ||
  detailQuestion.value.trim() ||
  emotionDetail.value.trim()
)

const saveCurrentDetail = (fallback = '') => {
  const savedText = getCurrentDetailText() || fallback
  if (!savedText) return false

  companionRounds.value.push({
    visual: detailQuestion.value.trim() || savedText,
    emotion: emotionDetail.value.trim(),
    narrator: narratorDetail.value.trim() || savedText
  })
  savedDetailCount.value = Math.max(savedDetailCount.value + 1, 1)
  detailDraft.value = ''
  detailQuestion.value = ''
  emotionDetail.value = ''
  narratorDetail.value = ''
  return true
}

const shufflePuzzlePieces = () => {
  const sources = orderedPuzzlePieces.map((piece) => piece.source)

  for (let i = sources.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[sources[i], sources[j]] = [sources[j], sources[i]]
  }

  if (sources.every((source, index) => source === index)) {
    ;[sources[0], sources[1]] = [sources[1], sources[0]]
  }

  puzzlePieces.value = sources.map((source, slot) => ({ slot, source }))
  selectedPuzzleSlot.value = null
}

const resetPuzzlePieces = () => {
  puzzlePieces.value = [...orderedPuzzlePieces]
  selectedPuzzleSlot.value = null
}

const handlePuzzlePieceClick = (slot) => {
  if (selectedPuzzleSlot.value === null) {
    selectedPuzzleSlot.value = slot
    return
  }

  if (selectedPuzzleSlot.value === slot) {
    selectedPuzzleSlot.value = null
    return
  }

  const firstIndex = puzzlePieces.value.findIndex((piece) => piece.slot === selectedPuzzleSlot.value)
  const secondIndex = puzzlePieces.value.findIndex((piece) => piece.slot === slot)

  if (firstIndex >= 0 && secondIndex >= 0) {
    const nextPieces = [...puzzlePieces.value]
    const firstSource = nextPieces[firstIndex].source
    nextPieces[firstIndex] = { ...nextPieces[firstIndex], source: nextPieces[secondIndex].source }
    nextPieces[secondIndex] = { ...nextPieces[secondIndex], source: firstSource }
    puzzlePieces.value = nextPieces
  }

  selectedPuzzleSlot.value = null
}

const getPuzzlePieceStyle = (source) => {
  const col = source % 4
  const row = Math.floor(source / 4)

  return {
    backgroundImage: `url(${activePuzzleImage.value})`,
    backgroundSize: '400% 400%',
    backgroundPosition: `${col * 33.333333}% ${row * 33.333333}%`,
    backgroundRepeat: 'no-repeat'
  }
}

watch(activePuzzleImage, (src) => {
  if (typeof window === 'undefined' || !src) {
    puzzleImageRatio.value = '4 / 3'
    return
  }

  const img = new window.Image()
  img.onload = () => {
    if (img.naturalWidth && img.naturalHeight) {
      puzzleImageRatio.value = `${img.naturalWidth} / ${img.naturalHeight}`
    }
  }
  img.onerror = () => {
    puzzleImageRatio.value = '4 / 3'
  }
  img.src = src
}, { immediate: true })

const secondaryRoutes = {
  rule: '/portfolio-ready',
  ai: '/portfolio-generating',
  review: '/portfolio-complete',
  gallery: '/portfolio-gallery'
}

const go = async (action) => {
  if (secondaryRoutes[action]) {
    router.push(secondaryRoutes[action])
    return
  }
  if (action === 'startVoice') {
    await toggleRecord('story')
  }
  if (action === 'stopVoice') {
    await toggleRecord('story')
  }
  if (action === 'confirmStory') {
    step.value = 3
    mode.value = 'follow'
  }
  if (action === 'startFollowVoice') {
    await toggleRecord('visual')
  }
  if (action === 'stopFollowVoice') {
    await toggleRecord(activeVoiceTarget.value || 'visual')
  }
  if (action === 'saveFollow') {
    if (!getCurrentDetailText()) {
      detailDraft.value = '远处可以看到什么？'
      mode.value = 'followConfirm'
      return
    }
    saveCurrentDetail()
    mode.value = 'followSaved'
  }
  if (action === 'finishFollow') {
    if (getCurrentDetailText()) {
      saveCurrentDetail('远处有窗光和一条小路。')
    }
    if (savedDetailCount.value === 0) {
      mode.value = 'follow'
      return
    }
    step.value = 4
    mode.value = 'style'
  }
  if (action === 'generate') {
    await submitStoryText()
  }
  if (action === 'finish') {
    step.value = 5
    mode.value = 'done'
  }
  if (action === 'reset') {
    resetPuzzlePieces()
    step.value = 2
    mode.value = 'idle'
  }
}

let mediaRecorder = null
let mediaStream = null
let audioChunks = []
let recordingStartedAt = 0
let speechRecognition = null
let speechTranscript = ''

const MIN_RECORD_MS = 1200

const getSpeechRecognitionCtor = () => {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

const startBrowserSpeechRecognition = () => {
  const Recognition = getSpeechRecognitionCtor()
  speechTranscript = ''
  if (!Recognition) return false

  try {
    const recognition = new Recognition()
    recognition.lang = 'zh-CN'
    recognition.continuous = true
    recognition.interimResults = true
    recognition.onresult = (event) => {
      speechTranscript = Array.from(event.results)
        .map((result) => result?.[0]?.transcript || '')
        .join('')
        .trim()
    }
    recognition.onerror = () => {}
    recognition.onend = () => {
      if (speechRecognition === recognition) {
        speechRecognition = null
      }
    }
    recognition.start()
    speechRecognition = recognition
    return true
  } catch (_) {
    speechRecognition = null
    return false
  }
}

const stopBrowserSpeechRecognition = () => new Promise((resolve) => {
  if (!speechRecognition) {
    resolve(speechTranscript.trim())
    return
  }

  const recognition = speechRecognition
  let settled = false
  const finish = () => {
    if (settled) return
    settled = true
    if (speechRecognition === recognition) {
      speechRecognition = null
    }
    resolve(speechTranscript.trim())
  }

  recognition.onend = finish
  window.setTimeout(finish, 900)

  try {
    recognition.stop()
  } catch (_) {
    finish()
  }
})

const getRecorderOptions = () => {
  if (typeof MediaRecorder === 'undefined') return {}
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/aac'
  ]
  const mimeType = candidates.find((type) => MediaRecorder.isTypeSupported?.(type))
  return mimeType ? { mimeType } : {}
}

const getRecordFilename = (mimeType = '') => {
  if (mimeType.includes('mp4')) return 'record.mp4'
  if (mimeType.includes('aac')) return 'record.aac'
  if (mimeType.includes('wav')) return 'record.wav'
  return 'record.webm'
}

const cleanupMic = () => {
  if (speechRecognition) {
    try {
      speechRecognition.abort()
    } catch (_) {}
    speechRecognition = null
  }

  try {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop()
    }
  } catch (_) {}

  mediaRecorder = null
  audioChunks = []

  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop())
    mediaStream = null
  }
}

const toggleRecord = async (target = 'story') => {
  if (voiceStatus.value === 'recording') {
    if (activeVoiceTarget.value !== target) return
    await stopAndRecognize(target)
    return
  }

  if (voiceStatus.value === 'uploading' || voiceStatus.value === 'recognizing') return
  await startRecord(target)
}

const startRecord = async (target = 'story') => {
  try {
    step.value = target === 'story' ? 2 : 3
    mode.value = target === 'story' ? 'recording' : 'followRecording'
    activeVoiceTarget.value = target
    voiceStatus.value = 'idle'
    voiceHint.value = target === 'story'
      ? '正在录故事...再点一次结束并识别'
      : '正在录细节...再点一次结束并识别'

    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    audioChunks = []
    mediaRecorder = new MediaRecorder(mediaStream, getRecorderOptions())
    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        audioChunks.push(event.data)
      }
    }
    mediaRecorder.start(250)
    recordingStartedAt = Date.now()
    voiceStatus.value = 'recording'
    const browserSpeechReady = startBrowserSpeechRecognition()
    if (!browserSpeechReady) {
      voiceHint.value = target === 'story'
        ? '正在录故事...当前浏览器不支持本地识别，将上传到语音服务'
        : '正在录细节...当前浏览器不支持本地识别，将上传到语音服务'
    }
  } catch (error) {
    console.error(error)
    Toast.fail('无法使用麦克风')
    voiceStatus.value = 'idle'
    activeVoiceTarget.value = null
    mode.value = target === 'story' ? 'idle' : 'follow'
    cleanupMic()
  }
}

const applyRecognizedText = (target, text) => {
  if (target === 'story') {
    story.value = text
    storyInputText.value = text
    step.value = 2
    mode.value = 'confirm'
    return
  }
  if (target === 'emotion') {
    emotionDetail.value = text
    detailDraft.value = text
    step.value = 3
    mode.value = 'followConfirm'
    return
  }
  if (target === 'narrator') {
    narratorDetail.value = text
    detailDraft.value = text
    step.value = 3
    mode.value = 'followConfirm'
    return
  }
  detailQuestion.value = text
  detailDraft.value = text
  step.value = 3
  mode.value = 'followConfirm'
}

const postAsrAudio = async (blob, filename) => {
  const isLocalHost =
    typeof window !== 'undefined' &&
    ['localhost', '127.0.0.1'].includes(window.location.hostname)
  const endpoints = [
    apiUrl('/api/asr'),
    ...(isLocalHost ? ['http://127.0.0.1:3000/api/asr', 'http://localhost:3000/api/asr'] : [])
  ].filter((url, index, list) => list.indexOf(url) === index)

  let lastError = null
  for (const endpoint of endpoints) {
    try {
      const formData = new FormData()
      formData.append('audio', blob, filename)
      return await axios.post(endpoint, formData, { timeout: 60000 })
    } catch (error) {
      lastError = error
      if (error?.code !== 'ERR_NETWORK') throw error
    }
  }
  throw lastError
}

const stopAndRecognize = async (target = activeVoiceTarget.value || 'story') => {
  if (!mediaRecorder || mediaRecorder.state === 'inactive') return

  try {
    const elapsed = Date.now() - recordingStartedAt
    if (elapsed < MIN_RECORD_MS) {
      voiceHint.value = '再听一小会儿...'
      await new Promise((resolve) => setTimeout(resolve, MIN_RECORD_MS - elapsed))
    }

    voiceStatus.value = 'uploading'
    voiceHint.value = '正在结束录音并上传...'
    mode.value = target === 'story' ? 'recognizing' : 'followRecognizing'
    const mimeType = mediaRecorder.mimeType || 'audio/webm'
    const browserSpeechTextPromise = stopBrowserSpeechRecognition()

    const blob = await new Promise((resolve) => {
      mediaRecorder.onstop = () => {
        resolve(new Blob(audioChunks, { type: mimeType }))
      }
      try {
        mediaRecorder.requestData()
      } catch (_) {}
      mediaRecorder.stop()
    })

    const browserSpeechText = await browserSpeechTextPromise
    cleanupMic()
    if (blob.size < 1024) {
      if (browserSpeechText) {
        applyRecognizedText(target, browserSpeechText)
        Toast.success('已使用浏览器识别结果')
        voiceHint.value = '录音文件较短，已使用浏览器识别结果'
        return
      }
      throw new Error('录音太短，请按住节奏说完一句后再点停止')
    }

    voiceStatus.value = 'recognizing'
    voiceHint.value = '正在语音识别...'

    const response = await postAsrAudio(blob, getRecordFilename(mimeType))

    const text = response?.data?.data?.text || browserSpeechText
    if (response?.data?.code === 200 && text) {
      applyRecognizedText(target, text)
      Toast.success('识别完成')
      voiceHint.value = target === 'story'
        ? '故事识别完成，可以确认后进入提问'
        : '细节识别完成，会一起用于生成图片'
    } else if (browserSpeechText) {
      applyRecognizedText(target, browserSpeechText)
      Toast.success('已使用浏览器识别结果')
      voiceHint.value = '后端语音服务没有返回文字，已使用浏览器识别结果'
    } else {
      throw new Error(response?.data?.message || '语音识别失败')
    }
  } catch (error) {
    console.error(error)
    const browserSpeechText = speechTranscript.trim()
    if (browserSpeechText) {
      applyRecognizedText(target, browserSpeechText)
      Toast.success('已使用浏览器识别结果')
      voiceHint.value = '连接不到语音服务，已使用浏览器识别结果'
    } else {
      const message = error?.code === 'ERR_NETWORK'
        ? '连接不到语音服务'
        : error?.response?.data?.message || error.message || '语音识别失败'
      Toast.fail(message)
      voiceHint.value = `${message}，请改用直接输入`
      mode.value = target === 'story' ? 'idle' : 'follow'
    }
  } finally {
    voiceStatus.value = 'idle'
    activeVoiceTarget.value = null
  }
}

const submitStoryText = async () => {
  if (!story.value.trim()) {
    Toast.fail('请先输入或识别故事')
    return
  }

  recordStatus.value = 'uploading'
  mode.value = 'generating'
  step.value = 4
  Toast.loading({
    message: '生成图片中...',
    forbidClick: true,
    duration: 0
  })

  try {
    const response = await fetch(apiUrl('/api/story'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomCode: roomCode.value || 'single',
        playerName: playerName.value || '玩家',
        storyText: story.value.trim(),
        companionContext: companionContext.value,
        puzzleStyle: puzzleStyle.value
      })
    })

    const data = await response.json()
    if (!response.ok || data?.code !== 200) {
      throw new Error(data?.message || '生成图片失败')
    }

    puzzleImageUrl.value = normalizeAssetUrl(data?.data?.imageUrl)
    if (!puzzleImageUrl.value) {
      throw new Error('未返回图片地址')
    }

    shufflePuzzlePieces()
    step.value = 5
    mode.value = 'puzzle'
    Toast.clear()
    Toast.success('图片生成成功')
  } catch (error) {
    console.error(error)
    Toast.clear()
    Toast.fail(error.message || '生成图片失败，请重试')
    step.value = 4
    mode.value = 'style'
  } finally {
    recordStatus.value = 'idle'
  }
}

const iconAssets = {
  voice: 'voice-input.svg?v=solid1',
  puzzle: 'soft-puzzle.svg',
  album: 'nav-gallery.svg',
  members: 'room-members.svg?v=3',
  ruleNote: 'nav-rule.svg',
  aiWaiting: 'nav-ai-waiting.svg',
  bloomReview: 'nav-review.svg',
  pattoWeaving: 'pato-listening.svg?v=ip3',
  canvasBound: 'canvas-bound.svg',
  boboCurious: '/memopuzzle-ip/bobo-work.png?v=ip20260611',
  hugHeart: 'hug-heart.svg',
  sparklePop: 'sparkle-pop.svg',
  tinySparkle: 'tiny-sparkle.svg',
  tagLocation: 'tag-location.svg',
  tagObject: 'tag-object.svg',
  tagDistance: 'tag-distance.svg',
  tagColor: 'tag-color.svg',
  tagBody: 'tag-body.svg'
}

const iconComponent = (name, filename) => defineComponent({
  props: {
    active: Boolean,
    compact: Boolean,
    tile: Boolean,
    tiny: Boolean,
    decorative: Boolean
  },
  setup(props, { attrs }) {
    const resolveIconSrc = () => {
      if (name === 'icon-voice' && props.active) return publicAssetUrl('/memopuzzle-icons/voice-stop.svg?v=black1')
      return publicAssetUrl(filename.startsWith('/') ? filename : `/memopuzzle-icons/${filename}`)
    }

    return () => h('span', {
      ...attrs,
      class: [
        attrs.class,
        props.tile || props.tiny ? 'tile-icon' : 'mp-icon',
        name,
        `mp-${name}`,
        {
          active: props.active,
          compact: props.compact,
          tiny: props.tiny,
          decorative: props.decorative
        }
      ],
      'aria-hidden': props.decorative ? 'true' : null
    }, [
      h('img', {
        class: 'asset-icon-image',
        src: resolveIconSrc(),
        alt: '',
        draggable: 'false'
      })
    ])
  }
})

const IconVoiceInput = iconComponent('icon-voice', iconAssets.voice)
const IconSoftPuzzle = iconComponent('icon-puzzle', iconAssets.puzzle)
const IconMemoryAlbum = iconComponent('icon-album', iconAssets.album)
const IconRoomMembers = iconComponent('icon-members', iconAssets.members)
const IconRuleNote = iconComponent('icon-rule-note', iconAssets.ruleNote)
const IconAIWaiting = iconComponent('icon-ai-waiting', iconAssets.aiWaiting)
const TinySparkleIcon = iconComponent('icon-tiny-sparkle', iconAssets.tinySparkle)
const BloomReviewIcon = iconComponent('icon-bloom-review', iconAssets.bloomReview)
const IconPattoWeaving = iconComponent('icon-patto-weaving', iconAssets.pattoWeaving)
const IconCanvasBound = iconComponent('icon-canvas-bound', iconAssets.canvasBound)
const IconBoBoCurious = iconComponent('icon-bobo-curious', iconAssets.boboCurious)
const IconHugHeart = iconComponent('icon-hug-heart', iconAssets.hugHeart)
const IconSparklePop = iconComponent('icon-sparkle-pop', iconAssets.sparklePop)
const IconTagLocation = iconComponent('icon-tag-location', iconAssets.tagLocation)
const IconTagObject = iconComponent('icon-tag-object', iconAssets.tagObject)
const IconTagDistance = iconComponent('icon-tag-distance', iconAssets.tagDistance)
const IconTagColor = iconComponent('icon-tag-color', iconAssets.tagColor)
const IconTagBody = iconComponent('icon-tag-body', iconAssets.tagBody)

const FlowBar = defineComponent({
  setup() {
    return () => h('div', { class: 'flowbar' }, flow.map(([n, title, time]) => h(
      'div',
      { class: ['flow-step', { active: Number(n) === step.value, done: Number(n) < step.value }] },
      [
        h('span', { class: 'num' }, n),
        h('span', { class: 'txt' }, [title, h('small', time)])
      ]
    )))
  }
})

const FloatingNav = defineComponent({
  setup() {
    const items = [
      ['rule', IconRuleNote, '准备加入', '规则入口'],
      ['ai', IconAIWaiting, 'AI等待', '生成反馈'],
      ['review', BloomReviewIcon, '完成回看', '结果总结'],
      ['gallery', IconMemoryAlbum, '作品回顾', '记忆沉淀']
    ]
    const handleNavClick = (event, key) => {
      event.preventDefault()
      event.stopPropagation()
      if (key === 'gallery') {
        router.push({ name: 'PortfolioGallery' })
        return
      }
      go(key)
    }
    return () => h('nav', { class: 'float-nav' }, items.map(([key, Icon, title, sub]) => h(
      'button',
      { type: 'button', class: ['float-btn', `float-btn-${key}`, { active: secondary.value === key }], onClick: (event) => handleNavClick(event, key) },
      [
        h(Icon, { compact: true }),
        key === 'rule' ? h('span', { class: 'join-market-panel', onClick: (event) => event.stopPropagation() }, [
          h('span', { class: 'join-panel-close' }, '×'),
          h('span', { class: 'join-panel-head' }, [
            h(ListeningSprite, { label: '' }),
            h('span', null, [
              h('b', '玩法入口 / 加入画市'),
              h('span', '先创建或加入一个房间，再进入画市。画市不是普通大厅，而是大家开始讲小事、补充细节和共同拼图的协作空间。')
            ])
          ]),
          h('span', { class: 'join-panel-steps' }, [
            ['1', '创建或加入房间：生成房间号，邀请同伴进入同一个故事空间。'],
            ['2', '讲述一件小事：帕托负责倾听，系统把语音整理成故事线索。'],
            ['3', '同伴轻轻提问：啵啵引导补充地点、声音、颜色与身体感受。'],
            ['4', '协作拼图与存回忆：朵朵在完成节点给出庆祝反馈，并沉淀进相册。']
          ].map(([num, text]) => h('span', { class: 'join-step-line' }, [
            h('i', num),
            h('span', text)
          ]))),
          h('span', { class: 'join-panel-actions' }, [
            h('span', { class: 'join-action-card' }, [
              h('strong', '🌿 创建房间'),
              h('em', '适合主持人使用。创建后会生成 4 位房间号，同伴可用该号码加入。'),
              h('span', { class: 'join-create-btn' }, '创建房间')
            ]),
            h('span', { class: 'join-action-card' }, [
              h('strong', '↳ 加入房间'),
              h('em', '已有房间号时输入加入。这里先做前端原型交互，后续接入 Socket.io。'),
              h('span', { class: 'join-code-box' }, '8888'),
              h('span', { class: 'join-room-btn' }, '加入房间')
            ])
          ]),
          h('span', { class: 'join-ready-card' }, [
            h('span', null, [h('em', '你已加入房间'), h('b', '8888')]),
            h('span', { class: 'join-members' }, [h('i', '你'), h('i', '伴'), h('strong', '2/4 已就绪')])
          ]),
          h('span', { class: 'join-enter-btn' }, '加入画市，开始分享小事 →')
        ]) : h('span', { class: 'float-tip' }, [h('b', title), h('span', sub)])
      ]
    )))
  }
})

const ListeningSprite = defineComponent({
  props: { label: { type: String, default: '帕托 · 倾听陪伴' } },
  setup(props) {
    return () => h('span', { class: 'sprite' }, [
      h('img', { class: 'sprite-asset listening-sprite-asset ip-png-asset', src: publicAssetUrl('/memopuzzle-ip/patto-listening.png?v=ip20260611'), alt: '' }),
      h('span', { class: 'sprite-label' }, props.label)
    ])
  }
})

const CuriousSprite = defineComponent({
  props: { label: { type: String, default: '啵啵 · 协作提问' } },
  setup(props) {
    return () => h('span', { class: 'sprite' }, [
      h('img', { class: 'sprite-asset curious-sprite-asset ip-png-asset', src: publicAssetUrl('/memopuzzle-ip/bobo-work.png?v=ip20260611'), alt: '' }),
      h('span', { class: 'sprite-label' }, props.label)
    ])
  }
})

const BloomSprite = defineComponent({
  props: {
    label: { type: String, default: '朵朵 · 完成回看' },
    decorative: Boolean
  },
  setup(props) {
    return () => h('span', { class: ['sprite', { 'is-decorative': props.decorative }] }, [
      h('img', { class: 'sprite-asset bloom-sprite-asset ip-png-asset', src: publicAssetUrl('/memopuzzle-ip/dodo-happy.png?v=ip20260611'), alt: '' }),
      h('span', { class: 'sprite-label' }, props.label)
    ])
  }
})

const SpriteGroup = defineComponent({
  props: { type: { type: String, default: 'all' } },
  setup(props) {
    return () => h('div', { class: 'sprite-stage-placeholder' }, [
      props.type === 'listen' || props.type === 'all' ? h(ListeningSprite) : null,
      props.type === 'curious' || props.type === 'all' ? h(CuriousSprite) : null,
      props.type === 'bloom' || props.type === 'all' ? h(BloomSprite) : null
    ])
  }
})

const SecondaryPage = defineComponent({
  setup() {
    const data = computed(() => ({
      rule: ['准备加入', '规则入口', 'listen'],
      ai: ['AI等待', '生成反馈', 'bloom'],
      review: ['完成回看', '结果总结', 'bloom'],
      gallery: ['作品回顾', '记忆沉淀', 'curious']
    }[secondary.value]))
    return () => h('div', { class: 'secondary-preview-card' }, [
      h('h2', data.value[0]),
      h(SpriteGroup, { type: data.value[2] }),
      h('p', `${data.value[1]} · 这是左侧悬浮导航的二级页面。我们把这件小事织成共鸣，完整回声已送达。`),
      h('button', { class: 'confirm-btn', type: 'button', onClick: () => { secondary.value = null } }, '关闭页面')
    ])
  }
})

const StoryCard = defineComponent({
  setup() {
    return () => {
      const recording = mode.value === 'recording'
      const busy = activeVoiceTarget.value === 'story' && (voiceStatus.value === 'uploading' || voiceStatus.value === 'recognizing')
      const confirm = mode.value === 'confirm'
      return h('div', null, [
        h('div', { class: ['step-card', 'active', 'story-panel', { recording }] }, [
          h('div', { class: 'step-top' }, [
            h('div', { class: 'step-title' }, [h('span', { class: 'step-num' }, '1'), '讲一件最近的小事']),
            h('span', { class: 'step-state' }, confirm ? '待确认' : '进行中')
          ]),
          h('p', { class: 'step-sub' }, '用语音或文字说出故事'),
          recording ? h('div', { class: 'companion-card' }, [
            h(ListeningSprite, { label: '' }),
            h('div', null, [
              h('strong', '帕托 · 倾听陪伴'),
              h('p', '不用一次说完整，先从一个画面、一个声音或一个感受开始。')
            ])
          ]) : null,
          h('button', { type: 'button', class: ['record-btn', { confirmed: confirm, disabled: busy }], onClick: () => { if (!confirm && !busy) toggleRecord('story') } }, [
            h(IconVoiceInput, { compact: true, active: recording }),
            busy ? '识别中' : recording ? '停止并识别' : '开始说话',
            h('span', {
              class: 'direct',
              onClick: (event) => {
                event.preventDefault()
                event.stopPropagation()
                focusStoryInput()
              }
            }, '直接输入')
          ]),
          h('textarea', {
            ref: storyInputEl,
            class: ['input-box', 'story-input'],
            value: confirm ? story.value : storyInputText.value,
            placeholder: '今天发生了什么？\n你最想记住哪个片段？\n当时在哪里？',
            onInput: (event) => {
              const value = event.currentTarget.value
              storyInputText.value = value
              story.value = value
            }
          }),
          canConfirmStory.value ? h('button', { type: 'button', class: 'confirm-btn', onClick: () => go('confirmStory') }, '确认故事，进入提问') : null,
          h('div', { class: 'voice-status' }, [
            h(recording ? IconVoiceInput : TinySparkleIcon, { tiny: true, active: recording }),
            h('span', busy ? voiceHint.value : recording ? '懂一点也没关系，我在听着呢' : '慢一点也没关系，我在听着呢')
          ])
        ]),
        h(LockedCard, { num: '2', title: '补充画面细节', sub: '先完成第 1 步，再进入同伴提问' }),
        h(LockedCard, { num: '3', title: '选择风格', sub: '确认画风后生成拼图' })
      ])
    }
  }
})

const LockedCard = defineComponent({
  props: { num: String, title: String, sub: String },
  setup(props) {
    return () => h('div', { class: 'step-card locked' }, [
      h('div', { class: 'step-top' }, [
        h('div', { class: 'step-title' }, [h('span', { class: 'step-num' }, props.num), props.title]),
        h('span', { class: 'step-state' }, '未解锁')
      ]),
      h('p', { class: 'step-sub' }, props.sub)
    ])
  }
})

const FollowCard = defineComponent({
  setup() {
    return () => {
      const recording = mode.value === 'followRecording'
      const confirm = mode.value === 'followConfirm'
      const hasSaved = savedDetailCount.value > 0
      const hasDraft = Boolean(detailDraft.value || detailQuestion.value || emotionDetail.value || narratorDetail.value || confirm)
      const canSaveDetail = hasDraft && !recording
      const canFinishDetail = (hasSaved || hasDraft) && !recording
      const recommendedPrompt = [IconTagLocation, '当时在哪里？', 'recommended']
      const promptTags = [
        [IconTagObject, '周围有什么物品？', 'normal'],
        [IconTagDistance, '远处可以看到什么？', 'normal'],
        [IconTagColor, '这东西像什么颜色？', 'emotion'],
        [IconTagBody, '当时身体感觉如何？', 'emotion'],
        [TinySparkleIcon, '希望画面更安静还是更开心？', 'mood']
      ]
      const choosePrompt = (text) => {
        detailDraft.value = text
        detailQuestion.value = text
        mode.value = 'follow'
      }
      const renderPromptButton = ([Icon, text, tone]) => h('button', {
        type: 'button',
        class: ['prompt-chip', `prompt-chip-${tone}`, { selected: detailQuestion.value === text || detailDraft.value === text }],
        onClick: () => choosePrompt(text)
      }, [
        h(Icon, { tiny: true }),
        h('span', text),
        (detailQuestion.value === text || detailDraft.value === text) ? h('b', { class: 'prompt-check' }, '✓') : null
      ])
      return h('div', null, [
        h(DoneCard, { num: '1', title: '讲一件最近的小事', sub: '已确认故事，可以继续补充细节' }),
        h('div', { class: 'detail-hero-card' }, [
          h('div', { class: 'detail-hero-icon' }, h(IconBoBoCurious, { compact: true, decorative: true })),
          h('div', null, [
            h('strong', '帧帧正在帮你补全画面'),
            h('p', '选择一个提示后，可以直接补充一句话。')
          ]),
          h('span', { class: 'detail-count' }, `${Math.max(savedDetailCount.value + 1, 1)}/3`)
        ]),
        h('div', { class: 'step-card active question-card formal-question-card' }, [
          h(IconBoBoCurious, { class: 'bobo-curious', decorative: true }),
          h('div', { class: 'step-top' }, [
            h('div', { class: 'step-title' }, [h('span', { class: 'step-num' }, '2'), '补充画面细节']),
            h('span', { class: 'step-state' }, hasSaved ? '可继续' : '提问中')
          ]),
          h('p', { class: 'step-sub' }, hasSaved ? `已保存 ${savedDetailCount.value} 条补充，可以继续补充，也可以进入风格选择。` : '不用分开填写，用一句话补充地点、颜色、声音或感受。'),
          h('section', { class: 'question-section unified-detail-section' }, [
            h('div', { class: 'question-section-head' }, [
              h('div', null, [h('strong', '提示问题区'), h('span', '不用全部回答，先选一个最容易说的。')])
            ]),
            h('div', { class: 'prompt-group recommended-prompt' }, [
              h('span', { class: 'prompt-label' }, '推荐问题'),
              h('div', { class: 'follow-tags priority-tags' }, [renderPromptButton(recommendedPrompt)])
            ]),
            h('div', { class: 'prompt-group' }, [
              h('span', { class: 'prompt-label' }, '更多提示'),
              h('div', { class: 'follow-tags' }, promptTags.map(renderPromptButton))
            ]),
            h('div', { class: 'question-section-head input-head' }, [
              h('div', null, [h('strong', '补充内容'), h('span', '写一句就够了，也可以直接用语音。')])
            ]),
            h('textarea', {
              class: ['input-box', 'question-input', 'unified-detail-input'],
              value: detailDraft.value || detailQuestion.value || narratorDetail.value,
              placeholder: '写一句就够了：例如，远处的窗子有光，空气有点潮湿，我当时有一点紧张，后来很安心。',
              onInput: (event) => {
                detailDraft.value = event.currentTarget.value
                detailQuestion.value = event.currentTarget.value
              }
            })
          ]),
          h('button', { type: 'button', class: ['record-btn', 'follow-record', { recording }], onClick: () => toggleRecord(activeVoiceTarget.value || 'visual') }, [
            h(IconVoiceInput, { compact: true, active: recording }),
            recording ? '停止并识别' : '开始补充语音',
            recording ? null : h('span', { class: 'direct' }, '直接输入')
          ]),
          h('div', { class: 'detail-action-row' }, [
            h('button', { type: 'button', class: ['confirm-btn', 'save-detail-btn', { disabled: !canSaveDetail }], disabled: !canSaveDetail, onClick: () => go('saveFollow') }, recording ? '识别后可保存' : hasSaved ? '保存后继续补充' : '先保存这一句'),
            h('button', { type: 'button', class: ['confirm-btn', 'finish-detail-btn', { disabled: !canFinishDetail }], disabled: !canFinishDetail, onClick: () => go('finishFollow') }, '保存补充，选择风格')
          ]),
          recording ? null : h('div', { class: 'voice-status compact-follow-hint' }, [
            h(recording ? IconVoiceInput : TinySparkleIcon, { tiny: true, active: recording }),
            h('span', '细节不用完整，说一个画面、声音或身体感受就可以')
          ])
        ]),
        hasSaved ? h(LockedCard, { num: '3', title: '选择风格', sub: '完成提问后即可进入风格选择' }) : h(LockedCard, { num: '3', title: '选择风格', sub: '至少保存一轮提问和回应后解锁' })
      ])
    }
  }
})

const DoneCard = defineComponent({
  props: { num: String, title: String, sub: String },
  setup(props) {
    return () => h('div', { class: 'step-card done' }, [
      h('div', { class: 'step-top' }, [
        h('div', { class: 'step-title' }, [h('span', { class: 'step-num' }, props.num), props.title]),
        h('span', { class: 'step-state' }, '已完成')
      ]),
      props.sub ? h('p', { class: 'step-sub' }, props.sub) : null
    ])
  }
})

const StyleCard = defineComponent({
  setup() {
    return () => h('div', null, [
      h(DoneCard, { num: '1', title: '讲一件最近的小事' }),
      h(DoneCard, { num: '2', title: '补充画面细节' }),
      h('div', { class: 'step-card active' }, [
        h('div', { class: 'step-top' }, [
          h('div', { class: 'step-title' }, [h('span', { class: 'step-num' }, '3'), '选择风格']),
          h('span', { class: 'step-state' }, '进行中')
        ]),
        h('p', { class: 'step-sub' }, '确认画面风格后生成拼图'),
        h('div', { class: 'style-options' }, [
          [IconMemoryAlbum, 'healing', '梦境绘本'],
          [IconSparklePop, 'emotion-light', '情绪光影'],
          [IconSoftPuzzle, 'clear-puzzle', '清晰的拼图']
        ].map(([Icon, value, label]) => {
          const active = puzzleStyle.value === value
          return h('button', {
            type: 'button',
            class: ['style', { active }],
            'aria-pressed': active ? 'true' : 'false',
            onClick: () => { puzzleStyle.value = value }
          }, [
            h('div', { class: 'style-icon' }, h(Icon, { compact: true, active })),
          label
          ])
        })),
        h('button', { type: 'button', class: ['confirm-btn', { disabled: recordStatus.value === 'uploading' }], onClick: () => { if (recordStatus.value !== 'uploading') go('generate') } }, recordStatus.value === 'uploading' ? '正在生成图像...' : '织成图像碎片')
      ])
    ])
  }
})

const PuzzleCard = defineComponent({
  setup() {
    return () => {
      const correct = correctPuzzleCount.value
      const total = puzzleTotalCount.value
      const remaining = remainingPuzzleCount.value
      const solved = total > 0 && remaining === 0
      const nearComplete = puzzleNearComplete.value

      return h('div', null, [
        h('div', { class: 'step-card puzzle-state' }, [
          h('div', { class: 'step-title' }, [h(IconSoftPuzzle, { tiny: true, active: true }), '轮到当前玩家移动碎片', h('span', { class: 'count-chip mint-bg' }, '3/3')]),
          h('p', { class: 'step-sub no-bottom' }, solved
            ? '已经全部归位，正在显示庆祝反馈。'
            : nearComplete
              ? `还差 ${remaining} 块，黄色描边的碎片还没归位。`
              : `当前已归位 ${correct} 块，还差 ${remaining} 块。`)
        ]),
        h(DoneCard, { num: '1', title: '讲一件最近的小事' }),
        h(DoneCard, { num: '2', title: '补充画面细节' }),
        h(DoneCard, { num: '3', title: '选择风格' }),
        h('div', { class: 'step-card active' }, [
          h('b', { class: 'complete-title' }, [h(IconHugHeart, { tiny: true }), solved ? '我们把这张图拼回来了' : '拼图正在慢慢完整']),
          h('p', { class: 'desc complete-desc' }, solved
            ? '这是这轮小事留下的共同图像。'
            : nearComplete
              ? '画面看起来很接近了，最后几块已经帮你轻轻标出来。'
              : '继续交换碎片，画面会一点点回到正确位置。'),
          h('div', { class: 'bar-line', style: { '--progress': `${puzzleProgressPercent.value}%` } }, [h('i')]),
          h('p', { class: 'progress-copy' }, solved ? `${correct}/${total} 块已归位 · 已完成` : `${correct}/${total} 块已归位 · 还差 ${remaining} 块`),
          h('button', { type: 'button', class: 'confirm-btn regen-btn', onClick: () => go('finish') }, '重新生成图片'),
          h('div', { class: 'note' }, '生成后会自动切成 4×4 拼图。')
        ])
      ])
    }
  }
})
</script>

<style>
:root {
  --mp-bg: #DEEAE7;
  --mp-cream: #FFFDF7;
  --mp-paper: #FFFFFF;
  --mp-yellow: #FFD875;
  --mp-yellow-deep: #F6C756;
  --mp-yellow-soft: #FFF3BD;
  --mp-mint: #A3E4D7;
  --mp-mint-soft: #DCFAF4;
  --mp-blue: #9BD8F4;
  --mp-blue-soft: #E6F7FF;
  --mp-pink: #FFACC8;
  --mp-peach: #FFD9C2;
  --mp-lavender: #CDBBFF;
  --mp-ink: #31424A;
  --mp-muted: #7D8D92;
  --mp-line: #E5E6DF;
  --mp-radius-button: 18px;
  --mp-radius-input: 24px;
  --mp-radius-card: 28px;
  --mp-radius-stage: 40px;
  --mp-radius-dialog: 32px;
  --mp-radius-puzzle: 16px;
  --mp-shadow-soft: 0 12px 30px rgba(84, 119, 110, 0.08);
  --mp-shadow-stage: 0 24px 70px rgba(84, 119, 110, 0.16);
  --mp-ease: cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

body {
  margin: 0;
  overflow: hidden;
  background:
    radial-gradient(at 0% 0%, rgba(200, 142, 255, 0.08) 0px, transparent 50%),
    radial-gradient(at 100% 100%, rgba(115, 168, 255, 0.08) 0px, transparent 50%),
    var(--mp-bg);
}

.filter-defs,
.roughen-filter-svg {
  position: absolute;
  width: 0;
  height: 0;
  pointer-events: none;
}

.emotion-rebuild-page {
  --bg: var(--mp-bg);
  --paper: var(--mp-paper);
  --cream: var(--mp-cream);
  --ink: var(--mp-ink);
  --muted: var(--mp-muted);
  --line: var(--mp-line);
  --radius-button: var(--mp-radius-button);
  --radius-input: var(--mp-radius-input);
  --radius-card: var(--mp-radius-card);
  --radius-stage: var(--mp-radius-stage);
  --radius-dialog: var(--mp-radius-dialog);
  --radius-puzzle: var(--mp-radius-puzzle);
  --shadow: var(--mp-shadow-stage);
  --soft: var(--mp-shadow-soft);
  --ease: var(--mp-ease);
  min-height: 100vh;
  display: grid;
  place-items: center;
  overflow: hidden;
  background:
    radial-gradient(at 0% 0%, rgba(200, 142, 255, 0.08) 0px, transparent 50%),
    radial-gradient(at 100% 100%, rgba(115, 168, 255, 0.08) 0px, transparent 50%),
    var(--mp-bg);
  color: var(--ink);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
}

.emotion-rebuild-page * {
  box-sizing: border-box;
}

.app {
  position: relative;
  width: 1440px;
  height: 960px;
  border-radius: var(--mp-radius-stage);
  overflow: hidden;
  background:
    radial-gradient(at 0% 0%, rgba(200, 142, 255, 0.08) 0px, transparent 50%),
    radial-gradient(at 100% 100%, rgba(115, 168, 255, 0.08) 0px, transparent 50%),
    var(--bg);
}

.flowbar {
  position: absolute;
  z-index: 10;
  top: 14px;
  right: 54px;
  left: 125px;
  display: grid;
  height: 64px;
  grid-template-columns: repeat(5, 1fr);
  align-items: center;
  border: 1px solid rgba(255, 255, 255, 0.86);
  border-radius: 999px;
  padding: 0 12px;
  background: rgba(255, 255, 255, 0.78);
  box-shadow: 0 14px 34px rgba(84, 119, 110, 0.1);
  backdrop-filter: blur(18px);
}

.flow-step {
  position: relative;
  display: flex;
  height: 44px;
  align-items: center;
  gap: 10px;
  border-radius: 999px;
  margin: 0 4px;
  padding: 0 16px;
  color: var(--muted);
  font-weight: 700;
  transition: all 0.28s var(--ease);
  background: rgba(255, 255, 255, 0.55);
}

.flow-step:not(:last-child)::after {
  content: "";
  position: absolute;
  right: -14px;
  top: 50%;
  width: 16px;
  height: 2px;
  border-radius: 999px;
  background: rgba(246, 199, 86, 0.38);
}

.flow-step .num {
  display: grid;
  width: 26px;
  height: 26px;
  flex: 0 0 26px;
  place-items: center;
  border-radius: 50%;
  background: rgba(49, 66, 74, 0.07);
  color: var(--muted);
  font-size: 13px;
  font-weight: 900;
  transition: all 0.28s var(--ease);
}

.flow-step .txt {
  display: block;
  min-width: 0;
  font-size: 14px;
  line-height: 1.2;
  white-space: nowrap;
}

.flow-step small {
  display: block;
  margin-top: 1px;
  color: var(--muted);
  font-size: 11px;
  font-weight: 500;
}

.flow-step.active {
  background: var(--mp-yellow);
  box-shadow: 0 6px 15px rgba(246, 199, 86, 0.3);
  color: var(--ink);
  transform: rotate(-1.5deg) translateY(-1px);
}

.flow-step.active .num {
  background: #ffffff;
  color: var(--ink);
  font-weight: 900;
}

.flow-step.done {
  color: var(--ink);
  background: rgba(163, 228, 215, 0.42);
}

.flow-step.done .num {
  background: var(--mp-mint);
  color: var(--ink);
}

.float-nav {
  position: absolute;
  z-index: 20;
  left: 16px;
  top: 50%;
  display: flex;
  width: 76px;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 38px;
  padding: 16px 0;
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 24px 70px rgba(84, 119, 110, 0.16);
  transform: translateY(-50%);
  backdrop-filter: blur(20px);
}

.float-btn {
  position: relative;
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 6px 14px rgba(84, 119, 110, 0.1);
  cursor: pointer;
  font-size: 22px;
  transition: all 0.25s var(--ease);
}

.float-btn:hover,
.float-btn.active {
  background: #ffffff;
  box-shadow: 0 12px 28px rgba(84, 119, 110, 0.14);
  transform: translateX(5px) scale(1.08);
}

.float-tip {
  position: absolute;
  z-index: 30;
  left: 68px;
  top: 50%;
  display: none;
  border: 1px solid rgba(0, 0, 0, 0.04);
  border-radius: var(--radius-button);
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 16px 38px rgba(84, 119, 110, 0.16);
  font-size: 13px;
  line-height: 1.3;
  white-space: nowrap;
  transform: translateY(-50%);
  backdrop-filter: blur(14px);
}

.float-tip b {
  display: block;
  color: var(--ink);
  font-size: 14px;
}

.float-tip span {
  display: block;
  margin-top: 2px;
  color: var(--muted);
  font-size: 11px;
}

.float-btn:hover .float-tip {
  display: block;
}

.join-market-panel {
  position: absolute;
  z-index: 50;
  left: 66px;
  top: -18px;
  display: none;
  width: min(430px, calc(100vw - 132px));
  max-height: min(680px, calc(100vh - 42px));
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.75);
  border-radius: 28px;
  padding: 22px;
  background:
    radial-gradient(circle at 80% 18%, rgba(255, 239, 186, 0.32), transparent 28%),
    rgba(255, 255, 255, 0.98);
  box-shadow: 0 22px 58px rgba(84, 119, 110, 0.2);
  color: var(--ink);
  text-align: left;
  cursor: default;
  transform-origin: left top;
  backdrop-filter: blur(18px);
}

.float-btn-rule:hover .join-market-panel,
.float-btn-rule:focus-visible .join-market-panel,
.join-market-panel:hover {
  display: block;
}

.join-panel-close {
  position: absolute;
  top: 14px;
  right: 14px;
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border: 1px solid rgba(49, 66, 74, 0.08);
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 8px 24px rgba(84, 119, 110, 0.12);
  color: var(--ink);
  font-size: 22px;
  font-weight: 900;
  line-height: 1;
}

.join-panel-head {
  display: grid;
  grid-template-columns: 64px 1fr;
  gap: 14px;
  align-items: center;
  padding-right: 38px;
}

.join-panel-head .sprite {
  width: 62px;
  height: 50px;
  filter: none;
}

.join-panel-head .sprite-asset {
  width: 62px;
  height: 50px;
}

.join-panel-head .sprite-label {
  display: none;
}

.join-panel-head b {
  display: block;
  color: var(--ink);
  font-size: 22px;
  font-weight: 950;
  letter-spacing: -0.04em;
  line-height: 1.15;
}

.join-panel-head span span {
  display: block;
  margin-top: 6px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 800;
  line-height: 1.55;
}

.join-panel-steps {
  display: grid;
  gap: 10px;
  border: 1.5px solid rgba(246, 199, 86, 0.45);
  border-radius: 22px;
  margin-top: 18px;
  padding: 16px;
  background: rgba(255, 253, 247, 0.72);
}

.join-step-line {
  display: grid;
  grid-template-columns: 28px 1fr;
  align-items: center;
  gap: 10px;
  color: var(--ink);
  font-size: 12px;
  font-weight: 900;
  line-height: 1.45;
}

.join-step-line i {
  display: grid;
  width: 26px;
  height: 26px;
  place-items: center;
  border-radius: 50%;
  background: var(--mp-yellow);
  box-shadow: 0 3px 0 rgba(49, 66, 74, 0.12);
  color: var(--ink);
  font-style: normal;
  font-size: 13px;
  font-weight: 950;
}

.join-panel-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 16px;
}

.join-action-card {
  display: block;
  min-height: 118px;
  border: 1px solid rgba(49, 66, 74, 0.1);
  border-radius: 20px;
  padding: 15px 14px;
  background: #ffffff;
  box-shadow: 0 14px 34px rgba(84, 119, 110, 0.1);
}

.join-action-card strong {
  display: block;
  color: var(--ink);
  font-size: 15px;
  font-weight: 950;
}

.join-action-card em {
  display: block;
  min-height: 46px;
  margin-top: 8px;
  color: var(--muted);
  font-style: normal;
  font-size: 11px;
  font-weight: 800;
  line-height: 1.55;
}

.join-create-btn,
.join-room-btn,
.join-enter-btn {
  display: grid;
  height: 38px;
  place-items: center;
  border-radius: 14px;
  margin-top: 10px;
  color: var(--ink);
  font-size: 13px;
  font-weight: 950;
}

.join-create-btn {
  background: linear-gradient(135deg, #69ad70, #a7dbad);
}

.join-room-btn {
  background: linear-gradient(135deg, #4b78c9, #a8d1f3);
  color: #ffffff;
}

.join-code-box {
  display: flex;
  height: 36px;
  align-items: center;
  border: 1px solid rgba(49, 66, 74, 0.12);
  border-radius: 12px;
  margin-top: 10px;
  padding: 0 14px;
  background: rgba(255, 253, 247, 0.9);
  color: var(--ink);
  font-size: 14px;
  font-weight: 950;
  letter-spacing: 0.28em;
}

.join-ready-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1.5px solid rgba(163, 228, 215, 0.55);
  border-radius: 18px;
  margin-top: 14px;
  padding: 12px 14px;
  background: linear-gradient(135deg, rgba(220, 250, 244, 0.72), rgba(255, 255, 255, 0.92));
}

.join-ready-card em,
.join-ready-card b {
  display: block;
}

.join-ready-card em {
  color: var(--muted);
  font-style: normal;
  font-size: 11px;
  font-weight: 900;
}

.join-ready-card b {
  margin-top: 3px;
  color: var(--ink);
  font-size: 26px;
  font-weight: 950;
  letter-spacing: 0.18em;
  line-height: 1;
}

.join-members {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 950;
}

.join-members i {
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 8px 20px rgba(84, 119, 110, 0.1);
  color: var(--ink);
  font-style: normal;
  font-weight: 950;
}

.join-enter-btn {
  height: 46px;
  margin-top: 14px;
  border-radius: 16px;
  background: linear-gradient(135deg, #f5ca4b, #ffe78d);
  box-shadow: 0 14px 34px rgba(246, 199, 86, 0.24);
  font-size: 15px;
}

.float-btn .mp-icon {
  margin-right: 0;
}

.float-btn .mp-icon.compact {
  width: 38px;
  height: 38px;
  margin-right: 0;
  border-radius: 50%;
  box-shadow: none;
}

.float-btn:hover .mp-icon,
.float-btn.active .mp-icon {
  transform: none;
}

.float-btn.active .mp-icon {
  box-shadow:
    0 0 0 7px rgba(255, 216, 117, 0.18),
    0 10px 22px rgba(84, 119, 110, 0.12);
}

.float-btn-review.active .mp-icon,
.float-btn-gallery.active .mp-icon {
  box-shadow:
    0 0 0 7px rgba(255, 172, 200, 0.18),
    0 10px 22px rgba(84, 119, 110, 0.12);
}

.mp-icon,
.tile-icon {
  position: relative;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  color: var(--mp-ink);
  pointer-events: auto;
}

.mp-icon {
  width: 48px;
  height: 48px;
  border-radius: 18px;
  background: var(--icon-bg, #ffffff);
  box-shadow: 0 8px 18px rgba(84, 119, 110, 0.1);
  transition: transform 0.25s var(--ease), box-shadow 0.25s ease;
}

.tile-icon {
  width: 28px;
  height: 28px;
  border-radius: 12px;
  background: var(--icon-bg, transparent);
}

.mp-icon.compact {
  width: 38px;
  height: 38px;
  border-radius: 15px;
  margin-right: 12px;
  box-shadow: 0 5px 12px rgba(84, 119, 110, 0.1);
}

.mp-icon.tiny,
.tile-icon.tiny {
  width: 24px;
  height: 24px;
  border-radius: 10px;
  box-shadow: none;
  margin-right: 0;
}

.mp-icon.decorative,
.tile-icon.decorative {
  pointer-events: none;
}

.mp-icon:hover,
.mp-icon.active {
  box-shadow: 0 12px 26px rgba(84, 119, 110, 0.14);
  transform: translateY(-2px) scale(1.04);
}

.mp-icon *,
.tile-icon * {
  position: absolute;
  border-radius: 999px;
  box-sizing: border-box;
}

.icon-voice {
  --icon-bg: #ffffff;
  border-radius: 50%;
}

.record-btn .icon-voice,
.voice-status .icon-voice,
.mini-mic .icon-voice {
  background: #ffffff;
  box-shadow: none;
}

.voice-status .icon-voice.tiny,
.voice-status .tile-icon.icon-voice {
  width: 28px;
  height: 28px;
  flex: 0 0 28px;
  border-radius: 50%;
}

.record-btn .icon-voice .asset-icon-image,
.voice-status .icon-voice .asset-icon-image,
.mini-mic .icon-voice .asset-icon-image {
  width: 82%;
  height: 82%;
}

.record-btn .icon-voice.active .asset-icon-image,
.voice-status .icon-voice.active .asset-icon-image,
.mini-mic .icon-voice.active .asset-icon-image {
  width: 58%;
  height: 58%;
}
.voice-mic {
  width: 13px;
  height: 22px;
  border: 3px solid var(--mp-ink);
  border-radius: 10px;
  background: var(--mp-paper);
}
.voice-mic::before,
.voice-mic::after {
  content: "";
  position: absolute;
  left: 50%;
  background: var(--mp-ink);
  transform: translateX(-50%);
}
.voice-mic::before { bottom: -8px; width: 3px; height: 8px; }
.voice-mic::after { bottom: -11px; width: 16px; height: 3px; border-radius: 999px; }
.voice-bubble {
  width: 7px;
  height: 7px;
  background: var(--mp-mint);
}
.voice-bubble.b1 { right: 7px; top: 11px; }
.voice-bubble.b2 { right: 12px; top: 24px; width: 5px; height: 5px; background: var(--mp-yellow); }
.voice-sparkle {
  left: 12px;
  top: 8px;
  width: 9px;
  height: 9px;
  background: var(--mp-yellow-deep);
  clip-path: polygon(50% 0, 62% 37%, 100% 50%, 62% 63%, 50% 100%, 38% 63%, 0 50%, 38% 37%);
  opacity: 0;
}
.icon-voice.active .voice-sparkle {
  opacity: 1;
  animation: sparklePop 1.6s infinite ease-in-out;
}

.icon-puzzle { --icon-bg: #fff9e6; }
.soft-piece {
  width: 25px;
  height: 25px;
  border: 3px solid var(--mp-ink);
  border-radius: 8px 10px 9px 12px;
  background: var(--mp-mint);
  transform: rotate(-5deg);
}
.soft-piece::before,
.soft-piece::after {
  content: "";
  position: absolute;
  border: 3px solid var(--mp-ink);
  border-radius: 50%;
  background: var(--mp-mint);
}
.soft-piece::before { right: -8px; top: 6px; width: 10px; height: 10px; border-left: 0; }
.soft-piece::after { left: 6px; top: -8px; width: 10px; height: 10px; border-bottom: 0; }
.icon-puzzle.active .soft-piece {
  animation: softBreath 2s infinite ease-in-out;
}

.icon-album { --icon-bg: #ffe6eb; }
.album-left-page,
.album-right-page {
  bottom: 11px;
  width: 16px;
  height: 22px;
  border: 3px solid var(--mp-ink);
  background: var(--mp-paper);
}
.album-left-page { left: 10px; border-radius: 11px 4px 7px 12px; transform: rotate(-6deg); }
.album-right-page { right: 10px; border-radius: 4px 11px 12px 7px; transform: rotate(6deg); }
.album-heart,
.hug-heart-shape {
  width: 12px;
  height: 12px;
  background: var(--mp-pink);
  transform: rotate(45deg);
}
.album-heart { top: 17px; left: 18px; }
.album-heart::before,
.album-heart::after,
.hug-heart-shape::before,
.hug-heart-shape::after {
  content: "";
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: inherit;
}
.album-heart::before,
.hug-heart-shape::before { left: -6px; top: 0; }
.album-heart::after,
.hug-heart-shape::after { left: 0; top: -6px; }

.icon-album.active .album-right-page {
  animation: pageWake 2.8s infinite var(--mp-ease);
}

.icon-album.active .album-heart {
  animation: softBreath 2.2s infinite ease-in-out;
}

.icon-members { --icon-bg: #e8f5e9; }
.member-blob {
  bottom: 10px;
  width: 20px;
  height: 24px;
  border: 3px solid var(--mp-ink);
  background: var(--mp-blue);
}
.member-blob.one { left: 9px; border-radius: 58% 42% 50% 50%; }
.member-blob.two { right: 9px; border-radius: 42% 58% 50% 50%; background: var(--mp-mint); }
.member-blob::before,
.member-blob::after {
  content: "";
  position: absolute;
  top: 8px;
  width: 3px;
  height: 3px;
  background: var(--mp-ink);
}
.member-blob::before { left: 5px; }
.member-blob::after { right: 5px; }
.online-dot {
  top: 9px;
  right: 9px;
  width: 8px;
  height: 8px;
  background: var(--mp-mint);
  box-shadow: 0 0 0 4px rgba(163, 228, 215, 0.24);
  animation: softBreath 2s infinite ease-in-out;
}

.icon-members.active .member-blob.one,
.icon-members.active .member-blob.two {
  animation: tinyFloat 3.2s infinite ease-in-out;
}

.icon-rule-note { --icon-bg: var(--mp-yellow-soft); }
.note-sheet {
  width: 25px;
  height: 28px;
  border: 3px solid var(--mp-ink);
  border-radius: 9px 11px 10px 8px;
  background: var(--mp-paper);
  transform: rotate(-3deg);
}
.note-line {
  left: 16px;
  width: 16px;
  height: 3px;
  background: var(--mp-ink);
}
.note-line.one { top: 18px; }
.note-line.two { top: 26px; width: 12px; }

.icon-tiny-sparkle { --icon-bg: var(--mp-yellow-soft); }
.sparkle-core,
.pop-spark,
.canvas-spark {
  width: 17px;
  height: 17px;
  background: var(--mp-yellow-deep);
  clip-path: polygon(50% 0, 62% 37%, 100% 50%, 62% 63%, 50% 100%, 38% 63%, 0 50%, 38% 37%);
  animation: sparklePop 2.4s infinite ease-in-out;
}
.sparkle-dot {
  width: 5px;
  height: 5px;
  background: var(--mp-pink);
}
.sparkle-dot.one { right: 10px; top: 9px; }
.sparkle-dot.two { left: 10px; bottom: 9px; background: var(--mp-mint); }

.icon-bloom-review { --icon-bg: #fff2f5; }
.bloom-petal {
  width: 20px;
  height: 22px;
  background: var(--mp-pink);
}
.bloom-petal.p1 { top: 8px; left: 14px; transform: rotate(-25deg); }
.bloom-petal.p2 { top: 8px; right: 14px; transform: rotate(25deg); }
.bloom-petal.p3 { bottom: 10px; left: 15px; width: 18px; height: 18px; background: var(--mp-peach); }
.bloom-face {
  width: 18px;
  height: 11px;
  border-bottom: 3px solid var(--mp-ink);
  border-radius: 0 0 999px 999px;
}

.icon-bloom-review.active .bloom-petal {
  animation: softBreath 2.3s infinite ease-in-out;
}

.icon-patto-weaving { --icon-bg: var(--mp-yellow-soft); }
.patto-body {
  width: 26px;
  height: 21px;
  border: 3px solid var(--mp-ink);
  border-radius: 58% 42% 55% 45%;
  background: var(--mp-yellow);
}
.patto-thread {
  width: 34px;
  height: 15px;
  border: 2px solid rgba(49, 66, 74, 0.45);
  border-left-color: transparent;
  border-right-color: transparent;
}
.patto-thread.one { transform: rotate(-16deg); animation: tinyFloat 4s infinite ease-in-out; }
.patto-thread.two { transform: rotate(16deg); animation: tinyFloat 4.4s infinite ease-in-out reverse; }
.patto-ball {
  right: 6px;
  bottom: 7px;
  width: 10px;
  height: 10px;
  background: var(--mp-pink);
}

.icon-patto-weaving.active .patto-body {
  animation: softBreath 2.6s infinite ease-in-out;
}

.icon-canvas-bound { --icon-bg: rgba(255, 255, 255, 0.7); }
.canvas-corner {
  width: 12px;
  height: 12px;
  border: 3px solid var(--mp-ink);
  opacity: 0.72;
}
.canvas-corner.tl { left: 8px; top: 8px; border-right: 0; border-bottom: 0; border-radius: 5px 0 0 0; }
.canvas-corner.tr { right: 8px; top: 8px; border-left: 0; border-bottom: 0; border-radius: 0 5px 0 0; }
.canvas-corner.bl { left: 8px; bottom: 8px; border-right: 0; border-top: 0; border-radius: 0 0 0 5px; }
.canvas-corner.br { right: 8px; bottom: 8px; border-left: 0; border-top: 0; border-radius: 0 0 5px 0; }
.canvas-spark {
  width: 10px;
  height: 10px;
}

.icon-bobo-curious { --icon-bg: transparent; }

.icon-bobo-curious .asset-icon-image {
  width: 112%;
  height: 112%;
}
.bobo-head {
  bottom: 5px;
  width: 26px;
  height: 24px;
  border: 3px solid var(--mp-ink);
  border-radius: 44% 56% 42% 58%;
  background: var(--mp-blue);
}
.bobo-eye {
  bottom: 16px;
  width: 3px;
  height: 3px;
  background: var(--mp-ink);
  animation: lookAround 4.5s infinite ease-in-out;
}
.bobo-eye.one { left: 18px; }
.bobo-eye.two { right: 18px; }
.bobo-question {
  right: 8px;
  top: 5px;
  width: 13px;
  height: 13px;
  border: 3px solid var(--mp-ink);
  border-left-color: transparent;
  border-bottom-color: transparent;
}
.bobo-question::after {
  content: "";
  position: absolute;
  right: -3px;
  bottom: -7px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--mp-ink);
}

.icon-hug-heart { --icon-bg: #fff2f5; }
.hug-heart-shape {
  width: 14px;
  height: 14px;
  background: var(--mp-pink);
}
.hug-hand {
  width: 13px;
  height: 20px;
  border: 3px solid var(--mp-ink);
  background: var(--mp-paper);
}
.hug-hand.left { left: 8px; transform: rotate(-28deg); }
.hug-hand.right { right: 8px; transform: rotate(28deg); }

.icon-sparkle-pop { --icon-bg: #fff8dc; }
.pop-bulb {
  width: 22px;
  height: 25px;
  border: 3px solid var(--mp-ink);
  border-radius: 55% 45% 48% 52%;
  background: var(--mp-yellow-soft);
}
.pop-spark {
  width: 10px;
  height: 10px;
}
.pop-base {
  bottom: 7px;
  width: 13px;
  height: 5px;
  background: var(--mp-ink);
}

.icon-sparkle-pop.active .pop-spark,
.icon-sparkle-pop.active .pop-bulb {
  animation: sparklePop 2.2s infinite ease-in-out;
}

.icon-tag-sun,
.icon-tag-wind,
.icon-tag-pet,
.icon-tag-color,
.icon-tag-body {
  --icon-bg: rgba(255, 255, 255, 0.5);
}
.tag-sun-core,
.tag-sun-glow {
  width: 14px;
  height: 14px;
  background: var(--mp-yellow);
}
.tag-sun-glow {
  width: 20px;
  height: 20px;
  background: rgba(255, 216, 117, 0.35);
}
.tag-wind-line {
  width: 18px;
  height: 8px;
  border: 3px solid var(--mp-mint);
  border-left: 0;
  border-bottom: 0;
}
.tag-wind-line.one { top: 8px; transform: rotate(-6deg); }
.tag-wind-line.two { bottom: 8px; width: 14px; transform: rotate(6deg); }
.tag-paw.pad { width: 10px; height: 9px; bottom: 6px; background: var(--mp-pink); }
.tag-paw.toe { width: 5px; height: 5px; top: 7px; background: var(--mp-pink); }
.tag-paw.toe.one { left: 7px; }
.tag-paw.toe.two { left: 12px; top: 5px; }
.tag-paw.toe.three { right: 7px; }
.tag-palette {
  width: 19px;
  height: 15px;
  border: 3px solid var(--mp-ink);
  background: var(--mp-yellow-soft);
  border-radius: 55% 45% 50% 50%;
}
.tag-color-dot { width: 5px; height: 5px; background: var(--mp-pink); }
.tag-color-dot.one { left: 8px; top: 9px; }
.tag-color-dot.two { right: 7px; bottom: 8px; background: var(--mp-blue); }
.tag-body-cloud {
  width: 20px;
  height: 15px;
  background: var(--mp-mint-soft);
  border: 2px solid var(--mp-mint);
}
.tag-body-pulse {
  width: 12px;
  height: 6px;
  border-bottom: 3px solid var(--mp-pink);
  border-radius: 0;
}

.layout {
  display: grid;
  height: 100%;
  grid-template-columns: 1fr 410px;
  gap: 28px;
  padding: 98px 36px 36px 108px;
}

.main-card {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: var(--radius-stage);
  padding: 32px;
  background: rgba(255, 255, 255, 0.8);
  box-shadow: var(--shadow);
  backdrop-filter: blur(20px);
}

.right-panel {
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: var(--radius-stage);
  padding: 24px 18px;
  background: rgba(255, 255, 255, 0.65);
  box-shadow: var(--soft);
  backdrop-filter: blur(15px);
}

.status-head {
  display: flex;
  height: 96px;
  align-items: center;
  border-radius: var(--radius-card);
  margin-bottom: 20px;
  padding: 0 24px;
  background: var(--mp-paper);
  box-shadow: var(--soft);
}

.avatar {
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  border-radius: 50%;
  margin-right: 16px;
  background: var(--mp-blue);
  box-shadow: 0 4px 10px rgba(155, 216, 244, 0.4);
  color: #ffffff;
  font-size: 20px;
}

.icon-avatar {
  background: transparent;
  box-shadow: none;
}

.icon-avatar .mp-icon {
  margin: 0;
}

.status-head h2 {
  margin: 0;
  color: var(--ink);
  font-size: 18px;
  font-weight: 800;
}

.status-head p {
  margin: 4px 0 0;
  color: var(--muted);
  font-size: 13px;
  font-weight: 500;
}

.task-pill {
  margin-left: auto;
  border-radius: 999px;
  padding: 6px 16px;
  background: var(--mp-peach);
  color: var(--ink);
  font-size: 13px;
  font-weight: 700;
}

.timer {
  margin-left: 14px;
  border: 2px dashed var(--mp-yellow);
  border-radius: var(--radius-button);
  padding: 6px 14px;
  background: #fffdf3;
  text-align: center;
}

.timer small {
  display: block;
  color: var(--muted);
  font-size: 11px;
  font-weight: 600;
}

.timer b {
  color: var(--ink);
  font-size: 24px;
  font-weight: 900;
}

.board-wrap {
  position: relative;
  display: grid;
  place-items: center;
  width: 100%;
  height: calc(100% - 116px);
  border: 1px solid rgba(246, 199, 86, 0.25);
  border-radius: var(--radius-card);
  padding: 20px;
  background: var(--mp-cream);
  box-shadow: var(--soft);
}

.puzzle-grid {
  display: grid;
  width: 100%;
  height: 100%;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(4, 1fr);
  gap: 6px;
  overflow: hidden;
  border-radius: var(--radius-puzzle);
}

.puzzle-grid.image-grid {
  width: auto;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  aspect-ratio: var(--puzzle-ratio, 4 / 3);
  background: rgba(255, 253, 247, 0.72);
}

.puzzle-grid.solved {
  animation: puzzleSolvedGlow 1.2s var(--ease) 1;
}

.puzzle-grid.near-complete {
  overflow: visible;
}

.cell {
  position: relative;
  overflow: hidden;
  border: 0;
  border-radius: var(--radius-puzzle);
  cursor: pointer;
  transition: transform 0.25s var(--ease), box-shadow 0.25s ease;
}

.cell:hover {
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
  transform: scale(1.02);
}

.cell.selected {
  z-index: 2;
  box-shadow:
    0 0 0 4px rgba(255, 255, 255, 0.95),
    0 0 0 8px rgba(163, 228, 215, 0.78),
    0 14px 30px rgba(84, 119, 110, 0.22);
  transform: scale(0.97);
}

.cell.correct {
  box-shadow:
    inset 0 0 0 3px rgba(163, 228, 215, 0.46),
    0 0 18px rgba(163, 228, 215, 0.24);
}

.cell.pending:not(.selected) {
  z-index: 1;
  box-shadow:
    inset 0 0 0 4px rgba(255, 216, 117, 0.9),
    0 0 0 5px rgba(255, 253, 247, 0.92),
    0 12px 28px rgba(246, 199, 86, 0.26);
  animation: pendingPieceHint 1.35s ease-in-out infinite;
}

.cell:nth-child(4n + 1) { background: var(--mp-blue); }
.cell:nth-child(4n + 2) { background: var(--mp-yellow-soft); }
.cell:nth-child(4n + 3) { background: var(--mp-mint-soft); }
.cell:nth-child(4n + 4) { background: var(--mp-pink); }
.cell:nth-child(n + 5):nth-child(-n + 8) { background: var(--mp-lavender); }
.cell:nth-child(n + 9):nth-child(-n + 12) { background: var(--mp-peach); }
.cell:nth-child(n + 13) { background: var(--mp-mint); }

.cell::after,
.cell::before {
  content: "";
  position: absolute;
  width: 20px;
  height: 20px;
  border-radius: 50%;
}

.cell::after {
  left: 50%;
  top: -10px;
  background: rgba(255, 255, 255, 0.4);
  transform: translateX(-50%);
}

.cell::before {
  right: -10px;
  top: 50%;
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-50%);
}

.image-grid .cell {
  background-color: transparent !important;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.2);
}

.image-grid .cell:hover {
  box-shadow: 0 0 0 3px var(--mp-mint), 0 12px 24px rgba(101, 212, 195, 0.4);
}

.image-grid .cell::before,
.image-grid .cell::after {
  display: none;
}

.center-notice {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 380px;
  border: 1px solid rgba(0, 0, 0, 0.02);
  border-radius: var(--radius-dialog);
  padding: 32px 28px;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: var(--shadow);
  text-align: center;
  transform: translate(-50%, -50%);
  backdrop-filter: blur(10px);
}

.center-notice h3 {
  margin: 0 0 10px;
  font-size: 20px;
  font-weight: 800;
}

.center-notice .sprite {
  margin: 0 auto 22px;
  filter: drop-shadow(0 18px 36px rgba(84, 119, 110, 0.12));
}

.center-notice .sprite-asset {
  width: 156px;
  height: 126px;
}

.center-notice .sprite-label {
  display: block;
  position: static;
  margin-top: 8px;
  color: var(--muted);
  font-size: 13px;
  font-weight: 800;
  transform: none;
}

.center-notice p {
  margin: 0 0 16px;
  color: var(--muted);
  font-size: 14px;
  font-weight: 500;
  line-height: 1.5;
}

.center-notice button {
  border: 0;
  border-radius: var(--radius-button);
  padding: 12px 28px;
  background: linear-gradient(135deg, var(--mp-yellow), #ffd255);
  box-shadow: 0 8px 20px rgba(255, 211, 79, 0.35);
  color: var(--ink);
  cursor: pointer;
  font-size: 15px;
  font-weight: 800;
  transition: transform 0.25s var(--ease);
}

.center-notice button:hover {
  transform: translateY(-2px);
}

.progress-card {
  position: absolute;
  right: 20px;
  bottom: 20px;
  width: 64px;
  height: 64px;
  border-radius: var(--radius-button) 0 0 0;
  background: var(--mp-yellow);
  opacity: 0.15;
  pointer-events: none;
}

.canvas-bound-anchor {
  position: absolute;
  z-index: 3;
  right: 22px;
  top: 22px;
  pointer-events: none;
}

.player-box {
  display: flex;
  height: 76px;
  align-items: center;
  border-radius: var(--radius-card);
  margin-bottom: 16px;
  padding: 0 20px;
  background: var(--mp-paper);
  box-shadow: var(--soft);
}

.player-box .avatar {
  width: 40px;
  height: 40px;
  background: var(--mp-lavender);
  box-shadow: none;
  font-size: 18px;
}

.player-box h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 800;
}

.player-box p {
  margin: 2px 0 0;
  color: var(--muted);
  font-size: 12px;
  font-weight: 500;
}

.heart {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  border-radius: 999px;
  padding: 6px 14px;
  background: var(--mp-peach);
  font-size: 13px;
  font-weight: 700;
}

.step-card {
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  margin-bottom: 16px;
  padding: 20px;
  background: var(--mp-paper);
  box-shadow: var(--soft);
  transition: all 0.3s var(--ease);
}

.step-card.active {
  border: 2px solid var(--mp-yellow-deep);
  background: var(--mp-cream);
  box-shadow: 0 14px 35px rgba(255, 216, 117, 0.15);
}

.step-card.done {
  border-color: rgba(101, 212, 195, 0.2);
  background: var(--mp-mint-soft);
}

.step-card.locked {
  background: rgba(255, 255, 255, 0.42);
  box-shadow: none;
  opacity: 0.45;
}

.step-top,
.step-title {
  display: flex;
  align-items: center;
}

.step-top {
  justify-content: space-between;
}

.step-title {
  gap: 10px;
  font-size: 16px;
  font-weight: 800;
}

.step-title .tile-icon {
  margin-right: 0;
}

.step-num,
.mini-sprite {
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--mp-yellow);
  font-weight: 900;
}

.step-num {
  width: 26px;
  height: 26px;
  font-size: 13px;
}

.mini-sprite {
  width: 24px;
  height: 24px;
  font-size: 11px;
}

.mini-sprite.mint {
  background: var(--mp-mint);
}

.step-card.done .step-num {
  background: var(--mp-mint);
  color: #ffffff;
}

.step-state {
  border-radius: 999px;
  padding: 4px 12px;
  background: rgba(255, 211, 79, 0.2);
  color: #7a5500;
  font-size: 12px;
  font-weight: 700;
}

.step-card.done .step-state {
  background: var(--mp-mint);
  color: #ffffff;
}

.step-card.locked .step-state {
  background: rgba(0, 0, 0, 0.05);
  color: var(--muted);
}

.story-panel.recording {
  border: 2px solid var(--mp-yellow-deep);
  border-radius: 30px;
  padding: 20px 20px 18px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 14px 34px rgba(246, 199, 86, 0.14);
}

.story-panel.recording .step-title {
  font-size: 17px;
}

.story-panel.recording .step-num {
  width: 30px;
  height: 30px;
  background: var(--mp-yellow-deep);
  color: var(--ink);
  font-size: 14px;
}

.story-panel.recording .step-state {
  padding: 7px 14px;
  background: var(--mp-yellow-soft);
  color: #755a12;
  font-size: 13px;
}

.story-panel.recording > .step-sub {
  margin: 7px 0 14px 42px;
  font-size: 13px;
  font-weight: 700;
}

.companion-card {
  display: grid;
  grid-template-columns: 76px 1fr;
  align-items: center;
  gap: 12px;
  border: 1px solid var(--mp-line);
  border-radius: 22px;
  margin: 0 0 14px;
  padding: 12px 14px;
  background: #ffffff;
  box-shadow: 0 10px 28px rgba(84, 119, 110, 0.06);
}

.companion-card .sprite {
  width: 70px;
  height: 56px;
  filter: none;
}

.companion-card .sprite-asset {
  width: 70px;
  height: 56px;
}

.companion-card .sprite-label {
  display: none;
}

.companion-card strong {
  display: block;
  color: var(--ink);
  font-size: 16px;
  font-weight: 900;
}

.companion-card p {
  margin: 4px 0 0;
  color: var(--muted);
  font-size: 12px;
  font-weight: 700;
  line-height: 1.45;
}

.step-sub {
  margin: 4px 0 12px 36px;
  color: var(--muted);
  font-size: 13px;
  font-weight: 500;
}

.dark {
  color: var(--ink);
  font-weight: 500;
}

.no-bottom {
  margin-bottom: 0;
}

.nested-recording {
  margin: 0 0 20px;
  border: 1.5px solid var(--mp-yellow-deep);
  border-radius: 30px;
  padding: 24px 26px;
  background: linear-gradient(135deg, var(--mp-yellow-soft), #fff7ce);
  box-shadow: none;
}

.nested-recording .step-title {
  gap: 12px;
  font-size: 20px;
}

.nested-recording .tile-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--mp-yellow);
}

.nested-recording .count-chip {
  min-width: 48px;
  padding: 4px 10px;
  background: var(--ink);
  font-size: 14px;
  text-align: center;
}

.nested-recording .step-sub {
  margin: 8px 0 0 40px;
  color: var(--ink);
  font-size: 15px;
  font-weight: 700;
}

.nested-follow {
  margin: 12px 0;
  border-color: var(--mp-mint);
  background: var(--mp-mint-soft);
}

.detail-hero-card {
  display: grid;
  grid-template-columns: 48px 1fr auto;
  align-items: center;
  gap: 14px;
  border: 1px solid rgba(49, 66, 74, 0.08);
  border-radius: 24px;
  margin-bottom: 14px;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: var(--soft);
}

.detail-hero-icon {
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border-radius: 15px;
  background: var(--mp-blue-soft);
}

.detail-hero-card strong {
  display: block;
  color: var(--ink);
  font-size: 17px;
  font-weight: 900;
}

.detail-hero-card p {
  margin: 5px 0 0;
  color: var(--muted);
  font-size: 12px;
  font-weight: 700;
  line-height: 1.5;
}

.detail-count {
  min-width: 48px;
  border-radius: 999px;
  padding: 8px 12px;
  background: var(--ink);
  color: #ffffff;
  text-align: center;
  font-size: 15px;
  font-weight: 900;
}

.question-card {
  position: relative;
}

.formal-question-card {
  border-color: #f7bd38;
  border-radius: 30px;
  padding: 20px 18px;
  background: rgba(255, 253, 247, 0.94);
}

.question-card .bobo-curious {
  position: absolute;
  right: 18px;
  top: -18px;
  pointer-events: none;
  transform: rotate(4deg);
}

.formal-question-card .bobo-curious {
  right: 20px;
  top: -28px;
}

.question-guide-box,
.narrator-section {
  border: 1px solid rgba(49, 66, 74, 0.1);
  border-radius: 22px;
  margin: 14px 0;
  padding: 16px;
  background: rgba(255, 255, 255, 0.82);
}

.question-guide-box strong {
  display: block;
  color: var(--ink);
  font-size: 15px;
  font-weight: 900;
}

.question-guide-box p {
  margin: 6px 0 0;
  color: var(--muted);
  font-size: 12px;
  font-weight: 700;
}

.question-section {
  margin-top: 16px;
  border-radius: 22px;
  padding: 0 2px;
}

.unified-detail-section {
  border: 1px solid rgba(246, 199, 86, 0.28);
  border-radius: 26px;
  padding: 16px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.82), rgba(255, 253, 247, 0.58));
}

.question-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.question-section-head strong,
.question-section-head span {
  display: block;
}

.question-section-head strong {
  color: var(--ink);
  font-size: 15px;
  font-weight: 900;
}

.question-section-head span {
  margin-top: 2px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 700;
}

.input-head {
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px solid rgba(49, 66, 74, 0.07);
}

.mini-mic {
  display: grid;
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  place-items: center;
  border: 1px solid rgba(49, 66, 74, 0.1);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 8px 18px rgba(84, 119, 110, 0.08);
  cursor: pointer;
}

.question-input {
  min-height: 78px;
  margin-top: 10px;
  border: 0;
  background: rgba(255, 255, 255, 0.64);
  color: #9b99ad;
  font-size: 15px;
  font-weight: 800;
}

.unified-detail-input {
  display: block;
  width: 100%;
  min-height: 124px;
  border: 1px solid rgba(49, 66, 74, 0.08);
  border-radius: 24px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.92);
  color: var(--ink);
  font-size: 16px;
  line-height: 1.65;
  resize: none;
}

.unified-detail-input::placeholder {
  color: rgba(49, 66, 74, 0.54);
}

.narrator-section {
  margin-top: 16px;
  background: linear-gradient(135deg, rgba(255, 253, 247, 0.9), rgba(255, 255, 255, 0.72));
}

.narrator-input {
  min-height: 76px;
}

.detail-action-row {
  display: grid;
  grid-template-columns: 0.88fr 1.12fr;
  gap: 10px;
  align-items: center;
}

.save-detail-btn {
  margin-top: 12px;
  border: 1px solid rgba(49, 66, 74, 0.08);
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 8px 18px rgba(84, 119, 110, 0.08);
}

.finish-detail-btn {
  margin-top: 12px;
  background: linear-gradient(135deg, var(--mp-yellow), var(--mp-yellow-deep));
}

.save-detail-btn.disabled,
.finish-detail-btn.disabled {
  opacity: 0.45;
  filter: grayscale(0.35);
  cursor: not-allowed;
}

.count-chip {
  margin-left: auto;
  border-radius: 999px;
  padding: 3px 8px;
  background: var(--ink);
  color: #ffffff;
  font-size: 12px;
}

.count-chip.mint-bg {
  background: var(--mp-mint);
}

.record-btn {
  display: flex;
  height: 64px;
  align-items: center;
  border: 0;
  border-radius: var(--radius-button);
  margin: 16px 0;
  padding: 0 16px;
  background: linear-gradient(135deg, var(--mp-yellow), #ffd255);
  box-shadow: 0 6px 15px rgba(255, 211, 79, 0.25);
  color: var(--ink);
  cursor: pointer;
  font-size: 18px;
  font-weight: 800;
  transition: transform 0.2s ease;
  width: 100%;
}

.story-panel.recording .record-btn {
  height: 58px;
  border-radius: 20px;
  margin: 0 0 14px;
  padding: 0 16px;
  background: linear-gradient(135deg, #ffd34f, #ffe37b);
  box-shadow: none;
  font-size: 18px;
  font-weight: 900;
}

.story-panel.recording .record-btn .mp-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 14px;
  background: #ffffff;
}

.story-panel.recording .record-btn .direct {
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.75);
  font-size: 12px;
}

.record-btn .mp-icon {
  margin-right: 12px;
}

.record-btn:active {
  transform: scale(0.98);
}

.record-btn.confirmed {
  cursor: default;
}

.record-btn.confirmed:active {
  transform: none;
}

.record-btn.disabled,
.confirm-btn.disabled {
  cursor: progress;
  opacity: 0.72;
  transform: none;
}

.follow-record {
  height: 58px;
  margin: 14px 0 0;
  background: linear-gradient(135deg, var(--mp-mint), #c9f6ee);
}

.follow-record.recording {
  background: linear-gradient(135deg, var(--mp-yellow-soft), var(--mp-yellow));
  box-shadow: 0 8px 20px rgba(246, 199, 86, 0.18);
}

.mic {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border-radius: 50%;
  margin-right: 12px;
  background: #ffffff;
  color: var(--mp-pink);
  font-size: 14px;
}

.direct {
  margin-left: auto;
  border-radius: 999px;
  padding: 6px 14px;
  background: rgba(255, 255, 255, 0.6);
  color: var(--ink);
  font-size: 12px;
}

.input-box {
  min-height: 100px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: var(--radius-input);
  outline: none;
  padding: 16px;
  background: var(--mp-paper);
  color: var(--ink);
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-line;
}

.story-input {
  display: block;
  width: 100%;
  resize: none;
  font-family: inherit;
  font-weight: 700;
}

.story-input::placeholder {
  color: var(--mp-ink);
  opacity: 0.92;
}

.story-panel.recording .input-box {
  min-height: 96px;
  border-color: var(--mp-line);
  border-radius: 22px;
  padding: 15px 16px;
  font-size: 13px;
  font-weight: 800;
  line-height: 1.7;
}

.dashed {
  overflow: hidden;
  max-height: 96px;
  margin-top: 12px;
  border-style: dashed;
  color: var(--muted);
}

.small-dashed {
  max-height: 86px;
}

.follow-input {
  margin-top: 12px;
}

.confirm-btn {
  width: 100%;
  height: 48px;
  border: 0;
  border-radius: var(--radius-button);
  margin-top: 14px;
  background: linear-gradient(135deg, var(--mp-yellow), var(--mp-yellow-deep));
  box-shadow: 0 8px 20px rgba(255, 211, 79, 0.25);
  color: var(--ink);
  cursor: pointer;
  font-size: 15px;
  font-weight: 700;
  transition: all 0.2s ease;
}

.confirm-btn:hover {
  background: linear-gradient(135deg, #FFE08A, var(--mp-yellow-deep));
  transform: translateY(-1px);
}

.confirm-btn.disabled:hover,
.confirm-btn:disabled:hover {
  transform: none;
}

.save-detail-btn.disabled:hover,
.save-detail-btn:disabled:hover {
  background: rgba(255, 255, 255, 0.86);
}

.finish-detail-btn.disabled:hover,
.finish-detail-btn:disabled:hover {
  background: linear-gradient(135deg, var(--mp-yellow), var(--mp-yellow-deep));
}

.voice-status {
  display: flex;
  height: 36px;
  align-items: center;
  border-radius: var(--radius-button);
  margin-top: 12px;
  padding: 0 14px;
  background: rgba(255, 216, 117, 0.15);
  color: #7a5500;
  font-size: 12px;
  font-weight: 600;
  gap: 8px;
}

.compact-follow-hint {
  margin-top: 10px;
  background: rgba(255, 216, 117, 0.12);
}

.story-panel.recording .voice-status {
  height: 34px;
  margin-top: 14px;
  background: var(--mp-yellow-soft);
  color: #6e4e00;
  font-size: 12px;
  font-weight: 800;
}

.follow-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.prompt-group {
  margin-top: 10px;
}

.prompt-group + .prompt-group {
  margin-top: 14px;
}

.prompt-label {
  display: block;
  margin-bottom: 8px;
  color: var(--mp-muted);
  font-size: 12px;
  font-weight: 900;
}

.follow-tags button {
  display: inline-flex;
  position: relative;
  align-items: center;
  gap: 6px;
  border: 1px solid rgba(49, 66, 74, 0.08);
  border-radius: 999px;
  padding: 8px 12px;
  background: #e8f7f4;
  color: #2d6b5f;
  cursor: pointer;
  font-size: 13px;
  font-weight: 800;
  transition: all 0.2s ease;
}

.priority-tags button,
.follow-tags .prompt-chip-recommended {
  border-color: rgba(246, 199, 86, 0.58);
  background: var(--mp-yellow-soft);
  color: #6d5600;
  box-shadow: 0 8px 18px rgba(246, 199, 86, 0.14);
}

.follow-tags .prompt-chip-normal {
  background: var(--mp-mint-soft);
  color: #2d6b5f;
}

.follow-tags .prompt-chip-emotion {
  background: #fff1f5;
  color: #8a4960;
}

.follow-tags .prompt-chip-mood {
  background: #fff6ce;
  color: #715400;
}

.follow-tags .prompt-chip.selected {
  border-color: var(--mp-yellow-deep);
  background: rgba(255, 216, 117, 0.55);
  box-shadow: 0 0 0 3px rgba(255, 216, 117, 0.24);
  color: var(--mp-ink);
}

.prompt-check {
  display: grid;
  width: 18px;
  height: 18px;
  place-items: center;
  border-radius: 50%;
  margin-left: 2px;
  background: var(--mp-mint);
  color: var(--mp-ink);
  font-size: 12px;
  font-weight: 900;
}

.follow-tags button:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 18px rgba(84, 119, 110, 0.12);
}

.style-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.style {
  border: 2px solid rgba(0, 0, 0, 0.04);
  border-radius: var(--radius-button);
  padding: 12px 8px;
  background: #ffffff;
  color: var(--ink);
  cursor: pointer;
  font-family: inherit;
  font-size: 13px;
  font-weight: 700;
  text-align: center;
  transition: all 0.25s var(--ease);
}

.style:focus-visible {
  outline: 3px solid rgba(255, 216, 117, 0.58);
  outline-offset: 3px;
}

.style.active {
  border-color: var(--mp-yellow-deep);
  background: var(--cream);
  transform: scale(1.04);
}

.style-icon {
  display: grid;
  height: 48px;
  place-items: center;
  border-radius: 12px;
  margin-bottom: 6px;
  background: rgba(255, 255, 255, 0.55);
}

.style-icon .mp-icon {
  margin: 0;
}

.puzzle-state {
  border-color: var(--mp-mint);
  background: #ffffff;
}

.bar-line {
  overflow: hidden;
  height: 8px;
  border-radius: 999px;
  margin: 12px 0;
  background: rgba(0, 0, 0, 0.05);
}

.bar-line i {
  display: block;
  width: var(--progress, 0%);
  height: 100%;
  background: linear-gradient(90deg, var(--mp-yellow), var(--mp-mint));
  transition: width 0.28s var(--ease);
}

.complete-desc {
  margin: 4px 0 0;
  color: var(--muted);
  font-size: 13px;
}

.complete-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.progress-copy {
  margin: 6px 0 12px;
  font-size: 13px;
  font-weight: 700;
}

.regen-btn {
  background: var(--mp-yellow-deep);
  color: var(--ink);
}

.note {
  border-radius: 12px;
  margin-top: 10px;
  padding: 12px;
  background: var(--mp-lavender);
  color: #524482;
  font-size: 12px;
  font-weight: 600;
}

.sprite-stage-placeholder {
  display: flex;
  min-height: 116px;
  align-items: center;
  justify-content: center;
  gap: 18px;
  padding: 18px 0 22px;
  pointer-events: none;
}

.center-notice .icon-patto-weaving {
  margin: 0 auto 12px;
}

.sprite {
  position: relative;
  display: inline-grid;
  place-items: center;
  filter: url("#hand-drawn-filter") drop-shadow(0 12px 24px rgba(84, 119, 110, 0.15));
  pointer-events: none;
}

.is-decorative {
  pointer-events: none;
}

.board-corner-sprite {
  position: absolute;
  z-index: 3;
  right: 16px;
  top: 16px;
  opacity: 0.88;
  pointer-events: none;
  transform: scale(0.42);
  transform-origin: top right;
}

.emotion-blob {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.25s var(--ease);
}

.emotion-blob:hover {
  transform: translateY(-4px) scale(1.04);
}

.listening-sprite {
  width: 122px;
  height: 96px;
  border-radius: 62% 38% 58% 42% / 46% 54% 42% 58%;
  background: var(--mp-yellow);
  animation: listeningBreath 2s infinite ease-in-out;
}

.listening-sprite::after {
  content: "";
  position: absolute;
  z-index: -1;
  inset: 0;
  border-radius: inherit;
  background: var(--mp-yellow);
  opacity: 0.34;
  animation: listeningRipple 2.4s infinite ease-out;
}

.curious-sprite {
  width: 112px;
  height: 112px;
  border-radius: 42% 58% 35% 65% / 55% 45% 60% 40%;
  background: var(--mp-blue);
  animation: curiousFloat 3.8s infinite ease-in-out;
}

.curious-sprite::after {
  content: "?";
  position: absolute;
  right: -10px;
  top: -12px;
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border-radius: 50%;
  background: #fff4d8;
  box-shadow: var(--soft);
  color: #4c8aa6;
  font-weight: 900;
  animation: questionFloat 2.6s infinite ease-in-out;
}

.bloom-sprite {
  width: 116px;
  height: 116px;
  border-radius: 48% 52% 62% 38% / 52% 42% 58% 48%;
  background: var(--mp-pink);
  box-shadow:
    -24px -18px 0 -18px var(--mp-yellow),
    26px -10px 0 -19px var(--mp-lavender),
    -18px 24px 0 -19px var(--mp-mint),
    24px 26px 0 -20px var(--mp-peach);
  animation: bloomBounce 2.5s infinite ease-in-out;
}

.bloom-sprite::before,
.bloom-sprite::after {
  content: "";
  position: absolute;
  top: 20px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.44);
}

.bloom-sprite::before {
  left: 18px;
}

.bloom-sprite::after {
  right: 18px;
}

.eyes {
  position: absolute;
  z-index: 2;
  display: flex;
  gap: 14px;
  transform: translateY(-6px);
}

.eye {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--ink);
  animation: blink 4s infinite linear;
}

.curious-sprite .eye {
  animation: lookAround 4.5s infinite ease-in-out;
}

.bloom-sprite .eyes {
  gap: 18px;
  transform: translateY(-10px);
}

.bloom-sprite .eye {
  width: 18px;
  height: 11px;
  border-bottom: 3px solid var(--ink);
  border-radius: 0 0 999px 999px;
  background: transparent;
  animation: none;
}

.sprite-label {
  position: absolute;
  left: 50%;
  bottom: -24px;
  color: var(--muted);
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
  transform: translateX(-50%);
}

.sparkle,
.confetti {
  position: absolute;
  pointer-events: none;
}

.sparkle {
  color: var(--mp-yellow-deep);
  animation: spark 3s infinite ease-in-out;
}

.confetti {
  border-radius: 40% 60% 35% 65% / 60% 45% 55% 40%;
  animation: wobble 4s infinite ease-in-out;
}

.decor-a {
  position: absolute;
  left: 180px;
  top: 330px;
  pointer-events: none;
}

.decor-b {
  left: 1030px;
  top: 140px;
  width: 18px;
  height: 18px;
  background: var(--mp-pink);
}

.board-sparkle {
  position: absolute;
  left: 170px;
  top: 86px;
  pointer-events: none;
}

.board-confetti {
  right: 90px;
  top: 180px;
  width: 20px;
  height: 20px;
  background: var(--mp-mint);
}

.puzzle-celebration {
  position: absolute;
  z-index: 8;
  left: 50%;
  top: 50%;
  display: grid;
  width: 190px;
  height: 190px;
  place-items: center;
  pointer-events: none;
  transform: translate(-50%, -50%);
  animation: celebrationPop 1.15s var(--ease) both;
}

.celebration-glow {
  position: absolute;
  inset: 22px;
  border-radius: 50%;
  background:
    radial-gradient(circle, rgba(255, 216, 117, 0.42), rgba(163, 228, 215, 0.18) 55%, transparent 72%);
  animation: celebrationGlow 1.8s ease-in-out infinite;
}

.puzzle-celebration .sprite {
  width: 112px;
  height: 92px;
  filter: drop-shadow(0 18px 34px rgba(84, 119, 110, 0.18));
}

.puzzle-celebration .sprite-asset {
  width: 112px;
  height: 92px;
}

.puzzle-celebration .sprite-label {
  display: none;
}

.celebration-text {
  position: absolute;
  bottom: 24px;
  border-radius: 999px;
  padding: 7px 16px;
  background: rgba(255, 253, 247, 0.92);
  box-shadow: 0 10px 24px rgba(84, 119, 110, 0.12);
  color: var(--mp-ink);
  font-size: 14px;
  font-weight: 950;
}

.celebration-confetti {
  position: absolute;
  width: 14px;
  height: 18px;
  border-radius: 40% 60% 35% 65% / 60% 45% 55% 40%;
  box-shadow: inset -2px -2px 6px rgba(0, 0, 0, 0.05);
  animation: celebrationConfetti 1.8s var(--ease) infinite;
}

.celebration-confetti.c1 { left: 20px; top: 28px; background: var(--mp-yellow); animation-delay: 0s; }
.celebration-confetti.c2 { right: 18px; top: 38px; background: var(--mp-blue); animation-delay: 0.12s; }
.celebration-confetti.c3 { left: 36px; bottom: 42px; background: var(--mp-pink); animation-delay: 0.24s; }
.celebration-confetti.c4 { right: 40px; bottom: 36px; background: var(--mp-mint); animation-delay: 0.36s; }
.celebration-confetti.c5 { left: 82px; top: 12px; background: var(--mp-lavender); animation-delay: 0.18s; }
.celebration-confetti.c6 { right: 82px; bottom: 14px; background: var(--mp-peach); animation-delay: 0.3s; }

.secondary-preview-card {
  position: absolute;
  z-index: 15;
  left: 112px;
  top: 98px;
  display: flex;
  width: 340px;
  height: 420px;
  flex-direction: column;
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: var(--radius-dialog);
  padding: 32px;
  background:
    radial-gradient(circle at 18% 8%, rgba(255, 216, 117, 0.18), transparent 42%),
    rgba(255, 255, 255, 0.96);
  box-shadow: 0 24px 70px rgba(84, 119, 110, 0.18);
  backdrop-filter: blur(15px);
}

.secondary-preview-card h2 {
  margin: 0 0 8px;
  color: var(--ink);
  font-size: 22px;
  font-weight: 800;
}

.secondary-preview-card p {
  flex: 1;
  color: var(--muted);
  font-size: 13px;
  font-weight: 600;
  line-height: 1.5;
}

.secondary-preview-card .sprite-stage-placeholder {
  min-height: 138px;
  padding: 12px 0 22px;
}

@keyframes listeningBreath {
  0%, 100% { transform: scale(1) rotate(0deg); border-radius: 62% 38% 58% 42% / 46% 54% 42% 58%; }
  50% { transform: scale(1.06) rotate(2deg); border-radius: 50% 50% 45% 55% / 55% 45% 55% 45%; }
}

@keyframes listeningRipple {
  0% { opacity: 0.38; transform: scale(1); }
  100% { opacity: 0; transform: scale(1.42); }
}

@keyframes spriteFloat {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-8px) rotate(2deg); }
}

@keyframes spriteBreath {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.045); }
}

@keyframes rippleOut {
  0% { opacity: 0.38; transform: scale(1); }
  100% { opacity: 0; transform: scale(1.45); }
}

@keyframes curiousFloat {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-8px) rotate(-2deg); }
}

@keyframes questionFloat {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-5px) rotate(8deg); }
}

@keyframes bloomBounce {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-10px) scale(1.05); }
}

@keyframes blink {
  0%, 94%, 100% { transform: scaleY(1); }
  97% { transform: scaleY(0.18); }
}

@keyframes lookAround {
  0%, 100% { transform: translate(0, 0); }
  25% { transform: translate(-3px, 1px); }
  70% { transform: translate(3px, -2px); }
}

@keyframes spark {
  0%, 100% { opacity: 0.4; transform: scale(1) rotate(-10deg); }
  50% { opacity: 1; transform: scale(1.3) rotate(15deg); }
}

@keyframes wobble {
  0%, 100% { transform: rotate(0) translateY(0); }
  50% { transform: rotate(15deg) translateY(-6px); }
}

@keyframes sparkleBreath {
  0%, 100% { opacity: 0.6; transform: scale(1) rotate(-10deg); }
  50% { opacity: 1; transform: scale(1.25) rotate(15deg); }
}

@keyframes confettiWobble {
  0%, 100% { transform: rotate(0) translateY(0); }
  50% { border-radius: 50% 50% 40% 60%; transform: rotate(8deg) translateY(-4px); }
}

@keyframes puzzleSolvedGlow {
  0% {
    box-shadow: 0 0 0 rgba(163, 228, 215, 0);
    transform: scale(1);
  }
  45% {
    box-shadow: 0 0 0 8px rgba(255, 216, 117, 0.2), 0 0 42px rgba(163, 228, 215, 0.38);
    transform: scale(1.012);
  }
  100% {
    box-shadow: 0 0 0 rgba(163, 228, 215, 0);
    transform: scale(1);
  }
}

@keyframes pendingPieceHint {
  0%, 100% {
    box-shadow:
      inset 0 0 0 4px rgba(255, 216, 117, 0.82),
      0 0 0 5px rgba(255, 253, 247, 0.9),
      0 12px 28px rgba(246, 199, 86, 0.18);
  }
  50% {
    box-shadow:
      inset 0 0 0 4px rgba(255, 216, 117, 1),
      0 0 0 8px rgba(255, 216, 117, 0.2),
      0 16px 34px rgba(246, 199, 86, 0.3);
  }
}

@keyframes celebrationPop {
  0% {
    opacity: 0;
    transform: translate(-50%, -45%) scale(0.78);
  }
  54% {
    opacity: 1;
    transform: translate(-50%, -52%) scale(1.06);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

@keyframes celebrationGlow {
  0%, 100% {
    opacity: 0.68;
    transform: scale(0.96);
  }
  50% {
    opacity: 1;
    transform: scale(1.08);
  }
}

@keyframes celebrationConfetti {
  0%, 100% {
    opacity: 0.82;
    transform: translateY(0) rotate(-8deg);
  }
  50% {
    opacity: 1;
    transform: translateY(-12px) rotate(12deg);
  }
}

@keyframes paperFold {
  0% { transform: translateY(0) rotate(0deg); }
  55% { transform: translateY(-4px) rotate(-1deg); }
  100% { transform: translateY(0) rotate(0deg); }
}

@keyframes softBreath {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.06); }
}

@keyframes tinyFloat {
  0%, 100% { transform: translateY(0) rotate(-2deg); }
  50% { transform: translateY(-5px) rotate(3deg); }
}

@keyframes sparklePop {
  0%, 100% { opacity: 0.55; transform: scale(1) rotate(-10deg); }
  50% { opacity: 1; transform: scale(1.25) rotate(12deg); }
}

@keyframes pageWake {
  0%, 100% { transform: rotate(6deg); }
  50% { transform: rotate(13deg) translateX(1px); }
}

/* Formal SVG assets: fit exported artwork into the existing component slots. */
.asset-icon-image {
  display: block;
  width: 82%;
  height: 82%;
  border-radius: 0 !important;
  object-fit: contain;
  pointer-events: none;
  user-select: none;
}

.tile-icon .asset-icon-image,
.mp-icon.tiny .asset-icon-image,
.tile-icon.tiny .asset-icon-image {
  width: 100%;
  height: 100%;
}

.icon-members .asset-icon-image {
  width: 100%;
  height: 100%;
}

.sprite-asset {
  display: block;
  width: 122px;
  height: 112px;
  object-fit: contain;
  pointer-events: none;
  user-select: none;
}

.ip-png-asset {
  border-radius: 0;
  object-fit: contain;
}

.listening-sprite-asset { animation: listeningBreath 2s infinite ease-in-out; }
.curious-sprite-asset { animation: curiousFloat 3.8s infinite ease-in-out; }
.bloom-sprite-asset { animation: bloomBounce 2.5s infinite ease-in-out; }

@keyframes rotateClockwise {
  from { transform: rotate(0); }
  to { transform: rotate(360deg); }
}
</style>
