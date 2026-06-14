<template>
  <div class="player-mobile-page">
    <div class="atmosphere-sprites" aria-hidden="true">
      <SpriteIcon type="confetti" color="#fed7ce" size="18" class="atmosphere-sprite atmosphere-sprite--one" />
      <SpriteIcon type="leaf" color="#9bd4aa" size="34" class="atmosphere-sprite atmosphere-sprite--two" />
      <SpriteIcon type="cloud" size="42" class="atmosphere-sprite atmosphere-sprite--three" />
      <SpriteIcon type="confetti" color="#d9c7ff" size="14" class="atmosphere-sprite atmosphere-sprite--four" />
    </div>

    <header class="flow-header">
      <div
        v-for="step in flowSteps"
        :key="step.no"
        class="flow-step"
        :class="{ active: step.no === currentStepNo }"
      >
        <span class="flow-dot">{{ step.no }}</span>
        <div>
          <div class="flow-title">{{ step.title }}</div>
          <div class="flow-time">{{ step.time }}</div>
        </div>
      </div>
    </header>

    <main class="game-shell">
      <nav class="game-quick-nav" aria-label="游戏功能导航">
        <button
          v-for="item in quickNavItems"
          :key="item.path"
          type="button"
          class="quick-nav-button"
          @click="router.push(item.path)"
        >
          <span class="quick-nav-icon">
            <SpriteIcon :type="item.sprite" :color="item.color" size="28" />
          </span>
          <span class="quick-nav-tooltip">
            <strong>{{ item.title }}</strong>
            <small>{{ item.desc }}</small>
          </span>
        </button>
      </nav>

      <section class="center-stage">
        <div class="stage-head turn-status-bar">
          <div class="speaker turn-player">
            <span class="avatar large">🧑</span>
            <div>
              <div class="stage-title">正在玩家 · {{ playerName }}</div>
              <div class="stage-subtitle">{{ gameStarted ? '移动 1 块拼图，让画面更完整' : '先完成右侧引导，生成本轮拼图' }}</div>
            </div>
          </div>
          <div class="turn-action-hint">
            <span>{{ gameStarted ? '当前任务' : '准备任务' }}</span>
            <strong>{{ gameStarted ? '移动 1 块碎片' : '录入故事生成图像' }}</strong>
          </div>
          <div class="timer-pill" :class="{ warning: remainingSeconds <= 30 && gameStarted && !timeExpired }">
            <em class="turn-task-chip">当前任务：{{ gameStarted ? '移动拼图' : '分享小事' }}</em>
            <span>本轮倒计时</span>
            <strong>{{ formatTime(remainingSeconds) }}</strong>
          </div>
        </div>

        <div class="puzzle-table">
          <div class="puzzle-board">
            <div class="puzzle-grid">
              <button
                v-for="(pieceIndex, gridIndex) in displayCells"
                :key="gridIndex"
                type="button"
                class="puzzle-cell"
                :class="{ selected: selectedIndex === gridIndex }"
                :style="getPieceStyle(pieceIndex)"
                @click="handleCellClick(gridIndex)"
              >
                <SpriteIcon
                  v-if="gameStarted && pieceIndex === gridIndex"
                  type="lock"
                  size="22"
                  active
                  class="puzzle-lock-sprite"
                />
              </button>
            </div>
          </div>
          <div v-if="!gameStarted" class="start-overlay">
            <EmotionSprite
              :type="activeGuideStep === 2 ? 'curious' : 'listening'"
              :state="voiceStatus === 'recording' ? 'recording' : 'idle'"
              size="118"
              class="stage-emotion-sprite"
            />
            <strong>拼图预览即将生成</strong>
            <span>先完成右侧第 1 步，讲一件最近的小事。</span>
            <button type="button">去完成第 1 步 →</button>
          </div>
          <div v-if="recordStatus === 'uploading'" class="generating-overlay">
            <EmotionSprite type="curious" state="generating" size="112" />
            <strong>AI 正在生成故事图像</strong>
            <span>请稍等，系统会自动切成 4×4 拼图。</span>
          </div>
        </div>

      </section>

      <aside class="right-column">
        <section class="panel player-status-panel">
          <div class="panel-title-row">
            <h2>轮次状态</h2>
            <span>{{ gameStarted ? '拼图中' : '准备中' }}</span>
          </div>
          <div class="current-player-card">
            <span class="avatar large">🧑</span>
            <div>
              <strong>{{ playerName }}</strong>
              <p>{{ gameStarted ? '正在完成 4×4 拼图' : '放轻松玩家' }}</p>
            </div>
            <span class="player-energy">♥ 022/4</span>
          </div>
          <div class="progress-grid">
            <div>
              <span>步数</span>
              <strong>{{ moveCount }}</strong>
            </div>
            <div>
              <span>用时</span>
              <strong>{{ formatTime(elapsedSeconds) }}</strong>
            </div>
            <div>
              <span>完成度</span>
              <strong>{{ completedCount }}/{{ GRID_SIZE * GRID_SIZE }}</strong>
            </div>
          </div>
        </section>

        <section class="panel story-panel">
          <div class="panel-title-row">
            <h2>任务引导</h2>
            <span>{{ guidePanelState.kicker }}</span>
          </div>

          <div class="task-state-card" :class="`task-state-card--${guidePanelState.tone}`">
            <EmotionSprite
              :type="guidePanelState.emotionSprite"
              :state="guidePanelState.tone === 'recording' ? 'recording' : guidePanelState.tone"
              size="58"
              class="task-emotion-sprite"
            />
            <div>
              <strong>{{ guidePanelState.title }}</strong>
              <p>{{ guidePanelState.desc }}</p>
            </div>
            <span class="task-state-count">{{ completedGuideSteps }}/3</span>
          </div>

          <div class="guide-flow">
            <div
              class="guide-step guide-step--story"
              :class="{ active: activeGuideStep === 1, done: storyConfirmed, recording: activeVoiceTarget === 'story' && voiceStatus === 'recording' }"
            >
              <div class="guide-step-head">
                <span class="guide-step-no">1</span>
                <div>
                  <strong>讲一件最近的小事</strong>
                  <small>{{ storyConfirmed ? '已确认故事，可以继续补充细节' : storyText.trim() ? '请确认后进入同伴提问' : '用语音或文字说出故事' }}</small>
                </div>
                <span class="guide-step-state">{{ storyConfirmed ? '已完成' : storyText.trim() ? '待确认' : '进行中' }}</span>
                <span class="guide-chevron">›</span>
              </div>
              <div v-show="activeGuideStep === 1" class="guide-step-body">
                <div class="emotion-guidance-card emotion-guidance-card--listening">
                  <EmotionSprite
                    type="listening"
                    :state="activeVoiceTarget === 'story' && voiceStatus === 'recording' ? 'recording' : 'idle'"
                    size="84"
                  />
                  <div>
                    <strong>{{ activeVoiceTarget === 'story' && voiceStatus === 'recording' ? '正在听你说...' : '小倾听者在这里' }}</strong>
                    <span>先说一个地点、一个人，或一个你还记得的瞬间。</span>
                  </div>
                </div>
                <van-field
                  v-model="storyText"
                  @update:model-value="handleStoryTextInput"
                  type="textarea"
                  placeholder=""
                  rows="3"
                  autosize
                  class="story-input"
                />
                <div class="story-voice-row" @click="toggleRecord('story')">
                  <button
                    type="button"
                    class="voice-icon-btn story-voice-btn"
                    :class="{ recording: activeVoiceTarget === 'story' && voiceStatus === 'recording' }"
                    :disabled="recordStatus === 'uploading' || (isVoiceBusy && activeVoiceTarget !== 'story')"
                    :title="getVoiceButtonLabel('story')"
                    :aria-label="getVoiceButtonLabel('story')"
                    @click.stop="toggleRecord('story')"
                  >
                    <span
                      class="voice-icon-symbol"
                      :class="`voice-icon-symbol--${getVoiceIconType('story')}`"
                      aria-hidden="true"
                    ></span>
                  </button>
                  <span>{{ getVoiceButtonLabel('story') }}</span>
                  <button type="button" class="text-entry-chip" @click.stop>直接输入</button>
                </div>
                <div v-if="storyText.trim()" class="story-recorded-card">
                  <span v-if="storyConfirmed">已确认</span>
                  <p>{{ storyText }}</p>
                </div>
                <button
                  v-if="storyText.trim() && !storyConfirmed"
                  type="button"
                  class="story-confirm-btn"
                  @click="confirmStoryText"
                >
                  确认故事，进入提问
                </button>
              </div>
            </div>

            <div
              class="guide-step guide-step--detail"
              :class="{ active: activeGuideStep === 2, done: questioningComplete, locked: activeGuideStep < 2 && !storyConfirmed }"
            >
              <div class="guide-step-head">
                <span class="guide-step-no">2</span>
                <div>
                  <strong>补充画面细节</strong>
                  <small>{{ detailStepHint }}</small>
                </div>
                <span class="guide-step-state">{{ questioningComplete ? '已完成' : storyConfirmed ? '提问中' : '未解锁' }}</span>
                <span class="guide-chevron">⌄</span>
              </div>
              <div v-show="activeGuideStep === 2" class="guide-step-body question-panel">
                <div class="companion-state-card">
                  <EmotionSprite type="curious" state="asking" size="62" class="companion-emotion-sprite" />
                  <strong>{{ companionPanelTitle }}</strong>
                  <span>{{ companionPanelDesc }}</span>
                </div>
                <div v-if="companionRounds.length" class="companion-round-list">
                  <div
                    v-for="(round, index) in companionRounds"
                    :key="round.id"
                    class="companion-round-item"
                  >
                    <div class="round-item-head">
                      <strong>第 {{ index + 1 }} 轮问答</strong>
                      <button type="button" @click="editCompanionRound(round)">修改</button>
                    </div>
                    <p v-if="round.visual">画面：{{ round.visual }}</p>
                    <p v-if="round.emotion">感受：{{ round.emotion }}</p>
                    <p>回应：{{ round.narrator }}</p>
                  </div>
                </div>
                <div class="question-card">
                  <div class="question-title">
                    <div>
                      <strong>画面描述式</strong>
                      <span>画面里有什么？</span>
                    </div>
                    <button
                      type="button"
                      class="voice-icon-btn question-voice-btn"
                      :class="{ recording: activeVoiceTarget === 'visual' && voiceStatus === 'recording' }"
                      :disabled="isVoiceBusy && activeVoiceTarget !== 'visual'"
                      :title="getVoiceButtonLabel('visual')"
                      :aria-label="getVoiceButtonLabel('visual')"
                      @click="toggleRecord('visual')"
                    >
                      <span
                        class="voice-icon-symbol"
                        :class="`voice-icon-symbol--${getVoiceIconType('visual')}`"
                        aria-hidden="true"
                      ></span>
                    </button>
                  </div>
                  <div class="question-chips">
                    <button
                      v-for="tip in visualQuestionTips"
                      :key="tip"
                      type="button"
                      @click="applyQuestionTip('visual', tip)"
                    >
                      {{ tip }}
                    </button>
                  </div>
                  <van-field
                    v-model="visualDetailText"
                    type="textarea"
                    placeholder="例如：远处有窗光和一条小路。"
                    rows="2"
                    autosize
                    class="question-input"
                  />
                  <div v-if="visualDetailText.trim()" class="detail-recorded-card detail-recorded-card--visual">
                    <span>已记录问题</span>
                    <p>{{ visualDetailText }}</p>
                  </div>
                </div>

                <div class="question-card">
                  <div class="question-title">
                    <div>
                      <strong>感受描述式</strong>
                      <span>是什么感觉？</span>
                    </div>
                    <button
                      type="button"
                      class="voice-icon-btn question-voice-btn"
                      :class="{ recording: activeVoiceTarget === 'emotion' && voiceStatus === 'recording' }"
                      :disabled="isVoiceBusy && activeVoiceTarget !== 'emotion'"
                      :title="getVoiceButtonLabel('emotion')"
                      :aria-label="getVoiceButtonLabel('emotion')"
                      @click="toggleRecord('emotion')"
                    >
                      <span
                        class="voice-icon-symbol"
                        :class="`voice-icon-symbol--${getVoiceIconType('emotion')}`"
                        aria-hidden="true"
                      ></span>
                    </button>
                  </div>
                  <div class="question-chips">
                    <button
                      v-for="tip in emotionQuestionTips"
                      :key="tip"
                      type="button"
                      @click="applyQuestionTip('emotion', tip)"
                    >
                      {{ tip }}
                    </button>
                  </div>
                  <van-field
                    v-model="emotionDetailText"
                    type="textarea"
                    placeholder="例如：有一点紧张，后来很安心。"
                    rows="2"
                    autosize
                    class="question-input"
                  />
                  <div v-if="emotionDetailText.trim()" class="detail-recorded-card detail-recorded-card--emotion">
                    <span>已记录感受</span>
                    <p>{{ emotionDetailText }}</p>
                  </div>
                </div>

                <div class="narrator-response-card">
                  <div>
                    <strong>讲述者补充说明</strong>
                    <span>回答同伴的问题，让画面更准确。</span>
                  </div>
                  <button
                    type="button"
                    class="voice-icon-btn narrator-voice-btn"
                    :class="{ recording: activeVoiceTarget === 'narrator' && voiceStatus === 'recording' }"
                    :disabled="isVoiceBusy && activeVoiceTarget !== 'narrator'"
                    :title="getVoiceButtonLabel('narrator')"
                    :aria-label="getVoiceButtonLabel('narrator')"
                    @click="toggleRecord('narrator')"
                  >
                    <span
                      class="voice-icon-symbol"
                      :class="`voice-icon-symbol--${getVoiceIconType('narrator')}`"
                      aria-hidden="true"
                    ></span>
                  </button>
                </div>
                <van-field
                  v-model="narratorSupplementText"
                  type="textarea"
                  placeholder="例如：其实那天我最记得窗外的雨声。"
                  rows="2"
                  autosize
                  class="question-input narrator-input"
                />
                <div v-if="narratorSupplementText.trim()" class="detail-recorded-card detail-recorded-card--narrator">
                  <span>已记录回应</span>
                  <p>{{ narratorSupplementText }}</p>
                </div>
                <div class="question-round-actions">
                  <button
                    type="button"
                    class="round-action-secondary"
                    :disabled="!canSaveCompanionRound"
                    @click="addAnotherCompanionQuestion"
                  >
                    保存本轮，继续提问
                  </button>
                  <button
                    type="button"
                    class="round-action-primary"
                    :disabled="!hasSavedCompanionRound && !canSaveCompanionRound"
                    @click="finishCompanionQuestions"
                  >
                    完成提问，选择风格
                  </button>
                </div>
              </div>
            </div>

            <div
              class="guide-step guide-step--generate"
              :class="{ active: activeGuideStep === 3, done: gameStarted, locked: activeGuideStep < 3 && !questioningComplete }"
            >
              <div class="guide-step-head">
                <span class="guide-step-no">3</span>
                <div>
                  <strong>选择风格</strong>
                  <small>{{ gameStarted ? '图片已生成，开始拼图' : '确认画面风格后生成拼图' }}</small>
                </div>
                <span class="guide-step-state">{{ gameStarted ? '已完成' : questioningComplete ? '待生成' : '未解锁' }}</span>
                <span class="guide-chevron">⌄</span>
              </div>
              <div v-show="activeGuideStep === 3" class="guide-step-body">
                <div v-if="gameStarted" class="puzzle-progress-card">
                  <div>
                    <strong>拼图正在进行</strong>
                    <span>轮到当前玩家移动 1 块碎片。</span>
                  </div>
                  <div class="puzzle-progress-meter">
                    <i :style="{ width: `${Math.round((completedCount / (GRID_SIZE * GRID_SIZE)) * 100)}%` }"></i>
                  </div>
                  <p>{{ completedCount }}/{{ GRID_SIZE * GRID_SIZE }} 块已归位 · 剩余 {{ formatTime(remainingSeconds) }}</p>
                </div>
                <div v-else class="style-options">
                  <button
                    v-for="option in styleOptions"
                    :key="option.value"
                    type="button"
                    class="style-option"
                    :class="{ active: puzzleStyle === option.value }"
                    @click="puzzleStyle = option.value"
                  >
                    <span class="style-preview" aria-hidden="true"></span>
                    <strong>{{ option.label }}</strong>
                    <span>{{ option.desc }}</span>
                  </button>
                </div>
                <div class="guide-complete-count">● 已完成 {{ completedGuideSteps }}/3</div>
                <div class="story-actions">
                  <van-button
                    type="primary"
                    block
                    :disabled="!canGenerateStoryImage || recordStatus === 'uploading'"
                    @click="submitStoryText"
                  >
                    {{ generateButtonLabel }}
                  </van-button>
                </div>
                <div class="generate-guidance">
                  {{ storyConfirmed ? '生成后会自动切成 4×4 拼图。' : '先完成第 1 步，按钮就会亮起。' }}
                </div>
              </div>
            </div>
          </div>
          <div v-if="voiceHint" class="voice-status">{{ voiceHint }}</div>
        </section>
      </aside>
    </main>

    <div v-if="showCompleteDialog" class="complete-overlay">
      <div class="celebration-burst" aria-hidden="true">
        <span
          v-for="piece in confettiPieces"
          :key="piece.id"
          :style="{
            '--x': piece.x,
            '--y': piece.y,
            '--r': piece.rotate,
            '--d': piece.delay,
            '--c': piece.color
          }"
        ></span>
      </div>
      <div class="complete-dialog">
        <SpriteIcon type="sparkle" size="30" class="complete-sparkle complete-sparkle-a" />
        <SpriteIcon type="confetti" color="#75e3d5" size="26" class="complete-sparkle complete-sparkle-b" />
        <EmotionSprite type="bloom" state="complete" size="122" class="complete-emotion-sprite" />
        <h3 class="complete-title">拼图完成</h3>
        <p class="complete-emotion-copy">我们把这张图拼回来了。</p>
        <img :src="activeImage" alt="complete" class="complete-preview" />
        <p class="complete-info">用时：{{ formatTime(elapsedSeconds) }}</p>
        <p class="complete-info">步数：{{ moveCount }}</p>
        <div class="complete-actions">
          <van-button type="primary" block @click="showCompleteDialog = false">继续查看</van-button>
          <van-button type="default" block @click="restartCurrentPuzzle">再玩一次</van-button>
        </div>
      </div>
    </div>

    <div v-if="showTimeUpDialog" class="complete-overlay">
      <div class="complete-dialog time-up-dialog">
        <h3 class="complete-title">本轮时间到</h3>
        <img :src="activeImage" alt="time up" class="complete-preview" />
        <p class="complete-info">单次拼图时间：{{ formatTime(PUZZLE_TIME_LIMIT_SECONDS) }}</p>
        <p class="complete-info">当前步数：{{ moveCount }}</p>
        <div class="complete-actions">
          <van-button type="primary" block @click="restartCurrentPuzzle">再试一次</van-button>
          <van-button type="default" block @click="showTimeUpDialog = false">继续查看</van-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Toast } from 'vant'
