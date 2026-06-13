import express from 'express';
import imageRoutes from './imageRoutes';
import roomRoutes from './roomRoutes';
import playerRoutes from './playerRoutes';

const router = express.Router();
router.use('/image', imageRoutes);
router.use('/room', roomRoutes); // 新增房间路由
router.use('/player', playerRoutes); // 新增玩家路由

export default router;