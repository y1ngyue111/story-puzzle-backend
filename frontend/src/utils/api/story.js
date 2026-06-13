import http from './http'

export function uploadStoryText({ roomCode = 'single', playerName = '玩家', storyText }) {
  return http.post('/story', {
    roomCode,
    playerName,
    storyText
  })
}

export default {
  uploadStoryText
}
