<template>
  <div class="portfolio-screen-page" :class="`portfolio-screen-page--${kind}`">
    <header class="screen-topbar">
      <button type="button" @click="goBack">展示流程</button>
      <div>
        <span>{{ current.index }}</span>
        <strong>{{ current.title }}</strong>
      </div>
      <button type="button" class="primary" @click="goNext">{{ nextLabel }}</button>
    </header>

    <main class="showcase-screen">
      <section v-if="kind === 'ready'" class="ready-layout">
        <div class="room-card">
          <p class="micro-title">房间码</p>
          <strong>428 613</strong>
          <span>围到屏幕前，准备分享一件最近的小事。</span>
        </div>

        <div class="rule-stack">
          <div class="rule-card active">
            <span>🎙️</span>
            <div>
              <strong>先讲一小段</strong>
              <p>不用组织得很完整，像聊天一样开始。</p>
            </div>
          </div>
          <div class="rule-card">
            <span>💬</span>
            <div>
              <strong>同伴只补充</strong>
              <p>问题围绕画面和感受，不评价故事好坏。</p>
            </div>
          </div>
          <div class="rule-card">
            <span>🧩</span>
            <div>
              <strong>一起拼完</strong>
              <p>每人移动一块，让画面慢慢完整。</p>
            </div>
          </div>
        </div>
      </section>

      <section v-else-if="kind === 'generating'" class="generation-card">
        <div class="image-wait">
          <div class="image-wait__orb"></div>
          <img :src="sceneImage" alt="故事场景插画预览" />
        </div>
        <div class="generation-copy">
          <p class="micro-title">正在生成故事画面</p>
          <h1>把讲述、提问和补充，整理成一张更完整的画。</h1>
          <div class="keyword-row">
            <span>夜晚小路</span>
            <span>星光</span>
            <span>被陪伴</span>
            <span>治愈风</span>
          </div>
          <div class="progress-track">
            <i></i>
          </div>
          <p class="hint">请稍等，完成后会自动切成 4 x 4 拼图。</p>
        </div>
      </section>

      <section v-else-if="kind === 'complete'" class="complete-layout">
        <div class="final-image">
          <img :src="sceneImage" alt="最终故事图像" />
          <div class="confetti one"></div>
          <div class="confetti two"></div>
          <div class="confetti three"></div>
        </div>
        <div class="complete-summary">
          <span class="success-pill">🎉 拼图完成</span>
          <h1>这幅图是大家一起把故事补完整的结果。</h1>
          <div class="summary-stats">
            <div>
              <strong>03:00</strong>
              <span>限定时间</span>
            </div>
            <div>
              <strong>16/16</strong>
              <span>拼图片数</span>
            </div>
            <div>
              <strong>6 人</strong>
              <span>共同参与</span>
            </div>
          </div>
          <p>从一个人的小故事开始，最后变成可以被所有人看见和保存的共同记忆。</p>
        </div>
      </section>

      <section v-else class="gallery-showcase">
        <aside class="gallery-side-nav" aria-label="作品回顾快捷入口">
          <button
            v-for="item in sideNavItems"
            :key="item.kind"
            type="button"
            :class="{ active: kind === item.kind }"
            :aria-label="item.label"
            @click="goPortfolio(item.path)"
          >
            <img :src="item.icon" alt="" />
          </button>
        </aside>

        <div class="gallery-main-card">
          <header class="gallery-hero">
            <img :src="galleryHeroImage" alt="作品回顾治愈插画" />
            <div>
              <h1>作品回顾</h1>
              <p>把讲过的小事、拼好的画面，轻轻收进属于你的记忆相册。这里作为左侧「作品回顾」按钮的二级界面接入。</p>
              <div class="gallery-filter-row">
                <span class="active">全部</span>
                <span>最近</span>
                <span>已收藏</span>
                <span>和同伴一起</span>
              </div>
            </div>
            <button type="button" class="gallery-close" @click="goBack">×</button>
          </header>

          <div class="gallery-content">
            <div class="gallery-grid">
              <article
                v-for="item in galleryItems"
                :key="item.title"
                class="gallery-memory-card"
                :class="item.tone"
              >
                <div class="gallery-image-wrap">
                  <img :src="item.image" :alt="item.title" />
                  <button type="button" class="heart-mark">♡</button>
                </div>
                <time>{{ item.date }}</time>
                <strong>{{ item.title }}</strong>
                <span>{{ item.badge }}</span>
                <i>{{ item.icon }}</i>
                <div class="memory-hover-panel" aria-hidden="true">
                  <button type="button">×</button>
                  <h2>{{ item.title }}</h2>
                  <img :src="item.image" :alt="`${item.title}作品详情`" />
                  <div>
                    <time>{{ item.date }}</time>
                    <span>{{ item.badge }}</span>
                  </div>
                  <p>这是一段由讲述、补充细节和共同拼图留下的回忆。它不强调完整叙事，而是把当时的画面、声音、身体感受和同伴回应温柔地收在一起。</p>
                </div>
              </article>
            </div>

            <aside class="gallery-stats-panel">
              <h2>🌿 本周回忆</h2>
              <dl>
                <div>
                  <dt>新回忆</dt>
                  <dd>4</dd>
                </div>
                <div>
                  <dt>收藏</dt>
                  <dd>2</dd>
                </div>
                <div>
                  <dt>完成拼图</dt>
                  <dd>3次</dd>
                </div>
              </dl>
              <div class="dodo-note">
                <span><img src="/memopuzzle-ip/dodo-happy.png?v=ip20260611" alt="" /></span>
                <p>朵朵正在守着回忆。讲过的小事会合进相册，也可以收藏、重看与导出。</p>
              </div>
              <button type="button" class="open-memory-btn">打开回忆</button>
              <button type="button" class="export-memory-btn">导出图片</button>
            </aside>
          </div>

          <footer class="gallery-footer-note">♡ 这些小小的片段，都会被悄悄收藏起来 ♡</footer>
        </div>

        <aside class="memory-preview-modal">
          <button type="button">×</button>
          <h2>午后散步</h2>
          <img :src="galleryItems[0].image" alt="午后散步作品详情" />
          <div>
            <time>2025.05.20</time>
            <span>和同伴一起</span>
          </div>
          <p>这是一段由讲述、补充细节和共同拼图留下的回忆。它不强调完整叙事，而是把当时的画面、声音、身体感受和同伴回应温柔地收在一起。</p>
        </aside>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import sceneImage from '@/assets/images/portfolio-usage-scene.png'

