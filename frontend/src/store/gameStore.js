import { defineStore } from 'pinia';

// 定义拼图游戏状态（全局唯一）
export const useGameStore = defineStore('game', {
  state: () => ({
    // 基础信息
    roomCode: '', // 当前房间号（从路由获取）
    hostName: '', // 主持人昵称
    // 拼图配置
    puzzleConfig: {
      level: 'easy', // 难度：easy(3x3)/medium(4x4)/hard(5x5)
      totalPieces: 9, // 总碎片数（默认3x3）
      imgUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=90', // 拼图原图（可替换为语音生成图）
    },
    // 游戏数据
    puzzleData: [], // 拼图碎片数组（id、pos、currentIdx、targetIdx、isCorrect）
    playerProgress: {}, // 玩家进度：{ "玩家1": 30 }（百分比）
    gameStatus: 'waiting', // 游戏状态：waiting/playing/finished
    winner: '', // 获胜者
  }),
  actions: {
    // 1. 初始化游戏（主持人/玩家进入游戏时调用）
    initGame(initData) {
      this.roomCode = initData.roomCode;
      this.hostName = initData.hostName || '';
      this.puzzleConfig.level = initData.level || 'easy';
      this.puzzleConfig.totalPieces = this.getTotalPiecesByLevel();
      // 若传入自定义图片，优先使用
      if (initData.imgUrl) this.puzzleConfig.imgUrl = initData.imgUrl;
      // 生成打乱的拼图碎片
      this.puzzleData = this.generatePuzzlePieces();
      // 初始化玩家进度（兼容主持人/玩家多角色）
      this.playerProgress = initData.players 
        ? Object.fromEntries(initData.players.map(player => [player.playerName, 0]))
        : {};
      this.gameStatus = 'playing';
      this.winner = '';
    },

    // 2. 根据难度获取总碎片数（保持不变）
    getTotalPiecesByLevel() {
      const levelMap = { easy: 9, medium: 16, hard: 25 };
      return levelMap[this.puzzleConfig.level] || 9;
    },

    // 3. 生成拼图碎片数据（修复打乱逻辑，确保归位判断准确）
    generatePuzzlePieces() {
      const { totalPieces, imgUrl } = this.puzzleConfig;
      const cols = Math.sqrt(totalPieces);
      const pieceSize = 100 / cols; // 每个碎片占原图的百分比

      // 步骤1：生成有序碎片（targetIdx = 正确位置索引，pos = 对应原图位置）
      const orderedPieces = Array.from({ length: totalPieces }, (_, idx) => {
        const row = Math.floor(idx / cols);
        const col = idx % cols;
        return {
          id: `piece-${idx}`,
          pos: `${-col * pieceSize}% ${-row * pieceSize}%`, // 负数确保背景图正确偏移
          currentIdx: idx, // 初始位置索引（未打乱前=targetIdx）
          targetIdx: idx, // 正确位置索引
          isCorrect: false,
        };
      });

      // 步骤2：Fisher-Yates 洗牌算法（修复原sort打乱的随机性问题）
      const shuffledPieces = [...orderedPieces];
      for (let i = shuffledPieces.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        // 交换 currentIdx，确保打乱后碎片位置错位
        [shuffledPieces[i].currentIdx, shuffledPieces[j].currentIdx] = 
        [shuffledPieces[j].currentIdx, shuffledPieces[i].currentIdx];
      }

      return shuffledPieces;
    },

    // 4. 新增：用新图像重置拼图（语音生成图像后调用）
    resetPuzzleWithNewImg(newImgUrl) {
      if (!newImgUrl) return;
      // 更新原图地址
      this.puzzleConfig.imgUrl = newImgUrl;
      // 重置所有碎片状态（未归位）
      this.puzzleData = this.generatePuzzlePieces().map(piece => ({
        ...piece,
        isCorrect: false
      }));
      // 保持玩家进度不变（仅换图不重置进度）
      Toast.success('拼图图像已更新！');
    },

    // 5. 更新玩家进度（保持不变，优化容错）
    updatePlayerProgress(playerName, correctCount) {
      if (!playerName) return;
      const progress = Math.floor((correctCount / this.puzzleConfig.totalPieces) * 100);
      this.playerProgress[playerName] = progress;
      // 进度100%判定获胜
      if (progress === 100 && this.gameStatus === 'playing') {
        this.gameStatus = 'finished';
        this.winner = playerName;
      }
    },

    // 6. 重置游戏（保持不变，优化逻辑）
    resetGame() {
      this.puzzleData = this.generatePuzzlePieces();
      // 重置所有玩家进度为0
      Object.keys(this.playerProgress).forEach(name => {
        this.playerProgress[name] = 0;
      });
      this.gameStatus = 'playing';
      this.winner = '';
    },
  },
});
