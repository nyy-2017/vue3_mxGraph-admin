import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// ===== 端口统一配置 =====
// 前端（Vite dev server）端口
const WEB_PORT = 8090
// 后端（Express API，由 server/index.js 监听）端口，需与 server/index.js 中保持一致
const API_PORT = 8081
// 注意：WEB_PORT 不能等于 API_PORT，否则 Vite 代理会回环指向自身
// ========================

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    host: '0.0.0.0',
    // 端口被占时直接报错退出，而不是自动跳到 8081 与后端冲突
    port: WEB_PORT,
    strictPort: true,
    // 前端通过 Vite 代理访问后端，避免跨域。所有后端接口（/api 等）都转发到 API_PORT。
    // npm run dev 会同时启动前端(Vite)与后端(server/index.js)，二者端口即下方两常量。
    proxy: {
      '/api': {
        target: `http://localhost:${API_PORT}`,
        changeOrigin: true
      },
      '/users': {
        target: `http://localhost:${API_PORT}`,
        changeOrigin: true
      },
      '/authenticate': {
        target: `http://localhost:${API_PORT}`,
        changeOrigin: true
      },
      '/account': {
        target: `http://localhost:${API_PORT}`,
        changeOrigin: true
      }
    }
  },
  // mxgraph 为 UMD 格式，必须经过预构建转换为 ESM（含 default 导出），
  // 排除预构建会导致 `import mx from 'mxgraph'` 报
  // "does not provide an export named 'default'"
  build: {
    emptyOutDir: false,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          vue: ['vue', 'vue-router', 'pinia'],
          antd: ['ant-design-vue', '@ant-design/icons-vue'],
          mxgraph: ['mxgraph', 'pako', 'sanitizer', 'spin.js']
        }
      }
    }
  }
})
