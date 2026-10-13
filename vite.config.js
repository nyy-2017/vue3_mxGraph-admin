import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

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
    port: 8080,
    // 代理后端接口，避免跨域（按实际后端地址调整）
    proxy: {
      '/graphs': {
        target: 'http://localhost:8081',
        changeOrigin: true
      },
      '/users': {
        target: 'http://localhost:8081',
        changeOrigin: true
      },
      '/authenticate': {
        target: 'http://localhost:8081',
        changeOrigin: true
      },
      '/account': {
        target: 'http://localhost:8081',
        changeOrigin: true
      }
    }
  },
  // mxgraph 依赖在 window 上挂载大量全局变量，关闭预构建以避免潜在问题
  optimizeDeps: {
    exclude: ['mxgraph']
  },
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
