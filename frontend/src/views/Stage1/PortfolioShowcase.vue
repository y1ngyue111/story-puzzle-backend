<template>
  <div class="portfolio-page">
    <header class="portfolio-hero">
      <div>
        <span class="eyebrow">作品集展示版</span>
        <h1>一段故事，如何变成共同完成的画面</h1>
        <p>把完整体验拆成独立页面，方便演示、截图和放进作品集叙事。</p>
      </div>
      <div class="hero-actions">
        <button type="button" @click="goHome">返回开始页</button>
        <button type="button" class="primary" @click="goGame">进入可交互版本</button>
      </div>
    </header>

    <main class="showcase-workspace">
      <aside class="floating-nav-panel" aria-label="作品集页面导航">
        <span class="nav-kicker">功能入口</span>
        <button
          v-for="(screen, index) in screens"
          :key="screen.path"
          type="button"
          class="floating-nav-button"
          :class="{ active: activeIndex === index }"
          @click="activeIndex = index"
        >
          <span class="nav-index">{{ screen.index }}</span>
          <span class="nav-copy">
            <strong>{{ screen.title }}</strong>
            <small>{{ screen.short }}</small>
          </span>
        </button>
      </aside>

      <section class="showcase-stage">
        <article class="showcase-preview-card">
          <div class="preview-index">{{ activeScreen.index }}</div>
          <div class="preview-content">
            <span class="preview-label">{{ activeScreen.label }}</span>
            <h2>{{ activeScreen.title }}</h2>
            <p>{{ activeScreen.desc }}</p>
            <ul class="preview-points">
              <li v-for="point in activeScreen.points" :key="point">{{ point }}</li>
            </ul>
          </div>
          <button type="button" class="preview-action" @click="router.push(activeScreen.path)">
            查看页面
          </button>
          <div class="preview-corner" aria-hidden="true"></div>
        </article>

        <div class="mini-screen-row">
          <button
            v-for="(screen, index) in screens"
            :key="`mini-${screen.path}`"
            type="button"
            class="mini-screen-card"
            :class="{ active: activeIndex === index }"
            @click="activeIndex = index"
          >
            <span>{{ screen.index }}</span>
            <strong>{{ screen.title }}</strong>
          </button>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const activeIndex = ref(0)

const screens = [
  {
    index: '01',
    title: '准备加入',
    short: '房间与规则',
    label: 'Entry',
    desc: '展示房间码、基础规则和低压力进入方式。',
    path: '/portfolio-ready',
    points: ['房间码一眼可见', '进入规则更轻', '减少尴尬和等待']
  },
  {
    index: '02',
    title: 'AI 生成等待',
    short: '关键词与进度',
    label: 'Generating',
    desc: '展示关键词、生成进度和等待反馈。',
    path: '/portfolio-generating',
    points: ['生成进度可见', '关键词帮助理解', '等待过程不空白']
  },
  {
    index: '03',
    title: '完成回看',
    short: '结果与成就',
    label: 'Complete',
    desc: '展示最终图、完成数据和共同成就感。',
    path: '/portfolio-complete',
    points: ['最终图突出', '记录用时和步数', '强化共同完成']
  },
  {
    index: '04',
    title: '作品回顾',
    short: '记忆沉淀',
    label: 'Gallery',
    desc: '展示多轮故事图像和共同记忆沉淀。',
    path: '/portfolio-gallery',
    points: ['多轮故事沉淀', '适合作品集展示', '形成共同记忆墙']
  }
]

const activeScreen = computed(() => screens[activeIndex.value])

const goHome = () => {
  router.push('/')
}

const goGame = () => {
  router.push('/player-mobile')
}
</script>

<style scoped>
.portfolio-page {
  min-height: 100vh;
  padding: 30px;
  box-sizing: border-box;
  background:
    radial-gradient(circle at 14% 8%, rgba(112, 104, 255, 0.22), transparent 28%),
    radial-gradient(circle at 86% 18%, rgba(89, 196, 245, 0.2), transparent 26%),
    linear-gradient(135deg, #f8fbff 0%, #eff5ff 50%, #fff8f0 100%);
  color: #25355d;
}

.portfolio-hero {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  align-items: flex-end;
  max-width: 1440px;
  margin: 0 auto 24px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.66);
  box-shadow: 0 18px 48px rgba(79, 98, 148, 0.12);
  backdrop-filter: blur(18px);
}

.eyebrow {
  color: #6469e9;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.portfolio-hero h1 {
  margin: 10px 0 8px;
  font-size: clamp(30px, 3.4vw, 52px);
  line-height: 1.12;
}

.portfolio-hero p {
  margin: 0;
  max-width: 720px;
  color: #687693;
  font-size: 17px;
  line-height: 1.7;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: flex-end;
}

.hero-actions button,
.showcase-card button {
  border: none;
  border-radius: 14px;
  padding: 14px 18px;
  color: #49607d;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: inset 0 0 0 1px rgba(146, 166, 205, 0.28);
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
}

