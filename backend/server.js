// server.js
const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
const multer = require('multer')
const axios = require('axios')
const dotenv = require('dotenv')

dotenv.config()

const roomRoutes = require('./routes/roomRoutes')
const asrRoutes = require('./routes/asrRoutes')

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: { origin: '*' }
})

app.use(cors())
app.use(express.json())

const upload = multer({ storage: multer.memoryStorage() })

// ----------------- 房间状态 -----------------
const rooms = {}

/**
 * rooms[roomCode] = {
 *   players: [{ socketId, name }],
 *   currentSpeakerId: socketId,
 *   puzzleImageUrl: '',
 *   puzzleCells: [],
 *   voiceStatus: 'idle'
 * }
 */

function ensureRoom(roomCode) {
  if (!rooms[roomCode]) {
    rooms[roomCode] = {
      roomCode,
      hostName: '',
      players: [],
      currentSpeakerId: null,
      puzzleImageUrl: '',
      puzzleCells: [],
      voiceStatus: 'idle'
    }
  }
  return rooms[roomCode]
}

function makeRoomCode() {
  let roomCode = ''
  do {
    roomCode = Math.floor(100000 + Math.random() * 900000).toString()
  } while (rooms[roomCode])
  return roomCode
}

function getPlayerName(player) {
  return player?.playerName || player?.name || '玩家'
}

function serializeRoom(roomCode, room) {
  const players = room.players.map(player => ({
    ...player,
    playerName: getPlayerName(player),
    name: getPlayerName(player)
  }))
  const host = room.hostName || getPlayerName(players[0])
  const currentSpeaker =
    players.find(p => p.socketId && p.socketId === room.currentSpeakerId) ||
    players.find(p => getPlayerName(p) === room.currentSpeakerId) ||
    null

  return {
    roomCode,
    hostName: host || '未分配',
    currentSpeaker: currentSpeaker ? getPlayerName(currentSpeaker) : '未分配',
    playerCount: players.length,
    players,
    puzzleImageUrl: room.puzzleImageUrl,
    puzzleCells: room.puzzleCells,
    voiceStatus: room.voiceStatus,
    gameStatus: room.gameStatus || 'waiting'
  }
}

function listRooms() {
  return Object.entries(rooms).map(([roomCode, room]) => serializeRoom(roomCode, room))
}

function createRoomHandler(req, res) {
  const hostName = (req.body?.hostName || req.body?.playerName || '主持人').trim()
  const roomCode = makeRoomCode()
  const room = ensureRoom(roomCode)
  room.hostName = hostName
  room.gameStatus = 'waiting'

  return res.json({
    code: 200,
    message: '房间创建成功',
    data: serializeRoom(roomCode, room)
  })
}

function joinRoomHandler(req, res) {
  const roomCode = String(req.body?.roomCode || '').trim()
  const playerName = String(req.body?.playerName || '').trim()

  if (!roomCode || !playerName) {
    return res.status(400).json({ code: 400, message: '房间码和玩家昵称不能为空' })
  }

  const room = rooms[roomCode]
  if (!room) {
    return res.status(404).json({ code: 404, message: '房间不存在' })
  }

  if (!room.players.some(player => getPlayerName(player) === playerName)) {
    room.players.push({ socketId: null, name: playerName, playerName, progress: 0, joinedAt: new Date().toISOString() })
  }

  io.to(roomCode).emit('room_state', room)
  io.to(roomCode).emit('playerJoined', serializeRoom(roomCode, room))

  return res.json({
    code: 200,
    message: '加入房间成功',
    data: serializeRoom(roomCode, room)
  })
}

function getRoomInfoHandler(req, res) {
  const roomCode = String(req.params.roomCode || '').trim()
  const room = rooms[roomCode]

  if (!room) {
    return res.status(404).json({ code: 404, message: '房间不存在' })
  }

  return res.json({
    code: 200,
    data: serializeRoom(roomCode, room)
  })
}

app.set('roomHandlers', {
  createRoom: createRoomHandler,
  joinRoom: joinRoomHandler,
  getRoomInfo: getRoomInfoHandler
})

