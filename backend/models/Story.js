// backend/models/Story.js
const mongoose = require('mongoose')

const StorySchema = new mongoose.Schema({
  roomCode: { type: String, required: false, trim: true },
  playerName: { type: String, required: false, trim: true },

  // 语音文件本地路径
  audioPath: { type: String, required: true },

  // 语音识别出来的文字（先用假数据）
  text: { type: String, required: true },

  // 根据文字生成的图片地址（先用占位图）
  imageUrl: { type: String, required: true },

  createdAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model('Story', StorySchema)
