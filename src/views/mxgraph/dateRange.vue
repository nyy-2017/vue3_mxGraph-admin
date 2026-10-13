<template>
  <div>
    <a-space direction="vertical" :size="12">
      <a-date-picker
        v-model:value="value1"
        show-time
        format="YYYY-MM-DD HH:mm:ss"
        placeholder="开始日期时间"
        :disabled-date="disabledDateStart"
        @change="handle1"
      />
      <a-date-picker
        v-model:value="value2"
        show-time
        format="YYYY-MM-DD HH:mm:ss"
        placeholder="结束日期时间"
        :disabled-date="disabledDateEnd"
        @change="handle2"
      />
    </a-space>
  </div>
</template>

<script>
import { nowTime, tenseTimes } from '../../utils/times'
import dayjs from 'dayjs'

export default {
  data() {
    return {
      value1: '',
      value2: '',
      nowTime: nowTime(),
      tenseTimes: tenseTimes().substring(11)
    }
  },
  methods: {
    disabledDateStart(current) {
      if (this.value2) {
        return current && (current.valueOf() > Date.now() || current.valueOf() > this.value2.valueOf())
      }
      return current && current.valueOf() > Date.now()
    },
    disabledDateEnd(current) {
      return current && (current.valueOf() < this.value1.valueOf() || current.valueOf() > Date.now())
    },
    handle1() {
      if (new Date(this.value1).getTime() < Date.now()) this.value1 = dayjs()
    },
    handle2() {
      if (new Date(this.value2).getTime() < Date.now()) this.value2 = dayjs()
    }
  }
}
</script>
