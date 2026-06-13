// src/utils/api/http.js
import axios from 'axios'
import { API_BASE_URL } from './base'

const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 90000
})

// 响应拦截器：让 400/404 这种“业务错误”也返回给页面自己判断
http.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('响应拦截器错误：', error)
    if (error.response) return Promise.resolve(error.response)
    return Promise.reject(error)
  }
)

export { http }
export default http
