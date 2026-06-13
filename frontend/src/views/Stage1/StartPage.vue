<template>
  <div class="start-page">
    <div class="start-page__glow start-page__glow--left"></div>
    <div class="start-page__glow start-page__glow--right"></div>

    <main class="start-page__content">
      <section class="hero-card">
        <div class="hero-card__badge">共享大屏互动体验</div>
        <h1 class="hero-card__title">把一段故事，变成一幅大家一起完成的拼图。</h1>
        <p class="hero-card__subtitle">
          先讲述一件小事，再由同伴补充画面细节与感受，最后一起完成专属拼图。
        </p>

        <div class="hero-card__actions">
          <button class="primary-btn" type="button" @click="goToGame">开始体验</button>
          <button class="secondary-btn" type="button" @click="goToGameWithDemo">直接进入示例</button>
          <button class="secondary-btn" type="button" @click="goToShowcase">浏览展示流程</button>
        </div>

        <ul class="hero-card__highlights">
          <li>语音讲述</li>
          <li>同伴提问</li>
          <li>AI 生图</li>
          <li>4 x 4 协作拼图</li>
        </ul>
      </section>

      <section class="preview-panel">
        <div class="preview-panel__topbar">
          <span>轻社交叙事拼图</span>
          <span>大屏版</span>
        </div>

        <div class="preview-panel__board">
          <div class="preview-panel__status">
            <div class="preview-panel__avatar">🙂</div>
            <div class="preview-panel__status-text">
              <strong>当前玩家：玩家</strong>
              <span>讲一个最近发生的小片段，其他人帮你把画面补充完整。</span>
            </div>
            <div class="preview-panel__timer">03:00</div>
          </div>

          <div class="preview-panel__layout">
            <div class="preview-panel__puzzle">
              <div
                v-for="piece in 16"
                :key="piece"
                class="preview-panel__piece"
                :class="`preview-panel__piece--${(piece % 4) + 1}`"
              >
                <span v-if="piece === 11" class="preview-panel__piece-icon">🧩</span>
              </div>
            </div>

            <div class="preview-panel__steps">
              <div class="step-card step-card--active">
                <div class="step-card__index">1</div>
                <div>
                  <strong>讲述故事</strong>
                  <p>用一句话开始，不用担心说得是否完整。</p>
                </div>
              </div>
              <div class="step-card">
                <div class="step-card__index">2</div>
                <div>
                  <strong>同伴补充</strong>
                  <p>围绕画面和感受提问，帮助故事更具体。</p>
                </div>
              </div>
              <div class="step-card">
                <div class="step-card__index">3</div>
                <div>
                  <strong>生成拼图</strong>
                  <p>选择风格，生成专属画面并开始协作拼图。</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goToGame = () => {
  router.push('/player-mobile')
}

const goToGameWithDemo = () => {
  router.push({
    path: '/player-mobile',
    query: {
      playerName: '玩家'
    }
  })
}

const goToShowcase = () => {
  router.push('/portfolio-showcase')
}
</script>

<style scoped>
.start-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background:
    radial-gradient(circle at 20% 20%, rgba(255, 214, 165, 0.24), transparent 28%),
    radial-gradient(circle at 82% 18%, rgba(131, 170, 255, 0.26), transparent 26%),
    linear-gradient(135deg, #f7fbff 0%, #eef4ff 35%, #fff9f1 100%);
}

.start-page__glow {
  position: absolute;
  width: 28rem;
  height: 28rem;
  border-radius: 999px;
  filter: blur(42px);
  opacity: 0.45;
  pointer-events: none;
}

.start-page__glow--left {
  top: -8rem;
  left: -8rem;
  background: rgba(106, 140, 255, 0.32);
}

.start-page__glow--right {
  right: -7rem;
  bottom: -7rem;
  background: rgba(255, 182, 120, 0.28);
}

.start-page__content {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(320px, 520px) minmax(420px, 1fr);
  gap: 32px;
  align-items: center;
  min-height: 100vh;
  padding: 40px;
  box-sizing: border-box;
}

.hero-card,
.preview-panel {
  border: 1px solid rgba(255, 255, 255, 0.78);
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: 0 20px 60px rgba(78, 98, 147, 0.14);
  backdrop-filter: blur(18px);
}

.hero-card {
  padding: 40px 36px;
}

.hero-card__badge {
  display: inline-flex;
  align-items: center;
  margin-bottom: 20px;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(112, 128, 255, 0.12);
  color: #5c5ee6;
  font-size: 14px;
  font-weight: 700;
}

