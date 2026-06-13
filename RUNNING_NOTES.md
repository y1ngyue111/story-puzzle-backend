# 当前可运行版本说明

## 本地地址
- 前端：http://127.0.0.1:5173
- 后端：http://127.0.0.1:3000

## 启动方式
### 前端
cd frontend
npm run dev

### 后端
cd backend
npm run dev

## 当前已打通流程
- 玩家输入文字/语音
- 前端调用 /api/story/text
- 后端调用阿里云文生图
- 图片保存到 /uploads/images
- 前端加载图片并开始拼图

## 注意事项
- 本地联调前先关闭 VPN / Clash / Surge / 代理插件
- 优先使用 127.0.0.1，不要用 localhost
- backend/.env 中需要正确配置阿里云 API Key 和模型名