const route = useRoute()
const router = useRouter()
const galleryHeroImage = '/memopuzzle-gallery/gallery-hero.svg'

const screenMap = {
  ready: {
    index: '01',
    title: '准备加入',
    next: '/portfolio-generating'
  },
  generating: {
    index: '02',
    title: 'AI 生成等待',
    next: '/portfolio-complete'
  },
  complete: {
    index: '03',
    title: '完成回看',
    next: '/portfolio-gallery'
  },
  gallery: {
    index: '04',
    title: '作品回顾',
    next: '/portfolio-showcase'
  }
}

const sideNavItems = [
  { kind: 'ready', label: '准备加入', path: '/portfolio-ready', icon: '/memopuzzle-icons/nav-rule.svg' },
  { kind: 'generating', label: 'AI 等待', path: '/portfolio-generating', icon: '/memopuzzle-icons/nav-ai-waiting.svg' },
  { kind: 'complete', label: '完成回看', path: '/portfolio-complete', icon: '/memopuzzle-icons/nav-review.svg' },
  { kind: 'gallery', label: '作品回顾', path: '/portfolio-gallery', icon: '/memopuzzle-icons/nav-gallery.svg' }
]

const galleryItems = [
  {
    title: '午后散步',
    date: '2025.05.20',
    badge: '和同伴一起',
    icon: '✨',
    tone: 'blue',
    image: '/memopuzzle-gallery/afternoon-walk.svg'
  },
  {
    title: '窗边阳光',
    date: '2025.05.18',
    badge: '最喜欢',
    icon: '⭐',
    tone: 'peach',
    image: '/memopuzzle-gallery/window-sun.svg'
  },
  {
    title: '雨天的小路',
    date: '2025.05.16',
    badge: '能不记录',
    icon: '☔',
    tone: 'mint',
    image: '/memopuzzle-gallery/rainy-path.svg'
  },
  {
    title: '和小林',
    date: '2025.05.14',
    badge: '和同伴一起',
    icon: '🌿',
    tone: 'lavender',
    image: '/memopuzzle-gallery/friends-garden.svg'
  },
  {
    title: '安静的傍晚',
    date: '2025.05.12',
    badge: '随手记录',
    icon: '⭐',
    tone: 'pink',
    image: '/memopuzzle-gallery/quiet-pond.svg'
  },
  {
    title: '拼图完成',
    date: '2025.05.10',
    badge: '最喜欢',
    icon: '🍀',
    tone: 'yellow',
    image: '/memopuzzle-gallery/puzzle-rainbow.svg'
  }
]

