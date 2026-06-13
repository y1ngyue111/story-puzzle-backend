<template>
  <div class="panel-states-page">
    <header class="states-hero">
      <div>
        <span class="eyebrow">Guided task panel</span>
        <h1>任务引导面板状态案例</h1>
        <p>用于查看“分享故事 - 同伴提问 - 选择风格 - 协作拼图”的完整组件状态。</p>
      </div>
      <RouterLink to="/player-mobile" class="hero-link">回到游戏页</RouterLink>
    </header>

    <main class="states-grid">
      <article
        v-for="state in panelStates"
        :key="state.id"
        class="state-demo"
        :class="`state-demo--${state.tone}`"
      >
        <div class="demo-meta">
          <span>{{ state.index }}</span>
          <div>
            <strong>{{ state.name }}</strong>
            <p>{{ state.scene }}</p>
          </div>
        </div>

        <section class="panel story-panel">
          <div class="panel-title-row">
            <h2>任务引导</h2>
            <span>{{ state.kicker }}</span>
          </div>

          <div class="task-state-card" :class="`task-state-card--${state.tone}`">
            <span class="task-state-icon">{{ state.icon }}</span>
            <div>
              <strong>{{ state.title }}</strong>
              <p>{{ state.desc }}</p>
            </div>
            <span class="task-state-count">{{ state.progress }}/3</span>
          </div>

          <div class="guide-flow">
            <div
              class="guide-step guide-step--story"
              :class="{ active: state.activeStep === 1, done: state.storyDone, recording: state.id === 'recording' }"
            >
              <div class="guide-step-head">
                <span class="guide-step-no">1</span>
                <div>
                  <strong>讲一件最近的小事</strong>
                  <small>{{ state.storyDone ? '已记录故事，可以继续补充细节' : '用语音或文字说出故事' }}</small>
                </div>
                <span class="guide-step-state">{{ state.storyDone ? '已完成' : state.activeStep === 1 ? '进行中' : '未开始' }}</span>
                <span class="guide-chevron">›</span>
              </div>

              <div v-if="state.activeStep === 1" class="guide-step-body">
                <div v-if="state.id === 'story-done'" class="story-recorded-card">
                  <span>已记录</span>
                  <p>今天放学后突然下雨，我和朋友躲在屋檐下，听见雨滴落在地上的声音。</p>
                </div>
                <template v-else>
                  <div class="story-input-preview">
                    <p v-if="state.id === 'recording'">正在听你说话，结束后会自动转成文字。</p>
                    <p v-else>今天发生了什么？</p>
                    <p>你最想记住哪个片段？</p>
                    <p>当时在哪里？</p>
                  </div>
                  <div class="prompt-seed-list">
                    <button type="button">今天发生了一件让我记住的小事。</button>
                    <button type="button">我最想记住的是当时的一个画面。</button>
                  </div>
                </template>
                <div class="story-voice-row">
                  <button type="button" class="voice-icon-btn story-voice-btn" :class="{ recording: state.id === 'recording' }">
                    <span class="voice-icon-symbol" :class="state.id === 'recording' ? 'voice-icon-symbol--stop' : 'voice-icon-symbol--mic'"></span>
                  </button>
                  <span>{{ state.id === 'recording' ? '停止并识别' : '开始说话' }}</span>
                  <button type="button" class="text-entry-chip">直接输入</button>
                </div>
              </div>
            </div>

            <div
              class="guide-step guide-step--detail"
              :class="{ active: state.activeStep === 2, done: state.detailDone, locked: !state.storyDone }"
            >
              <div class="guide-step-head">
                <span class="guide-step-no">2</span>
                <div>
                  <strong>补充画面细节</strong>
                  <small>{{ state.detailDone ? '讲述者已回应，可以进入生成' : state.storyDone ? '先由同伴任选画面或感受方向提问' : '先完成第 1 步' }}</small>
                </div>
                <span class="guide-step-state">{{ state.detailDone ? '已完成' : state.storyDone ? '待补充' : '未解锁' }}</span>
                <span class="guide-chevron">⌄</span>
              </div>

              <div v-if="state.activeStep === 2" class="guide-step-body question-panel">
                <div class="companion-state-card">
                  <strong>{{ state.id === 'question' ? '请同伴从两种方式里选一个提问' : '同伴问题已收到，等待讲述者回应' }}</strong>
                  <span>{{ state.id === 'question' ? '问题只补充画面，不评价故事。' : '回答后会进入风格选择与生图。' }}</span>
                </div>
                <div class="question-card">
                  <div class="question-title">
                    <div>
                      <strong>画面描述式</strong>
                      <span>画面里有什么？</span>
                    </div>
                    <button type="button" class="voice-icon-btn question-voice-btn">
                      <span class="voice-icon-symbol voice-icon-symbol--mic"></span>
                    </button>
                  </div>
                  <div class="question-chips">
                    <button type="button">当时在哪里？</button>
                    <button type="button">周围有什么物件？</button>
                  </div>
                  <div class="question-input-preview">例如：远处有窗光和一条小路。</div>
                </div>
                <div class="narrator-response-card">
                  <div>
                    <strong>讲述者补充说明</strong>
                    <span>回答同伴的问题，让画面更准确。</span>
                  </div>
                  <button type="button" class="voice-icon-btn narrator-voice-btn">
                    <span class="voice-icon-symbol voice-icon-symbol--mic"></span>
                  </button>
                </div>
              </div>
            </div>

            <div
              class="guide-step guide-step--generate"
              :class="{ active: state.activeStep === 3, done: state.id === 'puzzle', locked: !state.detailDone }"
            >
              <div class="guide-step-head">
                <span class="guide-step-no">3</span>
                <div>
                  <strong>选择风格</strong>
                  <small>{{ state.id === 'puzzle' ? '图片已生成，开始拼图' : '确认画面风格后生成拼图' }}</small>
                </div>
                <span class="guide-step-state">{{ state.id === 'puzzle' ? '已完成' : state.detailDone ? '待生成' : '未解锁' }}</span>
                <span class="guide-chevron">⌄</span>
              </div>

              <div v-if="state.activeStep === 3" class="guide-step-body">
                <div v-if="state.id === 'puzzle'" class="puzzle-progress-card">
                  <div>
                    <strong>拼图正在进行</strong>
                    <span>轮到当前玩家移动 1 块碎片。</span>
                  </div>
                  <div class="puzzle-progress-meter">
                    <i style="width: 56%"></i>
                  </div>
                  <p>9/16 块已归位 · 剩余 02:14</p>
                </div>
                <template v-else>
                  <div class="style-options">
                    <button type="button" class="style-option active">
                      <span class="style-preview"></span>
                      <strong>治愈风</strong>
                      <span>黑板梦境</span>
                    </button>
                    <button type="button" class="style-option">
                      <span class="style-preview"></span>
                      <strong>抽象风</strong>
                      <span>情绪形状</span>
                    </button>
                    <button type="button" class="style-option">
                      <span class="style-preview"></span>
                      <strong>色块风</strong>
                      <span>清晰拼图</span>
                    </button>
                  </div>
                  <button type="button" class="generate-button">生成拼图</button>
                </template>
              </div>
            </div>
          </div>
        </section>
      </article>
    </main>
  </div>
