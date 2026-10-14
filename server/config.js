// 后端全局配置（密钥、限流、JWT 过期等）。
// 生产环境请通过环境变量覆盖 JWT_SECRET，例如：set JWT_SECRET=xxx 或 .env。
const SECRETS = {
  // JWT 签名密钥：默认占位，强烈建议用环境变量覆盖
  jwtSecret: process.env.JWT_SECRET || 'mxgraph-admin-jwt-secret-change-me',
  // JWT 有效期
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '12h',
  // bcrypt 加密成本
  bcryptRounds: 10,
  // 新建用户的默认密码（首次创建后建议用户自行修改）
  defaultPassword: '123456'
}

// 请求限流配置
const RATE_LIMIT = {
  // 全局：单 IP 每 15 分钟最多 300 次
  global: {
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: '请求过于频繁，请稍后再试' }
  },
  // 登录接口：单 IP 每 15 分钟最多 10 次，防暴力破解
  login: {
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: '登录尝试过于频繁，请 15 分钟后再试' }
  }
}

module.exports = { SECRETS, RATE_LIMIT }
