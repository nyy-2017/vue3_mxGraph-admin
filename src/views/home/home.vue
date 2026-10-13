<template>
  <div class="home">
    <section class="banner">
      <div class="banner-text">
        <h2>{{ greeting }}，{{ userName }}</h2>
        <p>欢迎使用组态管理系统，可在此完成组态图的创建、编辑与设备实时状态查看。</p>
      </div>
      <div class="clock">
        <span class="time">{{ time }}</span>
        <span class="date">{{ date }}</span>
      </div>
    </section>

    <section class="entries">
      <div
        v-for="item in entries"
        :key="item.name"
        class="entry-card"
        @click="go(item.name)"
      >
        <span class="entry-icon"><component :is="item.icon" /></span>
        <div class="entry-body">
          <div class="entry-title">{{ item.title }}</div>
          <div class="entry-desc">{{ item.desc }}</div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, markRaw, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import {
  ApartmentOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  UnorderedListOutlined
} from '@ant-design/icons-vue'
import { useUserStore } from '../../stores/user'

const router = useRouter()
const userStore = useUserStore()

const userName = computed(() => userStore.userName || 'admin')

const entries = [
  { name: 'appView', title: '组态列表一', desc: '查看已配置的组态图权限与结构', icon: markRaw(ApartmentOutlined) },
  { name: 'graph_list', title: '组态列表二', desc: '新建、编辑、删除与上报 TOPO 图', icon: markRaw(UnorderedListOutlined) },
  { name: 'lookStatus', title: '查看状态', desc: '实时查看设备运行状态与告警', icon: markRaw(EyeOutlined) },
  { name: 'dateTime', title: '当前时间', desc: '按时间点查询历史运行数据', icon: markRaw(ClockCircleOutlined) }
]

const now = ref(dayjs())
const time = computed(() => now.value.format('HH:mm:ss'))
const date = computed(() => now.value.format('YYYY-MM-DD dddd'))

const greeting = computed(() => {
  const hour = now.value.hour()
  if (hour < 6) return '凌晨好'
  if (hour < 12) return '上午好'
  if (hour < 18) return '下午好'
  return '晚上好'
})

let timer = null
onMounted(() => {
  timer = setInterval(() => {
    now.value = dayjs()
  }, 1000)
})
onBeforeUnmount(() => clearInterval(timer))

function go(name) {
  router.push({ name })
}
</script>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 24px 26px;
  background: linear-gradient(120deg, rgba(22, 199, 154, 0.18) 0%, rgba(27, 111, 214, 0.16) 55%, rgba(16, 29, 46, 0.2) 100%);
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius);
}
.banner-text h2 {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 600;
  color: var(--app-text);
}
.banner-text p {
  margin: 0;
  font-size: 13px;
  color: var(--app-text-sub);
}
.clock {
  flex: none;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}
.clock .time {
  font-size: 26px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--app-primary);
}
.clock .date {
  font-size: 12px;
  color: var(--app-text-sub);
}

.entries {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 14px;
}
.entry-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px;
  background: var(--app-bg-elevated);
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius);
  cursor: pointer;
  transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
}
.entry-card:hover {
  transform: translateY(-2px);
  border-color: var(--app-primary);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35);
}
.entry-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  font-size: 18px;
  color: var(--app-primary);
  background: var(--app-primary-soft);
  border-radius: 10px;
}
.entry-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--app-text);
}
.entry-desc {
  margin-top: 4px;
  font-size: 12px;
  color: var(--app-text-sub);
}
</style>
