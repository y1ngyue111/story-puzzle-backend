import http from './http';

export const recognizeVoice = async (audioBuffer) => {
  const formData = new FormData();
  const audio =
    audioBuffer instanceof Blob
      ? audioBuffer
      : new Blob([audioBuffer], { type: 'audio/webm' });

  formData.append('audio', audio, 'record.webm');

  return http.post('/api/asr', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000
  });
};
