<template>
  <div>
    <a-select v-model:value="checkedId" style="width: 240px" @change="onChangeList">
      <a-select-option v-for="(item, index) in topoData" :key="index" :value="item.id">
        {{ item.name }}
      </a-select-option>
    </a-select>
    <span style="line-height: 32px; margin-left: 12px; color: #ffa940">
      注：黑色--正常，紫色--故障，红色--离线，灰色--异常
    </span>
  </div>
</template>

<script>
import graphApi from '../../../api/graph.api'

export default {
  name: 'deviceTree',
  data() {
    return {
      checkedId: '',
      topoData: []
    }
  },
  methods: {
    // 自动加载列表最后一个 xml 文件
    autoLoad() {
      graphApi.list().then((res) => {
        this.topoData = res.data.data
        this.checkedId = this.topoData[this.topoData.length - 1].id
        this.$emit('send_selectID', this.checkedId) // 传给父组件 lookStatus.vue
      })
    },
    onChangeList(id) {
      if (id) this.$emit('send_selectID', id)
    }
  },
  mounted() {
    this.autoLoad()
  }
}
</script>
