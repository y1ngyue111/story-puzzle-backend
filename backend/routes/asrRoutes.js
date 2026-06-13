// backend/routes/asrRoutes.js
const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const fs = require('fs')

// 后端音频处理服务
const { transcodeToWav16kMono } = require('../services/audioTranscode')
const { recognizeShortWav } = require('../services/tencentAsr')

// 确保上传目录存在
const uploadDir = path.join(__dirname, '..', 'uploads', 'records')
fs.mkdirSync(uploadDir, { recursive: true })

// Multer 配置
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => cb(null, `${Date.now()}-${file.originalname || 'record'}`)
})

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }) // 10MB

router.get('/health', (_req, res) => {
  res.json({ code: 200, message: 'ASR service is available' })
})

// POST /api/asr -> 接收音频并识别
router.post('/', (req, res) => {
  upload.single('audio')(req, res, async (err) => {
    if (err) {
      console.error('[ASR][multer]', err)
      return res.status(400).json({ code: 400, message: '音频上传失败', error: err.message })
    }

    if (!req.file) {
      return res.status(400).json({ code: 400, message: '缺少音频文件 audio' })
    }

    const inputPath = req.file.path
    let wavPath = null

    try {
      // 转码为 16k 单声道 wav
      wavPath = await transcodeToWav16kMono(inputPath)
      // 调用腾讯 ASR 识别
      const text = await recognizeShortWav(wavPath)
      return res.json({ code: 200, data: { text } })
    } catch (e) {
      console.error('[ASR] error:', e)
      const message =
        e?.code === 'AuthFailure.SecretIdNotFound'
          ? '腾讯云 SecretId 不存在或不正确，请检查 TENCENT_SECRET_ID'
          : e?.code === 'AuthFailure.SignatureFailure'
            ? '腾讯云签名校验失败，请检查 TENCENT_SECRET_KEY'
            : e?.message || '语音识别失败'

      return res.status(500).json({ code: 500, message, error: e?.message, errorCode: e?.code })
    } finally {
      // 可选：清理上传文件，节省空间
      // try { fs.unlinkSync(inputPath) } catch (_) {}
      // if (wavPath) { try { fs.unlinkSync(wavPath) } catch (_) {} }
    }
  })
})

module.exports = router
