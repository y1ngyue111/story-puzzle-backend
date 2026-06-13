const express = require('express')
const router = express.Router()
const multer = require('multer')

const {
  uploadStoryText,
  uploadVoiceStory,
  organizeStory
} = require('../controllers/storyController')

const upload = multer({ storage: multer.memoryStorage() })

router.post('/text', uploadStoryText)
router.post('/upload', upload.single('file'), uploadVoiceStory)
router.post('/organize', organizeStory)

module.exports = router