.hero-card__title {
  margin: 0;
  color: #26355a;
  font-size: clamp(34px, 4vw, 54px);
  line-height: 1.12;
}

.hero-card__subtitle {
  margin: 18px 0 0;
  color: #62718f;
  font-size: 18px;
  line-height: 1.7;
}

.hero-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 30px;
}

.primary-btn,
.secondary-btn {
  border: none;
  border-radius: 14px;
  padding: 15px 24px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;
}

.primary-btn {
  color: #fff;
  background: linear-gradient(135deg, #6f68ff 0%, #5abef5 100%);
  box-shadow: 0 16px 32px rgba(102, 122, 255, 0.24);
}

.secondary-btn {
  color: #49607d;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: inset 0 0 0 1px rgba(146, 166, 205, 0.28);
}

.primary-btn:hover,
.secondary-btn:hover {
  transform: translateY(-1px);
}

.hero-card__highlights {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 28px 0 0;
  padding: 0;
  list-style: none;
}

.hero-card__highlights li {
  padding: 10px 14px;
  border-radius: 999px;
  color: #4d6482;
  background: rgba(243, 247, 255, 0.92);
  box-shadow: inset 0 0 0 1px rgba(192, 209, 239, 0.72);
  font-size: 14px;
  font-weight: 600;
}

.preview-panel {
  padding: 18px 18px 20px;
}

.preview-panel__topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 8px 12px;
  color: #7b89a6;
  font-size: 13px;
  font-weight: 700;
}

.preview-panel__board {
  padding: 18px;
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(250, 252, 255, 0.96), rgba(245, 248, 255, 0.82));
  box-shadow: inset 0 0 0 1px rgba(209, 222, 246, 0.8);
}

.preview-panel__status {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 14px;
  align-items: center;
  padding: 14px 16px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.9);
}

.preview-panel__avatar {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: linear-gradient(135deg, #7ce3d9 0%, #66c8f5 100%);
  font-size: 28px;
}

.preview-panel__status-text {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.preview-panel__status-text strong {
  color: #22345d;
  font-size: 18px;
}

.preview-panel__status-text span {
  color: #6d7b96;
  font-size: 14px;
}

.preview-panel__timer {
  padding: 14px 18px;
  border-radius: 18px;
  color: #fff;
  background: linear-gradient(135deg, #6f68ff 0%, #55c7f6 100%);
  font-size: 24px;
  font-weight: 800;
  letter-spacing: 1px;
}

.preview-panel__layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 18px;
  margin-top: 18px;
}

.preview-panel__puzzle {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  aspect-ratio: 1 / 1;
  padding: 16px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.82);
  box-shadow: inset 0 0 0 1px rgba(205, 219, 243, 0.88);
}

.preview-panel__piece {
  position: relative;
  border-radius: 18px;
  min-height: 0;
  overflow: hidden;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.7);
}

.preview-panel__piece--1 {
  background: linear-gradient(135deg, rgba(137, 211, 255, 0.55), rgba(205, 242, 255, 0.9));
}

.preview-panel__piece--2 {
  background: linear-gradient(135deg, rgba(255, 220, 162, 0.62), rgba(255, 242, 213, 0.95));
}

.preview-panel__piece--3 {
  background: linear-gradient(135deg, rgba(196, 237, 186, 0.68), rgba(234, 250, 212, 0.92));
}

.preview-panel__piece--4 {
  background: linear-gradient(135deg, rgba(235, 200, 255, 0.62), rgba(253, 232, 247, 0.92));
}

.preview-panel__piece::before,
.preview-panel__piece::after {
  content: '';
  position: absolute;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.34);
}

.preview-panel__piece::before {
  top: 14%;
  left: 22%;
  width: 34%;
  height: 34%;
}

.preview-panel__piece::after {
  top: 42%;
  right: -9%;
  width: 18%;
  height: 22%;
}

.preview-panel__piece-icon {
  position: absolute;
  right: 12px;
  bottom: 10px;
  font-size: 26px;
}

.preview-panel__steps {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.step-card {
  display: grid;
  grid-template-columns: 36px 1fr;
  gap: 12px;
  padding: 14px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.82);
  box-shadow: inset 0 0 0 1px rgba(211, 223, 245, 0.88);
}

.step-card--active {
  box-shadow:
    inset 0 0 0 1px rgba(113, 132, 255, 0.42),
    0 12px 24px rgba(107, 124, 241, 0.12);
}