const kind = computed(() => route.meta.portfolioKind || 'ready')
const current = computed(() => screenMap[kind.value])
const nextLabel = computed(() => kind.value === 'gallery' ? '回到总览' : '下一页')

const goBack = () => {
  router.push('/portfolio-showcase')
}

const goNext = () => {
  router.push(current.value.next)
}

const goPortfolio = (path) => {
  router.push(path)
}
</script>

<style scoped>
.portfolio-screen-page {
  min-height: 100vh;
  padding: 24px;
  box-sizing: border-box;
  background:
    radial-gradient(circle at 12% 10%, rgba(112, 104, 255, 0.22), transparent 28%),
    radial-gradient(circle at 84% 22%, rgba(89, 196, 245, 0.2), transparent 26%),
    linear-gradient(135deg, #f8fbff 0%, #eff5ff 50%, #fff8f0 100%);
  color: #25355d;
}

.screen-topbar {
  display: grid;
  grid-template-columns: 180px 1fr 180px;
  gap: 16px;
  align-items: center;
  max-width: 1440px;
  margin: 0 auto 20px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.82);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.68);
  box-shadow: 0 18px 48px rgba(79, 98, 148, 0.12);
  backdrop-filter: blur(18px);
}

.screen-topbar div {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
}

.screen-topbar span {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 14px;
  color: #fff;
  background: linear-gradient(135deg, #7068ff, #56c7ef);
  font-weight: 900;
}

.screen-topbar strong {
  font-size: 22px;
}

.screen-topbar button {
  border: none;
  border-radius: 14px;
  padding: 13px 16px;
  color: #49607d;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: inset 0 0 0 1px rgba(146, 166, 205, 0.28);
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
}

.screen-topbar .primary {
  color: #fff;
  background: linear-gradient(135deg, #7068ff, #56c7ef);
  box-shadow: 0 14px 32px rgba(103, 125, 242, 0.24);
}

.showcase-screen {
  max-width: 1440px;
  min-height: calc(100vh - 140px);
  margin: 0 auto;
  padding: 28px;
  border: 1px solid rgba(255, 255, 255, 0.78);
  border-radius: 30px;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: 0 20px 54px rgba(79, 98, 148, 0.12);
  backdrop-filter: blur(18px);
  box-sizing: border-box;
}

.micro-title {
  color: #6469e9;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.ready-layout,
.generation-card,
.complete-layout {
  display: grid;
  grid-template-columns: 0.9fr 1.1fr;
  gap: 24px;
  min-height: calc(100vh - 200px);
  align-items: center;
}

.room-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 520px;
  padding: 40px;
  border-radius: 26px;
  background:
    linear-gradient(145deg, rgba(117, 235, 219, 0.26), rgba(123, 137, 255, 0.18)),
    rgba(255, 255, 255, 0.8);
  box-shadow: inset 0 0 0 1px rgba(190, 214, 245, 0.72);
}

.room-card strong {
  margin: 12px 0;
  color: #24345d;
  font-size: clamp(52px, 7vw, 92px);
  letter-spacing: 0.06em;
}

.room-card span {
  color: #65738f;
  font-size: 20px;
  line-height: 1.7;
}

.rule-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
  justify-content: center;
}

.rule-card {
  display: grid;
  grid-template-columns: 64px 1fr;
  gap: 16px;
  align-items: center;
  padding: 22px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: inset 0 0 0 1px rgba(206, 219, 244, 0.9);
}

.rule-card.active {
  box-shadow: 0 14px 30px rgba(103, 125, 242, 0.14), inset 0 0 0 1px rgba(112, 104, 255, 0.32);
}

.rule-card > span {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  border-radius: 20px;
  background: linear-gradient(135deg, #fff2b9, #9fe9de);
  font-size: 32px;
}

.rule-card strong {
  font-size: 22px;
}

.rule-card p {
  margin: 8px 0 0;
  color: #687693;
  font-size: 17px;
  line-height: 1.55;
}

.image-wait,
.final-image {
  position: relative;
  overflow: hidden;
  min-height: 560px;
  border-radius: 26px;
  background: #f0f5ff;
  box-shadow: inset 0 0 0 1px rgba(205, 219, 243, 0.88);
}

.image-wait img,
.final-image img,
.memory-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.image-wait::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.18), rgba(112, 104, 255, 0.22));
}