</template>

<script setup>
const panelStates = [
  {
    id: 'empty',
    index: '01',
    name: 'Step 1 空状态',
    scene: '刚进入任务面板，还没有输入故事。',
    kicker: '第 1 步',
    tone: 'active',
    icon: '💬',
    title: '先讲一件最近的小事',
    desc: '不用讲完整，先说一个地点、人物或瞬间就可以。',
    progress: 0,
    activeStep: 1,
    storyDone: false,
    detailDone: false
  },
  {
    id: 'recording',
    index: '02',
    name: 'Step 1 录音中',
    scene: '用户点击开始说话后，强调正在收音。',
    kicker: '录音中',
    tone: 'recording',
    icon: '🎙',
    title: '正在记录你的故事',
    desc: '说完后再点一次，系统会转成文字。',
    progress: 0,
    activeStep: 1,
    storyDone: false,
    detailDone: false
  },
  {
    id: 'story-done',
    index: '03',
    name: '故事已记录',
    scene: '故事语音识别成功，准备进入同伴提问。',
    kicker: '已记录',
    tone: 'ready',
    icon: '✅',
    title: '故事已经记录下来',
    desc: '接下来请同伴补充一个不会造成压力的问题。',
    progress: 1,
    activeStep: 1,
    storyDone: true,
    detailDone: false
  },
  {
    id: 'question',
    index: '04',
    name: 'Step 2 同伴提问',
    scene: '同伴从画面描述或感受描述中选择问题。',
    kicker: '第 2 步',
    tone: 'upcoming',
    icon: '👀',
    title: '请同伴补充一个问题',
    desc: '从画面描述或感受描述里选一个方向，让故事更具体。',
    progress: 1,
    activeStep: 2,
    storyDone: true,
    detailDone: false
  },
  {
    id: 'style',
    index: '05',
    name: 'Step 3 选择风格',
    scene: '讲述者已回应，可以选择风格并生成拼图。',
    kicker: '第 3 步',
    tone: 'ready',
    icon: '✨',
    title: '选择风格并生成拼图',
    desc: '确认画面风格后，AI 会生成图片并切成 4×4 拼图。',
    progress: 2,
    activeStep: 3,
    storyDone: true,
    detailDone: true
  },
  {
    id: 'puzzle',
    index: '06',
    name: '拼图进行中',
    scene: '图像生成完成，进入 3 分钟协作拼图。',
    kicker: '拼图中',
    tone: 'puzzle',
    icon: '🧩',
    title: '轮到当前玩家移动碎片',
    desc: '3 分钟内完成 4×4 拼图，当前已归位 9 块。',
    progress: 3,
    activeStep: 3,
    storyDone: true,
    detailDone: true
  }
]
</script>

