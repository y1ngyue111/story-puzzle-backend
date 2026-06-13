console.log('[storyController] LOADED - local download + ali version')

const fs = require('fs')
const path = require('path')
const { generateHealingImageUrl } = require('../services/aliWanxImage')

function makePicsumUrl(seedText) {
  const seed = encodeURIComponent((seedText || '').slice(0, 80) || String(Date.now()))
  return `https://picsum.photos/seed/${seed}/800/800`
}

async function downloadToFile(url, outPath) {
  const resp = await fetch(url, { redirect: 'follow' })
  if (!resp.ok) {
    throw new Error(`Download failed: ${resp.status} ${resp.statusText}`)
  }
  const buffer = Buffer.from(await resp.arrayBuffer())
  await fs.promises.writeFile(outPath, buffer)
}

async function uploadStoryText(req, res) {
  try {
    const { storyText, roomCode, playerName } = req.body || {}

    if (!storyText || !String(storyText).trim()) {
      return res.status(400).json({ code: 400, message: 'storyText 不能为空' })
    }

    let srcUrl
    try {
      srcUrl = await generateHealingImageUrl(storyText)
    } catch (e) {
      console.error('[AliGen] fallback to picsum:', e?.message)
      srcUrl = makePicsumUrl(storyText)
    }

    const imagesDir = path.join(__dirname, '..', 'uploads', 'images')
    await fs.promises.mkdir(imagesDir, { recursive: true })

    const safeRoom = (roomCode || 'room').toString().replace(/[^\w-]/g, '')
    const filename = `${safeRoom}-${Date.now()}.jpg`
    const absPath = path.join(imagesDir, filename)

    await downloadToFile(srcUrl, absPath)

    const imageUrl = `/uploads/images/${filename}`

    return res.json({
      code: 200,
      message: 'OK',
      data: { imageUrl, roomCode, playerName, storyText }
    })
  } catch (e) {
    console.error('[uploadStoryText] error:', e)
    return res.status(500).json({ code: 500, message: 'Server Error', error: e?.message })
  }
}

async function uploadVoiceStory(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ code: 400, message: '缺少语音文件 file' })
    }

    const srcUrl = makePicsumUrl(String(Date.now()))

    const imagesDir = path.join(__dirname, '..', 'uploads', 'images')
    await fs.promises.mkdir(imagesDir, { recursive: true })

    const filename = `voice-${Date.now()}.jpg`
    const absPath = path.join(imagesDir, filename)

    await downloadToFile(srcUrl, absPath)

    const imageUrl = `/uploads/images/${filename}`

    return res.json({
      code: 200,
      message: 'OK',
      data: { imageUrl }
    })
  } catch (e) {
    console.error('[uploadVoiceStory] error:', e)
    return res.status(500).json({ code: 500, message: 'Server Error', error: e?.message })
  }
}

async function organizeStory(req, res) {
  try {
    const { storyText } = req.body || {}

    if (!storyText || !String(storyText).trim()) {
      return res.status(400).json({
        code: 400,
        message: 'storyText 不能为空'
      })
    }

    const rawText = String(storyText).trim()

    const extractKeywords = (text) => {
      const presetWords = [
        '海边', '晚霞', '朋友', '妈妈', '爸爸', '老师', '同学',
        '学校', '森林', '公园', '房间', '礼物', '生日',
        '星星', '月亮', '大海', '贝壳', '小狗', '小猫',
        '旅行', '阳光', '下雨', '风', '操场', '家里',
        '厨房', '客厅', '花园', '河边', '山上'
      ]
      return presetWords.filter(word => text.includes(word)).slice(0, 6)
    }

    const detectMood = (text) => {
      if (/开心|快乐|高兴|兴奋|惊喜|幸福|温暖/.test(text)) return '温暖'
      if (/难过|伤心|失落|遗憾|想念/.test(text)) return '伤感'
      if (/紧张|害怕|恐怖|担心/.test(text)) return '紧张'
      if (/好笑|搞笑|有趣|逗/.test(text)) return '轻松'
      return '治愈'
    }

    const detectScene = (text) => {
      const sceneWords = [
        '海边', '学校', '教室', '公园', '森林', '房间',
        '操场', '家里', '山上', '厨房', '客厅', '花园', '河边'
      ]
      return sceneWords.find(word => text.includes(word)) || '一个温馨的日常场景'
    }

    const detectCharacters = (text) => {
      const roleWords = [
        '我', '朋友', '妈妈', '爸爸', '老师',
        '同学', '姐姐', '弟弟', '奶奶', '爷爷'
      ]
      const result = roleWords.filter(word => text.includes(word))
      return result.length ? result : ['我']
    }

    const buildSummary = (text) => {
      const clean = text.replace(/\s+/g, '').trim()
      if (clean.length <= 30) return clean
      return clean.slice(0, 30) + '...'
    }

    const cleanText = rawText.replace(/\s+/g, ' ').trim()
    const summary = buildSummary(rawText)
    const keywords = extractKeywords(rawText)
    const mood = detectMood(rawText)
    const scene = detectScene(rawText)
    const characters = detectCharacters(rawText)

    const questionSeed =
      scene !== '一个温馨的日常场景'
        ? '故事主要发生在哪里？'
        : keywords.length
          ? '故事里出现了哪些关键元素？'
          : '这个故事最重要的内容是什么？'

    const imagePrompt = `插画风，${mood}氛围，场景是${scene}，人物有${characters.join('、')}${keywords.length ? `，包含元素${keywords.join('、')}` : ''}，根据这个故事生成画面：${summary}`

    return res.json({
      code: 200,
      message: 'OK',
      data: {
        rawText,
        cleanText,
        summary,
        keywords,
        mood,
        scene,
        characters,
        questionSeed,
        imagePrompt
      }
    })
  } catch (e) {
    console.error('[organizeStory] error:', e)
    return res.status(500).json({
      code: 500,
      message: 'Server Error',
      error: e?.message
    })
  }
}

module.exports = {
  uploadStoryText,
  uploadVoiceStory,
  organizeStory
}