.image-wait__orb {
  position: absolute;
  inset: 50%;
  z-index: 2;
  width: 150px;
  height: 150px;
  margin: -75px 0 0 -75px;
  border-radius: 999px;
  background: conic-gradient(from 40deg, #7068ff, #56c7ef, #ffe08a, #7068ff);
  filter: blur(2px);
  opacity: 0.82;
  animation: spin 4s linear infinite;
}

.generation-copy,
.complete-summary {
  padding: 36px;
  border-radius: 26px;
  background: rgba(255, 255, 255, 0.84);
  box-shadow: inset 0 0 0 1px rgba(206, 219, 244, 0.9);
}

.generation-copy h1,
.complete-summary h1 {
  margin: 10px 0 24px;
  font-size: clamp(34px, 4vw, 56px);
  line-height: 1.14;
}

.keyword-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.keyword-row span {
  padding: 10px 14px;
  border-radius: 999px;
  color: #50627f;
  background: #f4f8ff;
  box-shadow: inset 0 0 0 1px rgba(198, 213, 242, 0.88);
  font-weight: 800;
}

.progress-track {
  height: 14px;
  margin: 32px 0 18px;
  overflow: hidden;
  border-radius: 999px;
  background: #edf2fb;
}

.progress-track i {
  display: block;
  width: 68%;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #7068ff, #56c7ef, #ffe08a);
}

.hint,
.complete-summary p {
  color: #687693;
  font-size: 18px;
  line-height: 1.7;
}

.success-pill {
  display: inline-flex;
  padding: 10px 15px;
  border-radius: 999px;
  color: #2e756a;
  background: rgba(159, 233, 222, 0.32);
  font-weight: 900;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin: 26px 0;
}

.summary-stats div {
  padding: 18px;
  border-radius: 18px;
  background: #f6f9ff;
  box-shadow: inset 0 0 0 1px rgba(206, 219, 244, 0.9);
}

.summary-stats strong,
.summary-stats span {
  display: block;
}

.summary-stats strong {
  color: #26355d;
  font-size: 30px;
}

.summary-stats span {
  margin-top: 5px;
  color: #7b89a6;
  font-size: 14px;
}

.confetti {
  position: absolute;
  width: 18px;
  height: 46px;
  border-radius: 999px;
  transform: rotate(24deg);
}

.confetti.one {
  top: 26px;
  left: 32px;
  background: #ffe08a;
}

.confetti.two {
  right: 46px;
  top: 40px;
  background: #8ee4d7;
  transform: rotate(-18deg);
}

.confetti.three {
  right: 28px;
  bottom: 40px;
  background: #9aa0ff;
  transform: rotate(42deg);
}

.gallery-layout {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  align-items: stretch;
}

.memory-card {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 200px);
  padding: 16px;
  border-radius: 26px;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: inset 0 0 0 1px rgba(206, 219, 244, 0.9);
}

