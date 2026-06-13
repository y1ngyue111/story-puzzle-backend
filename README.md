# Story Game

一个基于 Vue 3 + Vite + Express + Socket.io 的多人故事拼图游戏原型。主持人创建房间后，玩家加入房间，通过文字或语音输入故事；后端根据故事生成绘本风图片，前端把图片作为拼图素材，并通过 Socket.io 同步房间、发言人、语音状态和拼图状态。

## 当前本地地址

- 前端：http://127.0.0.1:5173
- 后端：http://127.0.0.1:3000

## 技术栈

- 前端：Vue 3、Vite、Vue Router、Pinia、Vant、Axios、Socket.io Client
- 后端：Node.js、Express、Socket.io、Multer、Axios、dotenv
- 图像生成：默认优先使用 OpenAI Images API；未配置 OpenAI Key 时回退到阿里云 DashScope / 通义万相；都不可用时回退到 Picsum 随机图

## 主要功能

- 主持人进入准备页并管理房间。
- 玩家通过房间号加入游戏。
- 房间内维护玩家列表、当前发言人、语音状态、拼图图片和拼图格子状态。
- 玩家提交故事文本后，后端调用图像生成服务，返回图片地址并广播到房间。
- 前端基于生成图片初始化拼图，并通过 Socket.io 同步拼图状态。
- 语音识别接口当前为占位实现，会返回示例文本。

## 目录结构

```text
.
├── backend
│   ├── server.js              # 当前实际启动的后端入口
│   ├── app.js                 # 另一份后端应用入口草稿/历史版本
│   ├── routes                 # 拆分路由文件
│   ├── controllers            # 控制器文件
│   ├── services               # 语音、图像等服务封装
│   ├── uploads                # 本地上传的图片与录音文件
│   └── .env                   # 后端环境变量
├── frontend
│   ├── src
│   │   ├── views/Stage1       # 主持人、玩家、房间、拼图相关页面
│   │   ├── components         # 拼图、录音、房间、通用组件
│   │   ├── router             # Vue Router 配置
│   │   ├── store              # Pinia 状态
│   │   └── utils              # API、设备、图片、语音等工具
│   ├── vite.config.js         # Vite 配置，含 /api 代理到后端
│   └── package.json
├── RUNNING_NOTES.md           # 原始运行备注
└── package.json               # 根目录依赖，不是主启动入口
```

## 启动方式

先启动后端：

```bash
cd /Users/Rosaone/Documents/Playground/story-game-backup-2026-03-25/backend
npm start
```

再启动前端：

```bash
cd /Users/Rosaone/Documents/Playground/story-game-backup-2026-03-25/frontend
npm run dev -- --host 127.0.0.1
```

浏览器打开：

```text
http://127.0.0.1:5173/
```

注意：当前后端 `package.json` 只有 `start` 脚本，没有 `dev` 脚本；如果看到旧备注里的 `npm run dev`，后端请改用 `npm start`。

## 环境变量

后端环境变量放在 `backend/.env`。当前项目会读取以下变量名：

```text
PORT
FRONT_ORIGIN
MONGO_URL
MONGO_URL_ATLAS
TENCENT_SECRET_ID
TENCENT_SECRET_KEY
TTENCENT_REGION
ALI_IMAGE_API_KEY
ALI_IMAGE_MODEL
ALI_IMAGE_STYLE
ALI_IMAGE_API_URL
IMAGE_PROVIDER
OPENAI_API_KEY
OPENAI_IMAGE_MODEL
OPENAI_IMAGE_SIZE
OPENAI_IMAGE_QUALITY
IMAGE_SAVE_PATH
RECORD_SAVE_PATH
```

当前实际启动入口 `backend/server.js` 主要使用：

