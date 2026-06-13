// src/utils/api/imageGenerate.js
// 对接阿里云通义万相API（替换原模拟接口）
export const generateImage = async (keyword) => {
    // 1. 基础参数校验
    if (!keyword || keyword.trim().length === 0) {
      throw new Error('请输入图像关键词');
    }
  
    try {
      // 2. 调用阿里云通义万相API（真实接口）
      const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc-image/text-to-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_ALIYUN_DASHSCOPE_KEY}`, // 从环境变量取密钥
          'Content-Type': 'application/json',
          'X-Dashscope-Async': 'false' // 同步请求（实时返回结果）
        },
        body: JSON.stringify({
          model: 'wanx-v1', // 通义万相基础模型
          input: {
            prompt: `高清、清晰的${keyword}，适合作为拼图素材，800x800像素，色彩鲜明，细节丰富`,
            negative_prompt: '模糊, 低分辨率, 变形, 色情, 暴力, 政治敏感' // 负面提示词过滤
          },
          parameters: {
            size: '800x800', // 拼图适合的尺寸
            n: 1, // 生成1张图
            steps: 20 // 生成步数（平衡速度和质量）
          }
        }),
        timeout: 30000 // 超时时间30秒（图像生成耗时较长）
      });
  
      // 3. 解析响应
      const result = await response.json();
  
      // 4. 错误处理（API返回的错误）
      if (!response.ok) {
        const errorMsg = result.message || `图像生成失败（状态码：${response.status}）`;
        throw new Error(errorMsg);
      }
  
      // 5. 提取有效图像URL
      if (!result.data?.images?.[0]?.url) {
        throw new Error('未获取到有效图像地址');
      }
  
      return {
        imageUrl: result.data.images[0].url,
        success: true
      };
  
    } catch (err) {
      // 6. 统一错误处理（网络错误、API错误等）
      console.error('图像生成接口异常:', err);
      // 生产环境可添加错误上报逻辑（如Sentry）
      throw new Error(err.message || '图像生成失败，请稍后重试');
    }
  };