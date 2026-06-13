const express = require('express');
const router = express.Router();

function getHandlers(req, res) {
  const handlers = req.app.get('roomHandlers');
  if (!handlers) {
    res.status(500).json({ code: 500, message: '房间服务未初始化' });
    return null;
  }
  return handlers;
}

router.post('/create', (req, res) => {
  const handlers = getHandlers(req, res);
  if (handlers) handlers.createRoom(req, res);
});

router.post('/join', (req, res) => {
  const handlers = getHandlers(req, res);
  if (handlers) handlers.joinRoom(req, res);
});

router.get('/:roomCode', (req, res) => {
  const handlers = getHandlers(req, res);
  if (handlers) handlers.getRoomInfo(req, res);
});

module.exports = router;
