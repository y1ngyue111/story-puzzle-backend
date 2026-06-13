// src/main.js
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'

// ✅ 按需注册：补上 Switch
import { Button, NavBar, Field, Popup, Toast, Loading, Switch } from 'vant'
import 'vant/lib/index.css'

const app = createApp(App)
const pinia = createPinia()

app.use(router)
  .use(pinia)
  .use(Button)
  .use(NavBar)
  .use(Field)
  .use(Popup)
  .use(Toast)
  .use(Loading)
  .use(Switch) // ✅ 新增

app.mount('#app')