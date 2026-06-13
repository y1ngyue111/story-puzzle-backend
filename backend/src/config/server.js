// server.js
require('dotenv').config()
const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
const multer = require('multer')
const axios = require('axios')

const app = express()
const server = http.createServer(app)

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173'

const io = new Server(server, {
  cors: {
    origin: FRONTEND_ORIGIN,
    methods: ["GET","POST"],
    credentials: true
  }
})

app.use(cors({
  origin: FRONTEND_ORIGIN,
  credentials: true
}))
app.use(express.json())

const upload = multer({ storage: multer.memoryStorage() })

// 内存房间存储
const rooms = {}

function buildPrompt(storyText) {
  return `请把下面的故事画成一张温柔、治愈、绘本风插画：${storyText}`
}

async function generateImageByText(storyText) {
  const apiKey = process.env.ALI_IMAGE_API_KEY
  if (!apiKey) return `https://picsum.photos/seed/${encodeURIComponent(storyText)}/800/800`

  try {
    const resp = await axios.post(
      'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation',
      {
        model: process.env.ALI_IMAGE_MODEL || 'wan2.6-t2i',
        input: { messages: [{ role: 'user', content: [{ text: buildPrompt(storyText) }] }] },
        parameters: { prompt_extend: true, watermark: false, n: 1, size: '1024*1024' }
      },
      { timeout: 180000, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` } }
    )

    const imageUrl = resp.data?.output?.choices?.[0]?.message?.content?.find?.(x => x.image)?.image
                  || resp.data?.output?.images?.[0]?.url
                  || resp.data?.output?.results?.[0]?.url

    if (!imageUrl) throw new Error('阿里云未返回图片地址')
    return imageUrl
  } catch (err) {
    console.error('[AliGen] fallback picsum:', err.message)
    return `https://picsum.photos/seed/${encodeURIComponent(storyText)}/800/800`
  }
}

// ----------------- Socket -----------------
io.on('connection', socket => {
  console.log('Socket connected:', socket.id)

  socket.on('join_room', ({ roomCode, playerName }) => {
    if (!rooms[roomCode]) {
      rooms[roomCode] = { players: [], currentSpeakerId: null, puzzleImageUrl: '', puzzleCells: [], voiceStatus: 'idle' }
    }
    const room = rooms[roomCode]

    if (!room.players.find(p => p.socketId === socket.id)) {
      room.players.push({ socketId: socket.id, name: playerName })
    }
    if (!room.currentSpeakerId) room.currentSpeakerId = socket.id

    socket.join(roomCode)
    io.to(roomCode).emit('room_state', room)
    console.log(`${playerName} joined room ${roomCode}`)
  })

  socket.on('switch_speaker', ({ roomCode, nextSocketId }) => {
    const room = rooms[roomCode]
    if (!room) return
    room.currentSpeakerId = nextSocketId
    room.voiceStatus = 'idle'
    io.to(roomCode).emit('room_state', room)
  })

  socket.on('update_puzzle', ({ roomCode, puzzleCells, puzzleImageUrl }) => {
    const room = rooms[roomCode]
    if (!room) return
    if (Array.isArray(puzzleCells)) room.puzzleCells = puzzleCells
    if (puzzleImageUrl) room.puzzleImageUrl = puzzleImageUrl
    io.to(roomCode).emit('room_state', room)
  })

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
        if (room.currentSpeakerId === socket.id) room.currentSpeakerId = room.players[0]?.socketId || null
        io.to(roomCode).emit('room_state', room)
      }
    }
    console.log('Socket disconnected:', socket.id)
  })
})

// ----------------- ASR & story -----------------
app.post('/api/asr', upload.single('audio'), (req,res) => {
  res.json({ code:200, data:{ text:'这里是识别后的文字示例' } })
})

app.post('/api/story', async (req,res) => {
  try {
    const { roomCode, storyText } = req.body
    if (!roomCode || !storyText) return res.status(400).json({ code:400, message:'缺少 roomCode 或 storyText' })

    if (!rooms[roomCode]) rooms[roomCode] = { players:[], currentSpeakerId:null, puzzleImageUrl:'', puzzleCells:[], voiceStatus:'idle' }

    const imageUrl = await generateImageByText(storyText)
    const room = rooms[roomCode]
    room.puzzleImageUrl = imageUrl
    room.puzzleCells = Array.from({ length: 9 }, (_,i)=>i)

    io.to(roomCode).emit('room_state', room)
    res.json({ code:200, data:{ imageUrl } })
  } catch(err) {
    console.error('/api/story error:', err)
    res.status(500).json({ code:500, message:'生成图片失败' })
  }
})

server.listen(3000, () => console.log('Backend running on http://127.0.0.1:3000'))