function getPuzzleStylePrompt(puzzleStyle) {
  const stylePrompts = {
    healing: [
      '【风格方向：治愈风】',
      '深色梦幻粉笔插画：以深蓝、墨绿或近黑色背景为底，加入细密点阵网格、柔和手绘线条、轻微发光的星点和彩色光雾。',
      '把故事处理成一张温柔、连续、完整的黑板梦境场景：所有人物、小动物、叶片、星光、蝴蝶、道路、河流、窗边、桌面或生活物件都必须处在同一个空间里，元素之间用粉笔感弧线自然连接。',
      '色彩叠加蓝紫、青绿、暖黄、粉色等梦幻霓虹粉笔色，局部有柔和光晕和彩色流动痕迹，氛围安静、治愈、可爱。',
      '可以出现少量装饰性的光点和手绘弧线，但不要出现可读文字、真实标签、Logo、水印、画框、分隔线或拼贴边界。'
    ],
    abstract: [
      '【风格方向：抽象风】',
      '把故事情绪转化为抽象插画：流动形状、轻盈线条、半透明色面、象征性小物件和富有节奏的空间关系。',
      '保持温柔、明亮、可爱的气质，不要黑暗、尖锐或压迫；抽象但仍要能读出故事的情绪线索。',
      '画面必须是一张连续的完整抽象场景，区域之间自然过渡；不要把画面做成独立小格、图标集合、贴纸拼贴或多张小插画。'
    ],
    'color-block': [
      '【风格方向：色块风】',
      '使用扁平插画和清晰色块：轮廓明确、形状简洁、边界干净、层次分明，像适合儿童绘本和拼图的现代图形插画。',
      '保留故事中的关键环境和小物件，用清楚的色块组织前景、中景、远景，提升拼图辨识度。',
      '色彩明快但不刺眼，可以使用温柔绿色、蓝色、粉色、黄色和少量对比色；不要照片感、复杂噪点或混乱纹理。'
    ]
  }

  return stylePrompts[puzzleStyle] || stylePrompts.healing
}

function buildCompanionContextPrompt(companionContext = {}) {
  const visual = String(companionContext.visual || '').trim()
  const emotion = String(companionContext.emotion || '').trim()
  const narrator = String(companionContext.narrator || '').trim()
  const rounds = Array.isArray(companionContext.rounds)
    ? companionContext.rounds
        .map((round, index) => ({
          index: Number(round?.index) || index + 1,
          visual: String(round?.visual || '').trim(),
          emotion: String(round?.emotion || '').trim(),
          narrator: String(round?.narrator || '').trim()
        }))
        .filter((round) => round.visual || round.emotion || round.narrator)
    : []

  if (!rounds.length && !visual && !emotion && !narrator) return []

  const lines = ['【同伴提问补充】']
  if (rounds.length) {
    rounds.forEach((round) => {
      lines.push(`第 ${round.index} 轮同伴问答：`)
      if (round.visual) lines.push(`- 画面描述式提问/补充：${round.visual}`)
      if (round.emotion) lines.push(`- 感受描述式提问/补充：${round.emotion}`)
      if (round.narrator) lines.push(`- 讲述者回应：${round.narrator}`)
    })
    lines.push('请综合多轮问答，把反复出现或被讲述者确认的地点、物件、远近关系、情绪和氛围优先画进画面。')
  }
  if (!rounds.length && visual) {
    lines.push(`画面描述式补充：${visual}`)
    lines.push('请优先把这些地点、物件、远近关系和可见细节自然画进画面。')
  }
  if (!rounds.length && emotion) {
    lines.push(`感受描述式补充：${emotion}`)
    lines.push('请把这些情绪转化为色彩、光线、空间氛围和角色姿态，不要写成文字。')
  }
  if (!rounds.length && narrator) {
    lines.push(`讲述者补充说明：${narrator}`)
    lines.push('这部分是讲述者对同伴问题的回应，请优先用于修正故事画面中的关键细节、时间、地点、人物关系和情绪重点。')
  }

  return [...lines, '']
}