import axios from 'axios'
import { apiUrl } from '@/utils/api/base'
import EmotionSprite from '@/components/common/EmotionSprite.vue'
import SpriteIcon from '@/components/common/SpriteIcon.vue'

const defaultPuzzle =
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=90'

const route = useRoute()
const router = useRouter()

const roomCode = ref(route.query.roomCode || 'single')
const playerName = ref(route.query.playerName || '玩家')

const storyText = ref('')
const storyConfirmed = ref(false)
const visualDetailText = ref('')
const emotionDetailText = ref('')
const narratorSupplementText = ref('')
const companionRounds = ref([])
const questioningComplete = ref(false)
const puzzleStyle = ref('healing')
const puzzleImageUrl = ref('')
const puzzleCells = ref([])
const selectedIndex = ref(null)
const gameStarted = ref(false)
const showCompleteDialog = ref(false)
const showTimeUpDialog = ref(false)
const timeExpired = ref(false)

const recordStatus = ref('idle') // idle | uploading
const voiceStatus = ref('idle') // idle | recording | uploading | recognizing
const voiceHint = ref('')
const activeVoiceTarget = ref(null) // story | visual | emotion | narrator
const storyTextBeforeCompanionVoice = ref('')

const moveCount = ref(0)
const elapsedSeconds = ref(0)
let timer = null

const GRID_SIZE = 4
const PUZZLE_TIME_LIMIT_SECONDS = 180
const flowSteps = [
  { no: 1, title: '创建房间', time: '1 min' },
  { no: 2, title: '分享小事', time: '1-2 min/人' },
  { no: 3, title: '同伴提问', time: '30s/人' },
  { no: 4, title: 'AI生成碎片', time: '10s/人' },
  { no: 5, title: '轮流拼图', time: '3 min/人' }
]
const styleOptions = [
  { value: 'healing', label: '具象治愈风', desc: '故事还原' },
  { value: 'abstract', label: '情绪氛围风', desc: '情绪表达' },
  { value: 'color-block', label: '色块拼图风', desc: '拼图识别' }
]
const quickNavItems = [
  { no: '01', sprite: 'home', color: '#8ed2a7', title: '准备加入', desc: '规则入口', path: '/portfolio-ready' },
  { no: '02', sprite: 'sparkle', color: '#ffd86f', title: 'AI等待', desc: '生成反馈', path: '/portfolio-generating' },
  { no: '03', sprite: 'confetti', color: '#ffb2aa', title: '完成回看', desc: '结果总结', path: '/portfolio-complete' },
  { no: '04', sprite: 'leaf', color: '#75e3d5', title: '作品回顾', desc: '记忆沉淀', path: '/portfolio-gallery' }
]
const visualQuestionTips = [
  '当时在哪里？',
  '周围有什么物件？',
  '远处可以看到什么？'
]
const emotionQuestionTips = [
  '这件事像什么颜色？',
  '当时身体是什么感觉？',
  '希望画面更安静还是更开心？'
]
const confettiColors = ['#ff7b7b', '#ffd45b', '#4fd1c5', '#6c63ff', '#f7f1ff']
const confettiPieces = Array.from({ length: 36 }, (_, index) => ({
  id: index,
  x: `${((index % 12) - 5.5) * 48}px`,
  y: `${-172 - Math.floor(index / 12) * 54 - (index % 4) * 18}px`,
  rotate: `${index * 47}deg`,
  delay: `${index * 12}ms`,
  color: confettiColors[index % confettiColors.length]
}))
const activeImage = computed(() => puzzleImageUrl.value || defaultPuzzle)
const displayCells = computed(() => {
  return puzzleCells.value.length
    ? puzzleCells.value
    : Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => i)
})

const completedCount = computed(() => {
  return displayCells.value.filter((piece, pos) => piece === pos).length
})

const currentStepNo = computed(() => {
  if (gameStarted.value) return 5
  if (recordStatus.value === 'uploading') return 4
  if (storyConfirmed.value) return 3
  return 2
})

const hasDraftCompanionDetail = computed(() => {
  return Boolean(visualDetailText.value.trim() || emotionDetailText.value.trim())
})

const hasDraftNarratorSupplement = computed(() => {
  return Boolean(narratorSupplementText.value.trim())
})

const hasSavedCompanionRound = computed(() => companionRounds.value.length > 0)
const hasCompanionDetail = computed(() => hasDraftCompanionDetail.value || hasSavedCompanionRound.value)
const canSaveCompanionRound = computed(() => hasDraftCompanionDetail.value && hasDraftNarratorSupplement.value)
const canGenerateStoryImage = computed(() => {
  return Boolean(storyConfirmed.value && questioningComplete.value && hasSavedCompanionRound.value)
})

const activeGuideStep = computed(() => {
  if (!storyConfirmed.value) return 1
  if (!questioningComplete.value) return 2
  return 3
})

const generateButtonLabel = computed(() => {
  if (recordStatus.value === 'uploading') return '正在生成拼图'
  if (!storyConfirmed.value) return storyText.value.trim() ? '先确认故事' : '先讲述故事'
  if (!hasSavedCompanionRound.value) return '先完成一轮提问'
  if (!questioningComplete.value) return '先结束提问环节'
  return gameStarted.value ? '重新生成图片' : '先拼一个小故事'
})

const completedGuideSteps = computed(() => {
  return [
    storyConfirmed.value,
    questioningComplete.value,
    gameStarted.value
  ].filter(Boolean).length
})

const detailStepHint = computed(() => {
  if (!storyConfirmed.value) return storyText.value.trim() ? '请先确认故事，再进入同伴提问' : '先完成第 1 步，再进入同伴提问'
  if (questioningComplete.value) return `已保存 ${companionRounds.value.length} 轮问答，可以进入生成`
  if (hasDraftCompanionDetail.value && !hasDraftNarratorSupplement.value) return '请讲述者回应当前同伴问题'
  if (hasSavedCompanionRound.value) return `已保存 ${companionRounds.value.length} 轮，还可以继续提问`
  return '先由同伴任选画面或感受方向提问'
})

const companionPanelTitle = computed(() => {
  if (hasDraftCompanionDetail.value && !hasDraftNarratorSupplement.value) return '同伴问题已收到，等待讲述者回应'
  if (canSaveCompanionRound.value) return '本轮问答已完整，可以保存'
  if (hasSavedCompanionRound.value) return '可以继续追问，也可以结束提问'
  return '请同伴从两种方式里选一个提问'
})

const companionPanelDesc = computed(() => {
  if (hasDraftCompanionDetail.value && !hasDraftNarratorSupplement.value) return '讲述者回答后，可以保存本轮并继续下一轮。'
  if (canSaveCompanionRound.value) return '保存后会清空输入框，方便同伴继续提问。'
  if (hasSavedCompanionRound.value) return '多轮问答会一起进入生图提示词，让画面更完整。'
  return '问题只补充画面和感受，不评价故事。'
})

const guidePanelState = computed(() => {
  if (gameStarted.value) {
    return {
      sprite: 'lock',
      emotionSprite: 'bloom',
      color: '#ffb2aa',
      kicker: '拼图中',
      tone: 'puzzle',
      title: '轮到当前玩家移动碎片',
      desc: `3 分钟内完成 4×4 拼图，当前已归位 ${completedCount.value} 块。`
    }
  }

  if (activeVoiceTarget.value === 'story' && voiceStatus.value === 'recording') {
    return {
      sprite: 'sparkle',
      emotionSprite: 'listening',
      color: '#ffd86f',
      kicker: '录音中',
      tone: 'recording',
      title: '正在记录你的故事',
      desc: '说完后再点一次，系统会转成文字。'
    }
  }

  if (!storyConfirmed.value) {
    return {
      sprite: 'home',
      emotionSprite: 'listening',
      color: '#8ed2a7',
      kicker: '第 1 步',
      tone: 'active',
      title: storyText.value.trim() ? '确认后进入同伴提问' : '先讲一件最近的小事',
      desc: storyText.value.trim()
        ? '文字输入需要主动确认，避免还没写完就跳到下一步。'
        : '不用讲完整，先说一个地点、人物或瞬间就可以。'
    }
  }

  if (!hasCompanionDetail.value) {
    return {
      sprite: 'leaf',
      emotionSprite: 'curious',
      color: '#9bd4aa',
      kicker: '第 2 步',
      tone: 'upcoming',
      title: '请同伴补充一个问题',
      desc: '从画面描述或感受描述里选一个方向，让故事更具体。'
    }
  }

  if (!questioningComplete.value) {
    return {
      sprite: 'confetti',
      emotionSprite: 'curious',
      color: '#fed7ce',
      kicker: hasDraftNarratorSupplement.value ? '可继续追问' : '待回应',
      tone: 'active',
      title: hasSavedCompanionRound.value ? '继续提问或结束本轮' : '请讲述者回应同伴问题',
      desc: hasSavedCompanionRound.value
        ? `已保存 ${companionRounds.value.length} 轮问答，结束后再进入风格选择。`
        : '这一句会直接影响生成图里的细节和氛围。'
    }
  }

  return {
    sprite: 'sparkle',
    emotionSprite: 'curious',
    color: '#ffd86f',
    kicker: '第 3 步',
    tone: 'ready',
    title: '选择风格并生成拼图',
    desc: '确认画面风格后，AI 会生成图片并切成 4×4 拼图。'
  }
})

const companionContext = computed(() => ({
  visual: visualDetailText.value.trim(),
  emotion: emotionDetailText.value.trim(),
  narrator: narratorSupplementText.value.trim(),
  rounds: companionRounds.value.map((round, index) => ({
    index: index + 1,
    visual: round.visual,
    emotion: round.emotion,
    narrator: round.narrator
  }))
}))
const isVoiceBusy = computed(() => voiceStatus.value !== 'idle')
const remainingSeconds = computed(() => Math.max(PUZZLE_TIME_LIMIT_SECONDS - elapsedSeconds.value, 0))

const formatTime = (seconds) => {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0')
  const s = String(seconds % 60).padStart(2, '0')
  return `${m}:${s}`
}

const appendTip = (currentText, tip) => {
  if (!currentText) return tip
  if (currentText.includes(tip)) return currentText
  return `${currentText}；${tip}`
}

const applyQuestionTip = (type, tip) => {
  questioningComplete.value = false
  if (type === 'visual') {
    visualDetailText.value = appendTip(visualDetailText.value.trim(), tip)
    return
  }
  emotionDetailText.value = appendTip(emotionDetailText.value.trim(), tip)
}

const handleStoryTextInput = (value) => {
  storyText.value = value
  storyConfirmed.value = false
}

const confirmStoryText = () => {
  if (!storyText.value.trim()) {
    Toast.fail('请先输入故事')
    return
  }
  storyConfirmed.value = true
  Toast.success('故事已确认，可以请同伴提问')
}

const getVoiceButtonLabel = (target) => {
  if (activeVoiceTarget.value !== target) {
    if (target === 'narrator') return '回应补充'
    return target === 'story' ? '开始说话' : '语音补充'
  }
  if (voiceStatus.value === 'recording') return '停止并识别'
  if (voiceStatus.value === 'uploading' || voiceStatus.value === 'recognizing') return '识别中'
  if (target === 'narrator') return '回应补充'
  return target === 'story' ? '开始说话' : '语音补充'
}

const getVoiceIconType = (target) => {
  if (activeVoiceTarget.value !== target) return 'mic'
  if (voiceStatus.value === 'recording') return 'stop'
  if (voiceStatus.value === 'uploading' || voiceStatus.value === 'recognizing') return 'wave'
  return 'mic'
}

const applyRecognizedText = (target, text) => {
  if (target === 'visual') {
    questioningComplete.value = false
    visualDetailText.value = appendTip(visualDetailText.value.trim(), text)
    return
  }
  if (target === 'emotion') {
    questioningComplete.value = false
    emotionDetailText.value = appendTip(emotionDetailText.value.trim(), text)
    return
  }
  if (target === 'narrator') {
    questioningComplete.value = false
    narratorSupplementText.value = appendTip(narratorSupplementText.value.trim(), text)
    return
  }
  storyText.value = text
  storyConfirmed.value = true
}

const resetCompanionDraft = () => {
  visualDetailText.value = ''
  emotionDetailText.value = ''
  narratorSupplementText.value = ''
}

const saveCompanionRound = () => {
  if (!hasDraftCompanionDetail.value) {
    Toast.fail('请先让同伴提出一个问题')
    return false
  }
  if (!hasDraftNarratorSupplement.value) {
    Toast.fail('请先让讲述者回应问题')
    return false
  }

  companionRounds.value.push({
    id: `${Date.now()}-${companionRounds.value.length}`,
    visual: visualDetailText.value.trim(),
    emotion: emotionDetailText.value.trim(),
    narrator: narratorSupplementText.value.trim()
  })
  resetCompanionDraft()
  questioningComplete.value = false
  Toast.success(`已保存第 ${companionRounds.value.length} 轮问答`)
  return true
}

const addAnotherCompanionQuestion = () => {
  saveCompanionRound()
}

const finishCompanionQuestions = () => {
  if (hasDraftCompanionDetail.value || hasDraftNarratorSupplement.value) {
    if (!saveCompanionRound()) return
  }
  if (!hasSavedCompanionRound.value) {
    Toast.fail('请至少完成一轮提问和回应')
    return
  }
  questioningComplete.value = true
  Toast.success('提问环节完成，可以选择风格')
}

const editCompanionRound = (round) => {
  visualDetailText.value = round.visual
  emotionDetailText.value = round.emotion
  narratorSupplementText.value = round.narrator
  companionRounds.value = companionRounds.value.filter((item) => item.id !== round.id)
  questioningComplete.value = false
}

const startTimer = () => {
  stopTimer()
  elapsedSeconds.value = 0
  timer = setInterval(() => {
    elapsedSeconds.value += 1
    if (elapsedSeconds.value >= PUZZLE_TIME_LIMIT_SECONDS) {
      elapsedSeconds.value = PUZZLE_TIME_LIMIT_SECONDS
      timeExpired.value = true
      selectedIndex.value = null
      showTimeUpDialog.value = true
      stopTimer()
      Toast.fail('本轮拼图时间到')
    }
  }, 1000)
}

const stopTimer = () => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

const shuffleArray = (arr) => {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

const initPuzzle = () => {
  const base = Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => i)
  let shuffled = shuffleArray(base)

  if (shuffled.every((v, i) => v === i)) {
    shuffled = shuffleArray(base)
  }

  puzzleCells.value = shuffled
  selectedIndex.value = null
  gameStarted.value = true
  moveCount.value = 0
  showCompleteDialog.value = false
  showTimeUpDialog.value = false
  timeExpired.value = false
  startTimer()
}

const restartCurrentPuzzle = () => {
  if (!puzzleImageUrl.value) return
  initPuzzle()
}

const getPieceStyle = (pieceIndex) => {
  const col = pieceIndex % GRID_SIZE
  const row = Math.floor(pieceIndex / GRID_SIZE)

  const xPercent = GRID_SIZE === 1 ? 0 : (col / (GRID_SIZE - 1)) * 100
  const yPercent = GRID_SIZE === 1 ? 0 : (row / (GRID_SIZE - 1)) * 100
  const bgUrl = puzzleImageUrl.value || defaultPuzzle

  return {
    backgroundImage: `url(${bgUrl})`,
    backgroundSize: `${GRID_SIZE * 100}% ${GRID_SIZE * 100}%`,
    backgroundPosition: `${xPercent}% ${yPercent}%`,
    backgroundRepeat: 'no-repeat'
  }
}

const handleCellClick = (gridIndex) => {
  if (!gameStarted.value) return
  if (timeExpired.value) return

  if (selectedIndex.value === null) {
    selectedIndex.value = gridIndex
    return
  }

  if (selectedIndex.value === gridIndex) {
    selectedIndex.value = null
    return
  }

  const copy = [...puzzleCells.value]
  const i = selectedIndex.value
  const j = gridIndex

  ;[copy[i], copy[j]] = [copy[j], copy[i]]
  puzzleCells.value = copy
  selectedIndex.value = null
  moveCount.value += 1

  const completed = copy.every((piece, pos) => piece === pos)
  if (completed) {
    stopTimer()
    showTimeUpDialog.value = false
    showCompleteDialog.value = true
    Toast.success('恭喜你完成拼图！')
  }
}

