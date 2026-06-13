console.log('[aliWanxImage] LOADED')

const axios = require('axios')

function buildHealingPrompt(storyText) {
  const story = (storyText || '').trim()
  const style = process.env.ALI_IMAGE_STYLE || 'A'

  const base = [
    '请将下面的生活故事转化为一张高质量、软萌治愈、完整舒展的绘本插画。',
    '',
    '【故事内容】',
    story || '一个温暖的日常瞬间',
    '',
    '【创作任务】',
    '先理解故事中的场景、人物、动作、环境与情绪，再把它整理成一幅完整插画，而不是机械照搬原文。',
    '请把画面处理成温柔、安静、可爱、有陪伴感的一页插画。',
    '允许画面带有轻微夸张和可爱化处理，但整体必须自然、舒服、干净。',
    '',
    '【画面要求】',
    '构图完整舒展，允许偏平面化处理，但不要空、散、乱。',
    '主体清晰，画面里可以有一些可爱的小配角、小动物、小物件、小植物，帮助讲故事。',
    '不要追求真实摄影感，也不要强烈镜头冲击感，要像完整的高质量绘本插画页面。',
    '',
    '【细节增强】',
    '请增加温柔的小细节，比如草地纹理、小花、小叶片、小动物、小零食、小包、小玩具、野餐布、风吹动草尖等，让画面更有陪伴感和故事感。',
    '如果故事里提到风、树木、落叶、草地、鸟叫、路边、山路、阳光、窗边、动物等，请用柔和、可爱的方式自然表现。',
    '',
    '【质量要求】',
    '高完成度，高统一度，画面干净细腻，颜色柔和舒服。',
    '不要廉价AI感，不要过度写实，不要过于空洞。',
    '如果画面中出现人类角色，必须画出完整、友好、清楚的头发轮廓和五官：柔和的眼睛、眉毛、小鼻子、自然嘴巴；脸部不能是空白面具，不能没有头发，不能只有一块肤色脸。',
    '人物可以画得小、简洁、可爱，但脸部必须有可读的表情和发型。若人物不适合画正脸，优先改成背影、侧脸、戴帽子的温柔角色或小动物，不要生成无脸人形。',
    '',
    '【整体气质】',
    '像春天或初夏草地上的安静时刻，轻松、软乎乎、松弛、温柔、有陪伴感。',
    '',
    '【严格禁止】',
    '不要文字、不要水印、不要Logo、不要边框、不要二维码。',
    '不要强逆光、不要强烈阴影、不要舞台感光影、不要电影海报感。',
    '不要恐怖、惊悚、压抑、阴森氛围。',
    '不要写实照片感、不要3D塑料质感、不要金属高反光。',
    '不要无脸人物、不要空白脸、不要没有头发的人形、不要面具脸、不要空洞眼神、不要诡异微笑。',
    '不要畸形手指、不要多余肢体、不要崩坏五官、不要怪异表情。'
  ].join('\n')

  const styleA = [
    '【风格】高质量软萌治愈绘本插画风，温柔、可爱、松弛、陪伴感强',
    '【角色感觉】角色造型圆润、软乎乎、表情简单克制、动作自然可爱',
    '【色彩】以浅绿色、奶油白、淡黄、浅橘为主，低饱和、低对比、整体统一柔和',
    '【光线】均匀柔光，自然明亮，不要强逆光，不要强烈阴影，不要夸张高光',
    '【线条】轻手绘线稿，边缘柔和，略带涂鸦感，但整体干净完整',
    '【质感】像高质量儿童绘本或治愈贴纸插画，有轻微纸面感和柔软涂色感',
    '【构图】像一张完整插画页面，主体与周围小物件共同讲故事，画面松弛、舒服、有陪伴感',
    '【氛围】像在草地上休息、发呆、聊天、晒太阳的安静时刻，温暖但不煽情'
  ].join('\n')

  const styleB = [
    '【风格】高质量自然治愈插画，偏生活绘本感，稍微成熟一点，但仍然柔软可爱',
    '【角色感觉】主体圆润简洁，表情轻微，动作自然，不要夸张',
    '【色彩】浅绿、灰绿、米白、淡黄为主，颜色统一柔和，不要强烈冷暖对比',
    '【光线】自然柔光，明暗变化非常轻，避免强烈高光和阴影',
    '【线条】干净细腻，带轻手绘感',
    '【质感】像一本高质量自然观察绘本中的插图，精致但不厚重',
    '【构图】更完整、更平衡，适合表现日常场景和温柔叙事'
  ].join('\n')

  const styleC = [
    '【风格】高质量童书插画风，更可爱、更简洁、更柔软',
    '【角色感觉】角色非常圆润，造型简洁，童趣但不低幼',
    '【色彩】温和浅色调，偏浅绿、浅黄、奶油白、浅橘',
    '【光线】柔和均匀自然光，几乎没有戏剧化对比',
    '【质感】柔软纸面感，颜色像轻轻涂上去一样',
    '【构图】像儿童绘本中的一页完整场景图，简单但不空'
  ].join('\n')

  const picked = style === 'B' ? styleB : style === 'C' ? styleC : styleA

  return [
    base,
    '',
    picked,
    '',
    '【最终输出要求】只生成一张完整插画，不要输出任何文字说明。'
  ].join('\n')
}

async function generateHealingImageUrl(storyText) {
  const apiKey = process.env.ALI_IMAGE_API_KEY
  const model = process.env.ALI_IMAGE_MODEL || 'wan2.6-t2i'

  if (!apiKey) {
    throw new Error('缺少环境变量 ALI_IMAGE_API_KEY')
  }

  const prompt = buildHealingPrompt(storyText)

  console.log('[AliGen] model =', model)
  console.log('[AliGen] prompt preview =', prompt.slice(0, 180))
  console.log(
    '[AliGen] endpoint =',
    'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation'
  )
  console.log('[AliGen] key prefix =', apiKey ? apiKey.slice(0, 6) : 'NONE')

  const resp = await axios.post(
    'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation',
    {
      model,
      input: {
        messages: [
          {
            role: 'user',
            content: [
              {
                text: prompt
              }
            ]
          }
        ]
      },
      parameters: {
        prompt_extend: true,
        watermark: false,
        n: 1,
        size: '1536*1536',
        negative_prompt:
          'large sky, wide open sky, huge sky area, clouds dominating the image, cloudscape, sea of clouds, empty sky background, sky occupying more than 10 percent, faceless person, blank face, missing facial features, missing hair, bald faceless character, mask face, empty eyes, uncanny face, scary smile, realistic photo, dramatic lighting, harsh contrast, strong backlight, heavy shadow, cinematic poster, 3d render, plastic texture, glossy surface, metallic reflection, dark mood, horror mood, dirty background, oversaturated colors, messy composition, low quality, blurry, bad anatomy, extra fingers, extra limbs, distorted face, scary expression, text, watermark, logo, frame'
      }
    },
    {
      timeout: 180000,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      }
    }
  )

  console.log('[AliGen] raw response =', JSON.stringify(resp.data, null, 2))

  const imageUrl =
    resp.data?.output?.choices?.[0]?.message?.content?.find?.((x) => x.image)?.image ||
    resp.data?.output?.choices?.[0]?.message?.content?.[0]?.image ||
    resp.data?.output?.images?.[0]?.url ||
    resp.data?.output?.results?.[0]?.url

  if (!imageUrl) {
    throw new Error('阿里云返回中没有找到图片地址')
  }

  return imageUrl
}

module.exports = {
  generateHealingImageUrl
}
