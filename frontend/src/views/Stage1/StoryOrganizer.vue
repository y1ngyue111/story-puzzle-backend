<template>
    <div class="story-organizer-page">
      <van-nav-bar
        title="故事整理器"
        left-text="返回"
        left-arrow
        @click-left="goBack"
      />
  
      <div class="page-content">
        <div class="intro-card">
          <div class="intro-title">把原始故事整理成可复用的信息</div>
          <div class="intro-desc">
            这一步会生成摘要、关键词、场景、人物、提问种子和生图提示词，后面拼图和提问都能复用。
          </div>
        </div>
  
        <van-field
          v-model="storyText"
          rows="8"
          autosize
          label="故事内容"
          type="textarea"
          maxlength="1000"
          placeholder="请输入你的故事内容"
          show-word-limit
          class="story-field"
        />
  
        <div class="action-row">
          <van-button type="primary" block :loading="loading" @click="handleOrganize">
            整理故事
          </van-button>
        </div>
  
        <div v-if="result" class="result-card">
          <h3>整理结果</h3>
  
          <div class="result-item">
            <div class="label">原始故事</div>
            <div class="value">{{ result.rawText }}</div>
          </div>
  
          <div class="result-item">
            <div class="label">整理后故事</div>
            <div class="value">{{ result.cleanText }}</div>
          </div>
  
          <div class="result-item">
            <div class="label">一句话摘要</div>
            <div class="value">{{ result.summary }}</div>
          </div>
  
          <div class="result-item">
            <div class="label">关键词</div>
            <div class="value">{{ formatArray(result.keywords) }}</div>
          </div>
  
          <div class="result-item">
            <div class="label">情绪</div>
            <div class="value">{{ result.mood }}</div>
          </div>
  
          <div class="result-item">
            <div class="label">场景</div>
            <div class="value">{{ result.scene }}</div>
          </div>
  
          <div class="result-item">
            <div class="label">人物</div>
            <div class="value">{{ formatArray(result.characters) }}</div>
          </div>
  
          <div class="result-item">
            <div class="label">提问种子</div>
            <div class="value">{{ result.questionSeed }}</div>
          </div>
  
          <div class="result-item">
            <div class="label">生图提示词</div>
            <div class="value">{{ result.imagePrompt }}</div>
          </div>
  
          <div class="action-row dual-btns">
            <van-button type="success" block @click="handleSaveResult">
              保存整理结果
            </van-button>
            <van-button type="default" block @click="handleFillDemo">
              填入示例
            </van-button>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { showToast } from 'vant'
  import { apiUrl } from '@/utils/api/base'
  
  const router = useRouter()
  
  const storyText = ref('')
  const loading = ref(false)
  const result = ref(null)
  
  const goBack = () => {
    router.back()
  }
  
  const formatArray = (arr) => {
    if (!Array.isArray(arr) || !arr.length) return '—'
    return arr.join('、')
  }
  
  const handleFillDemo = () => {
    storyText.value = '今天我和朋友一起去海边散步，看到了很漂亮的晚霞，还捡了很多贝壳，感觉特别开心。'
  }
  
  const handleOrganize = async () => {
    if (!storyText.value.trim()) {
      showToast('请先输入故事内容')
      return
    }
  
    loading.value = true
    try {
      const res = await fetch(apiUrl('/api/story/organize'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          storyText: storyText.value
        })
      })
  
      const data = await res.json()
  
      if (data.code === 200) {
        result.value = data.data
        showToast('故事整理完成')
      } else {
        showToast(data.message || '整理失败')
      }
    } catch (error) {
      console.error('整理故事失败:', error)
      showToast('接口请求失败')
    } finally {
      loading.value = false
    }
  }
  
  const handleSaveResult = () => {
    if (!result.value) {
      showToast('请先整理故事')
      return
    }
  
    localStorage.setItem('organizedStory', JSON.stringify(result.value))
    showToast('整理结果已保存')
  }
  </script>
  
  <style scoped>
  .story-organizer-page {
    min-height: 100vh;
    background: #f7f8fa;
  }
  
  .page-content {
    padding: 16px;
  }
  
  .intro-card {
    padding: 14px 16px;
    margin-bottom: 16px;
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }
  
  .intro-title {
    font-size: 16px;
    font-weight: 600;
    color: #222;
    margin-bottom: 6px;
  }
  
  .intro-desc {
    font-size: 13px;
    color: #666;
    line-height: 1.6;
  }
  
  .story-field {
    background: #fff;
    border-radius: 12px;
    overflow: hidden;
  }
  
  .action-row {
    margin-top: 16px;
  }
  
  .dual-btns {
    display: flex;
    gap: 12px;
  }
  
  .result-card {
    margin-top: 20px;
    padding: 16px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }
  
  .result-card h3 {
    margin: 0 0 16px;
    font-size: 18px;
    color: #222;
  }
  
  .result-item {
    margin-bottom: 14px;
  }
  
  .label {
    font-size: 13px;
    color: #888;
    margin-bottom: 4px;
  }
  
  .value {
    font-size: 15px;
    color: #222;
    line-height: 1.7;
    word-break: break-word;
  }
  </style>
