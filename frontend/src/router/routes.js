// src/router/index.js
import { createRouter, createWebHashHistory } from 'vue-router'

// 使用相对路径（避免 @ 别名问题）
const HostPrepare = () => import('../views/Stage1/HostPrepare.vue')
const PlayerJoin   = () => import('../views/Stage1/PlayerJoin.vue')
const RoomManage   = () => import('../views/Stage1/RoomManage.vue')
const PlayerMobile = () => import('../views/Stage1/PlayerMobile.vue')
const PlayerPage   = () => import('../views/Stage1/PlayerPage.vue')
const GamePuzzle   = () => import('../views/Stage1/GamePuzzle.vue')

const routes = [
  { path: '/', redirect: '/player-mobile' },
  { path: '/host', name: 'HostPrepare', component: HostPrepare },
  { path: '/player', name: 'PlayerJoin', component: PlayerJoin },
  { path: '/room-manage', name: 'RoomManage', component: RoomManage },
  { path: '/player-mobile', name: 'PlayerMobile', component: PlayerMobile },
  { path: '/player-page', name: 'PlayerPage', component: PlayerPage },
  { path: '/game-puzzle', name: 'GamePuzzle', component: GamePuzzle },
  { path: '/:pathMatch(.*)*', redirect: '/player-mobile' }
]

export default createRouter({
  history: createWebHashHistory(),
  routes
})