// ---------------- 录音逻辑 ----------------
let mediaRecorder = null
let mediaStream = null
let audioChunks = []
let speechRecognition = null
let speechTranscript = ''

const getSpeechRecognitionCtor = () => {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
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
    mediaStream.getTracks().forEach((t) => t.stop())
    mediaStream = null
  }
}

const toggleRecord = async (target = 'story') => {
  if (voiceStatus.value === 'recording') {
    if (activeVoiceTarget.value !== target) return
    await stopAndRecognize(target)
  } else {
    await startRecord(target)
  }
}

const startRecord = async (target = 'story') => {
  try {
    activeVoiceTarget.value = target
    if (target !== 'story') {
      storyTextBeforeCompanionVoice.value = storyText.value
    }
    voiceHint.value = ''
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    audioChunks = []
    mediaRecorder = new MediaRecorder(mediaStream)

    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        audioChunks.push(e.data)
      }
    }

    mediaRecorder.start()
    const browserSpeechReady = startBrowserSpeechRecognition()
    voiceStatus.value = 'recording'
    voiceHint.value = target === 'story'
      ? browserSpeechReady
        ? '正在录故事…再点一次结束并识别'
        : '正在录故事…当前浏览器不支持本地识别，将上传到语音服务'
      : target === 'narrator'
        ? browserSpeechReady
          ? '正在录讲述者补充…再点一次结束并识别'
          : '正在录讲述者补充…当前浏览器不支持本地识别，将上传到语音服务'
        : browserSpeechReady
          ? '正在录同伴补充…再点一次结束并识别'
          : '正在录同伴补充…当前浏览器不支持本地识别，将上传到语音服务'
  } catch (err) {
    console.error(err)
    Toast.fail('无法使用麦克风')
    voiceStatus.value = 'idle'
    activeVoiceTarget.value = null
    cleanupMic()
  }
}

const stopAndRecognize = async (target = activeVoiceTarget.value) => {
  if (!mediaRecorder) return
  if (!target) return

  try {
    voiceStatus.value = 'uploading'
    voiceHint.value = '正在结束录音并上传…'
    const browserSpeechTextPromise = stopBrowserSpeechRecognition()

    const blob = await new Promise((resolve) => {
      mediaRecorder.onstop = () => {
        resolve(new Blob(audioChunks, { type: mediaRecorder.mimeType || 'audio/webm' }))
      }
      mediaRecorder.stop()
    })

    const browserSpeechText = await browserSpeechTextPromise
    cleanupMic()

    voiceStatus.value = 'recognizing'
    voiceHint.value = '正在语音识别…'

    const formData = new FormData()
    formData.append('audio', blob, 'record.webm')

    const res = await axios.post(apiUrl('/api/asr'), formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000
    })

    const text = res?.data?.data?.text || browserSpeechText
    if (res?.data?.code === 200 && text) {
      applyRecognizedText(target, text)
      if ((target === 'visual' || target === 'emotion') && storyTextBeforeCompanionVoice.value) {
        storyText.value = storyTextBeforeCompanionVoice.value
      }
      Toast.success('识别完成')
      voiceHint.value = target === 'story'
        ? '故事识别完成，可以请同伴补充细节'
        : target === 'narrator'
          ? '讲述者补充完成，会一起用于生成图片'
          : '补充识别完成，会一起用于生成图片'
    } else if (browserSpeechText) {
      applyRecognizedText(target, browserSpeechText)
      if ((target === 'visual' || target === 'emotion') && storyTextBeforeCompanionVoice.value) {
        storyText.value = storyTextBeforeCompanionVoice.value
      }
      Toast.success('已使用浏览器识别结果')
      voiceHint.value = '后端语音服务没有返回文字，已使用浏览器识别结果'
    } else {
      Toast.fail('语音识别失败')
      voiceHint.value = '识别失败，且浏览器没有得到可用文字，请改用直接输入'
    }
  } catch (err) {
    console.error(err)
    const browserSpeechText = speechTranscript.trim()
    if (browserSpeechText) {
      applyRecognizedText(target, browserSpeechText)
      if ((target === 'visual' || target === 'emotion') && storyTextBeforeCompanionVoice.value) {
        storyText.value = storyTextBeforeCompanionVoice.value
      }
      Toast.success('已使用浏览器识别结果')
      voiceHint.value = '连接不到语音服务，已使用浏览器识别结果'
    } else {
      const message = err?.code === 'ERR_NETWORK'
        ? '连接不到语音服务'
        : err?.response?.data?.message || '语音识别失败'
      Toast.fail(message)
      voiceHint.value = `${message}，请改用直接输入`
    }
  } finally {
    voiceStatus.value = 'idle'
    activeVoiceTarget.value = null
    storyTextBeforeCompanionVoice.value = ''
  }
}

// ---------------- 文字生图 ----------------
const submitStoryText = async () => {
  if (!storyText.value.trim()) {
    Toast.fail('请输入故事文字')
    return
  }
  if (!hasSavedCompanionRound.value) {
    Toast.fail('请至少完成一轮同伴提问和回应')
    return
  }
  if (!questioningComplete.value) {
    Toast.fail('请先点击“完成提问，选择风格”')
    return
  }

  recordStatus.value = 'uploading'
  Toast.loading({
    message: '生成图片中…',
    forbidClick: true,
    duration: 0
  })

  try {
    const res = await fetch(apiUrl('/api/story'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomCode: roomCode.value || 'single',
        playerName: playerName.value,
        storyText: storyText.value.trim(),
        companionContext: companionContext.value,
        puzzleStyle: puzzleStyle.value
      })
    })

    const data = await res.json()
    if (!res.ok || data?.code !== 200) {
      throw new Error(data?.message || '生成图片失败')
    }

    puzzleImageUrl.value = data?.data?.imageUrl || ''

    if (!puzzleImageUrl.value) {
      throw new Error('未返回图片地址')
    }

    initPuzzle()
    Toast.clear()
    Toast.success('图片生成成功！')
  } catch (err) {
    console.error(err)
    Toast.clear()
    Toast.fail(err.message || '生成图片失败，请重试')
  } finally {
    recordStatus.value = 'idle'
  }
}

const handleQuit = () => {
  router.push('/player-mobile')
}

onBeforeUnmount(() => {
  stopTimer()
  cleanupMic()
})
</script>

<style scoped>
.player-mobile-page {
  min-height: 100dvh;
  background:
    radial-gradient(circle at 12% 0%, rgba(185, 214, 244, 0.74), transparent 34%),
    radial-gradient(circle at 88% 0%, rgba(199, 226, 250, 0.62), transparent 32%),
    linear-gradient(115deg, #edf6f1 0%, #f6f7ea 52%, #eaf3f7 100%);
  padding: 0 12px 14px;
  color: #2f3b35;
  overflow-x: hidden;
  box-sizing: border-box;
}

.player-mobile-page * {
  box-sizing: border-box;
}

.flow-header {
  width: min(650px, 92vw);
  height: 48px;
  margin: 0 auto 12px;
  padding: 0 14px;
  border-radius: 0 0 8px 8px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 10px 30px rgba(82, 106, 96, 0.12);
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  align-items: center;
  gap: 6px;
  backdrop-filter: blur(16px);
}

.flow-step {
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
  color: #8b9890;
  min-width: 0;
}

.flow-step::after {
  content: '';
  position: absolute;
  right: -7px;
  top: 17px;
  width: 16px;
  height: 2px;
  background: #d6dfd8;
}

.flow-step:last-child::after {
  display: none;
}

.flow-step.active {
  color: #4976c7;
  font-weight: 700;
  background: #f3f7ff;
  border-radius: 8px;
  padding: 6px;
  box-shadow: 0 6px 16px rgba(78, 113, 188, 0.12);
}

.flow-dot {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #9ab8a8;
  color: #fff;
  display: grid;
  place-items: center;
  font-size: 12px;
  flex: none;
}

.flow-step.active .flow-dot {
  background: #6e92de;
}

.flow-title {
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.flow-time {
  font-size: 10px;
  color: #9ba6a0;
}

.game-shell {
  display: grid;
  grid-template-columns: minmax(620px, 1fr) 300px;
  gap: 12px;
  align-items: stretch;
  max-width: 1360px;
  margin: 0 auto;
}

.right-column {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.panel {
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.78);
  box-shadow: 0 10px 28px rgba(77, 103, 91, 0.11);
  padding: 13px 14px;
  backdrop-filter: blur(18px);
}

.panel h2 {
  margin: 0 0 12px;
  font-size: 15px;
  color: #43564d;
}

.info-panel {
  min-height: 150px;
}

.info-row {
  display: grid;
  grid-template-columns: 60px 1fr;
  gap: 8px;
  align-items: start;
  margin: 9px 0;
  font-size: 12px;
}

.info-row span {
  color: #6f7d74;
}

.info-row strong {
  line-height: 1.45;
}

.avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #d7e4d8;
  display: grid;
  place-items: center;
  font-size: 15px;
  flex: none;
}

.avatar.large {
  width: 38px;
  height: 38px;
  font-size: 22px;
}

.center-stage {
  min-width: 0;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.76);
  box-shadow: 0 12px 32px rgba(77, 103, 91, 0.12);
  padding: 18px 18px 14px;
  backdrop-filter: blur(18px);
}

.stage-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.speaker {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.stage-title {
  font-size: 17px;
  font-weight: 800;
  color: #2f3d36;
}

.stage-subtitle {
  font-size: 12px;
  color: #8a978f;
  margin-top: 3px;
}

.timer-pill {
  min-width: 88px;
  border-radius: 8px;
  background: #eef6ff;
  color: #5279cf;
  text-align: center;
  padding: 7px 10px;
}

.timer-pill span {
  display: block;
  font-size: 11px;
}

.timer-pill strong {
  display: block;
  font-size: 24px;
  line-height: 1.1;
}

.puzzle-table {
  position: relative;
  border-radius: 8px;
  overflow: visible;
  background: #dbe8df;
  box-shadow: inset 0 0 0 1px rgba(73, 91, 82, 0.16);
  padding: 10px;
  width: min(100%, 620px);
  margin: 0 auto;
}

.puzzle-board {
  width: 100%;
  aspect-ratio: 1 / 1;
  margin: 0;
  border-radius: 8px;
  background: #d8e5df;
  padding: 6px;
  overflow: hidden;
}

.puzzle-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1px;
  width: 100%;
  height: 100%;
}

.puzzle-cell {
  border: 0;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  transition: transform 0.14s ease, box-shadow 0.14s ease, filter 0.14s ease;
  box-shadow:
    inset 0 0 0 1px rgba(72, 94, 86, 0.22),
    0 1px 2px rgba(31, 47, 37, 0.12);
  min-width: 0;
  min-height: 0;
}

.puzzle-cell::before,
.puzzle-cell::after {
  content: '';
  position: absolute;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: inherit;
  background-image: inherit;
  background-size: inherit;
  background-position: inherit;
  pointer-events: none;
  box-shadow: inset 0 0 0 1px rgba(72, 94, 86, 0.16);
}

.puzzle-cell::before {
  top: 50%;
  right: -12px;
  transform: translateY(-50%);
}

.puzzle-cell::after {
  left: 50%;
  bottom: -12px;
  transform: translateX(-50%);
}

.puzzle-cell:nth-child(4n)::before {
  display: none;
}

.puzzle-cell:nth-child(n + 13)::after {
  display: none;
}

.puzzle-cell:nth-child(2n)::before {
  right: auto;
  left: -12px;
  background: #d8e5df;
  box-shadow: inset 0 0 0 1px rgba(72, 94, 86, 0.1);
}

.puzzle-cell:nth-child(2n + 1)::after {
  top: -12px;
  bottom: auto;
  background: #d8e5df;
  box-shadow: inset 0 0 0 1px rgba(72, 94, 86, 0.1);
}

.puzzle-cell.selected {
  outline: 3px solid #fff;
  transform: scale(1.025);
  z-index: 2;
  box-shadow: 0 8px 18px rgba(69, 88, 78, 0.22);
}

.start-overlay {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(246, 250, 246, 0.34);
  color: #33443b;
  font-weight: 700;
  pointer-events: none;
}

.panel-title-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: baseline;
}

.panel-title-row span {
  color: #8b9690;
  font-size: 12px;
}

.story-panel {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.player-status-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.current-player-card {
  display: flex;
  align-items: center;
  gap: 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.88);
  padding: 12px;
  box-shadow: 0 5px 14px rgba(77, 103, 91, 0.08);
}

.current-player-card strong {
  display: block;
  font-size: 16px;
  color: #2f3d36;
}

.current-player-card p {
  margin: 4px 0 0;
  color: #7b8780;
  font-size: 12px;
  line-height: 1.5;
}

.progress-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.progress-grid div {
  border-radius: 8px;
  background: #f5f9f6;
  padding: 10px 8px;
  text-align: center;
}

.progress-grid span {
  display: block;
  color: #7d8982;
  font-size: 12px;
}

.progress-grid strong {
  display: block;
  margin-top: 4px;
  color: #4d70c2;
  font-size: 17px;
}

.story-input {
  border-radius: 8px;
  overflow: hidden;
}

.style-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.style-option {
  border: 1px solid rgba(90, 113, 104, 0.16);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.84);
  color: #33443b;
  cursor: pointer;
  padding: 9px 8px;
  text-align: left;
  transition: transform 0.14s ease, border-color 0.14s ease, box-shadow 0.14s ease, background 0.14s ease;
}

.style-option strong,
.style-option span {
  display: block;
}

.style-option strong {
  font-size: 13px;
  line-height: 1.3;
}

.style-option span {
  margin-top: 3px;
  color: #7d8982;
  font-size: 11px;
  line-height: 1.35;
}

.style-option.active {
  border-color: rgba(0, 137, 123, 0.42);
  background: #e9fbf7;
  box-shadow: 0 8px 18px rgba(24, 79, 85, 0.11);
  color: #005b4f;
}

.style-option.active span {
  color: #4268d6;
}

.style-option:active {
  transform: translateY(1px);
}

.story-voice-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.story-voice-row span {
  color: #66607a;
  font-size: 12px;
  font-weight: 700;
}

.story-actions {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}

.voice-status {
  border-radius: 8px;
  background: #eef5ff;
  color: #5175c2;
  padding: 8px 10px;
  font-size: 13px;
}

.memory-strip {
  max-width: 1360px;
  margin: 12px auto 0;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.78);
  box-shadow: 0 10px 28px rgba(77, 103, 91, 0.11);
  padding: 12px 14px 14px;
  backdrop-filter: blur(18px);
}

.memory-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 8px;
}

.memory-head h2 {
  margin: 0;
  font-size: 16px;
}

.memory-head span {
  color: #8b9690;
  font-size: 12px;
}

.memory-list {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 10px;
}

.memory-card {
  position: relative;
  min-height: 104px;
  overflow: hidden;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.88);
  padding: 10px;
  box-shadow: 0 5px 14px rgba(77, 103, 91, 0.08);
}

.card-person {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.memory-card p {
  position: relative;
  z-index: 1;
  margin: 7px 0 4px;
  font-weight: 700;
  font-size: 13px;
}

.memory-card small {
  position: relative;
  z-index: 1;
  color: #6f7d74;
}

.memory-image {
  position: absolute;
  right: -18px;
  bottom: -24px;
  width: 112px;
  height: 78px;
  opacity: 0.45;
  background-size: cover;
  background-position: center;
  border-radius: 8px;
}

.complete-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.38);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  padding: 20px;
}

.complete-dialog {
  width: 100%;
  max-width: 360px;
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.18);
}

.complete-title {
  text-align: center;
  font-size: 20px;
  margin-bottom: 14px;
  color: #3f5c48;
}

.complete-preview {
  width: 100%;
  border-radius: 8px;
  margin-bottom: 12px;
}

.complete-info {
  text-align: center;
  font-size: 14px;
  color: #666;
  margin: 4px 0;
}

.complete-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 16px;
}