function buildPrompt(storyText, puzzleStyle = 'healing', companionContext = {}) {
  const story = (storyText || '').trim() || '一个温暖、安静、带有陪伴感的日常小故事'
  const stylePrompt = getPuzzleStylePrompt(puzzleStyle)
  const companionPrompt = buildCompanionContextPrompt(companionContext)

  return [
    '请把下面的生活故事转化为一张高质量治愈系手绘动画插画，适合做成多人协作拼图。',
    '',
    '【故事内容】',
    story,
    '',
    ...companionPrompt,
    '【核心风格】',
    ...stylePrompt,
    '整体应该像一张完整的动画背景插画，而不是照片、海报、游戏截图、分镜图或拼贴画。',
    '这张图会由前端在生成之后自动切成 4x4 拼图，所以原始图片本身绝对不要画拼图格子、分隔线、边框、卡片、小画框或多张独立小图。',
    '',
    '【角色与情绪】',
    '角色造型圆润可爱，表情简单克制，动作自然，有陪伴感。',
    '如果画面中出现人类角色，必须画出完整、友好、清楚的头发轮廓和五官：柔和的眼睛、眉毛、小鼻子、自然嘴巴；脸部不能是空白面具，不能没有头发，不能只有一块肤色脸。',
    '人物可以画得小、简洁、可爱，但脸部必须有可读的表情和发型，优先使用温柔的侧脸、背影带头发轮廓，或远景中仍能识别的卡通五官。',
    '如果模型难以稳定画人物，请减少人物正脸面积，用小动物、背影、侧影或戴帽子的温柔角色替代，但不要生成无脸、无发、空洞眼神的人形。',
    '如果故事里没有明确人物，可以用小动物、植物、路灯、窗边、书本、零食、杯子、桌椅、布料、手作物等温柔生活元素承接故事。',
    '情绪要松弛、善意、安静、明亮，不要夸张煽情。',
    '',
    '【画面与构图】',
    '必须是一张单一连续场景：同一时间、同一空间、同一透视关系，画面元素共享统一光源和统一地面/桌面/室内空间。',
    '不要把不同物件分别放进一个个独立格子里；不要生成九宫格、四宫格、漫画分镜、相册拼贴、贴纸集合、物品陈列板。',
    '必须使用远景或中远景，不要近景特写，不要半身肖像，不要只画一个主体的大头画面。',
    '使用广角环境叙事构图，让人物或动物只是画面中的一部分，周围要有丰富的场景内容。',
    '构图完整、清晰、稳定，前景、中景、远景都要有内容，形成空间层次。',
    '适合后续切成 4x4 拼图：同一连续场景的不同位置都要有可识别细节，不要出现大面积空白。',
    '推荐横向构图，保留适量环境空间，让画面像一页可爱的治愈动画场景；环境空间必须由人物、物件、植物、室内陈设或街景细节填充。',
    '画面内容要更丰富：可以加入道路、房屋、树木、花草、远处山丘、河流、窗户、桌椅、小动物、生活物件等，但必须自然服务故事。',
    '不要把天空、云、云海、大片空旷背景作为主要画面。天空最多只能作为很小的背景缝隙或窗外点缀，不能占据画面主体区域。',
    '',
    '【色彩与光线】',
    '自然柔光，清晨或午后感，避免强逆光、硬阴影、强对比。',
    '',
    '【细节】',
    '增加小花、小草、树叶、窗光、小动物、点心、布料、书本、手作物、温柔生活物件等细节。',
    '让画面不同区域都有属于同一个场景的小细节，适合玩家在拼图过程中辨认位置。',
    '细节要服务故事，不要堆砌，不要让主体占据画面过大比例。',
    '',
    '【严格禁止】',
    '不要文字、不要水印、不要 Logo、不要二维码、不要边框。',
    '不要拼图格子、不要网格分割、不要分镜、不要漫画格、不要照片墙、不要相册拼贴、不要多张小插画、不要贴纸集合、不要独立物件陈列。',
    '不要近景特写、不要头像构图、不要单一主体占满画面。',
    '不要大面积天空、不要大面积云朵、不要云海、不要以云层或空旷天空作为主要背景，天空和云不能超过画面的 10%。',
    '不要写实照片、不要 3D 塑料质感、不要赛博朋克、不要暗黑恐怖、不要电影海报强光影。',
    '不要无脸人物、不要空白脸、不要没有头发的人形、不要面具脸、不要空洞眼神、不要诡异微笑。',
    '不要畸形手指、不要多余肢体、不要崩坏五官、不要怪异表情。'
  ].join('\n')
}