.hero-actions .primary {
  color: #fff;
  background: linear-gradient(135deg, #7068ff, #56c7ef);
  box-shadow: 0 14px 32px rgba(103, 125, 242, 0.24);
}

.screen-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 20px;
  max-width: 1440px;
  margin: 0 auto;
}

.showcase-card {
  display: flex;
  flex-direction: column;
  min-height: 360px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.78);
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: 0 20px 54px rgba(79, 98, 148, 0.12);
  backdrop-filter: blur(18px);
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.showcase-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 24px 60px rgba(79, 98, 148, 0.16);
}

.showcase-card span {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 16px;
  color: #fff;
  background: linear-gradient(135deg, #7068ff, #56c7ef);
  font-weight: 900;
}

.showcase-card strong {
  margin-top: 24px;
  color: #25355d;
  font-size: 26px;
}

.showcase-card p {
  flex: 1;
  margin: 14px 0 22px;
  color: #687693;
  font-size: 16px;
  line-height: 1.7;
}

.showcase-card button {
  align-self: flex-start;
}

@media (max-width: 1180px) {
  .portfolio-hero {
    display: grid;
    align-items: stretch;
  }

  .screen-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .portfolio-page {
    padding: 14px;
  }

  .screen-grid {
    grid-template-columns: 1fr;
  }
}

/* Puzzle app showcase refresh */
.portfolio-page {
  background:
    radial-gradient(circle at 8% 84%, rgba(255, 213, 79, 0.3), transparent 14%),
    radial-gradient(circle at 88% 12%, rgba(52, 197, 156, 0.2), transparent 18%),
    linear-gradient(180deg, #f4f4f1 0%, #ededeb 100%);
  color: #111111;
}

.portfolio-page::before,
.portfolio-page::after {
  content: '';
  position: fixed;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  pointer-events: none;
  transform: rotate(-12deg);
  box-shadow:
    58px 24px 0 #3db4ff,
    112px -8px 0 #ffd54f,
    170px 32px 0 #34c59c;
}

.portfolio-page::before {
  left: 54px;
  top: 92px;
  background: #ff6b57;
}

.portfolio-page::after {
  right: 240px;
  bottom: 96px;
  background: #ffd54f;
  transform: rotate(14deg);
}

.portfolio-hero,
.showcase-card {
  border: 1px solid #e4e4dd;
  border-radius: 24px;
  background: #ffffff;
  box-shadow: 0 18px 44px rgba(23, 25, 30, 0.08);
  backdrop-filter: none;
}

.eyebrow {
  color: #111111;
}

.portfolio-hero h1,
.showcase-card strong {
  color: #111111;
}

.portfolio-hero p,
.showcase-card p {
  color: #6f6f68;
}

.hero-actions button,
.showcase-card button {
  color: #111111;
  background: #ffffff;
  box-shadow: inset 0 0 0 1px #dfdfd7;
}

.hero-actions .primary {
  color: #111111;
  background: #ffd54f;
  box-shadow: 0 12px 22px rgba(255, 213, 79, 0.28);
}

.showcase-card {
  position: relative;
  overflow: hidden;
}

.showcase-card::after {
  content: '';
  position: absolute;
  right: -18px;
  bottom: -18px;
  width: 92px;
  height: 92px;
  border-radius: 20px;
  background:
    radial-gradient(circle at 50% 0, #ffffff 0 15px, transparent 16px),
    linear-gradient(135deg, #ffd54f, #ff8f70);
  transform: rotate(12deg);
}

.showcase-card:nth-child(2)::after {
  background:
    radial-gradient(circle at 50% 0, #ffffff 0 15px, transparent 16px),
    linear-gradient(135deg, #75e3d5, #3db4ff);
}

.showcase-card:nth-child(3)::after {
  background:
    radial-gradient(circle at 50% 0, #ffffff 0 15px, transparent 16px),
    linear-gradient(135deg, #b8ebcc, #ffd54f);
}

.showcase-card:nth-child(4)::after {
  background:
    radial-gradient(circle at 50% 0, #ffffff 0 15px, transparent 16px),
    linear-gradient(135deg, #ffd0dc, #e5d4ff);
}

.showcase-card span {
  color: #111111;
  background: #f4f4f1;
}

/* Floating navigation version for portfolio entries. */
.showcase-workspace {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 22px;
  align-items: start;
  max-width: 1440px;
  margin: 0 auto;
}

.floating-nav-panel {
  position: sticky;
  top: 24px;
  z-index: 2;
  display: grid;
  gap: 10px;
  border: 1px solid #e4e4dd;
  border-radius: 24px;
  padding: 14px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 18px 44px rgba(23, 25, 30, 0.08);
}

.nav-kicker {
  padding: 2px 6px 8px;
  color: #6f6f68;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.06em;
}

.floating-nav-button {
  display: grid;
  grid-template-columns: 44px 1fr;
  gap: 12px;
  align-items: center;
  min-height: 72px;
  border: 1px solid #e4e4dd;
  border-radius: 18px;
  padding: 10px;
  background: #fbfbf8;
  color: #111111;
  cursor: pointer;
  text-align: left;
  transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease, border-color 0.18s ease;
}

.floating-nav-button:hover {
  transform: translateX(3px);
  border-color: #ffd54f;
  background: #fff2b8;
  box-shadow: 0 12px 24px rgba(23, 25, 30, 0.07);
}

.floating-nav-button.active {
  border-color: #111111;
  background: #ffd54f;
  box-shadow: 0 16px 32px rgba(255, 213, 79, 0.26);
}

.nav-index {
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border-radius: 14px;
  background: #ffffff;
  color: #111111;
  font-size: 15px;
  font-weight: 900;
}

.floating-nav-button.active .nav-index {
  background: #111111;
  color: #ffffff;
}

.nav-copy {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.nav-copy strong {
  overflow: hidden;
  color: #111111;
  font-size: 16px;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav-copy small {
  color: #6f6f68;
  font-size: 12px;
  line-height: 1.3;
}

.showcase-stage {
  display: grid;
  gap: 16px;
  min-width: 0;
}

.showcase-preview-card {
  position: relative;
  display: grid;
  grid-template-rows: auto 1fr auto;
  min-height: 500px;
  overflow: hidden;
  border: 1px solid #e4e4dd;
  border-radius: 28px;
  padding: 30px;
  background: #ffffff;
  box-shadow: 0 20px 54px rgba(23, 25, 30, 0.08);
}

.preview-index {
  display: grid;
  width: 76px;
  height: 76px;
  place-items: center;
  border-radius: 22px;
  background: #f4f4f1;
  color: #111111;
  font-size: 28px;
  font-weight: 900;
}

.preview-content {
  align-self: center;
  max-width: 660px;
}

.preview-label {
  display: inline-flex;
  margin-bottom: 18px;
  border-radius: 999px;
  padding: 7px 12px;
  background: #fff2b8;
  color: #111111;
  font-size: 13px;
  font-weight: 900;
}

.preview-content h2 {
  margin: 0;
  color: #111111;
  font-size: clamp(42px, 6vw, 78px);
  line-height: 1;
  letter-spacing: 0;
}

.preview-content p {
  max-width: 560px;
  margin: 18px 0 0;
  color: #6f6f68;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.7;
}

.preview-points {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 24px 0 0;
  padding: 0;
  list-style: none;
}

.preview-points li {
  border-radius: 999px;
  padding: 9px 12px;
  background: #fbfbf8;
  color: #111111;
  box-shadow: inset 0 0 0 1px #e4e4dd;
  font-size: 13px;
  font-weight: 800;
}

.preview-action {
  justify-self: start;
  border: 1px solid #111111;
  border-radius: 16px;
  padding: 16px 24px;
  background: #ffffff;
  color: #111111;
  cursor: pointer;
  font-size: 17px;
  font-weight: 900;
  transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}

.preview-action:hover {
  transform: translateY(-2px);
  background: #ffd54f;
  box-shadow: 0 14px 26px rgba(255, 213, 79, 0.26);
}

.preview-corner {
  position: absolute;
  right: -20px;
  bottom: -20px;
  width: 142px;
  height: 142px;
  border-radius: 30px;
  background:
    radial-gradient(circle at 50% 0, #ffffff 0 22px, transparent 23px),
    linear-gradient(135deg, #ffd54f, #ff8f70);
  transform: rotate(12deg);
}

.mini-screen-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.mini-screen-card {
  display: grid;
  gap: 10px;
  min-height: 112px;
  border: 1px solid #e4e4dd;
  border-radius: 20px;
  padding: 14px;
  background: #ffffff;
  color: #111111;
  cursor: pointer;
  text-align: left;
  box-shadow: 0 12px 28px rgba(23, 25, 30, 0.06);
}

.mini-screen-card.active {
  border-color: #111111;
  background: #fff2b8;
}

.mini-screen-card span {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border-radius: 12px;
  background: #f4f4f1;
  font-weight: 900;
}

.mini-screen-card strong {
  font-size: 15px;
}

@media (max-width: 1080px) {
  .showcase-workspace {
    grid-template-columns: 1fr;
  }

  .floating-nav-panel {
    position: static;
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .nav-kicker {
    grid-column: 1 / -1;
  }

  .floating-nav-button {
    grid-template-columns: 1fr;
    align-content: start;
  }
}

@media (max-width: 720px) {
  .floating-nav-panel,
  .mini-screen-row {
    grid-template-columns: 1fr;
  }

  .showcase-preview-card {
    min-height: 420px;
    padding: 22px;
  }

  .preview-content h2 {
    font-size: 38px;
  }
}
</style>