@media (max-width: 1024px) {
  .player-mobile-page {
    padding: 8px;
  }

  .flow-header {
    width: 100%;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    padding: 0 8px;
  }

  .flow-title {
    font-size: 11px;
  }

  .game-shell {
    grid-template-columns: 1fr;
  }

.right-column {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  .center-stage {
    order: -1;
  }

  .memory-list {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 700px) {
  .flow-header {
    overflow-x: auto;
    grid-template-columns: repeat(5, 130px);
    justify-content: start;
  }

.right-column,
  .memory-list {
    grid-template-columns: 1fr;
  }

}

.player-mobile-page {
  background: #f7fbf7;
  padding: 0 16px 16px;
  color: #1a1c1a;
}

.flow-header,
.panel,
.center-stage,
.memory-strip {
  background: #ffffff;
  backdrop-filter: none;
}

.flow-header {
  margin-bottom: 16px;
  box-shadow: 0 2px 6px rgba(31, 47, 37, 0.08), 0 1px 2px rgba(31, 47, 37, 0.08);
}

.flow-step {
  color: #68746b;
}

.flow-step::after {
  background: #d8e5db;
}

.flow-step.active {
  color: #005b4f;
  background: #d7f2ea;
  box-shadow: none;
}

.flow-dot {
  background: #789486;
}

.flow-step.active .flow-dot {
  background: #006b5d;
}

.panel,
.memory-strip {
  box-shadow: 0 1px 3px rgba(31, 47, 37, 0.12), 0 1px 2px rgba(31, 47, 37, 0.08);
  padding: 16px;
}

.center-stage {
  box-shadow: 0 2px 6px rgba(31, 47, 37, 0.11), 0 1px 3px rgba(31, 47, 37, 0.1);
}

.panel h2,
.stage-title,
.current-player-card strong {
  color: #1f2a23;
}

.flow-time,
.info-row span,
.stage-subtitle,
.panel-title-row span,
.current-player-card p,
.progress-grid span,
.memory-head span,
.memory-card small {
  color: #657169;
}

.voice-status {
  background: #d7f2ea;
  color: #005b4f;
}

.avatar {
  background: #e3eee6;
}

.timer-pill,
.progress-grid div {
  background: #e8f3ee;
  color: #006b5d;
}

.progress-grid strong {
  color: #006b5d;
}

.puzzle-table {
  background: #e4eee8;
  box-shadow: inset 0 0 0 1px #d2ded6;
}

.puzzle-cell.selected {
  outline: 3px solid #006b5d;
  box-shadow: 0 6px 16px rgba(0, 107, 93, 0.2);
}

.current-player-card {
  background: #f4f8f5;
  box-shadow: none;
}

.story-input {
  background: #f7fbf7;
}

.memory-card {
  background: #f8fbf8;
  box-shadow: inset 0 0 0 1px #e1ebe4;
}

:deep(.van-button) {
  border-radius: 8px;
  font-weight: 700;
  box-shadow: none;
}

:deep(.van-button--primary) {
  background: #006b5d;
  border-color: #006b5d;
  color: #ffffff;
}

:deep(.van-button--success) {
  background: #386a20;
  border-color: #386a20;
  color: #ffffff;
}

:deep(.van-button--default) {
  background: #eef7f2;
  border-color: #d8e5db;
  color: #1f2a23;
}

:deep(.van-field) {
  border-radius: 8px;
  background: #f7fbf7;
  box-shadow: inset 0 0 0 1px #d8e5db;
}

:deep(.van-field__control) {
  color: #1a1c1a;
}

.player-mobile-page {
  background:
    radial-gradient(circle at 18% 6%, rgba(0, 185, 166, 0.18), transparent 30%),
    radial-gradient(circle at 82% 2%, rgba(91, 124, 255, 0.18), transparent 28%),
    linear-gradient(135deg, #f6fbff 0%, #eef8f4 46%, #f9fbff 100%);
}

.flow-header,
.panel,
.center-stage,
.memory-strip {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 253, 251, 0.9));
  border: 1px solid rgba(118, 203, 192, 0.22);
}

.flow-header,
.center-stage {
  box-shadow:
    0 18px 42px rgba(24, 79, 85, 0.12),
    0 1px 0 rgba(255, 255, 255, 0.9) inset;
}

.panel,
.memory-strip {
  box-shadow:
    0 10px 30px rgba(24, 79, 85, 0.08),
    0 1px 0 rgba(255, 255, 255, 0.92) inset;
}

.flow-step.active,
.voice-status {
  background: linear-gradient(135deg, #d9fff3, #e8edff);
  color: #005b63;
}

.flow-step.active .flow-dot,
.timer-pill,
.progress-grid strong {
  background: linear-gradient(135deg, #00897b, #4268d6);
}

.timer-pill {
  color: #ffffff;
  box-shadow: 0 10px 24px rgba(66, 104, 214, 0.18);
}

.timer-pill strong,
.timer-pill span {
  color: #ffffff;
}

.progress-grid div {
  background: linear-gradient(180deg, #f0fbf8, #eef3ff);
  border: 1px solid rgba(118, 203, 192, 0.18);
}

.progress-grid strong {
  color: transparent;
  background-clip: text;
}

.puzzle-table {
  background:
    linear-gradient(135deg, rgba(0, 137, 123, 0.14), rgba(66, 104, 214, 0.12)),
    #eef8f4;
  border: 1px solid rgba(0, 137, 123, 0.18);
  box-shadow:
    0 18px 42px rgba(24, 79, 85, 0.14),
    0 0 0 1px rgba(255, 255, 255, 0.9) inset;
}

.puzzle-board {
  background: #e8f2ee;
  box-shadow:
    0 0 0 1px rgba(0, 137, 123, 0.14) inset,
    0 12px 28px rgba(24, 79, 85, 0.08);
}

.puzzle-cell {
  box-shadow:
    inset 0 0 0 1px rgba(0, 137, 123, 0.18),
    0 2px 6px rgba(24, 79, 85, 0.14);
}

.puzzle-cell.selected {
  outline: 3px solid #00a896;
  box-shadow:
    0 0 0 5px rgba(0, 168, 150, 0.16),
    0 14px 26px rgba(24, 79, 85, 0.2);
}

.current-player-card,
.memory-card {
  background: linear-gradient(180deg, #ffffff, #f5fbff);
  border: 1px solid rgba(118, 203, 192, 0.2);
}

.style-option {
  background: linear-gradient(180deg, #ffffff, #f7fbff);
  border-color: rgba(118, 203, 192, 0.22);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.92) inset;
}

.style-option.active {
  background: linear-gradient(135deg, #d9fff3, #eef3ff);
  border-color: rgba(66, 104, 214, 0.32);
  box-shadow:
    0 10px 22px rgba(24, 79, 85, 0.12),
    0 0 0 1px rgba(0, 168, 150, 0.12) inset;
}

:deep(.van-button--primary) {
  background: linear-gradient(135deg, #00897b, #4268d6);
  border-color: transparent;
}

:deep(.van-button--success) {
  background: linear-gradient(135deg, #2e7d32, #00897b);
  border-color: transparent;
}

:deep(.van-button--default) {
  background: #f4f8ff;
  border-color: rgba(66, 104, 214, 0.22);
  color: #263b6f;
}

:deep(.van-field) {
  background: #f8fcff;
  box-shadow:
    inset 0 0 0 1px rgba(118, 203, 192, 0.24),
    0 1px 0 rgba(255, 255, 255, 0.9);
}

.player-mobile-page {
  background:
    radial-gradient(circle at 14% 8%, rgba(159, 102, 255, 0.32), transparent 28%),
    radial-gradient(circle at 82% 4%, rgba(255, 82, 193, 0.18), transparent 24%),
    radial-gradient(circle at 52% 86%, rgba(43, 211, 255, 0.15), transparent 30%),
    linear-gradient(135deg, #070411 0%, #130824 44%, #090b1d 100%);
  color: #f4efff;
}

.flow-header,
.panel,
.center-stage,
.memory-strip {
  background: linear-gradient(180deg, rgba(35, 22, 62, 0.88), rgba(15, 10, 33, 0.88));
  border: 1px solid rgba(199, 164, 255, 0.2);
  backdrop-filter: blur(22px);
}

.flow-header,
.center-stage {
  box-shadow:
    0 24px 52px rgba(4, 1, 12, 0.42),
    0 0 0 1px rgba(255, 255, 255, 0.06) inset,
    0 0 36px rgba(148, 88, 255, 0.14);
}

.panel,
.memory-strip {
  box-shadow:
    0 18px 42px rgba(4, 1, 12, 0.34),
    0 0 0 1px rgba(255, 255, 255, 0.05) inset;
}

.panel h2,
.stage-title,
.current-player-card strong,
.memory-head h2,
.card-person strong,
.memory-card p,
.info-row strong {
  color: #fbf7ff;
}

.flow-step,
.flow-time,
.info-row span,
.stage-subtitle,
.panel-title-row span,
.current-player-card p,
.progress-grid span,
.memory-head span,
.memory-card small {
  color: #b8acd4;
}

.flow-step::after {
  background: linear-gradient(90deg, rgba(190, 152, 255, 0.28), rgba(77, 208, 255, 0.18));
}

.flow-step.active,
.voice-status {
  background: linear-gradient(135deg, rgba(147, 91, 255, 0.26), rgba(47, 196, 255, 0.16));
  color: #ffffff;
  box-shadow: 0 8px 24px rgba(116, 65, 255, 0.18);
}

.flow-dot,
.avatar {
  background: linear-gradient(135deg, #332056, #1d1438);
  color: #f5efff;
  box-shadow: inset 0 0 0 1px rgba(210, 180, 255, 0.18);
}

.flow-step.active .flow-dot,
.timer-pill,
.progress-grid strong {
  background: linear-gradient(135deg, #a56bff, #ff69c7 48%, #4dd0ff);
}

.timer-pill {
  color: #ffffff;
  box-shadow:
    0 12px 28px rgba(151, 82, 255, 0.26),
    0 0 0 1px rgba(255, 255, 255, 0.12) inset;
}

.timer-pill strong,
.timer-pill span {
  color: #ffffff;
}

.progress-grid div,
.current-player-card,
.memory-card,
.style-option {
  background: linear-gradient(180deg, rgba(42, 28, 72, 0.88), rgba(19, 13, 42, 0.9));
  border: 1px solid rgba(197, 159, 255, 0.18);
}

.progress-grid div {
  box-shadow: 0 10px 24px rgba(4, 1, 12, 0.18);
}

.progress-grid strong {
  color: transparent;
  background-clip: text;
}

.puzzle-table {
  background:
    linear-gradient(135deg, rgba(164, 107, 255, 0.2), rgba(77, 208, 255, 0.12)),
    rgba(12, 8, 28, 0.92);
  border: 1px solid rgba(202, 169, 255, 0.25);
  box-shadow:
    0 24px 54px rgba(4, 1, 12, 0.48),
    0 0 42px rgba(154, 91, 255, 0.18),
    0 0 0 1px rgba(255, 255, 255, 0.06) inset;
}

.puzzle-board {
  background: #0b0719;
  box-shadow:
    0 0 0 1px rgba(202, 169, 255, 0.2) inset,
    0 14px 34px rgba(4, 1, 12, 0.38);
}

.puzzle-cell {
  box-shadow:
    inset 0 0 0 1px rgba(220, 191, 255, 0.2),
    0 3px 10px rgba(4, 1, 12, 0.26);
}

.puzzle-cell:nth-child(2n)::before,
.puzzle-cell:nth-child(2n + 1)::after {
  background: #0b0719;
  box-shadow: inset 0 0 0 1px rgba(202, 169, 255, 0.1);
}

.puzzle-cell.selected {
  outline: 3px solid #d8b4ff;
  box-shadow:
    0 0 0 5px rgba(164, 107, 255, 0.2),
    0 0 30px rgba(255, 105, 199, 0.28),
    0 14px 30px rgba(4, 1, 12, 0.36);
}

.start-overlay {
  background: rgba(9, 6, 24, 0.54);
  color: #f5efff;
}

.style-option {
  color: #f5efff;
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.08) inset;
}

.style-option span {
  color: #b8acd4;
}

.style-option.active {
  background: linear-gradient(135deg, rgba(164, 107, 255, 0.34), rgba(255, 105, 199, 0.22));
  border-color: rgba(224, 194, 255, 0.46);
  color: #ffffff;
  box-shadow:
    0 14px 30px rgba(128, 72, 255, 0.22),
    0 0 0 1px rgba(255, 255, 255, 0.08) inset;
}

.style-option.active span {
  color: #d9f2ff;
}

.story-input {
  background: rgba(14, 9, 31, 0.86);
}

:deep(.van-field) {
  background: rgba(14, 9, 31, 0.86);
  box-shadow:
    inset 0 0 0 1px rgba(202, 169, 255, 0.2),
    0 10px 24px rgba(4, 1, 12, 0.18);
}

:deep(.van-field__control),
:deep(.van-field__control::placeholder) {
  color: #f5efff;
}

:deep(.van-field__control::placeholder) {
  opacity: 0.52;
}

:deep(.van-button--primary) {
  background: linear-gradient(135deg, #9b5cff, #ff69c7);
  border-color: transparent;
  color: #ffffff;
  box-shadow: 0 12px 28px rgba(151, 82, 255, 0.24);
}

:deep(.van-button--success) {
  background: linear-gradient(135deg, #3fd0ff, #9b5cff);
  border-color: transparent;
  color: #ffffff;
  box-shadow: 0 12px 28px rgba(63, 208, 255, 0.2);
}

:deep(.van-button--default) {
  background: rgba(31, 20, 58, 0.88);
  border-color: rgba(202, 169, 255, 0.26);
  color: #f5efff;
}

.memory-image {
  opacity: 0.34;
  filter: saturate(1.2) contrast(1.08);
}

.complete-overlay {
  background: rgba(4, 1, 12, 0.72);
}

.complete-dialog {
  background: linear-gradient(180deg, #24163d, #100a25);
  border: 1px solid rgba(202, 169, 255, 0.26);
  box-shadow:
    0 22px 54px rgba(4, 1, 12, 0.46),
    0 0 38px rgba(164, 107, 255, 0.2);
}

.complete-title,
.complete-info {
  color: #f5efff;
}

.player-mobile-page {
  background:
    radial-gradient(circle at 18% 10%, rgba(134, 104, 207, 0.2), transparent 26%),
    radial-gradient(circle at 86% 8%, rgba(127, 196, 185, 0.12), transparent 24%),
    radial-gradient(circle at 54% 88%, rgba(229, 203, 139, 0.1), transparent 28%),
    linear-gradient(135deg, #07120f 0%, #16102b 46%, #070b17 100%);
  color: #f3edf9;
}

.flow-header,
.panel,
.center-stage,
.memory-strip {
  background:
    linear-gradient(180deg, rgba(24, 29, 49, 0.88), rgba(12, 17, 31, 0.9)),
    rgba(13, 22, 27, 0.86);
  border-color: rgba(190, 173, 224, 0.18);
}

.flow-header,
.center-stage {
  box-shadow:
    0 22px 48px rgba(2, 5, 14, 0.42),
    0 0 0 1px rgba(255, 255, 255, 0.05) inset,
    0 0 28px rgba(132, 110, 190, 0.1);
}

.panel,
.memory-strip {
  box-shadow:
    0 16px 34px rgba(2, 5, 14, 0.34),
    0 0 0 1px rgba(255, 255, 255, 0.045) inset;
}

.flow-step,
.flow-time,
.info-row span,
.stage-subtitle,
.panel-title-row span,
.current-player-card p,
.progress-grid span,
.memory-head span,
.memory-card small {
  color: #aaa7bd;
}

.flow-step::after {
  background: linear-gradient(90deg, rgba(185, 169, 222, 0.22), rgba(127, 196, 185, 0.18));
}

.flow-step.active,
.voice-status {
  background: linear-gradient(135deg, rgba(121, 98, 177, 0.24), rgba(101, 159, 151, 0.18));
  color: #f9f5ff;
  box-shadow: 0 8px 20px rgba(69, 49, 119, 0.16);
}

.flow-dot,
.avatar {
  background: linear-gradient(135deg, #28372f, #201936);
  box-shadow: inset 0 0 0 1px rgba(214, 200, 238, 0.14);
}

.flow-step.active .flow-dot,
.timer-pill,
.progress-grid strong {
  background: linear-gradient(135deg, #8f78c9, #79c7b7 64%, #ead48b);
}

.timer-pill {
  box-shadow:
    0 10px 24px rgba(69, 49, 119, 0.22),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;
}

.progress-grid div,
.current-player-card,
.memory-card,
.style-option {
  background:
    linear-gradient(180deg, rgba(31, 32, 56, 0.86), rgba(13, 18, 34, 0.9));
  border-color: rgba(190, 173, 224, 0.16);
}

.puzzle-table {
  background:
    linear-gradient(135deg, rgba(143, 120, 201, 0.16), rgba(121, 199, 183, 0.1)),
    rgba(9, 16, 27, 0.94);
  border-color: rgba(190, 173, 224, 0.2);
  box-shadow:
    0 22px 48px rgba(2, 5, 14, 0.48),
    0 0 34px rgba(127, 196, 185, 0.1),
    0 0 0 1px rgba(255, 255, 255, 0.05) inset;
}

.puzzle-board,
.puzzle-cell:nth-child(2n)::before,
.puzzle-cell:nth-child(2n + 1)::after {
  background: #081018;
}

.puzzle-board {
  box-shadow:
    0 0 0 1px rgba(190, 173, 224, 0.16) inset,
    0 12px 28px rgba(2, 5, 14, 0.36);
}

.puzzle-cell {
  box-shadow:
    inset 0 0 0 1px rgba(214, 200, 238, 0.16),
    0 3px 10px rgba(2, 5, 14, 0.26);
}

.puzzle-cell.selected {
  outline-color: #d8c9f4;
  box-shadow:
    0 0 0 5px rgba(143, 120, 201, 0.18),
    0 0 22px rgba(121, 199, 183, 0.22),
    0 14px 28px rgba(2, 5, 14, 0.36);
}

.start-overlay {
  background: rgba(7, 14, 24, 0.58);
}

.style-option.active {
  background: linear-gradient(135deg, rgba(143, 120, 201, 0.3), rgba(121, 199, 183, 0.18));
  border-color: rgba(216, 201, 244, 0.36);
  box-shadow:
    0 12px 26px rgba(69, 49, 119, 0.18),
    0 0 0 1px rgba(255, 255, 255, 0.07) inset;
}

.style-option.active span {
  color: #ccefe8;
}

:deep(.van-field) {
  background: rgba(9, 16, 27, 0.86);
  box-shadow:
    inset 0 0 0 1px rgba(190, 173, 224, 0.16),
    0 10px 24px rgba(2, 5, 14, 0.16);
}

:deep(.van-button--primary) {
  background: linear-gradient(135deg, #8f78c9, #79c7b7);
  box-shadow: 0 10px 24px rgba(69, 49, 119, 0.22);
}

:deep(.van-button--success) {
  background: linear-gradient(135deg, #79c7b7, #8f78c9);
  box-shadow: 0 10px 24px rgba(65, 127, 121, 0.18);
}

:deep(.van-button--default) {
  background: rgba(18, 25, 43, 0.88);
  border-color: rgba(190, 173, 224, 0.22);
}

.complete-dialog {
  background: linear-gradient(180deg, #1d1e37, #0c1120);
  border-color: rgba(190, 173, 224, 0.24);
  box-shadow:
    0 22px 50px rgba(2, 5, 14, 0.46),
    0 0 28px rgba(127, 196, 185, 0.12);
}

.player-mobile-page {
  background:
    radial-gradient(circle at 8% 12%, rgba(255, 112, 112, 0.18), transparent 14%),
    radial-gradient(circle at 86% 10%, rgba(79, 209, 197, 0.2), transparent 16%),
    radial-gradient(circle at 74% 84%, rgba(255, 212, 91, 0.22), transparent 18%),
    linear-gradient(135deg, #f7f3ff 0%, #eefbf8 48%, #fff7ec 100%);
  color: #252237;
  position: relative;
}

.player-mobile-page::before {
  display: none;
}

.flow-header,
.panel,
.center-stage,
.memory-strip {
  background: rgba(255, 255, 255, 0.86);
  border: 2px solid rgba(47, 42, 68, 0.12);
  backdrop-filter: blur(18px);
}

.flow-header,
.center-stage,
.panel,
.memory-strip {
  box-shadow:
    10px 10px 0 rgba(79, 209, 197, 0.12),
    0 14px 28px rgba(47, 42, 68, 0.1);
}

.panel h2,
.stage-title,
.current-player-card strong,
.memory-head h2,
.card-person strong,
.memory-card p,
.info-row strong {
  color: #252237;
}

.flow-step,
.flow-time,
.info-row span,
.stage-subtitle,
.panel-title-row span,
.current-player-card p,
.progress-grid span,
.memory-head span,
.memory-card small {
  color: #66607a;
}

.flow-step::after {
  background: repeating-linear-gradient(
    90deg,
    #2f2a44 0 6px,
    transparent 6px 12px
  );
  opacity: 0.28;
}

.flow-step.active,
.voice-status {
  background: linear-gradient(135deg, #ffd45b, #ffb3a7);
  color: #252237;
  box-shadow: 4px 4px 0 rgba(47, 42, 68, 0.14);
}

.flow-dot,
.avatar {
  background: #4fd1c5;
  color: #252237;
  box-shadow: inset 0 0 0 2px rgba(47, 42, 68, 0.12);
}

.flow-step.active .flow-dot {
  background: #ff7b7b;
  color: #ffffff;
}

.timer-pill,
.progress-grid strong {
  background: linear-gradient(135deg, #6c63ff, #4fd1c5);
}

.timer-pill {
  color: #ffffff;
  box-shadow: 5px 5px 0 rgba(47, 42, 68, 0.12);
}

.timer-pill strong,
.timer-pill span {
  color: #ffffff;
}

.progress-grid div,
.current-player-card,
.memory-card,
.style-option {
  background: rgba(255, 255, 255, 0.92);
  border: 2px solid rgba(47, 42, 68, 0.1);
}

.progress-grid div {
  box-shadow: 4px 4px 0 rgba(108, 99, 255, 0.1);
}

.progress-grid strong {
  color: transparent;
  background-clip: text;
}

.puzzle-table {
  background:
    linear-gradient(135deg, rgba(108, 99, 255, 0.12), rgba(79, 209, 197, 0.14)),
    #ffffff;
  border: 2px solid rgba(47, 42, 68, 0.14);
  box-shadow:
    12px 12px 0 rgba(255, 123, 123, 0.14),
    0 18px 30px rgba(47, 42, 68, 0.12);
}

.puzzle-board {
  background: #f8f4ff;
  box-shadow: inset 0 0 0 2px rgba(47, 42, 68, 0.1);
}

.puzzle-cell,
.puzzle-cell:nth-child(2n)::before,
.puzzle-cell:nth-child(2n + 1)::after {
  box-shadow: inset 0 0 0 1px rgba(47, 42, 68, 0.14);
}

.puzzle-cell:nth-child(2n)::before,
.puzzle-cell:nth-child(2n + 1)::after {
  background: #f8f4ff;
}

.puzzle-cell.selected {
  outline-color: #6c63ff;
  box-shadow:
    0 0 0 5px rgba(255, 212, 91, 0.5),
    5px 5px 0 rgba(47, 42, 68, 0.16);
}

.start-overlay {
  background: rgba(255, 255, 255, 0.68);
  color: #252237;
}

.style-option {
  color: #252237;
  box-shadow: 3px 3px 0 rgba(47, 42, 68, 0.08);
}

.style-option span {
  color: #66607a;
}

.style-option.active {
  background: linear-gradient(135deg, #ffd45b, #b7f3ea);
  border-color: rgba(47, 42, 68, 0.18);
  color: #252237;
  box-shadow: 5px 5px 0 rgba(108, 99, 255, 0.16);
}

.style-option.active span {
  color: #3d4860;
}

.story-input,
:deep(.van-field) {
  background: rgba(255, 255, 255, 0.92);
}

:deep(.van-field) {
  box-shadow: inset 0 0 0 2px rgba(47, 42, 68, 0.1);
}

:deep(.van-field__control) {
  color: #252237;
}

:deep(.van-field__control::placeholder) {
  color: #7a748e;
  opacity: 0.8;
}

:deep(.van-button--primary) {
  background: linear-gradient(135deg, #6c63ff, #4fd1c5);
  border-color: transparent;
  color: #ffffff;
  box-shadow: 5px 5px 0 rgba(47, 42, 68, 0.14);
}

:deep(.van-button--success) {
  background: linear-gradient(135deg, #ff7b7b, #ffd45b);
  border-color: transparent;
  color: #252237;
  box-shadow: 5px 5px 0 rgba(47, 42, 68, 0.14);
}

:deep(.van-button--default) {
  background: #ffffff;
  border-color: rgba(47, 42, 68, 0.18);
  color: #252237;
  box-shadow: 4px 4px 0 rgba(79, 209, 197, 0.14);
}

.memory-image {
  opacity: 0.3;
  filter: saturate(1.05) contrast(1.02);
}

.complete-overlay {
  background: rgba(37, 34, 55, 0.46);
}

.complete-dialog {
  position: relative;
  z-index: 1;
  background: #ffffff;
  border: 2px solid rgba(47, 42, 68, 0.14);
  box-shadow:
    10px 10px 0 rgba(108, 99, 255, 0.18),
    0 18px 32px rgba(47, 42, 68, 0.18);
  overflow: hidden;
  animation: complete-pop 480ms cubic-bezier(0.2, 1.18, 0.34, 1) both;
}

.complete-title,
.complete-info {
  color: #252237;
}

.celebration-burst {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.celebration-burst span {
  position: absolute;
  left: 50%;
  top: 56%;
  width: 10px;
  height: 20px;
  border-radius: 3px;
  background: var(--c);
  box-shadow: 0 6px 18px rgba(47, 42, 68, 0.26);
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.4) rotate(0deg);
  animation: confetti-burst 1450ms cubic-bezier(0.16, 0.84, 0.22, 1) var(--d) both;
}

.celebration-burst span:nth-child(2n) {
  width: 16px;
  height: 16px;
  border-radius: 999px;
}

.celebration-burst span:nth-child(5n) {
  width: 24px;
  height: 8px;
  border-radius: 999px;
}

.complete-dialog::before {
  content: '';
  position: absolute;
  inset: -40% -20% auto;
  height: 120px;
  background: radial-gradient(circle, rgba(255, 212, 91, 0.24), transparent 62%);
  pointer-events: none;
}

.complete-sparkle {
  position: absolute;
  width: 58px;
  height: 58px;
  border-radius: 999px;
  border: 3px solid rgba(255, 212, 91, 0.9);
  opacity: 0;
  animation: sparkle-pulse 1650ms ease-out 220ms both;
}

.complete-sparkle::before,
.complete-sparkle::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: 7px;
  height: 30px;
  border-radius: 999px;
  background: #ffd45b;
  transform: translate(-50%, -50%);
}

.complete-sparkle::after {
  width: 30px;
  height: 7px;
}

.complete-sparkle-a {
  right: 14px;
  top: 12px;
}

.complete-sparkle-b {
  left: 18px;
  bottom: 120px;
  border-color: rgba(79, 209, 197, 0.82);
  animation-delay: 340ms;
  transform: scale(0.7);
}

.complete-sparkle-b::before,
.complete-sparkle-b::after {
  background: #4fd1c5;
}

@keyframes complete-pop {
  0% {
    opacity: 0;
    transform: translateY(16px) scale(0.92);
  }
  70% {
    opacity: 1;
    transform: translateY(-3px) scale(1.02);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes confetti-burst {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.2) rotate(0deg);
  }
  15% {
    opacity: 1;
  }
  68% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate(calc(-50% + var(--x)), var(--y)) scale(1.12) rotate(var(--r));
  }
}

@keyframes sparkle-pulse {
  0% {
    opacity: 0;
    transform: scale(0.38) rotate(0deg);
  }
  28% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: scale(1.2) rotate(32deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .complete-dialog,
  .celebration-burst span,
  .complete-sparkle {
    animation: none;
  }
}

.question-panel {
  display: grid;
  gap: 8px;
}

.question-head {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: flex-start;
  padding: 10px 11px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.78);
  border: 2px solid rgba(47, 42, 68, 0.08);
}

.question-head strong,
.question-head span {
  display: block;
}

.question-head strong {
  color: #252237;
  font-size: 13px;
}

.question-head span,
.question-head small {
  color: #66607a;
  font-size: 11px;
  line-height: 1.45;
}

.question-card {
  display: grid;
  gap: 8px;
  padding: 10px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.9);
  border: 2px solid rgba(47, 42, 68, 0.1);
  box-shadow: 4px 4px 0 rgba(79, 209, 197, 0.1);
}

.question-title {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: baseline;
}

.question-title div {
  min-width: 0;
}

.question-title strong {
  color: #252237;
  font-size: 13px;
}

.question-title span {
  color: #66607a;
  font-size: 11px;
}

.voice-icon-btn {
  border: 1px solid rgba(47, 42, 68, 0.14);
  border-radius: 50%;
  background: #ffffff;
  color: #252237;
  cursor: pointer;
  flex: none;
  display: grid;
  place-items: center;
  font-size: 15px;
  font-weight: 700;
  height: 32px;
  line-height: 1;
  padding: 0;
  width: 32px;
  box-shadow: 2px 2px 0 rgba(108, 99, 255, 0.14);
}

.story-voice-btn {
  height: 38px;
  width: 38px;
}

.voice-icon-btn.recording {
  background: #ffd45b;
}

.voice-icon-btn:disabled {
  cursor: not-allowed;
  opacity: 0.58;
}

.voice-icon-symbol {
  display: block;
  position: relative;
}

.voice-icon-symbol--mic {
  width: 12px;
  height: 17px;
  border: 2px solid currentColor;
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
}

.voice-icon-symbol--mic::before {
  content: '';
  position: absolute;
  left: 50%;
  bottom: -6px;
  width: 16px;
  height: 10px;
  border: 2px solid currentColor;
  border-top: 0;
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
  transform: translateX(-50%);
}

.voice-icon-symbol--mic::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: -11px;
  width: 12px;
  height: 2px;
  background: currentColor;
  border-radius: 8px;
  transform: translateX(-50%);
}

.voice-icon-symbol--stop {
  width: 14px;
  height: 14px;
  border-radius: 4px;
  background: currentColor;
}

.voice-icon-symbol--wave {
  width: 4px;
  height: 16px;
  border-radius: 8px;
  background: currentColor;
  box-shadow:
    -8px 4px 0 -1px currentColor,
    8px 4px 0 -1px currentColor;
}

.question-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.question-chips button {
  border: 1px solid rgba(47, 42, 68, 0.14);
  border-radius: 8px;
  background: #fff7d8;
  color: #252237;
  cursor: pointer;
  font-size: 11px;
  line-height: 1.2;
  padding: 6px 8px;
  box-shadow: 2px 2px 0 rgba(47, 42, 68, 0.08);
}

.question-chips button:nth-child(2n) {
  background: #ddfaf5;
}

.question-chips button:nth-child(3n) {
  background: #ece8ff;
}

:deep(.question-input.van-field) {
  background: #ffffff;
  box-shadow: inset 0 0 0 1px rgba(47, 42, 68, 0.1);
}

.player-mobile-page {
  height: 100dvh;
  min-height: 0;
  overflow: hidden;
  padding: 0 12px 10px;
}

.flow-header {
  height: 42px;
  margin: 0 auto 8px;
  padding: 0 10px;
}

.flow-step {
  gap: 6px;
}

.flow-step.active {
  padding: 4px 6px;
}

.flow-dot {
  width: 21px;
  height: 21px;
  font-size: 11px;
}

.flow-step::after {
  top: 15px;
}

.flow-title {
  font-size: 11px;
}

.flow-time {
  font-size: 9px;
}

.game-shell {
  height: calc(100dvh - 60px);
  grid-template-columns: minmax(620px, 1fr) 300px;
  gap: 10px;
  align-items: stretch;
}

.right-column {
  min-height: 0;
  gap: 10px;
  overflow: hidden;
}

.panel {
  padding: 10px 11px;
}

.panel h2 {
  margin-bottom: 8px;
}

.info-panel {
  min-height: 118px;
  flex: none;
}

.info-row {
  grid-template-columns: 48px 1fr;
  gap: 6px;
  margin: 6px 0;
  font-size: 11px;
}

.card-person {
  font-size: 11px;
}

.memory-card p {
  margin: 5px 0 2px;
  font-size: 11px;
}

.memory-card small {
  font-size: 10px;
}

.memory-image {
  right: -12px;
  bottom: -18px;
  width: 86px;
  height: 60px;
}

.center-stage {
  display: flex;
  min-height: 0;
  flex-direction: column;
  padding: 12px;
}

.stage-head {
  flex: none;
  margin-bottom: 8px;
}

.avatar.large {
  width: 34px;
  height: 34px;
  font-size: 20px;
}

.stage-title {
  font-size: 15px;
}

.stage-subtitle {
  font-size: 11px;
  margin-top: 2px;
}

.timer-pill {
  min-width: 78px;
  padding: 6px 8px;
}

.timer-pill strong {
  font-size: 20px;
}

.puzzle-table {
  width: min(100%, calc(100dvh - 145px), 560px);
  padding: 8px;
}

.puzzle-board {
  padding: 5px;
}

.right-column .player-status-panel {
  flex: none;
  gap: 8px;
}

.current-player-card {
  padding: 9px;
}

.current-player-card strong {
  font-size: 14px;
}

.current-player-card p {
  font-size: 11px;
  margin-top: 2px;
}

.progress-grid {
  gap: 6px;
}

.progress-grid div {
  padding: 7px 6px;
}

.progress-grid span {
  font-size: 10px;
}

.progress-grid strong {
  font-size: 15px;
  margin-top: 2px;
}

.story-panel {
  min-height: 0;
  gap: 7px;
  overflow: hidden;
}

.story-voice-row,
.style-options,
.story-actions {
  flex: none;
}

:deep(.story-input.van-field) {
  flex: none;
}

:deep(.story-input .van-field__control) {
  min-height: 44px;
}

.question-panel {
  gap: 6px;
  min-height: 0;
}

.question-head {
  padding: 7px 8px;
}

.question-card {
  gap: 6px;
  padding: 7px;
}

.question-chips {
  gap: 5px;
}

.question-chips button,
.question-voice-btn {
  font-size: 10px;
}

.question-chips button {
  padding: 5px 7px;
}

:deep(.question-input .van-field__control) {
  min-height: 34px;
}

.style-options {
  gap: 6px;
}

.style-option {
  padding: 7px;
}

.style-option strong {
  font-size: 12px;
}

.style-option span {
  font-size: 10px;
}

.voice-status {
  padding: 6px 8px;
  font-size: 12px;
}

@media (max-height: 720px) {
  .flow-header {
    height: 38px;
    margin-bottom: 6px;
  }

  .game-shell {
    height: calc(100dvh - 52px);
  }

  .puzzle-table {
    width: min(100%, calc(100dvh - 130px), 500px);
  }

  .memory-card p {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.right-column {
  gap: 8px;
}

.right-column .panel {
  padding: 8px 9px;
}

.right-column .panel-title-row h2 {
  font-size: 14px;
}

.right-column .panel-title-row span {
  font-size: 10px;
}

.right-column .player-status-panel {
  gap: 6px;
}

.right-column .current-player-card {
  padding: 7px 8px;
}

.right-column .current-player-card .avatar.large {
  width: 28px;
  height: 28px;
  font-size: 17px;
}

.right-column .current-player-card p {
  display: none;
}

.right-column .progress-grid div {
  padding: 6px 4px;
}

.right-column .progress-grid strong {
  font-size: 14px;
}

.right-column .story-panel {
  gap: 6px;
}

.right-column :deep(.van-button) {
  height: 34px;
}

.right-column :deep(.story-input .van-field__control) {
  min-height: 36px;
}

.right-column .question-panel {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
}

.right-column .question-head {
  grid-column: 1 / -1;
  padding: 6px 8px;
}

.right-column .question-card {
  gap: 5px;
  padding: 6px;
  min-width: 0;
}

.right-column .question-title {
  align-items: flex-start;
}

.right-column .question-title strong {
  font-size: 12px;
}

.right-column .question-title span {
  display: none;
}

.right-column .question-voice-btn {
  font-size: 10px;
  height: 28px;
  width: 28px;
}

.right-column .question-chips {
  gap: 4px;
}

.right-column .question-chips button {
  font-size: 10px;
  padding: 4px 6px;
}

.right-column :deep(.question-input .van-field__control) {
  min-height: 32px;
}

.right-column .style-option {
  padding: 6px;
}

.right-column .style-option strong {
  font-size: 11px;
}

.right-column .style-option span {
  font-size: 9px;
}

.player-mobile-page {
  padding: 0 14px 12px;
}

.game-shell {
  width: min(100%, 1240px);
  height: calc(100dvh - 58px);
  grid-template-columns: minmax(0, 1fr) clamp(286px, 25vw, 330px);
  gap: 12px;
}

.center-stage {
  align-items: center;
  justify-content: flex-start;
  min-width: 0;
  overflow: hidden;
}

.stage-head {
  width: min(100%, 620px);
}

.puzzle-table {
  width: min(100%, calc(100dvh - 142px), 590px);
}

.right-column {
  min-width: 0;
  overflow: hidden;
}

.right-column .story-panel {
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-right: 8px;
  scrollbar-width: thin;
}

.right-column .player-status-panel {
  flex: none;
}

.right-column .question-panel {
  grid-template-columns: 1fr;
}

.right-column .question-head,
.right-column .question-card {
  box-shadow: none;
}

.right-column .question-title span {
  display: block;
}

.right-column .style-options {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

@media (min-width: 1180px) and (min-height: 760px) {
  .right-column .question-panel {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .right-column .question-head {
    grid-column: 1 / -1;
  }
}

@media (max-width: 980px) {
  .player-mobile-page {
    height: auto;
    min-height: 100dvh;
    overflow: auto;
  }

  .game-shell {
    height: auto;
    grid-template-columns: 1fr;
  }

  .right-column .story-panel {
    overflow: visible;
  }
}

.voice-icon-btn {
  position: relative;
  isolation: isolate;
  border: 1px solid rgba(47, 42, 68, 0.1);
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.88), rgba(255, 255, 255, 0.34)),
    linear-gradient(135deg, #ddfaf5, #fff7d8);
  color: #244c59;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.86),
    0 7px 14px rgba(47, 42, 68, 0.1);
  transition:
    transform 160ms ease,
    box-shadow 160ms ease,
    background 160ms ease,
    color 160ms ease;
}

.voice-icon-btn::before {
  content: '';
  position: absolute;
  inset: 3px;
  z-index: -1;
  border-radius: 6px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0));
}

.voice-icon-btn:active {
  transform: translateY(1px) scale(0.98);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.72),
    0 3px 8px rgba(47, 42, 68, 0.12);
}

.voice-icon-btn.recording {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.82), rgba(255, 255, 255, 0.18)),
    linear-gradient(135deg, #ffd45b, #ff9f7b);
  color: #5a2b22;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.78),
    0 8px 18px rgba(255, 159, 123, 0.22);
}

.voice-icon-btn:disabled:not(.recording) {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.2)),
    linear-gradient(135deg, #ece8ff, #ddfaf5);
  color: #4d6884;
}

.story-voice-btn {
  height: 42px;
  width: 42px;
}

.right-column .question-voice-btn {
  height: 30px;
  width: 30px;
}

.voice-icon-symbol {
  z-index: 1;
}

.voice-icon-symbol--mic {
  width: 11px;
  height: 16px;
  border: 1.6px solid currentColor;
  border-radius: 7px;
  background:
    linear-gradient(currentColor, currentColor) 50% 4px / 4px 1.4px no-repeat,
    linear-gradient(currentColor, currentColor) 50% 8px / 4px 1.4px no-repeat;
}

.voice-icon-symbol--mic::before {
  bottom: -7px;
  width: 18px;
  height: 11px;
  border-width: 1.6px;
  border-bottom-left-radius: 9px;
  border-bottom-right-radius: 9px;
}

.voice-icon-symbol--mic::after {
  bottom: -12px;
  width: 14px;
  height: 8px;
  border-radius: 0;
  background:
    linear-gradient(currentColor, currentColor) 50% 0 / 1.6px 7px no-repeat,
    linear-gradient(currentColor, currentColor) 50% 7px / 10px 1.6px no-repeat;
}

.voice-icon-symbol--stop {
  width: 13px;
  height: 13px;
  border-radius: 4px;
  background: currentColor;
  box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.18);
}

.voice-icon-symbol--wave {
  width: 18px;
  height: 18px;
  border-radius: 0;
  background:
    linear-gradient(currentColor, currentColor) 2px 7px / 3px 8px no-repeat,
    linear-gradient(currentColor, currentColor) 8px 3px / 3px 13px no-repeat,
    linear-gradient(currentColor, currentColor) 14px 6px / 3px 10px no-repeat;
  box-shadow: none;
}

.timer-pill.warning {
  background: linear-gradient(135deg, #ff7b7b, #ffd45b);
  color: #252237;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.58),
    0 10px 24px rgba(255, 123, 123, 0.22);
}

.time-up-dialog {
  box-shadow:
    10px 10px 0 rgba(255, 123, 123, 0.16),
    0 18px 32px rgba(47, 42, 68, 0.18);
}

/* Focused guided layout: keep the soft style, make the puzzle and turn task clearer. */
.flow-header {
  height: 34px;
  width: min(590px, 88vw);
  margin-bottom: 10px;
  border-width: 1px;
  box-shadow: 0 8px 22px rgba(47, 42, 68, 0.06);
  opacity: 0.86;
}

.flow-step {
  gap: 5px;
}

.flow-step.active {
  padding: 3px 6px;
  box-shadow: none;
}

.flow-dot {
  width: 18px;
  height: 18px;
  font-size: 10px;
}

.flow-title {
  font-size: 10px;
}

.flow-time {
  display: none;
}

.game-shell {
  width: min(100%, 1240px);
  height: calc(100dvh - 56px);
  grid-template-columns: minmax(0, 1fr) clamp(318px, 27vw, 360px);
  gap: 14px;
}

.center-stage {
  padding: 14px;
  align-items: center;
  justify-content: flex-start;
  background: rgba(255, 255, 255, 0.82);
}

.turn-status-bar {
  width: min(100%, 720px);
  min-height: 66px;
  margin-bottom: 12px;
  padding: 10px 12px;
  border: 2px solid rgba(47, 42, 68, 0.1);
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.94), rgba(221, 250, 245, 0.82)),
    linear-gradient(135deg, rgba(255, 212, 91, 0.2), rgba(108, 99, 255, 0.08));
  box-shadow:
    6px 6px 0 rgba(79, 209, 197, 0.1),
    0 14px 26px rgba(47, 42, 68, 0.08);
}

.turn-player {
  flex: 1;
}

.turn-action-hint {
  min-width: 150px;
  border-radius: 8px;
  background: #fff7d8;
  border: 1px solid rgba(47, 42, 68, 0.1);
  color: #252237;
  padding: 8px 10px;
}

.turn-action-hint span,
.turn-action-hint strong {
  display: block;
}

.turn-action-hint span {
  color: #66607a;
  font-size: 10px;
}

.turn-action-hint strong {
  margin-top: 2px;
  font-size: 14px;
}

.timer-pill {
  min-width: 92px;
}

.puzzle-table {
  width: min(100%, calc(100dvh - 154px), 620px);
  padding: 10px;
  border-width: 1px;
  background:
    linear-gradient(135deg, rgba(221, 250, 245, 0.86), rgba(236, 232, 255, 0.72)),
    #ffffff;
  box-shadow:
    0 18px 38px rgba(47, 42, 68, 0.12),
    0 0 0 8px rgba(255, 255, 255, 0.34);
}

.puzzle-board {
  padding: 6px;
  background: rgba(255, 255, 255, 0.7);
  box-shadow: inset 0 0 0 1px rgba(47, 42, 68, 0.08);
}

.puzzle-grid {
  gap: 2px;
}

.puzzle-cell {
  border-radius: 7px;
  box-shadow:
    inset 0 0 0 1px rgba(47, 42, 68, 0.12),
    0 3px 8px rgba(47, 42, 68, 0.1);
}

.puzzle-cell.selected {
  outline-color: #6c63ff;
  transform: scale(1.018);
  box-shadow:
    0 0 0 6px rgba(255, 212, 91, 0.44),
    0 14px 26px rgba(47, 42, 68, 0.16);
}

.right-column {
  gap: 10px;
  overflow: hidden;
}

.right-column .player-status-panel {
  padding: 10px;
  gap: 7px;
}

.right-column .current-player-card {
  min-height: 42px;
  padding: 7px 8px;
}

.right-column .current-player-card p {
  display: block;
  font-size: 10px;
  line-height: 1.25;
}

.right-column .progress-grid div {
  padding: 6px 4px;
}

.right-column .story-panel {
  flex: 1;
  padding: 10px;
  gap: 8px;
  overflow-y: auto;
}

.guide-flow {
  display: grid;
  gap: 8px;
}

.guide-step {
  border: 2px solid rgba(47, 42, 68, 0.1);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.76);
  box-shadow: 3px 3px 0 rgba(79, 209, 197, 0.08);
  overflow: hidden;
}

.guide-step.active {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(246, 251, 249, 0.88));
  border-color: rgba(108, 99, 255, 0.18);
  box-shadow:
    5px 5px 0 rgba(108, 99, 255, 0.12),
    0 10px 20px rgba(47, 42, 68, 0.08);
}

.guide-step.done:not(.active) {
  background: rgba(221, 250, 245, 0.72);
}

.guide-step-head {
  display: flex;
  align-items: center;
  gap: 9px;
  min-height: 48px;
  padding: 8px 9px;
}

.guide-step-no {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  background: #ddfaf5;
  color: #244c59;
  display: grid;
  place-items: center;
  font-size: 13px;
  font-weight: 800;
  box-shadow: inset 0 0 0 1px rgba(47, 42, 68, 0.1);
  flex: none;
}

.guide-step.active .guide-step-no {
  background: linear-gradient(135deg, #ffd45b, #ffb3a7);
  color: #252237;
}

.guide-step.done:not(.active) .guide-step-no {
  background: #4fd1c5;
}

.guide-step-head strong,
.guide-step-head small {
  display: block;
}

.guide-step-head strong {
  color: #252237;
  font-size: 13px;
}

.guide-step-head small {
  color: #66607a;
  font-size: 11px;
  line-height: 1.35;
}

.guide-step-body {
  display: grid;
  gap: 8px;
  padding: 0 9px 9px;
}

.guide-step-body.question-panel {
  grid-template-columns: 1fr;
}

.question-card {
  padding: 8px;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: none;
}

.question-title span {
  display: block;
}

.style-options {
  grid-template-columns: 1fr;
  gap: 7px;
}

.style-option {
  min-height: 52px;
  padding: 9px 10px;
  border-width: 2px;
  display: grid;
  align-content: center;
}

.style-option.active {
  background:
    linear-gradient(135deg, rgba(255, 212, 91, 0.84), rgba(183, 243, 234, 0.9));
  box-shadow:
    5px 5px 0 rgba(108, 99, 255, 0.14),
    inset 0 0 0 1px rgba(255, 255, 255, 0.4);
}

.story-actions {
  margin-top: 2px;
}

.right-column :deep(.van-button) {
  height: 40px;
}

.generate-guidance {
  border-radius: 8px;
  background: rgba(236, 232, 255, 0.68);
  color: #66607a;
  font-size: 11px;
  line-height: 1.45;
  padding: 8px 9px;
}

.voice-status {
  margin-top: 2px;
}

@media (min-width: 1180px) and (min-height: 760px) {
  .right-column .question-panel,
  .guide-step-body.question-panel {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 980px) {
  .turn-status-bar {
    width: 100%;
    flex-wrap: wrap;
  }

  .puzzle-table {
    width: min(100%, 620px);
  }
}

/* Reference-inspired soft glass refinement. */
.player-mobile-page {
  background:
    radial-gradient(circle at 26% 12%, rgba(170, 234, 228, 0.26), transparent 26%),
    radial-gradient(circle at 78% 18%, rgba(255, 207, 154, 0.24), transparent 24%),
    radial-gradient(circle at 46% 88%, rgba(203, 198, 255, 0.22), transparent 30%),
    linear-gradient(120deg, #f8f7ff 0%, #eefaf8 45%, #fff6ec 100%);
}

.flow-header {
  height: 40px;
  width: min(660px, 88vw);
  border: 0;
  background: rgba(255, 255, 255, 0.72);
  box-shadow:
    0 12px 28px rgba(78, 92, 126, 0.11),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(18px);
}

.flow-step.active {
  background: linear-gradient(135deg, #ffd86b, #ffb1a4);
  box-shadow: 0 8px 18px rgba(255, 151, 125, 0.22);
}

.flow-dot {
  background: #55d2cb;
  color: #153236;
}

.flow-step.active .flow-dot {
  background: #ff7f75;
}

.game-shell {
  grid-template-columns: minmax(0, 1fr) clamp(350px, 31vw, 390px);
  gap: 16px;
}

.center-stage,
.right-column .panel {
  border: 1px solid rgba(173, 182, 213, 0.34);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.82), rgba(255, 255, 255, 0.62));
  box-shadow:
    0 22px 54px rgba(80, 90, 126, 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
}

.turn-status-bar {
  width: min(100%, 760px);
  min-height: 72px;
  border: 0;
  background: transparent;
  box-shadow: none;
  padding: 2px 4px 8px;
}

.turn-player .avatar.large,
.current-player-card .avatar.large {
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, #51d9d0, #70e5d9);
  box-shadow: 0 8px 20px rgba(80, 210, 202, 0.26);
}

.stage-title {
  font-size: 18px;
  letter-spacing: 0;
}

.stage-subtitle {
  color: #61627c;
  font-size: 12px;
}

.turn-action-hint {
  background: rgba(255, 255, 255, 0.7);
  border: 0;
  box-shadow: inset 0 0 0 1px rgba(173, 182, 213, 0.24);
}

.timer-pill {
  min-width: 104px;
  background: linear-gradient(135deg, #6f66ff, #48cdd4);
  border-radius: 8px;
  box-shadow: 0 12px 24px rgba(79, 119, 214, 0.22);
}

.timer-pill strong {
  font-size: 25px;
}

.puzzle-table {
  width: min(100%, calc(100dvh - 146px), 690px);
  padding: 12px;
  border: 1px solid rgba(155, 214, 215, 0.42);
  background:
    linear-gradient(135deg, rgba(236, 232, 255, 0.62), rgba(221, 250, 245, 0.7)),
    rgba(255, 255, 255, 0.68);
  box-shadow:
    0 26px 58px rgba(80, 90, 126, 0.16),
    18px 18px 0 rgba(82, 211, 204, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.96);
}

.puzzle-board {
  border-radius: 8px;
  background: rgba(243, 252, 252, 0.72);
  box-shadow:
    inset 0 0 0 1px rgba(113, 184, 188, 0.18),
    0 10px 28px rgba(80, 90, 126, 0.08);
}

.puzzle-cell {
  border-radius: 6px;
  box-shadow:
    inset 0 0 0 1px rgba(84, 116, 130, 0.12),
    0 2px 8px rgba(80, 90, 126, 0.08);
}

.puzzle-cell::before,
.puzzle-cell::after {
  opacity: 0.72;
}

.right-column .player-status-panel {
  min-height: 86px;
  display: grid;
  grid-template-columns: 1fr;
}

.right-column .player-status-panel .panel-title-row,
.right-column .progress-grid {
  display: none;
}

.right-column .current-player-card {
  border: 0;
  background: transparent;
  box-shadow: none;
  padding: 4px 2px;
}

.current-player-card strong {
  font-size: 17px;
}

.player-energy {
  margin-left: auto;
  align-self: flex-start;
  border-radius: 999px;
  background: rgba(236, 232, 255, 0.78);
  color: #687084;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 9px;
}

.story-panel > .panel-title-row {
  display: none;
}

.guide-flow {
  gap: 10px;
}

.guide-step {
  border: 0;
  background: rgba(255, 255, 255, 0.72);
  box-shadow:
    0 10px 28px rgba(86, 94, 128, 0.1),
    inset 0 0 0 1px rgba(181, 187, 211, 0.22);
}

.guide-step.active {
  background: rgba(255, 255, 255, 0.88);
  box-shadow:
    0 16px 34px rgba(86, 94, 128, 0.15),
    inset 0 0 0 1px rgba(181, 187, 211, 0.24);
}

.guide-step-head {
  min-height: 56px;
  padding: 12px 13px;
}

.guide-step-no {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: transparent;
  box-shadow: none;
  color: #737895;
  font-size: 18px;
}

.guide-step-head strong {
  font-size: 16px;
}

.guide-chevron {
  margin-left: auto;
  color: #9aa0c0;
  font-size: 26px;
  line-height: 1;
}

.guide-step-body {
  padding: 0 12px 12px;
}

.story-voice-row {
  min-height: 54px;
  border-radius: 8px;
  padding: 8px 10px;
  background: linear-gradient(135deg, #7066ff, #54d0d6);
  box-shadow: 0 12px 22px rgba(91, 105, 216, 0.18);
}

.story-voice-row span {
  color: #ffffff;
  font-size: 15px;
}

.text-entry-chip {
  margin-left: auto;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.3);
  color: #283157;
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
  padding: 8px 18px;
}

.story-voice-row .voice-icon-btn {
  background: transparent;
  color: #ffffff;
  border: 0;
  box-shadow: none;
}

:deep(.story-input.van-field),
:deep(.question-input.van-field) {
  background: rgba(255, 255, 255, 0.78);
  box-shadow: inset 0 0 0 1px rgba(181, 187, 211, 0.2);
}

.question-card {
  border: 0;
  background: transparent;
  padding: 0;
}

.question-title {
  padding: 0 2px;
}

.narrator-response-card {
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(236, 232, 255, 0.72), rgba(221, 250, 245, 0.7));
  box-shadow: inset 0 0 0 1px rgba(181, 187, 211, 0.22);
  padding: 10px;
}

.narrator-response-card strong,
.narrator-response-card span {
  display: block;
}

.narrator-response-card strong {
  color: #252237;
  font-size: 13px;
}

.narrator-response-card span {
  color: #66607a;
  font-size: 11px;
  line-height: 1.35;
  margin-top: 2px;
}

.narrator-voice-btn {
  margin-left: auto;
  height: 34px;
  width: 34px;
}

.narrator-input {
  margin-top: -2px;
}

.question-chips button {
  border: 1px solid rgba(181, 187, 211, 0.28);
  box-shadow: none;
}

.style-options {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.style-option {
  min-height: 116px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(181, 187, 211, 0.28);
  box-shadow: 0 8px 18px rgba(86, 94, 128, 0.08);
  text-align: center;
}

.style-preview {
  display: block;
  width: 100%;
  aspect-ratio: 1.55 / 1;
  border-radius: 7px;
  margin-bottom: 7px;
  background:
    radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.8) 0 8%, transparent 9%),
    radial-gradient(circle at 74% 34%, rgba(255, 205, 137, 0.9) 0 18%, transparent 19%),
    linear-gradient(145deg, #91ded4, #f7e6b2 58%, #d2c7ff);
}

.style-option:nth-child(2) .style-preview {
  background:
    radial-gradient(circle at 36% 34%, #ffbe8f 0 18%, transparent 19%),
    linear-gradient(145deg, #c9b6ff, #f1b7d8 52%, #95dbef);
}

.style-option:nth-child(3) .style-preview {
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.34) 0 20%, transparent 21%),
    linear-gradient(145deg, #52d2c7 0 28%, #fff0b7 29% 55%, #ffb5a8 56% 74%, #8fd3ff 75%);
}

.style-option.active {
  border-color: rgba(91, 105, 216, 0.3);
}

.guide-complete-count {
  color: #687084;
  font-size: 13px;
  padding-left: 6px;
}

.story-actions :deep(.van-button--primary) {
  height: 48px;
  font-size: 17px;
  background: linear-gradient(135deg, #7066ff, #54d0d6);
  box-shadow: 0 14px 26px rgba(91, 105, 216, 0.22);
}

/* Puzzle app showcase refresh for the playable game screen. */
.player-mobile-page {
  background:
    radial-gradient(circle at 8% 86%, rgba(255, 213, 79, 0.28), transparent 15%),
    radial-gradient(circle at 90% 12%, rgba(52, 197, 156, 0.18), transparent 18%),
    linear-gradient(180deg, #f4f4f1 0%, #ededeb 100%);
  color: #111111;
}

.player-mobile-page::before,
.player-mobile-page::after {
  content: '';
  position: fixed;
  z-index: 0;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  pointer-events: none;
  transform: rotate(-12deg);
  box-shadow:
    54px 22px 0 #3db4ff,
    108px -10px 0 #ffd54f,
    162px 30px 0 #34c59c;
}

.player-mobile-page::before {
  left: 44px;
  top: 86px;
  background: #ff6b57;
}

.player-mobile-page::after {
  right: 208px;
  bottom: 82px;
  background: #ffd54f;
  transform: rotate(14deg);
}

.flow-header,
.game-shell,
.center-stage,
.right-column,
.panel,
.puzzle-table,
.puzzle-board,
.guide-step,
.current-player-card,
.style-option,
:deep(.story-input.van-field),
:deep(.question-input.van-field) {
  border-color: #e4e4dd;
  background: #ffffff;
  box-shadow: 0 18px 44px rgba(23, 25, 30, 0.08);
  backdrop-filter: none;
}

.flow-header,
.game-shell {
  position: relative;
  z-index: 1;
}

.flow-step {
  color: #6f6f68;
}

.flow-step.active {
  background: #ffd54f;
  color: #111111;
}

.flow-dot {
  color: #111111;
  background: #f4f4f1;
}

.flow-step.active .flow-dot {
  background: #111111;
  color: #ffffff;
}

.flow-title,
.stage-title,
.panel-title-row h2,
.current-player-card strong,
.guide-step-head strong,
.question-title strong,
.style-option strong,
.timer-pill strong,
.progress-grid strong {
  color: #111111;
}

.flow-time,
.stage-subtitle,
.turn-action-hint span,
.turn-action-hint strong,
.panel-title-row span,
.current-player-card p,
.guide-step-head small,
.question-title span,
.style-option span,
.generate-guidance,
.voice-status,
.progress-grid span {
  color: #6f6f68;
}

.avatar.large,
.preview-panel__avatar {
  color: #111111;
  background: #75e3d5;
}

.timer-pill,
.player-energy,
.guide-step-no {
  color: #111111;
  background: #ffd54f;
  box-shadow: none;
}

.timer-pill.warning {
  background: #ff8f70;
  color: #111111;
}

.center-stage {
  position: relative;
  overflow: hidden;
}

.center-stage::after {
  content: '';
  position: absolute;
  right: -28px;
  bottom: -26px;
  width: 128px;
  height: 128px;
  border-radius: 28px;
  background:
    radial-gradient(circle at 50% 0, #ffffff 0 20px, transparent 21px),
    linear-gradient(135deg, #ffd54f, #ff8f70);
  transform: rotate(10deg);
  opacity: 0.95;
}

.puzzle-table {
  border-radius: 24px;
  background:
    radial-gradient(circle at 74% 22%, rgba(255, 255, 255, 0.78) 0 52px, transparent 53px),
    linear-gradient(145deg, #fff1b8 0%, #d9f3c4 48%, #c8f4f1 100%);
}

.puzzle-board {
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: inset 0 0 0 1px rgba(17, 17, 17, 0.06);
}

.puzzle-cell {
  border-radius: 12px;
  box-shadow:
    inset 0 0 0 1px rgba(17, 17, 17, 0.06),
    0 4px 10px rgba(23, 25, 30, 0.06);
}

.puzzle-cell::before,
.puzzle-cell::after {
  background: rgba(255, 255, 255, 0.5);
  opacity: 0.82;
}

.puzzle-cell.selected {
  outline: 3px solid #111111;
  box-shadow:
    0 0 0 6px rgba(255, 213, 79, 0.45),
    0 12px 22px rgba(23, 25, 30, 0.12);
}

.start-overlay {
  color: #111111;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid #e4e4dd;
}

.right-column {
  border-radius: 24px;
  background: #f8f8f4;
}

.panel {
  border-radius: 18px;
}

.guide-step {
  border-radius: 16px;
  background: #ffffff;
}

.guide-step.active {
  background: #ffffff;
  box-shadow:
    0 18px 40px rgba(23, 25, 30, 0.1),
    inset 0 0 0 1px #e4e4dd;
}

.guide-step.done:not(.active) .guide-step-no {
  background: #75e3d5;
}

.story-voice-row,
.story-actions :deep(.van-button--primary) {
  color: #111111;
  background: #ffd54f;
  box-shadow: 0 12px 22px rgba(255, 213, 79, 0.28);
}

.story-voice-row span {
  color: #111111;
}

.text-entry-chip {
  color: #111111;
  background: rgba(255, 255, 255, 0.72);
}

.question-chips button,
.keyword-row span {
  color: #111111;
  background: #f7f7f2;
  border-color: #dfdfd7;
  box-shadow: none;
}

.question-chips button:nth-child(2n) {
  background: #e8f7f3;
}

.question-chips button:nth-child(3n) {
  background: #fff2b8;
}

.narrator-response-card {
  background: #f7f7f2;
  box-shadow: inset 0 0 0 1px #e4e4dd;
}

.style-option {
  min-height: 124px;
  position: relative;
  overflow: hidden;
  border-radius: 14px;
  background: #ffffff;
  padding: 8px 10px 18px;
}

.style-option::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 52px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.92) 44%, #ffffff 100%);
  pointer-events: none;
}

.style-option.active {
  border-color: #111111;
  box-shadow:
    0 0 0 4px rgba(255, 213, 79, 0.34),
    0 12px 22px rgba(23, 25, 30, 0.08);
}

.style-option strong,
.style-option span {
  display: block;
  position: relative;
  z-index: 2;
}

.style-option strong {
  font-size: 14px;
  line-height: 1.28;
  margin-bottom: 3px;
}

.style-option span {
  padding: 0 4px;
  font-size: 11px;
  line-height: 1.3;
  color: #616884;
}

.style-preview {
  margin-bottom: 10px;
}

.style-preview {
  border-radius: 10px;
}

.guide-complete-count {
  color: #6f6f68;
}

.complete-dialog,
.result-dialog {
  background: #ffffff;
  border: 1px solid #e4e4dd;
  box-shadow: 0 24px 60px rgba(23, 25, 30, 0.18);
}

.celebration-burst span {
  background: #ffd54f;
}

.celebration-burst span:nth-child(2n) {
  background: #75e3d5;
}

.celebration-burst span:nth-child(5n) {
  background: #ff6b57;
}

/* More natural story input panel: write first, then choose action. */
.guide-step:first-child .guide-step-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.guide-step:first-child :deep(.story-input.van-field) {
  min-height: 132px;
  border-radius: 16px;
  background: #fbfbf8;
  box-shadow: inset 0 0 0 1px #e4e4dd;
}

.guide-step:first-child :deep(.story-input .van-field__control) {
  min-height: 92px;
  color: #111111;
  font-size: 16px;
  line-height: 1.65;
}

.guide-step:first-child :deep(.story-input .van-field__control::placeholder) {
  color: #a0a099;
}

.guide-step:first-child .story-voice-row {
  display: grid;
  grid-template-columns: 44px 1fr auto;
  align-items: center;
  gap: 12px;
  min-height: 58px;
  border-radius: 16px;
  padding: 8px;
  background: #ffd54f;
}

.guide-step:first-child .story-voice-btn {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: #ffffff;
}

.guide-step:first-child .story-voice-row > span {
  justify-self: start;
  color: #111111;
  font-size: 17px;
  font-weight: 800;
}

.guide-step:first-child .text-entry-chip {
  min-width: 104px;
  height: 42px;
  margin-left: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  color: #111111;
  font-size: 14px;
  font-weight: 800;
}

/* Product hierarchy pass: anticipatory puzzle preview and clearer active task. */
.turn-status-bar {
  grid-template-columns: 1fr auto;
  min-height: 82px;
  padding: 14px 18px;
  border-radius: 22px;
  background: #ffffff;
  box-shadow: 0 14px 34px rgba(23, 25, 30, 0.08);
}

.turn-status-bar .turn-player {
  display: grid;
  grid-template-columns: 52px 1fr;
  gap: 14px;
}

.turn-action-hint {
  display: none;
}

.turn-status-bar .stage-title {
  font-size: 20px;
  letter-spacing: 0;
}

.turn-status-bar .stage-subtitle {
  margin-top: 5px;
  font-size: 14px;
}

.turn-status-bar .timer-pill {
  min-width: 112px;
  border-radius: 16px;
  padding: 10px 14px;
}

.puzzle-table {
  position: relative;
  isolation: isolate;
  padding: 18px;
  box-shadow:
    0 24px 54px rgba(23, 25, 30, 0.1),
    inset 0 0 0 1px rgba(255, 255, 255, 0.74);
}

.puzzle-table::before {
  content: '';
  position: absolute;
  inset: 16px;
  z-index: -1;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.36);
}

.puzzle-board {
  opacity: 1;
}

.puzzle-table:has(.start-overlay) .puzzle-grid {
  filter: saturate(0.86) contrast(0.96);
  opacity: 0.72;
}

.puzzle-table:has(.start-overlay) .puzzle-cell {
  background-blend-mode: normal;
}

.start-overlay {
  left: 50%;
  top: 50%;
  right: auto;
  bottom: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: min(320px, calc(100% - 54px));
  padding: 18px 20px;
  border-radius: 18px;
  text-align: center;
  transform: translate(-50%, -50%);
  box-shadow:
    0 18px 40px rgba(23, 25, 30, 0.14),
    inset 0 0 0 1px rgba(255, 255, 255, 0.74);
}

.start-overlay strong {
  color: #111111;
  font-size: 18px;
  line-height: 1.25;
}

.start-overlay span {
  color: #6f6f68;
  font-size: 13px;
  line-height: 1.5;
}

.guide-step-head {
  grid-template-columns: auto 1fr auto auto;
}

.guide-step-state {
  min-width: 58px;
  border-radius: 999px;
  padding: 5px 9px;
  color: #6f6f68;
  background: #f4f4f1;
  font-size: 11px;
  font-weight: 800;
  text-align: center;
  white-space: nowrap;
}

.guide-step--story.active {
  border-color: #111111;
  box-shadow:
    0 18px 40px rgba(23, 25, 30, 0.1),
    0 0 0 4px rgba(255, 213, 79, 0.34);
}

.guide-step--story.active .guide-step-no,
.guide-step--story.active .guide-step-state {
  background: #ffd54f;
  color: #111111;
}

.guide-step.done .guide-step-state {
  background: #75e3d5;
  color: #111111;
}

.guide-step.locked {
  opacity: 1;
  background: #fbfbf8;
}

.guide-step.locked .guide-step-head {
  opacity: 0.72;
}

.guide-step.locked .guide-step-no,
.guide-step.locked .guide-step-state {
  background: #eeeeea;
  color: #8f8f86;
}

.guide-step.locked .guide-chevron {
  color: #b8b8af;
}

.guide-step--detail:not(.active):not(.done):not(.locked) .guide-step-state,
.guide-step--generate:not(.active):not(.done):not(.locked) .guide-step-state {
  background: #fff2b8;
  color: #111111;
}

.guide-step--story .story-voice-row {
  grid-template-columns: 1fr auto;
  min-height: 60px;
  padding: 9px;
}

.guide-step--story .story-voice-btn {
  display: none;
}

.guide-step--story .story-voice-row > span {
  justify-self: center;
  font-size: 18px;
}

.guide-step--story .text-entry-chip {
  min-width: 98px;
  background: #ffffff;
}

.guide-step--story :deep(.story-input.van-field) {
  order: 2;
}

.guide-step--story .story-voice-row {
  order: 1;
}

.guide-step--story :deep(.story-input.van-field) {
  min-height: 104px;
}

.guide-step--story :deep(.story-input .van-field__control) {
  min-height: 66px;
}

/* Final hierarchy polish based on the product review notes. */
.flow-header {
  min-height: 36px;
  padding: 6px 10px;
  gap: 6px;
  box-shadow: 0 10px 24px rgba(23, 25, 30, 0.06);
}

.flow-step {
  min-height: 30px;
  padding: 5px 10px;
  opacity: 0.62;
}

.flow-step.active {
  opacity: 1;
}

.flow-step:not(.active) .flow-title,
.flow-step:not(.active) .flow-time {
  color: #aaa99f;
}

.flow-dot {
  width: 26px;
  height: 26px;
  font-size: 12px;
}

.flow-title {
  font-size: 13px;
}

.flow-time {
  font-size: 10px;
}

.turn-status-bar {
  grid-template-columns: 1fr auto;
  align-items: center;
}

.turn-status-bar .timer-pill {
  display: grid;
  gap: 3px;
  min-width: 136px;
  background: #ffffff;
  box-shadow: inset 0 0 0 1px #e4e4dd;
}

.turn-task-chip {
  display: inline-flex;
  justify-content: center;
  justify-self: start;
  border-radius: 999px;
  padding: 4px 8px;
  background: #fff2b8;
  color: #111111;
  font-size: 10px;
  font-style: normal;
  font-weight: 800;
  line-height: 1;
}

.puzzle-table {
  border: 1px solid #eee8d4;
  background:
    radial-gradient(circle at 74% 22%, rgba(255, 255, 255, 0.82) 0 52px, transparent 53px),
    linear-gradient(145deg, #fff9e6 0%, #eef6df 48%, #e7f5f1 100%);
  box-shadow:
    0 24px 54px rgba(23, 25, 30, 0.09),
    inset 0 0 0 6px rgba(255, 255, 255, 0.34),
    inset 0 0 0 1px rgba(238, 232, 212, 0.95);
}

.puzzle-table:has(.start-overlay) .puzzle-grid {
  filter: saturate(0.98) contrast(0.98) brightness(1.05);
  opacity: 0.82;
}

.start-overlay {
  gap: 9px;
  background: rgba(255, 255, 255, 0.9);
}

.start-overlay button {
  align-self: center;
  border: 0;
  border-radius: 999px;
  padding: 8px 14px;
  background: #fff2b8;
  color: #111111;
  cursor: pointer;
  font-size: 13px;
  font-weight: 800;
}

.guide-step.locked {
  background: #ffffff;
  box-shadow:
    0 10px 24px rgba(23, 25, 30, 0.05),
    inset 0 0 0 1px #ecece6;
}

.guide-step.locked .guide-step-head {
  opacity: 1;
}

.guide-step.locked .guide-step-head strong {
  color: #33332e;
}

.guide-step.locked .guide-step-head small {
  color: #aaa99f;
}

.guide-step.locked .guide-step-no {
  background: #f4f4f1;
  color: #8f8f86;
}

.guide-step--story .story-voice-row {
  grid-template-columns: 46px minmax(0, 1fr) auto;
  cursor: pointer;
}

.guide-step--story .story-voice-btn {
  display: inline-flex;
}

.guide-step--story .story-voice-row > span {
  justify-self: start;
}

.guide-step--story .text-entry-chip {
  min-width: auto;
  height: 38px;
  padding: 0 6px;
  background: transparent;
  color: #5f5f58;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.guide-step--story :deep(.story-input.van-field) {
  background:
    linear-gradient(#fbfbf8, #fbfbf8) padding-box,
    linear-gradient(135deg, rgba(255, 213, 79, 0.28), rgba(117, 227, 213, 0.22)) border-box;
  border: 1px solid transparent;
}

/* Multi-state guided panel: mirrors the Figma component state board in the live page. */
.task-state-card {
  display: grid;
  grid-template-columns: 42px 1fr auto;
  align-items: center;
  gap: 12px;
  border-radius: 18px;
  padding: 12px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(250, 250, 246, 0.9));
  box-shadow:
    0 12px 28px rgba(23, 25, 30, 0.08),
    inset 0 0 0 1px #ecece6;
}

.task-state-icon {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: 14px;
  background: #ffd54f;
  color: #111111;
  font-size: 21px;
}

.task-state-card strong {
  display: block;
  color: #111111;
  font-size: 15px;
  line-height: 1.25;
}

.task-state-card p {
  margin: 4px 0 0;
  color: #6f6f68;
  font-size: 12px;
  line-height: 1.45;
}

.task-state-count {
  display: inline-grid;
  min-width: 42px;
  height: 28px;
  place-items: center;
  border-radius: 999px;
  background: #111111;
  color: #ffffff;
  font-size: 12px;
  font-weight: 900;
}

.task-state-card--recording {
  background:
    linear-gradient(135deg, rgba(255, 213, 79, 0.22), rgba(255, 255, 255, 0.94));
}

.task-state-card--recording .task-state-icon {
  animation: recordingPulse 1.15s ease-in-out infinite;
}

.task-state-card--upcoming .task-state-icon {
  background: #f4f4f1;
  color: #8f8f86;
}

.task-state-card--ready .task-state-icon,
.task-state-card--puzzle .task-state-icon {
  background: #75e3d5;
}

.guide-step.recording {
  border-color: #ffd54f;
  box-shadow:
    0 18px 40px rgba(23, 25, 30, 0.1),
    0 0 0 4px rgba(255, 213, 79, 0.44);
}

.prompt-seed-list {
  display: grid;
  gap: 7px;
  order: 3;
}

.prompt-seed-list button {
  border: 0;
  border-radius: 999px;
  padding: 8px 12px;
  background: #ffffff;
  color: #33332e;
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.25;
  text-align: left;
  box-shadow: inset 0 0 0 1px #ecece6;
}

.prompt-seed-list button:active {
  transform: translateY(1px);
}

.story-recorded-card,
.detail-recorded-card,
.companion-state-card,
.puzzle-progress-card {
  border-radius: 16px;
  padding: 12px;
  background: #fbfbf8;
  box-shadow: inset 0 0 0 1px #ecece6;
}

.story-recorded-card {
  order: 4;
}

.story-confirm-btn {
  order: 5;
  min-height: 44px;
  border: 0;
  border-radius: 14px;
  background: #ffd54f;
  color: #111111;
  cursor: pointer;
  font-size: 15px;
  font-weight: 900;
  box-shadow: 0 10px 20px rgba(255, 213, 79, 0.28);
}

.story-confirm-btn:active {
  transform: translateY(1px);
}

.story-recorded-card span,
.detail-recorded-card span {
  display: inline-flex;
  margin-bottom: 6px;
  border-radius: 999px;
  padding: 4px 8px;
  background: #75e3d5;
  color: #111111;
  font-size: 11px;
  font-weight: 900;
}

.story-recorded-card p,
.detail-recorded-card p {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  color: #33332e;
  font-size: 13px;
  line-height: 1.5;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.detail-recorded-card {
  margin-top: 8px;
  background:
    linear-gradient(135deg, rgba(255, 242, 184, 0.42), rgba(255, 255, 255, 0.96));
}

.detail-recorded-card--visual span {
  background: #fff2b8;
}

.detail-recorded-card--emotion span {
  background: #dff8f4;
}

.detail-recorded-card--narrator {
  margin-top: 0;
}

.detail-recorded-card--narrator span {
  background: #ede8ff;
}

.companion-state-card {
  display: grid;
  gap: 4px;
  background:
    linear-gradient(135deg, rgba(255, 242, 184, 0.68), rgba(255, 255, 255, 0.92));
}

.companion-state-card strong,
.puzzle-progress-card strong {
  color: #111111;
  font-size: 14px;
  line-height: 1.35;
}

.companion-state-card span,
.puzzle-progress-card span,
.puzzle-progress-card p {
  margin: 0;
  color: #6f6f68;
  font-size: 12px;
  line-height: 1.45;
}

.companion-round-list {
  display: grid;
  gap: 8px;
}

.companion-round-item {
  display: grid;
  gap: 6px;
  border-radius: 14px;
  padding: 10px;
  background: #ffffff;
  box-shadow: inset 0 0 0 1px #ecece6;
}

.round-item-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.round-item-head strong {
  color: #111111;
  font-size: 13px;
}

.round-item-head button {
  border: 0;
  border-radius: 999px;
  padding: 4px 9px;
  background: #fff2b8;
  color: #111111;
  font-size: 11px;
  font-weight: 800;
}

.companion-round-item p {
  margin: 0;
  color: #6f6f68;
  font-size: 12px;
  line-height: 1.45;
}

.question-round-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.question-round-actions button {
  min-height: 42px;
  border: 0;
  border-radius: 14px;
  padding: 0 12px;
  font-size: 13px;
  font-weight: 900;
}

.round-action-secondary {
  background: #ffffff;
  color: #111111;
  box-shadow: inset 0 0 0 1px #e4e4dd;
}

.round-action-primary {
  background: #ffd54f;
  color: #111111;
  box-shadow: 0 10px 20px rgba(255, 213, 79, 0.28);
}

.question-round-actions button:disabled {
  cursor: not-allowed;
  opacity: 0.42;
  box-shadow: none;
}

.puzzle-progress-card {
  display: grid;
  gap: 10px;
  background:
    linear-gradient(135deg, rgba(117, 227, 213, 0.26), rgba(255, 255, 255, 0.94));
}

.puzzle-progress-meter {
  height: 9px;
  overflow: hidden;
  border-radius: 999px;
  background: #ecece6;
}

.puzzle-progress-meter i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #ffd54f, #75e3d5);
  transition: width 0.24s ease;
}

@keyframes recordingPulse {
  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(255, 213, 79, 0.5);
  }

  50% {
    transform: scale(1.06);
    box-shadow: 0 0 0 8px rgba(255, 213, 79, 0);
  }
}

/* Canvas alignment pass: keep the whole game composition centered in the viewport. */
.player-mobile-page {
  --page-max-width: 1180px;
  --page-gap: 18px;
  --side-panel-width: 360px;
  --quick-nav-width: 64px;
  --stage-bottom-safe-space: 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px clamp(18px, 4vw, 48px) max(34px, env(safe-area-inset-bottom));
}

.flow-header {
  width: min(var(--page-max-width), 100%);
  margin: 0 auto 10px;
}

.game-shell {
  overflow: visible;
  width: min(var(--page-max-width), 100%);
  max-width: var(--page-max-width);
  grid-template-columns: var(--quick-nav-width) minmax(0, 1fr) var(--side-panel-width);
  gap: var(--page-gap);
  margin: 0 auto;
  align-items: stretch;
  padding-bottom: var(--stage-bottom-safe-space);
}

.game-quick-nav {
  position: sticky;
  top: clamp(168px, 32vh, 280px);
  z-index: 20;
  align-self: start;
  display: grid;
  justify-items: center;
  gap: 12px;
  border: 1px solid rgba(228, 228, 221, 0.86);
  border-radius: 999px;
  padding: 12px 8px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.86), rgba(251, 251, 248, 0.68));
  box-shadow:
    0 24px 54px rgba(23, 25, 30, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.95),
    inset 0 -1px 0 rgba(17, 17, 17, 0.04);
  backdrop-filter: blur(22px) saturate(1.12);
}

.quick-nav-button {
  position: relative;
  z-index: 21;
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  border: 1px solid #e4e4dd;
  border-radius: 50%;
  padding: 0;
  background:
    radial-gradient(circle at 30% 22%, rgba(255, 255, 255, 0.98) 0 20%, transparent 21%),
    radial-gradient(circle at 72% 82%, rgba(255, 213, 79, 0.12), transparent 46%),
    #ffffff;
  color: #111111;
  cursor: pointer;
  text-align: center;
  box-shadow:
    0 9px 18px rgba(23, 25, 30, 0.09),
    inset 0 1px 0 rgba(255, 255, 255, 0.95),
    inset 0 -1px 0 rgba(17, 17, 17, 0.05);
  transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease, border-color 0.18s ease;
}

.quick-nav-button:hover {
  z-index: 30;
  transform: translateX(4px) translateY(-1px) scale(1.06);
  border-color: #ffd54f;
  background:
    radial-gradient(circle at 30% 22%, rgba(255, 255, 255, 0.9) 0 20%, transparent 21%),
    radial-gradient(circle at 72% 82%, rgba(255, 255, 255, 0.34), transparent 46%),
    #ffd54f;
  box-shadow:
    0 18px 34px rgba(255, 213, 79, 0.28),
    0 12px 26px rgba(23, 25, 30, 0.13),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.quick-nav-button:nth-child(1):hover {
  border-color: #ffd54f;
  background:
    radial-gradient(circle at 30% 22%, rgba(255, 255, 255, 0.9) 0 20%, transparent 21%),
    #ffd54f;
}

.quick-nav-button:nth-child(2):hover {
  border-color: #7cc8f8;
  background: #7cc8f8;
  box-shadow:
    0 18px 34px rgba(124, 200, 248, 0.28),
    0 12px 26px rgba(23, 25, 30, 0.13),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.quick-nav-button:nth-child(3):hover {
  border-color: #ff8a76;
  background: #ff8a76;
  box-shadow:
    0 18px 34px rgba(255, 138, 118, 0.26),
    0 12px 26px rgba(23, 25, 30, 0.13),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.quick-nav-button:nth-child(4):hover {
  border-color: #75e3d5;
  background: #75e3d5;
  box-shadow:
    0 18px 34px rgba(117, 227, 213, 0.28),
    0 12px 26px rgba(23, 25, 30, 0.13),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.quick-nav-icon {
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border-radius: 50%;
  background:
    linear-gradient(180deg, #ffffff, #f7f7f2);
  color: #111111;
  font-size: 18px;
  font-weight: 900;
  box-shadow:
    inset 0 0 0 1px rgba(228, 228, 221, 0.7),
    0 3px 8px rgba(23, 25, 30, 0.05);
}

.quick-nav-button:nth-child(1) .quick-nav-icon {
  background: linear-gradient(180deg, #ffffff, #fff2b8);
}

.quick-nav-button:nth-child(2) .quick-nav-icon {
  background: linear-gradient(180deg, #ffffff, #e8f5ff);
}

.quick-nav-button:nth-child(3) .quick-nav-icon {
  background: linear-gradient(180deg, #ffffff, #ffe7e1);
}

.quick-nav-button:nth-child(4) .quick-nav-icon {
  background: linear-gradient(180deg, #ffffff, #e8f7f3);
}

.quick-nav-tooltip {
  position: absolute;
  left: calc(100% + 12px);
  top: 50%;
  z-index: 999;
  display: grid;
  gap: 3px;
  min-width: 128px;
  border: 1px solid #e4e4dd;
  border-radius: 16px;
  padding: 9px 12px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 16px 32px rgba(23, 25, 30, 0.12);
  opacity: 0;
  pointer-events: none;
  text-align: left;
  transform: translate(-8px, -50%);
  transition: opacity 0.16s ease, transform 0.16s ease;
}

.quick-nav-button:hover .quick-nav-tooltip,
.quick-nav-button:focus-visible .quick-nav-tooltip {
  opacity: 1;
  transform: translate(0, -50%);
}

.quick-nav-tooltip strong {
  color: #111111;
  font-size: 13px;
  line-height: 1.2;
  white-space: nowrap;
}

.quick-nav-tooltip small {
  color: #6f6f68;
  font-size: 10px;
  font-weight: 800;
  line-height: 1.2;
  white-space: nowrap;
}

.center-stage {
  position: relative;
  z-index: 1;
  min-width: 0;
  height: 100%;
  margin-bottom: var(--stage-bottom-safe-space);
}

.right-column {
  width: var(--side-panel-width);
  min-width: 0;
}

.puzzle-table {
  width: min(100%, 680px);
  margin: 0 auto;
}

.turn-status-bar {
  width: min(100%, 100%);
}

@media (min-width: 1280px) {
  .player-mobile-page {
    --page-max-width: 1340px;
    --side-panel-width: 370px;
  }
}

@media (max-width: 1080px) {
  .player-mobile-page {
    --side-panel-width: 330px;
    --quick-nav-width: 58px;
    padding-inline: 16px;
  }

  .game-shell {
    grid-template-columns: var(--quick-nav-width) minmax(0, 1fr) var(--side-panel-width);
  }

  .quick-nav-button {
    width: 42px;
    height: 42px;
  }
}

@media (max-width: 860px) {
  .game-shell {
    grid-template-columns: 1fr;
  }

  .game-quick-nav {
    position: static;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    border-radius: 24px;
  }

  .quick-nav-button {
    width: 44px;
    height: 44px;
  }

  .quick-nav-tooltip {
    display: none;
  }

  .right-column {
    width: 100%;
  }

  .puzzle-table {
    width: 100%;
  }
}

.player-mobile-page {
  position: relative;
}

.atmosphere-sprites {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.atmosphere-sprite {
  position: absolute;
  opacity: 0.72;
}

.atmosphere-sprite--one {
  left: clamp(18px, 5vw, 72px);
  top: 116px;
  transform: rotate(-12deg);
}

.atmosphere-sprite--two {
  left: clamp(90px, 12vw, 180px);
  bottom: 58px;
  opacity: 0.46;
}

.atmosphere-sprite--three {
  right: clamp(38px, 6vw, 92px);
  top: 88px;
  opacity: 0.52;
}

.atmosphere-sprite--four {
  right: clamp(126px, 14vw, 210px);
  bottom: 86px;
  transform: rotate(17deg);
}

.flow-header,
.game-shell {
  position: relative;
  z-index: 1;
}

.quick-nav-icon {
  overflow: visible;
}

.quick-nav-icon :deep(.sprite-icon) {
  transition: transform 0.24s ease;
}

.quick-nav-button:hover .quick-nav-icon :deep(.sprite-icon),
.quick-nav-button:focus-visible .quick-nav-icon :deep(.sprite-icon) {
  transform: rotate(8deg) scale(1.08);
}

.task-state-icon {
  border-radius: 40% 60% 46% 54% / 56% 44% 58% 42%;
  background:
    radial-gradient(circle at 35% 24%, rgba(255, 255, 255, 0.66), transparent 24%),
    #fff2b8;
  box-shadow:
    inset -2px -3px 7px rgba(105, 82, 37, 0.08),
    0 8px 18px rgba(77, 103, 91, 0.08);
}

.task-state-card--recording .task-state-icon {
  background: #fff2b8;
}

.task-state-card--upcoming .task-state-icon {
  background: #e8f7f3;
}

.task-state-card--ready .task-state-icon,
.task-state-card--puzzle .task-state-icon {
  background: #dff5ee;
}

.task-state-card {
  grid-template-columns: 58px 1fr auto;
  min-height: 82px;
}

.task-emotion-sprite {
  align-self: center;
}

.emotion-guidance-card {
  display: grid;
  grid-template-columns: 84px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  margin-bottom: 10px;
  border: 1px solid rgba(255, 235, 153, 0.58);
  border-radius: 18px;
  padding: 10px 12px;
  background:
    radial-gradient(circle at 16% 18%, rgba(255, 249, 230, 0.88), transparent 32%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(255, 249, 230, 0.76));
  box-shadow: 0 12px 28px rgba(255, 235, 153, 0.13);
}

.emotion-guidance-card strong {
  display: block;
  color: #3b443c;
  font-size: 15px;
  line-height: 1.35;
}

.emotion-guidance-card span {
  display: block;
  margin-top: 3px;
  color: #7b8780;
  font-size: 12px;
  line-height: 1.45;
}

.companion-state-card {
  grid-template-columns: 62px minmax(0, 1fr);
  align-items: center;
  column-gap: 10px;
  min-height: 78px;
}

.companion-emotion-sprite {
  grid-row: 1 / 3;
}

.companion-state-card strong,
.companion-state-card span {
  grid-column: 2;
}

.puzzle-lock-sprite {
  position: absolute;
  right: 5px;
  bottom: 5px;
  z-index: 3;
  opacity: 0.88;
  pointer-events: none;
}

.generating-overlay {
  position: absolute;
  inset: 10px;
  z-index: 5;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 8px;
  border-radius: 8px;
  background: rgba(250, 250, 246, 0.78);
  color: #33443b;
  text-align: center;
  backdrop-filter: blur(10px);
}

.generating-overlay strong {
  font-size: 18px;
  line-height: 1.25;
}

.generating-overlay span {
  color: #7b8780;
  font-size: 13px;
}

.stage-emotion-sprite {
  margin-bottom: 2px;
}

.complete-dialog {
  position: relative;
  overflow: hidden;
}

.complete-sparkle {
  position: absolute;
  z-index: 2;
}

.complete-sparkle::before,
.complete-sparkle::after {
  display: none;
}

.complete-sparkle-a {
  top: 14px;
  left: 18px;
}

.complete-sparkle-b {
  right: 20px;
  top: 18px;
}

.complete-emotion-sprite {
  display: grid;
  margin: 0 auto 8px;
}

.complete-emotion-copy {
  margin: -6px 0 12px;
  color: #8a6971;
  font-size: 14px;
  font-weight: 700;
  text-align: center;
}

@media (prefers-reduced-motion: reduce) {
  .atmosphere-sprite,
  .quick-nav-icon :deep(.sprite-icon),
  .task-state-card--recording .task-state-icon,
  .task-emotion-sprite,
  .stage-emotion-sprite,
  .companion-emotion-sprite,
  .complete-emotion-sprite {
    animation: none;
    transition: none;
  }
}
</style>
