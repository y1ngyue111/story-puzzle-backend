import axios from 'axios';

export const generateImage = async (keyword) => {
  const response = await axios.post(
    'https://dashscope.aliyuncs.com/api/v1/services/aigc-image/text-to-image',
    {
      prompt: `高清的${keyword}，适合作为拼图，800x800像素，色彩鲜明，细节丰富`,
      width: 800,
      height: 800,
      negative_prompt: '模糊, 低分辨率, 变形, 色情, 暴力, 政治敏感'
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.ALIYUN_DASHSCOPE_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return { imageUrl: response.data.data.images[0].url, success: true };
};