.step-card__index {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  color: #fff;
  background: linear-gradient(135deg, #6f68ff 0%, #59c4f5 100%);
  font-weight: 800;
}

.step-card strong {
  display: block;
  color: #24355c;
  font-size: 15px;
}

.step-card p {
  margin: 6px 0 0;
  color: #70809d;
  font-size: 13px;
  line-height: 1.6;
}

@media (max-width: 1100px) {
  .start-page__content {
    grid-template-columns: 1fr;
    padding: 28px 20px 32px;
  }

  .hero-card {
    padding: 30px 24px;
  }

  .preview-panel__layout {
    grid-template-columns: 1fr;
  }

  .preview-panel__steps {
    order: -1;
  }
}

@media (max-width: 680px) {
  .start-page__content {
    gap: 20px;
    padding: 18px 14px 24px;
  }

  .hero-card,
  .preview-panel {
    border-radius: 22px;
  }

  .hero-card__title {
    font-size: 34px;
  }

  .hero-card__subtitle {
    font-size: 16px;
  }

  .preview-panel__status {
    grid-template-columns: 1fr;
  }

  .preview-panel__timer {
    justify-self: flex-start;
  }
}

/* Puzzle app showcase refresh */
.start-page {
  background:
    radial-gradient(circle at 18% 72%, rgba(255, 213, 79, 0.26), transparent 17%),
    radial-gradient(circle at 78% 18%, rgba(39, 194, 165, 0.18), transparent 18%),
    linear-gradient(180deg, #f5f5f2 0%, #ededeb 100%);
}

.start-page::before,
.start-page::after {
  content: '';
  position: absolute;
  z-index: 0;
  border-radius: 18px;
  transform: rotate(-12deg);
  box-shadow:
    42px 30px 0 #3db4ff,
    88px -16px 0 #ffca3a,
    136px 26px 0 #34c59c;
}

.start-page::before {
  width: 34px;
  height: 34px;
  left: 72px;
  top: 86px;
  background: #ff6b57;
}

.start-page::after {
  width: 28px;
  height: 28px;
  right: 220px;
  bottom: 110px;
  background: #ffca3a;
  transform: rotate(16deg);
}

.start-page__glow {
  display: none;
}

.hero-card,
.preview-panel {
  border: 1px solid #e8e8e2;
  border-radius: 24px;
  background: #ffffff;
  box-shadow: 0 18px 44px rgba(23, 25, 30, 0.08);
  backdrop-filter: none;
}

.hero-card {
  position: relative;
  overflow: hidden;
}

.hero-card::after {
  content: '';
  position: absolute;
  right: -34px;
  bottom: -28px;
  width: 118px;
  height: 118px;
  border-radius: 28px;
  background:
    radial-gradient(circle at 50% 0, #ffffff 0 18px, transparent 19px),
    linear-gradient(135deg, #ffd54f, #ff8f70);
  transform: rotate(10deg);
}

.hero-card__badge {
  background: #f1f1ed;
  color: #111111;
}

.hero-card__title {
  color: #111111;
  letter-spacing: 0;
}

.hero-card__subtitle,
.preview-panel__status-text span {
  color: #6f6f68;
}

.primary-btn {
  color: #111111;
  background: #ffd54f;
  box-shadow: 0 12px 22px rgba(255, 213, 79, 0.28);
}

.secondary-btn {
  color: #111111;
  background: #ffffff;
  box-shadow: inset 0 0 0 1px #dfdfd7;
}

.hero-card__highlights li {
  color: #202020;
  background: #f5f5f1;
  box-shadow: inset 0 0 0 1px #e3e3dc;
}

.preview-panel__board,
.preview-panel__status,
.step-card {
  background: #fbfbf8;
  box-shadow: inset 0 0 0 1px #e6e6df;
}

.preview-panel__avatar,
.step-card__index {
  color: #111111;
  background: #6ee0c2;
}

.preview-panel__timer {
  color: #111111;
  background: #ffd54f;
}

.preview-panel__piece {
  border-radius: 16px;
  box-shadow: inset 0 0 0 1px rgba(17, 17, 17, 0.05);
}

.preview-panel__piece--1 {
  background: linear-gradient(135deg, #c8f4f1, #aee8ff);
}

.preview-panel__piece--2 {
  background: linear-gradient(135deg, #ffe59a, #ffd3a5);
}

.preview-panel__piece--3 {
  background: linear-gradient(135deg, #b8ebcc, #e3f7b4);
}

.preview-panel__piece--4 {
  background: linear-gradient(135deg, #ffd0dc, #e5d4ff);
}
</style>
