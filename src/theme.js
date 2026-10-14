import { theme } from 'ant-design-vue'

/**
 * 全局深色主题配置
 * - 以 antd darkAlgorithm 打底：表格、弹层、下拉、日期选择器等组件自动变深色
 * - 再用自定义 token 对齐整体色板：深蓝黑底 + 青绿高亮
 * - message / notification 的静态调用不读取 ConfigProvider，样式在 styles/theme.css 里手动深色化
 */
export const antdTheme = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: '#38bdf8',
    colorInfo: '#38bdf8',
    colorLink: '#38bdf8',
    colorSuccess: '#16c79a',
    colorWarning: '#f5a524',
    colorBgBase: '#0a1220',
    colorTextBase: '#dce7f5',
    colorBgContainer: '#101d2e',
    colorBgElevated: '#16263c',
    colorBgLayout: '#0a1220',
    colorBorder: '#24384f',
    colorBorderSecondary: '#1b2c42',
    borderRadius: 6,
    fontSize: 14
  },
  components: {
    Layout: {
      colorBgHeader: '#0d1a2b',
      colorBgBody: '#0a1220',
      colorBgTrigger: '#16263c',
      layoutHeaderColor: '#dce7f5'
    }
  }
}