- `IMAGE_PROVIDER`：图像服务提供商，默认 `openai`；如果 OpenAI 不可用会回退到阿里云/Picsum。
- `OPENAI_API_KEY`：OpenAI API Key。
- `OPENAI_IMAGE_MODEL`：OpenAI 图像模型，默认值为 `gpt-image-1.5`。
- `OPENAI_IMAGE_SIZE`：默认值为 `1536x1024`，适合横向拼图画布。
- `OPENAI_IMAGE_QUALITY`：默认值为 `high`。
- `ALI_IMAGE_API_KEY`：阿里云图像生成 API Key。
- `ALI_IMAGE_MODEL`：图像生成模型，默认值为 `wan2.6-t2i`。

如果没有配置 `OPENAI_API_KEY`，后端会继续尝试使用 `ALI_IMAGE_API_KEY`；如果阿里云 Key 也不可用，后端会使用 `https://picsum.photos` 生成兜底图片，便于本地流程继续跑通。

## 前端路由

项目使用 Hash 路由，常用页面包括：

- `/#/player-mobile`：默认游戏入口，语音、生图、拼图都在这个页面完成
- `/#/host`：主持人准备页，旧多人房间流程保留入口
- `/#/player`：玩家加入入口
- `/#/room-manage`：房间管理页
- `/#/player-page`：玩家个人中心
- `/#/story-followup-voice`：故事补充提问页

根路径 `/` 会重定向到 `/player-mobile`。

## 后端接口

当前 `backend/server.js` 提供的主要接口：

- `POST /api/asr`：语音识别占位接口，接收 `audio` 文件字段，返回示例识别文本。
- `POST /api/story`：根据故事文本生成图片。
  - 请求体：`{ roomCode, playerName, storyText }`
  - 返回：`{ code, data: { imageUrl, roomCode, playerName, storyText } }`
- `POST /api/room/create`：创建内存房间。
- `POST /api/room/join`：玩家加入内存房间。
- `GET /api/room/:roomCode`：获取单个房间信息。
- `GET /api/rooms`：返回当前内存中的房间列表。

前端 API 地址由 `frontend/src/utils/api/base.js` 统一生成。默认会使用当前页面 hostname 的 `3000` 端口，例如 iPad 打开 `http://192.168.1.8:5173` 时会请求 `http://192.168.1.8:3000`。也可以通过 `VITE_API_BASE` 显式指定后端地址：

```bash
VITE_API_BASE=http://192.168.1.8:3000 npm run dev -- --host 0.0.0.0
```

## Socket.io 事件

后端维护内存态 `rooms`，结构大致如下：

```js
{
  [roomCode]: {
    players: [{ socketId, name }],
    currentSpeakerId: null,
    puzzleImageUrl: '',
    puzzleCells: [],
    voiceStatus: 'idle'
  }
}
```

当前支持的主要事件：

- `join_room`：玩家加入房间。
- `hostJoinRoom`：兼容当前主持人页加入房间。
- `get_rooms` / `rooms_list`：兼容当前房间列表页获取房间列表。
- `create_room`：兼容当前房间列表页创建房间。
- `switch_speaker`：切换当前发言人。
- `update_puzzle`：同步拼图格子和图片地址。
- `update_voice_status`：同步语音录制状态。
- `room_state`：服务端广播房间状态。

## 当前注意事项

- 语音识别接口 `/api/asr` 仍是占位实现，还没有接入真实 ASR。
- 后端房间数据存储在内存里，服务重启后房间状态会丢失。
- 项目里同时存在 `backend/server.js`、`backend/app.js`、`backend/src/config/server.js` 等后端入口/配置草稿；当前 `npm start` 实际运行的是 `backend/server.js`。
- iPad 联调时，需要让 iPad 和开发机处在同一局域网，并用开发机局域网 IP 打开前端页面。

## 建议下一步

- 将后端接口统一到拆分后的 `routes/controllers/services` 结构，减少 `server.js` 体积。
- 为后端增加 `dev` 脚本，例如使用 `nodemon`。
- 将房间状态持久化到数据库，或至少增加房间过期清理。
- 接入真实语音识别服务，并补充失败兜底逻辑。