.memory-card img {
  flex: 1;
  min-height: 360px;
  border-radius: 20px;
}

.memory-card div {
  padding: 18px 8px 6px;
}

.memory-card strong {
  font-size: 24px;
}

.memory-card p {
  margin: 10px 0;
  color: #52627f;
  font-weight: 800;
}

.memory-card span {
  color: #7b89a6;
  font-size: 15px;
}

.portfolio-screen-page--gallery {
  overflow: hidden;
  background:
    radial-gradient(circle at 15% 12%, rgba(255, 216, 117, 0.24), transparent 22%),
    radial-gradient(circle at 84% 18%, rgba(163, 228, 215, 0.2), transparent 24%),
    linear-gradient(180deg, #f7f7f4 0%, #efefeb 100%);
}

.portfolio-screen-page--gallery .screen-topbar {
  max-width: 1320px;
  margin-bottom: 14px;
  padding: 10px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
}

.portfolio-screen-page--gallery .showcase-screen {
  position: relative;
  max-width: 1320px;
  min-height: calc(100vh - 118px);
  padding: 0;
  border: 0;
  background: transparent;
  box-shadow: none;
}

.gallery-showcase {
  position: relative;
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr) 330px;
  gap: 18px;
  align-items: start;
  min-height: calc(100vh - 118px);
}

.gallery-side-nav {
  display: grid;
  align-self: center;
  width: 76px;
  gap: 16px;
  justify-items: center;
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 38px;
  padding: 16px 0;
  background: rgba(255, 255, 255, 0.8);
  box-shadow: 0 24px 70px rgba(84, 119, 110, 0.16);
  backdrop-filter: blur(20px);
}

.gallery-side-nav button {
  display: grid;
  position: relative;
  width: 48px;
  height: 48px;
  place-items: center;
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 6px 14px rgba(84, 119, 110, 0.1);
  cursor: pointer;
  transition: transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275), background 0.25s ease;
}

.gallery-side-nav button:hover,
.gallery-side-nav button:focus-visible {
  background: #fffdf7;
  outline: none;
  transform: translateX(2px) scale(1.08);
}

.gallery-side-nav img {
  display: block;
  width: 38px;
  height: 38px;
  border-radius: 0;
  object-fit: contain;
  pointer-events: none;
  user-select: none;
}

.gallery-side-nav button.active {
  background: #fff4d5;
}

.gallery-side-nav button.active::before {
  content: "";
  position: absolute;
  inset: -5px;
  z-index: -1;
  border: 2px dashed #f6c756;
  border-radius: 50%;
}

.gallery-main-card {
  overflow: visible;
  border: 1px solid rgba(204, 215, 242, 0.88);
  border-radius: 32px;
  padding: 18px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 22px 60px rgba(84, 119, 110, 0.14);
}

.gallery-hero {
  position: relative;
  display: grid;
  grid-template-columns: 116px 1fr 36px;
  gap: 16px;
  align-items: center;
  border-radius: 24px;
  margin-bottom: 18px;
  padding: 18px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: inset 0 0 0 1px rgba(229, 230, 223, 0.88);
}

.gallery-hero > img {
  width: 96px;
  height: 96px;
  border-radius: 16px;
  object-fit: cover;
  box-shadow: 0 10px 24px rgba(84, 119, 110, 0.14);
}

.gallery-hero h1 {
  margin: 0;
  color: #22376b;
  font-size: 30px;
  font-weight: 950;
}

.gallery-hero p {
  max-width: 760px;
  margin: 8px 0 12px;
  color: #6d7a91;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.6;
}

.gallery-filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
}

.gallery-filter-row span {
  border-radius: 999px;
  padding: 7px 14px;
  background: #ffffff;
  box-shadow: inset 0 0 0 1px rgba(211, 220, 236, 0.95);
  color: #22376b;
  font-size: 12px;
  font-weight: 900;
}

.gallery-filter-row .active {
  background: #2f64c5;
  color: #ffffff;
  box-shadow: none;
}

.gallery-close {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 8px 20px rgba(84, 119, 110, 0.12);
  color: #22376b;
  font-size: 18px;
  font-weight: 900;
  cursor: pointer;
}

