import axios from 'axios';
import * as crypto from 'crypto';

// 生成腾讯云签名
const generateSignature = (secretKey, timestamp, nonce) => {
  const plainText = `secretKey=${secretKey}&timestamp=${timestamp}&nonce=${nonce}`;
  return crypto.createHash('sha256').update(plainText).digest('hex');
};

export const recognizeVoice = async (audioBuffer) => {
  const timestamp = Date.now();
  const nonce = Math.random().toString(36).substring(2, 15);
  const signature = generateSignature(
    process.env.TENCENT_SECRET_KEY,
    timestamp,
    nonce
  );

  const response = await axios.post(
    'https://asr.tencentcloudapi.com/',
    {
      Action: 'CreateRecTask',
      Version: '2019-06-14',
      ProjectId: 0,
      SubServiceType: 2, // 实时识别
      EngSerViceType: '16k_zh', // 中文16K采样率
      SourceType: 1, // 音频数据（Base64）
      VoiceFormat: 'wav',
      Data: audioBuffer.toString('base64'),
      HotwordId: process.env.TENCENT_HOTWORD_ID,
      Timestamp: timestamp,
      Nonce: nonce,
      SecretId: process.env.TENCENT_SECRET_ID,
      Signature: signature
    },
    {
      headers: { 'Content-Type': 'application/json' }
    }
  );

  return response.data.Response.Result;
};