<style scoped>
.panel-states-page {
  min-height: 100vh;
  padding: 28px;
  box-sizing: border-box;
  background:
    radial-gradient(circle at 12% 8%, rgba(255, 213, 79, 0.18), transparent 28%),
    radial-gradient(circle at 86% 16%, rgba(117, 227, 213, 0.22), transparent 30%),
    linear-gradient(135deg, #f7f7f2 0%, #f1f5f3 52%, #f9f7ef 100%);
  color: #111111;
}

.states-hero {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: end;
  gap: 24px;
  max-width: 1480px;
  margin: 0 auto 24px;
}

.eyebrow {
  display: inline-flex;
  border-radius: 999px;
  padding: 6px 10px;
  background: #ffd54f;
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
}

.states-hero h1 {
  margin: 12px 0 8px;
  font-size: clamp(30px, 4vw, 56px);
  line-height: 1;
  letter-spacing: 0;
}

.states-hero p {
  max-width: 620px;
  margin: 0;
  color: #6f6f68;
  font-size: 16px;
  line-height: 1.6;
}

.hero-link {
  border-radius: 999px;
  padding: 13px 18px;
  background: #111111;
  color: #ffffff;
  font-weight: 900;
  text-decoration: none;
}

.states-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(320px, 1fr));
  gap: 20px;
  max-width: 1480px;
  margin: 0 auto;
}

.state-demo {
  display: grid;
  gap: 14px;
  border-radius: 28px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.76);
  box-shadow:
    0 24px 60px rgba(23, 25, 30, 0.09),
    inset 0 0 0 1px rgba(255, 255, 255, 0.72);
}

.demo-meta {
  display: grid;
  grid-template-columns: 42px 1fr;
  gap: 12px;
  align-items: center;
}

.demo-meta > span {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: 14px;
  background: #111111;
  color: #ffffff;
  font-weight: 900;
}

.demo-meta strong {
  display: block;
  font-size: 17px;
}

.demo-meta p {
  margin: 3px 0 0;
  color: #77776f;
  font-size: 12px;
  line-height: 1.35;
}

.panel {
  display: grid;
  gap: 12px;
  border-radius: 24px;
  padding: 14px;
  background: #ffffff;
  box-shadow:
    0 16px 36px rgba(23, 25, 30, 0.08),
    inset 0 0 0 1px #ecece6;
}

