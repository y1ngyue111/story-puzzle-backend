module.exports = function requireMongo(req, res, next) {
    const isReady = req.app.get('mongoReady')?.()
    if (!isReady) {
      return res.status(503).json({
        code: 503,
        message: '数据库未连接（当前网络可能拦截 MongoDB Atlas）。请切换网络或使用本地 Mongo。',
      })
    }
    next()
  }