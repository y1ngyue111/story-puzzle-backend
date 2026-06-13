import { io } from 'socket.io-client'
import { API_ORIGIN } from './api/base'

export function createSocket(options = {}) {
  return io(API_ORIGIN, {
    transports: ['websocket', 'polling'],
    ...options
  })
}

export default createSocket
