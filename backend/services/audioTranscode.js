// backend/services/audioTranscode.js
const { execFile } = require('child_process')
const path = require('path')
const ffmpegPath = require('ffmpeg-static')

function transcodeToWav16kMono(inputPath) {
  const parsed = path.parse(inputPath)
  const outputPath = path.join(parsed.dir, `${parsed.name}-16k-mono.wav`)
  return new Promise((resolve, reject) => {
    execFile(
      ffmpegPath || 'ffmpeg',
      [
        '-y',
        '-i', inputPath,
        '-ac', '1',
        '-ar', '16000',
        '-acodec', 'pcm_s16le',
        outputPath
      ],
      (err, stdout, stderr) => {
        if (err) return reject(new Error(stderr || err.message))
        resolve(outputPath)
      }
    )
  })
}

module.exports = { transcodeToWav16kMono }
