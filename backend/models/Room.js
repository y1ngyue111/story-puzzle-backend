// backend/models/Room.js
const mongoose = require('mongoose')

const PlayerSchema = new mongoose.Schema({
  playerName: { type: String, required: true, trim: true },
  progress:   { type: Number, default: 0, min: 0, max: 100 },
  joinedAt:   { type: Date, default: Date.now }
}, { _id: false })

const RoomSchema = new mongoose.Schema({
  roomCode: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true
  },
  hostName: {
    type: String,
    required: true,
    trim: true
  },
  puzzleConfig: {
    level: { type: String, enum: ['easy','medium','hard'], default: 'easy' },
    totalPieces: { type: Number, default: 9, min: 1 },
    imgUrl: { type: String, default: 'https://picsum.photos/800/800' }
  },
  players: { type: [PlayerSchema], default: [] },
  gameStatus: {
    type: String,
    enum: ['waiting', 'playing', 'finished'],
    default: 'waiting'
  }
}, { timestamps: true, versionKey: false })

module.exports = mongoose.model('Room', RoomSchema)