async function generateImageByText(storyText, puzzleStyle = 'healing', companionContext = {}) {
  const imageProvider = (process.env.IMAGE_PROVIDER || 'openai').toLowerCase()
  if (imageProvider === 'openai') {
    try {
      return await generateOpenAIImageByText(storyText, puzzleStyle, companionContext)
    } catch (err) {
      console.error('[OpenAI Image] failed, fallback Ali/Picsum:', err.message)
    }
  }

  const apiKey = process.env.ALI_IMAGE_API_KEY
  const model = process.env.ALI_IMAGE_MODEL || 'wan2.6-t2i'

  if (!apiKey) {
    console.log('[AliGen] no key, fallback picsum')
    return `https://picsum.photos/seed/${encodeURIComponent(storyText)}/1024/1024`
  }

  try {
    const resp = await axios.post(
      'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation',
      {
        model,
        input: {
          messages: [
            {
              role: 'user',
              content: [
                {
                  text: buildPrompt(storyText, puzzleStyle, companionContext)
                }
              ]
            }
          ]
        },
        parameters: {
          prompt_extend: true,
          watermark: false,
          n: 1,
          size: '1024*1024',
          negative_prompt:
            'grid, panel layout, comic panels, storyboard, collage, photo wall, album collage, sticker sheet, multiple separate illustrations, isolated object collection, divided frames, split screen, puzzle grid drawn in image, jigsaw grid, tile borders, card borders, large sky, wide open sky, huge sky area, clouds dominating the image, cloudscape, sea of clouds, empty sky background, sky occupying more than 10 percent, faceless person, blank face, missing facial features, missing hair, bald faceless character, mask face, empty eyes, uncanny face, scary smile, realistic photo, dramatic lighting, harsh contrast, strong backlight, heavy shadow, cinematic poster, 3d render, plastic texture, glossy surface, metallic reflection, dark mood, horror mood, dirty background, oversaturated colors, messy composition, low quality, blurry, bad anatomy, extra fingers, extra limbs, distorted face, scary expression, text, watermark, logo, frame'
        }
      },
      {
        timeout: 180000,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        }
      }
    )

    console.log('[AliGen] raw response =', JSON.stringify(resp.data, null, 2))

    const imageUrl =
      resp.data?.output?.choices?.[0]?.message?.content?.find?.((x) => x.image)?.image ||
      resp.data?.output?.choices?.[0]?.message?.content?.[0]?.image ||
      resp.data?.output?.images?.[0]?.url ||
      resp.data?.output?.results?.[0]?.url

    if (!imageUrl) {
      throw new Error('阿里云未返回图片地址')
    }

    console.log('[AliGen] success:', imageUrl)
    return imageUrl
  } catch (err) {
    const aliError = err.response?.data
    console.error('[AliGen] failed:', aliError || err.message)

    if (aliError?.code === 'Arrearage') {
      throw new Error('阿里云生图账户欠费或不可用，请先检查 Model Studio 账户状态')
    }
    if (err.response?.status === 429) {
      throw new Error('阿里云生图服务请求过多，请稍后再试')
    }
    if (err.response?.status === 400) {
      throw new Error(`阿里云生图请求被拒绝：${aliError?.message || '请检查 prompt 或模型参数'}`)
    }

    throw new Error(aliError?.message || err.message || '阿里云生图失败')
  }
}

async function generateOpenAIImageByText(storyText, puzzleStyle = 'healing', companionContext = {}) {
  const apiKey = process.env.OPENAI_API_KEY
  const model = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1.5'
  const size = process.env.OPENAI_IMAGE_SIZE || '1536x1024'
  const quality = process.env.OPENAI_IMAGE_QUALITY || 'high'

  if (!apiKey) {
    throw new Error('缺少环境变量 OPENAI_API_KEY')
  }

  const prompt = buildPrompt(storyText, puzzleStyle, companionContext)

  const resp = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      prompt,
      size,
      quality,
      n: 1
    })
  })

  const data = await resp.json()
  if (!resp.ok) {
    throw new Error(data?.error?.message || `OpenAI image request failed: ${resp.status}`)
  }

  const image = data?.data?.[0]
  if (image?.b64_json) {
    return `data:image/png;base64,${image.b64_json}`
  }
  if (image?.url) {
    return image.url
  }

  throw new Error('OpenAI 未返回图片数据')
}

