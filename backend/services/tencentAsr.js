// backend/services/tencentAsr.js
const fs = require('fs')
const tencentcloud = require('tencentcloud-sdk-nodejs')

const AsrClient = tencentcloud.asr.v20190614.Client

function fileToBase64(filePath) {
  return fs.readFileSync(filePath).toString('base64')
}

function createClient() {
  return new AsrClient({
    credential: {
      secretId: String(process.env.TENCENT_SECRET_ID || '').trim(),
      secretKey: String(process.env.TENCENT_SECRET_KEY || '').trim(),
    },
    region: process.env.TENCENT_REGION || process.env.TTENCENT_REGION || 'ap-beijing',
    profile: {
      httpProfile: { endpoint: 'asr.tencentcloudapi.com' },
    },
  })
}

async function recognizeShortWav(wavPath) {
  if (!String(process.env.TENCENT_SECRET_ID || '').trim() || !String(process.env.TENCENT_SECRET_KEY || '').trim()) {
    throw new Error('缺少 TENCENT_SECRET_ID 或 TENCENT_SECRET_KEY')
  }

  const params = {
    EngSerViceType: '16k_zh',
    SourceType: 1,
    VoiceFormat: 'wav',
    Data: fileToBase64(wavPath),
  }
  const client = createClient()
  const resp = await client.SentenceRecognition(params)
  return resp.Result || ''
}

module.exports = { recognizeShortWav }
