// 把图片切成 3x3 拼图块
export async function cutImageToPieces(imageSrc) {
    const img = await loadImage(imageSrc)
    const pieces = []
  
    const size = 3 // 3x3
    const pieceWidth = img.width / size
    const pieceHeight = img.height / size
  
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
  
    canvas.width = pieceWidth
    canvas.height = pieceHeight
  
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        ctx.clearRect(0, 0, pieceWidth, pieceHeight)
        ctx.drawImage(
          img,
          x * pieceWidth,
          y * pieceHeight,
          pieceWidth,
          pieceHeight,
          0,
          0,
          pieceWidth,
          pieceHeight
        )
        pieces.push(canvas.toDataURL('image/png'))
      }
    }
  
    return pieces
  }
  
  // 加载图片为 Image 对象
  function loadImage(src) {
    return new Promise((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.src = src
    })
  }
  