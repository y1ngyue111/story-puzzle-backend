import { createRouter, createWebHashHistory } from 'vue-router'

// 1️⃣ 懒加载页面组件
const HostPrepare = () => import('@/views/Stage1/HostPrepare.vue')        // 主持人创建房间
const PlayerJoin = () => import('@/views/Stage1/PlayerJoin.vue')          // 玩家入口页
const RoomManage = () => import('@/views/Stage1/RoomManage.vue')          // 大屏房间管理
const PlayerMobile = () => import('@/views/Stage1/MemoPuzzleEmotionPreview.vue') // 情绪精灵视觉重构页
const PlayerPage = () => import('@/views/Stage1/PlayerPage.vue')          // 玩家个人中心
const StoryFollowUpVoice = () => import('@/views/Stage1/StoryFollowUpVoice.vue') // 补充提问页
const StartPage = () => import('@/views/Stage1/StartPage.vue')            // 项目开始页
const PortfolioShowcase = () => import('@/views/Stage1/PortfolioShowcase.vue') // 作品集展示流程
const PortfolioScreen = () => import('@/views/Stage1/PortfolioScreen.vue') // 作品集独立展示页
const GuidedPanelStates = () => import('@/views/Stage1/GuidedPanelStates.vue') // 任务面板状态案例页

// 2️⃣ 路由配置
const routes = [
  // 根路径进入开始页
  {
    path: '/',
    name: 'StartPage',
    component: StartPage,
    meta: { title: '故事拼图开始页' }
  },

  // 主持人创建房间页
  {
    path: '/host',
    name: 'HostPrepare',
    component: HostPrepare,
    meta: { title: '主持人准备' }
  },

  // 玩家加入入口页
  {
    path: '/player',
    name: 'PlayerJoin',
    component: PlayerJoin,
    meta: { title: '玩家入口' }
  },

  // 房间管理页（大屏）
  {
    path: '/room-manage',
    name: 'RoomManage',
    component: RoomManage,
    meta: { title: '房间管理' },
    props: route => ({
      roomCode: route.query.roomCode,
      hostName: route.query.hostName
    })
  },

  // 补充提问页
  {
    path: '/story-followup-voice',
    name: 'StoryFollowUpVoice',
    component: StoryFollowUpVoice,
    meta: { title: '故事补充提问' },
    props: route => ({
      roomCode: route.query.roomCode,
      playerName: route.query.playerName,
      storyText: route.query.storyText
    }),
    beforeEnter: (to, _from, next) => {
      const { roomCode, playerName, storyText } = to.query
      if (roomCode && playerName && storyText) next()
      else next({ path: '/player-mobile', query: { roomCode, playerName } })
    }
  },

  // 手机端拼图页
  {
    path: '/player-mobile',
    name: 'PlayerMobile',
    component: PlayerMobile,
    meta: { title: '拼图游戏' },
    props: route => ({
      roomCode: route.query.roomCode,
      playerName: route.query.playerName
    })
  },

  // 作品集展示流程页
  {
    path: '/portfolio-showcase',
    name: 'PortfolioShowcase',
    component: PortfolioShowcase,
    meta: { title: '作品集展示流程' }
  },
  {
    path: '/portfolio-ready',
    name: 'PortfolioReady',
    component: PortfolioScreen,
    meta: { title: '作品集展示：准备加入', portfolioKind: 'ready' }
  },
  {
    path: '/portfolio-generating',
    name: 'PortfolioGenerating',
    component: PortfolioScreen,
    meta: { title: '作品集展示：AI 生成等待', portfolioKind: 'generating' }
  },
  {
    path: '/portfolio-complete',
    name: 'PortfolioComplete',
    component: PortfolioScreen,
    meta: { title: '作品集展示：完成回看', portfolioKind: 'complete' }
  },
  {
    path: '/portfolio-gallery',
    name: 'PortfolioGallery',
    component: PortfolioScreen,
    meta: { title: '作品集展示：作品回顾', portfolioKind: 'gallery' }
  },
  {
    path: '/panel-states',
    name: 'GuidedPanelStates',
    component: GuidedPanelStates,
    meta: { title: '任务面板状态案例' }
  },

  // 玩家个人中心
  {
    path: '/player-page',
    name: 'PlayerPage',
    component: PlayerPage,
    meta: { title: '个人中心' },
    props: route => ({ playerName: route.query.playerName }),
    beforeEnter: (to, _from, next) => to.query.playerName ? next() : next({ path: '/player' })
  },

  // 兜底 404
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    redirect: '/',
    meta: { title: '页面不存在' }
  }
]

// 3️⃣ 创建 router
const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

// 4️⃣ 全局路由守卫：设置标题
router.beforeEach((to, _from, next) => {
  if (to.meta?.title) document.title = to.meta.title
  next()
})

export default router