.gallery-content {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 210px;
  gap: 18px;
  overflow: visible;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  overflow: visible;
}

.gallery-memory-card {
  position: relative;
  z-index: 1;
  border-radius: 20px;
  padding: 10px;
  background: #ffffff;
  box-shadow:
    inset 0 0 0 1px rgba(208, 215, 229, 0.95),
    0 12px 24px rgba(84, 119, 110, 0.08);
}

.gallery-memory-card:hover,
.gallery-memory-card:focus-within {
  z-index: 30;
  transform: translateY(-2px);
}

.memory-hover-panel {
  position: absolute;
  z-index: 60;
  left: 50%;
  top: 50%;
  display: none;
  width: min(390px, 78vw);
  border-radius: 22px;
  padding: 18px;
  background: #ffffff;
  box-shadow: 0 24px 70px rgba(49, 66, 74, 0.22);
  color: #22376b;
  pointer-events: none;
  transform: translate(-50%, -50%) scale(0.96);
}

.gallery-memory-card:hover .memory-hover-panel,
.gallery-memory-card:focus-within .memory-hover-panel {
  display: block;
  animation: memoryHoverIn 0.18s ease-out forwards;
}

.memory-hover-panel button {
  position: absolute;
  right: 16px;
  top: 16px;
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: #f3f5fb;
  color: #95a0b4;
  font-size: 18px;
  font-weight: 900;
}

.memory-hover-panel h2 {
  margin: 4px 36px 14px 0;
  color: #22376b;
  font-size: 21px;
  font-weight: 950;
}

.memory-hover-panel > img {
  display: block;
  width: 100%;
  height: 210px;
  border-radius: 16px;
  object-fit: cover;
}

.memory-hover-panel div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 12px 0 10px;
}

.memory-hover-panel time {
  color: #7c8aa3;
  font-size: 12px;
  font-weight: 900;
}

.memory-hover-panel div span {
  display: inline-flex;
  border-radius: 999px;
  margin: 0;
  padding: 5px 10px;
  background: #eef5ff;
  color: #315fa8;
  font-size: 11px;
  font-weight: 900;
}

.memory-hover-panel p {
  margin: 0;
  color: #6d7a91;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.8;
}