.panel-title-row,
.guide-step-head,
.question-title,
.narrator-response-card {
  display: flex;
  align-items: center;
}

.panel-title-row {
  justify-content: space-between;
}

.panel-title-row h2 {
  margin: 0;
  font-size: 20px;
}

.panel-title-row span {
  color: #77776f;
  font-size: 13px;
  font-weight: 800;
}

.task-state-card {
  display: grid;
  grid-template-columns: 42px 1fr auto;
  align-items: center;
  gap: 12px;
  border-radius: 18px;
  padding: 12px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(250, 250, 246, 0.9));
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
  font-size: 21px;
}

.task-state-card strong {
  display: block;
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
  display: grid;
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
  background: linear-gradient(135deg, rgba(255, 213, 79, 0.24), rgba(255, 255, 255, 0.94));
}

.task-state-card--recording .task-state-icon {
  animation: pulse 1.15s ease-in-out infinite;
}

.task-state-card--upcoming .task-state-icon {
  background: #f4f4f1;
  color: #8f8f86;
}

.task-state-card--ready .task-state-icon,
.task-state-card--puzzle .task-state-icon {
  background: #75e3d5;
}

.guide-flow {
  display: grid;
  gap: 10px;
}

.guide-step {
  overflow: hidden;
  border-radius: 18px;
  background: #ffffff;
  box-shadow:
    0 10px 24px rgba(23, 25, 30, 0.05),
    inset 0 0 0 1px #ecece6;
}

.guide-step.active {
  box-shadow:
    0 18px 40px rgba(23, 25, 30, 0.1),
    0 0 0 4px rgba(255, 213, 79, 0.34);
}

.guide-step.recording {
  box-shadow:
    0 18px 40px rgba(23, 25, 30, 0.1),
    0 0 0 4px rgba(255, 213, 79, 0.48);
}

.guide-step.done:not(.active) {
  background: #fbfffd;
}

.guide-step.locked {
  background: #fbfbf8;
}

.guide-step-head {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  gap: 10px;
  min-height: 58px;
  padding: 10px;
}

.guide-step-no,
.guide-step-state {
  display: grid;
  place-items: center;
  border-radius: 999px;
  font-weight: 900;
}

.guide-step-no {
  width: 32px;
  height: 32px;
  background: #f4f4f1;
  color: #8f8f86;
}

.guide-step.active .guide-step-no,
.guide-step.active .guide-step-state {
  background: #ffd54f;
  color: #111111;
}

.guide-step.done .guide-step-no,
.guide-step.done .guide-step-state {
  background: #75e3d5;
  color: #111111;
}

.guide-step-head strong,
.guide-step-head small {
  display: block;
}

.guide-step-head strong {
  font-size: 15px;
}

.guide-step-head small {
  margin-top: 2px;
  color: #77776f;
  font-size: 11px;
}

.guide-step-state {
  min-width: 56px;
  padding: 5px 9px;
  background: #eeeeea;
  color: #8f8f86;
  font-size: 11px;
}

.guide-chevron {
  color: #aaa99f;
  font-size: 20px;
  font-weight: 900;
}

.guide-step-body {
  display: grid;
  gap: 10px;
  padding: 0 10px 12px;
}

.story-input-preview,
.question-input-preview,
.story-recorded-card,
.companion-state-card,
.puzzle-progress-card {
  border-radius: 16px;
  padding: 12px;
  background: #fbfbf8;
  box-shadow: inset 0 0 0 1px #ecece6;
}

.story-input-preview {
  min-height: 112px;
  color: #aaa99f;
  font-weight: 800;
}

.story-input-preview p {
  margin: 0 0 8px;
}

.prompt-seed-list {
  display: grid;
  gap: 7px;
}

.prompt-seed-list button,
.question-chips button {
  border: 0;
  border-radius: 999px;
  padding: 8px 12px;
  background: #ffffff;
  box-shadow: inset 0 0 0 1px #ecece6;
  color: #33332e;
  cursor: pointer;
  font-size: 12px;
  font-weight: 800;
  text-align: left;
}

