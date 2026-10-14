// 请求限流中间件：基于 express-rate-limit。
const rateLimit = require('express-rate-limit')
const { RATE_LIMIT } = require('../config')

// 全局限流
const globalLimiter = rateLimit(RATE_LIMIT.global)

// 登录接口限流（防暴力破解）
const loginLimiter = rateLimit(RATE_LIMIT.login)

module.exports = { globalLimiter, loginLimiter }
