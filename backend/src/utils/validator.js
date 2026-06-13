const Joi = require('joi');

// 房间创建验证
exports.validateCreateRoom = (data) => {
  const schema = Joi.object({
    hostName: Joi.string().min(2).max(10).required().messages({
      'string.empty': '主持人昵称不能为空',
      'string.min': '昵称至少2个字符',
      'string.max': '昵称最多10个字符'
    })
  });
  return schema.validate(data);
};

// 房间加入验证
exports.validateJoinRoom = (data) => {
  const schema = Joi.object({
    roomCode: Joi.string().length(6).required().messages({
      'string.empty': '房间号不能为空',
      'string.length': '房间号必须是6位'
    }),
    playerName: Joi.string().min(2).max(10).required().messages({
      'string.empty': '玩家昵称不能为空',
      'string.min': '昵称至少2个字符',
      'string.max': '昵称最多10个字符'
    })
  });
  return schema.validate(data);
};

// 图像生成验证
exports.validateImageGenerate = (data) => {
  const schema = Joi.object({
    roomCode: Joi.string().length(6).required(),
    content: Joi.string().min(10).max(200).required().messages({
      'string.min': '描述内容至少10个字符',
      'string.max': '描述内容最多200个字符'
    })
  });
  return schema.validate(data);
};