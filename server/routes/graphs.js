// 组态图（TOPO）接口：复用原有 XML 文件存储逻辑，叠加登录鉴权与菜单权限校验。
const express = require('express')
const router = express.Router()
const legacy = require('./api')
const { authorize } = require('../middleware/auth')

// 所有组态接口需要登录，且具备 graph:view 权限（超级管理员自动放行）
router.use(authorize('graph:view'))
router.use(legacy)

module.exports = router