@keyframes memoryHoverIn {
  from {
    opacity: 0;
    transform: translate(-50%, -46%) scale(0.94);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

.gallery-memory-card.blue { box-shadow: inset 0 0 0 2px rgba(80, 116, 204, 0.18), 0 12px 24px rgba(84, 119, 110, 0.08); }
.gallery-memory-card.peach { box-shadow: inset 0 0 0 2px rgba(255, 169, 107, 0.22), 0 12px 24px rgba(84, 119, 110, 0.08); }
.gallery-memory-card.mint { box-shadow: inset 0 0 0 2px rgba(111, 185, 145, 0.22), 0 12px 24px rgba(84, 119, 110, 0.08); }
.gallery-memory-card.lavender { box-shadow: inset 0 0 0 2px rgba(180, 156, 242, 0.24), 0 12px 24px rgba(84, 119, 110, 0.08); }
.gallery-memory-card.pink { box-shadow: inset 0 0 0 2px rgba(235, 163, 199, 0.24), 0 12px 24px rgba(84, 119, 110, 0.08); }
.gallery-memory-card.yellow { box-shadow: inset 0 0 0 2px rgba(246, 199, 86, 0.28), 0 12px 24px rgba(84, 119, 110, 0.08); }

.gallery-image-wrap {
  position: relative;
  overflow: hidden;
  height: 150px;
  border-radius: 14px;
  background: #f4f1e8;
}

.gallery-image-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.heart-mark {
  position: absolute;
  right: 8px;
  top: 8px;
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  color: #22376b;
  font-size: 17px;
  font-weight: 900;
}

.gallery-memory-card time,
.gallery-memory-card strong,
.gallery-memory-card span {
  display: block;
}

.gallery-memory-card time {
  margin-top: 10px;
  color: #6d7a91;
  font-size: 11px;
  font-weight: 800;
}

.gallery-memory-card strong {
  margin-top: 4px;
  color: #22376b;
  font-size: 15px;
  font-weight: 950;
}

.gallery-memory-card span {
  display: inline-flex;
  border-radius: 999px;
  margin-top: 7px;
  padding: 5px 10px;
  background: #eef5ff;
  color: #315fa8;
  font-size: 10px;
  font-weight: 900;
}

.gallery-memory-card i {
  position: absolute;
  right: 12px;
  bottom: 12px;
  font-style: normal;
}

.gallery-stats-panel {
  border-radius: 20px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: inset 0 0 0 1px rgba(229, 230, 223, 0.95);
}

.gallery-stats-panel h2 {
  margin: 0 0 14px;
  color: #22376b;
  font-size: 17px;
  font-weight: 950;
}

.gallery-stats-panel dl {
  margin: 0;
}

.gallery-stats-panel dl div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px dashed rgba(109, 122, 145, 0.22);
  padding: 11px 0;
}

.gallery-stats-panel dt,
.gallery-stats-panel dd {
  margin: 0;
  color: #22376b;
  font-size: 13px;
  font-weight: 900;
}

.gallery-stats-panel dt {
  color: #6d7a91;
}

.dodo-note {
  display: grid;
  grid-template-columns: 42px 1fr;
  gap: 10px;
  border-radius: 16px;
  margin: 16px 0;
  padding: 12px;
  background: #fff2f6;
}

.dodo-note span {
  overflow: hidden;
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border-radius: 14px;
  background: #ffffff;
}

.dodo-note img {
  width: 34px;
  height: 34px;
  object-fit: contain;
  mix-blend-mode: multiply;
}

.dodo-note p {
  margin: 0;
  color: #6d4a60;
  font-size: 11px;
  font-weight: 800;
  line-height: 1.55;
}

.open-memory-btn,
.export-memory-btn {
  width: 100%;
  height: 42px;
  border-radius: 14px;
  border: 0;
  font-size: 13px;
  font-weight: 950;
  cursor: pointer;
}

.open-memory-btn {
  background: #2f64c5;
  color: #ffffff;
}

.export-memory-btn {
  margin-top: 10px;
  background: #ffffff;
  color: #22376b;
  box-shadow: inset 0 0 0 1px rgba(211, 220, 236, 0.95);
}

.gallery-footer-note {
  border-radius: 999px;
  margin-top: 16px;
  padding: 10px 16px;
  background: #ffffff;
  color: #22376b;
  text-align: center;
  font-size: 12px;
  font-weight: 900;
  box-shadow: inset 0 0 0 1px rgba(229, 230, 223, 0.95);
}

.memory-preview-modal {
  align-self: start;
  border-radius: 24px;
  padding: 18px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 22px 62px rgba(84, 119, 110, 0.18);
}

.memory-preview-modal button {
  float: right;
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 50%;
  background: #f3f5fb;
  color: #95a0b4;
  font-weight: 900;
}

.memory-preview-modal h2 {
  margin: 4px 0 12px;
  color: #22376b;
  font-size: 18px;
  font-weight: 950;
}

.memory-preview-modal img {
  width: 100%;
  height: 230px;
  border-radius: 16px;
  object-fit: cover;
  display: block;
}

.memory-preview-modal div {
  display: flex;
  justify-content: space-between;
  margin: 12px 0;
  color: #6d7a91;
  font-size: 11px;
  font-weight: 900;
}

.memory-preview-modal div span {
  border-radius: 999px;
  padding: 4px 10px;
  background: #eef5ff;
  color: #315fa8;
}

.memory-preview-modal p {
  margin: 0;
  color: #6d7a91;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.8;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1180px) {
  .screen-topbar,
  .ready-layout,
  .generation-card,
  .complete-layout,
  .gallery-layout {
    grid-template-columns: 1fr;
  }

  .screen-topbar div {
    justify-content: flex-start;
  }
}

@media (max-width: 720px) {
  .portfolio-screen-page {
    padding: 14px;
  }

  .showcase-screen {
    min-height: auto;
    padding: 18px;
    border-radius: 24px;
  }

  .summary-stats {
    grid-template-columns: 1fr;
  }
}

/* Puzzle app showcase refresh */
.portfolio-screen-page {
  background:
    radial-gradient(circle at 8% 86%, rgba(255, 213, 79, 0.32), transparent 15%),
    radial-gradient(circle at 88% 10%, rgba(52, 197, 156, 0.2), transparent 18%),
    linear-gradient(180deg, #f4f4f1 0%, #ededeb 100%);
  color: #111111;
}

.portfolio-screen-page::before,
.portfolio-screen-page::after {
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

.portfolio-screen-page::before {
  left: 42px;
  top: 92px;
  background: #ff6b57;
}

.portfolio-screen-page::after {
  right: 228px;
  bottom: 92px;
  background: #ffd54f;
  transform: rotate(14deg);
}

.screen-topbar,
.showcase-screen,
.room-card,
.rule-card,
.generation-copy,
.complete-summary,
.summary-stats div,
.memory-card {
  border: 1px solid #e4e4dd;
  background: #ffffff;
  box-shadow: 0 18px 44px rgba(23, 25, 30, 0.08);
  backdrop-filter: none;
}

.screen-topbar,
.showcase-screen {
  position: relative;
  z-index: 1;
}

.screen-topbar span,
.rule-card > span {
  color: #111111;
  background: #ffd54f;
}

.screen-topbar button,
.keyword-row span {
  color: #111111;
  background: #ffffff;
  box-shadow: inset 0 0 0 1px #dfdfd7;
}

.screen-topbar .primary {
  color: #111111;
  background: #ffd54f;
  box-shadow: 0 12px 22px rgba(255, 213, 79, 0.28);
}

.micro-title,
.screen-topbar strong,
.room-card strong,
.rule-card strong,
.generation-copy h1,
.complete-summary h1,
.memory-card strong,
.summary-stats strong {
  color: #111111;
}

.room-card span,
.rule-card p,
.hint,
.complete-summary p,
.memory-card span {
  color: #6f6f68;
}

.room-card {
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at 76% 22%, rgba(255, 255, 255, 0.78) 0 42px, transparent 43px),
    linear-gradient(145deg, #ffe9a8 0%, #c6f0d5 50%, #c8f4f1 100%);
}

.room-card::after {
  content: '';
  position: absolute;
  right: -22px;
  bottom: -18px;
  width: 140px;
  height: 140px;
  border-radius: 28px;
  background:
    radial-gradient(circle at 50% 0, #ffffff 0 20px, transparent 21px),
    linear-gradient(135deg, #ff6b57, #ffd54f);
  transform: rotate(10deg);
}

.rule-card:nth-child(2) > span {
  background: #75e3d5;
}

.rule-card:nth-child(3) > span {
  background: #ffd0dc;
}

.image-wait,
.final-image {
  border-radius: 24px;
  background: #ffffff;
  box-shadow: 0 18px 44px rgba(23, 25, 30, 0.08);
}

.image-wait::after {
  background:
    radial-gradient(circle at 26% 24%, rgba(255, 255, 255, 0.5) 0 58px, transparent 59px),
    linear-gradient(180deg, rgba(255, 255, 255, 0.1), rgba(255, 213, 79, 0.18));
}

.image-wait__orb {
  background: conic-gradient(from 40deg, #ff6b57, #ffd54f, #34c59c, #3db4ff, #ff6b57);
}

.progress-track {
  background: #eeeeea;
}

.progress-track i {
  background: linear-gradient(90deg, #ff6b57, #ffd54f, #34c59c);
}

.success-pill {
  color: #111111;
  background: #75e3d5;
}

.memory-card {
  overflow: hidden;
}

.memory-card::after {
  content: '';
  width: 74px;
  height: 74px;
  border-radius: 18px;
  background:
    radial-gradient(circle at 50% 0, #ffffff 0 12px, transparent 13px),
    linear-gradient(135deg, #ffd54f, #ff8f70);
  align-self: flex-end;
  margin-top: auto;
  transform: rotate(10deg);
}
</style>