// ----------------- Socket.io -----------------
io.on('connection', socket => {
  console.log('Socket connected:', socket.id)

  // 加入房间
  socket.on('join_room', ({ roomCode, playerName }) => {
    if (!roomCode) return

    const room = ensureRoom(roomCode)

    if (!room.players.find(p => p.socketId === socket.id)) {
      const name = playerName || '玩家'
      room.players.push({ socketId: socket.id, name, playerName: name })
    }

    // 第一个加入的人作为当前发言人
    if (!room.currentSpeakerId) {
      room.currentSpeakerId = socket.id
    }

    socket.join(roomCode)
    io.to(roomCode).emit('room_state', room)
    console.log(`${playerName} 加入房间 ${roomCode}`)
  })

  socket.on('hostJoinRoom', (roomCode) => {
    if (!roomCode) return
    const room = ensureRoom(roomCode)
    socket.join(roomCode)
    socket.emit('room_state', room)
  })

  socket.on('get_rooms', () => {
    socket.emit('rooms_list', listRooms())
  })

  socket.on('create_room', ({ playerName } = {}, callback) => {
    const roomCode = makeRoomCode()
    const room = ensureRoom(roomCode)
    const name = playerName || '玩家'
    room.hostName = name
    room.players.push({ socketId: socket.id, name, playerName: name })
    socket.join(roomCode)
    if (typeof callback === 'function') callback(roomCode)
    io.emit('rooms_list', listRooms())
  })

  // 切换发言人
  socket.on('switch_speaker', ({ roomCode, nextSocketId }) => {
    const room = rooms[roomCode]
    if (!room) return

    room.currentSpeakerId = nextSocketId
    room.voiceStatus = 'idle'
    io.to(roomCode).emit('room_state', room)
  })

  // 拼图状态同步
  socket.on('update_puzzle', ({ roomCode, puzzleCells, puzzleImageUrl }) => {
    const room = rooms[roomCode]
    if (!room) return

    if (Array.isArray(puzzleCells)) {
      room.puzzleCells = puzzleCells
    }
    if (puzzleImageUrl) {
      room.puzzleImageUrl = puzzleImageUrl
    }

    io.to(roomCode).emit('room_state', room)
  })

  // 语音状态同步
  socket.on('update_voice_status', ({ roomCode, voiceStatus }) => {
    const room = rooms[roomCode]
    if (!room) return

    room.voiceStatus = voiceStatus
    io.to(roomCode).emit('room_state', room)
  })

  socket.on('disconnect', () => {
    for (const roomCode in rooms) {
      const room = rooms[roomCode]
      const idx = room.players.findIndex(p => p.socketId === socket.id)

      if (idx >= 0) {
        room.players.splice(idx, 1)

        if (room.currentSpeakerId === socket.id) {
          room.currentSpeakerId = room.players[0]?.socketId || null
        }

        io.to(roomCode).emit('room_state', room)
      }
    }

    console.log('Socket disconnected:', socket.id)
  })
})

// ----------------- API -----------------

app.use('/api/asr', asrRoutes)
app.use('/api/room', roomRoutes)

// 根据故事生成图片，并广播给整个房间
app.post('/api/story', async (req, res) => {
  try {
    const { roomCode, playerName, storyText, puzzleStyle = 'healing', companionContext = {} } = req.body

    if (!roomCode || !storyText) {
      return res.status(400).json({
        code: 400,
        message: '缺少 roomCode 或 storyText'
      })
    }

    const room = ensureRoom(roomCode)

    const imageUrl = await generateImageByText(storyText, puzzleStyle, companionContext)

    // 这里只写“完整图”，不要在这里随机打乱
    // 打乱拼图的动作交给前端当前发言人 initPuzzle 后再同步
    room.puzzleImageUrl = imageUrl

    io.to(roomCode).emit('room_state', room)

    return res.json({
      code: 200,
      data: {
        imageUrl,
        roomCode,
        playerName,
        storyText,
        companionContext,
        puzzleStyle
      }
    })
  } catch (err) {
    console.error('/api/story error:', err)
    return res.status(500).json({
      code: 500,
      message: err.message || '生成图片失败'
    })
  }
})

// 获取所有房间，方便房间列表页使用
app.get('/api/rooms', (_req, res) => {
  res.json({
    code: 200,
    data: listRooms()
  })
})

// ----------------- 启动服务 -----------------
const PORT = 3000
server.listen(PORT, () => {
  console.log(`Backend server running on http://127.0.0.1:${PORT}`)
})