.story-voice-row {
  display: grid;
  grid-template-columns: 46px 1fr auto;
  align-items: center;
  gap: 12px;
  min-height: 60px;
  border-radius: 16px;
  padding: 9px;
  background: #ffd54f;
}

.voice-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: 0;
  border-radius: 14px;
  background: #ffffff;
}

.voice-icon-symbol {
  position: relative;
  width: 18px;
  height: 22px;
}

.voice-icon-symbol--mic::before {
  content: '';
  position: absolute;
  left: 5px;
  top: 0;
  width: 8px;
  height: 14px;
  border-radius: 8px;
  background: #111111;
}

.voice-icon-symbol--mic::after {
  content: '';
  position: absolute;
  left: 2px;
  bottom: 0;
  width: 14px;
  height: 12px;
  border: solid #111111;
  border-width: 0 2px 2px;
  border-radius: 0 0 10px 10px;
}

.voice-icon-symbol--stop::before {
  content: '';
  position: absolute;
  inset: 4px;
  border-radius: 5px;
  background: #111111;
}

.story-voice-row > span {
  font-size: 17px;
  font-weight: 900;
}

.text-entry-chip {
  border: 0;
  background: transparent;
  color: #5f5f58;
  font-weight: 900;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.story-recorded-card span {
  display: inline-flex;
  margin-bottom: 6px;
  border-radius: 999px;
  padding: 4px 8px;
  background: #75e3d5;
  font-size: 11px;
  font-weight: 900;
}

.story-recorded-card p,
.companion-state-card span,
.puzzle-progress-card span,
.puzzle-progress-card p {
  margin: 0;
  color: #6f6f68;
  font-size: 12px;
  line-height: 1.45;
}

.companion-state-card {
  display: grid;
  gap: 4px;
  background: linear-gradient(135deg, rgba(255, 242, 184, 0.68), rgba(255, 255, 255, 0.92));
}

.question-card {
  display: grid;
  gap: 9px;
  border-radius: 16px;
  padding: 10px;
  background: #ffffff;
  box-shadow: inset 0 0 0 1px #ecece6;
}

.question-title {
  justify-content: space-between;
}

.question-title strong,
.question-title span {
  display: block;
}

.question-title span {
  margin-top: 2px;
  color: #77776f;
  font-size: 12px;
}

.question-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.question-voice-btn,
.narrator-voice-btn {
  width: 38px;
  height: 38px;
  background: #ffd54f;
}

.narrator-response-card {
  justify-content: space-between;
}

.style-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.style-option {
  display: grid;
  gap: 6px;
  border: 0;
  border-radius: 16px;
  padding: 9px;
  background: #ffffff;
  box-shadow: inset 0 0 0 1px #ecece6;
  text-align: left;
}

.style-option.active {
  box-shadow:
    inset 0 0 0 2px #111111,
    0 8px 18px rgba(23, 25, 30, 0.08);
}

.style-preview {
  height: 46px;
  border-radius: 12px;
  background:
    radial-gradient(circle at 24% 30%, rgba(255, 255, 255, 0.8) 0 18px, transparent 19px),
    linear-gradient(135deg, #c9f5e8, #ffeaa8 46%, #ffb8d1);
}

.style-option strong,
.style-option span {
  display: block;
}

.style-option span {
  color: #77776f;
  font-size: 11px;
}

.generate-button {
  border: 0;
  border-radius: 16px;
  padding: 14px;
  background: #111111;
  color: #ffffff;
  cursor: pointer;
  font-size: 16px;
  font-weight: 900;
}

.puzzle-progress-card {
  display: grid;
  gap: 10px;
  background: linear-gradient(135deg, rgba(117, 227, 213, 0.26), rgba(255, 255, 255, 0.94));
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
}

@keyframes pulse {
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

@media (max-width: 1120px) {
  .states-grid {
    grid-template-columns: repeat(2, minmax(300px, 1fr));
  }
}

@media (max-width: 760px) {
  .panel-states-page {
    padding: 16px;
  }

  .states-hero {
    grid-template-columns: 1fr;
  }

  .states-grid {
    grid-template-columns: 1fr;
  }
}
</style>
